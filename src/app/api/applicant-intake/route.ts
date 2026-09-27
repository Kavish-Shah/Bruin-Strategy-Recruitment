import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase environment variables not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Helper for fuzzy key matching across Google Forms payloads
    const findValue = (candidates: string[]) => {
      for (const k of candidates) {
        if (body[k] !== undefined && body[k] !== null && String(body[k]).trim() !== "") {
          return String(body[k]).trim();
        }
      }
      for (const [key, val] of Object.entries(body)) {
        if (val && typeof val === "string" && val.trim() !== "") {
          const lowerKey = key.toLowerCase();
          if (candidates.some((c) => lowerKey.includes(c.toLowerCase()))) {
            return val.trim();
          }
        }
      }
      return null;
    };

    // Normalize payload to match Supabase schema
    const payload: Record<string, any> = {};

    // 1. LinkedIn
    const linkedinValue = findValue(["linkedin_url", "linkedin", "LinkedIn", "linkedinUrl", "LinkedIn (optional)"]);
    if (linkedinValue) {
      payload.linkedin_url = linkedinValue;
      payload.linkedin = linkedinValue;
    }

    // 2. Name
    const nameValue = findValue(["name", "Name", "candidateName", "candidate_name", "Full Name"]);
    if (nameValue) payload.name = nameValue;

    // 3. Email
    const emailValue = findValue(["email", "Email", "emailAddress", "email_address", "Email Address"]);
    if (emailValue) payload.email = emailValue.trim().toLowerCase();

    // 4. Resume
    const resumeValue = findValue(["resume_url", "resume", "Resume", "resumeUrl", "Resume/CV"]);
    if (resumeValue) payload.resume_url = resumeValue;

    // 5. Cohort / Track
    const cohortValue = findValue(["cohort", "Cohort", "track", "Which consulting track are you applying for?"]);
    if (cohortValue) payload.cohort = cohortValue;

    // 6. Status
    const statusValue = findValue(["status", "Status"]) || "unassigned";
    payload.status = statusValue;

    // 7. Short Answer / Essay
    const shortAnswerValue = findValue(["short_answer", "shortAnswer", "ShortAnswer", "why_bsn", "passionate", "essay"]);
    if (shortAnswerValue) payload.short_answer = shortAnswerValue;

    // 8. Year
    const yearValue = findValue(["year", "Year"]);
    if (yearValue) payload.Year = yearValue;

    // 9. Major
    const majorValue = findValue(["major", "Major", "Major(s) and Minor(s)", "majors"]);
    if (majorValue) payload.major = majorValue;

    // 10. Student ID
    const studentIdValue = findValue(["student_id", "studentId", "StudentId", "Student ID", "Student ID #", "uid", "sid"]);
    if (studentIdValue) payload.student_id = studentIdValue;

    // Put everything else in form_responses
    payload.form_responses = body;

    // 4-Tier Matching to retroactively link existing check-in records:
    const cleanSid = payload.student_id ? String(payload.student_id).replace(/\D/g, "") : "";
    const cleanSubmittedEmail = payload.email ? payload.email.trim().toLowerCase() : "";
    const submittedUsername = cleanSubmittedEmail ? cleanSubmittedEmail.split("@")[0].trim() : "";
    const cleanSubmittedName = payload.name ? payload.name.toLowerCase().replace(/[^a-z]/g, "") : "";

    // Fetch existing candidates to perform 4-tier precision matching
    const { data: allExisting } = await supabase
      .from("applicants")
      .select("id, name, email, student_id, form_responses");

    let existingApplicant: any = null;

    if (allExisting && allExisting.length > 0) {
      // Tier 1: Cleaned digits Student ID match
      if (!existingApplicant && cleanSid && cleanSid.length >= 6) {
        for (const a of allExisting) {
          const dbCleanId = (a.student_id || "").replace(/\D/g, "");
          const fId = a.form_responses?.["Student ID"] || a.form_responses?.student_id || a.form_responses?.studentId;
          const cleanFId = fId ? String(fId).replace(/\D/g, "") : "";
          if (
            (dbCleanId && (dbCleanId === cleanSid || dbCleanId.startsWith(cleanSid) || cleanSid.startsWith(dbCleanId))) ||
            (cleanFId && (cleanFId === cleanSid || cleanFId.startsWith(cleanSid)))
          ) {
            existingApplicant = a;
            break;
          }
        }
      }

      // Tier 2: Exact Email match
      if (!existingApplicant && cleanSubmittedEmail) {
        for (const a of allExisting) {
          const dbEmail = (a.email || "").toLowerCase().trim();
          if (dbEmail && dbEmail === cleanSubmittedEmail) {
            existingApplicant = a;
            break;
          }
        }
      }

      // Tier 3: Email Username match (e.g. kvshah@g.ucla.edu == kvshah@ucla.edu)
      if (!existingApplicant && submittedUsername && submittedUsername.length >= 3) {
        for (const a of allExisting) {
          const dbEmail = (a.email || "").toLowerCase().trim();
          const dbUser = dbEmail ? dbEmail.split("@")[0].trim() : "";
          if (dbUser && dbUser === submittedUsername) {
            existingApplicant = a;
            break;
          }
        }
      }

      // Tier 4: Cleaned Full Name match
      if (!existingApplicant && cleanSubmittedName && cleanSubmittedName.length >= 4) {
        for (const a of allExisting) {
          const dbName = (a.name || "").toLowerCase().trim().replace(/[^a-z]/g, "");
          if (dbName && dbName === cleanSubmittedName) {
            existingApplicant = a;
            break;
          }
        }
      }
    }

    if (existingApplicant) {
      // Merge form responses to preserve any recorded attendance events
      const prevResponses = existingApplicant.form_responses || {};
      const mergedResponses = {
        ...prevResponses,
        ...body,
      };

      if (prevResponses.attendance_events && !body.attendance_events) {
        mergedResponses.attendance_events = prevResponses.attendance_events;
        mergedResponses.attendance_count = prevResponses.attendance_count;
        mergedResponses.last_attended_event = prevResponses.last_attended_event;
        mergedResponses.last_attended_at = prevResponses.last_attended_at;
      }
      payload.form_responses = mergedResponses;
      if (!payload.student_id && existingApplicant.student_id) {
        payload.student_id = existingApplicant.student_id;
      }

      const { data: updatedData, error: updateErr } = await supabase
        .from("applicants")
        .update(payload)
        .eq("id", existingApplicant.id)
        .select();

      if (!updateErr) {
        return NextResponse.json({
          success: true,
          applicant: updatedData?.[0] || payload,
          updated: true,
        });
      }
    }

    const { data, error } = await supabase
      .from("applicants")
      .insert([payload])
      .select();

    if (error) {
      // Match PGRST204: Could not find the '<col>' column of 'applicants' in the schema cache
      const missingColMatch = error.message?.match(/Could not find the '([^']+)' column/i);
      if (missingColMatch && missingColMatch[1]) {
        delete payload[missingColMatch[1]];
        const { data: retryData, error: retryError } = await supabase
          .from("applicants")
          .insert([payload])
          .select();

        if (!retryError) {
          return NextResponse.json({ success: true, applicant: retryData?.[0] || payload });
        }
        return NextResponse.json({ error: retryError.message, details: retryError }, { status: 400 });
      }
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }

    return NextResponse.json({ success: true, applicant: data?.[0] || payload });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
