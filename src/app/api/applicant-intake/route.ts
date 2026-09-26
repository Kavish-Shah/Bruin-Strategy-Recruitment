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

    // Normalize payload to match Supabase schema
    const payload: Record<string, any> = {};
    
    // Fuzzy matching for linkedin / linkedin_url
    const linkedinValue = body.linkedin_url || body.linkedin || body.LinkedIn || body.linkedinUrl || body.LinkedInUrl;
    if (linkedinValue) {
      payload.linkedin_url = linkedinValue;
      payload.linkedin = linkedinValue;
    }

    // Map other common fields gracefully
    const nameValue = body.name || body.Name || body.candidateName || body.candidate_name;
    if (nameValue) payload.name = nameValue;

    const emailValue = body.email || body.Email || body.emailAddress || body.email_address;
    if (emailValue) payload.email = emailValue;

    const resumeValue = body.resume_url || body.resume || body.Resume || body.resumeUrl;
    if (resumeValue) payload.resume_url = resumeValue;

    const cohortValue = body.cohort || body.Cohort;
    if (cohortValue) payload.cohort = cohortValue;

    const statusValue = body.status || body.Status || "unassigned";
    if (statusValue) payload.status = statusValue;

    const shortAnswerValue = body.short_answer || body.shortAnswer || body.ShortAnswer || body.why_bsn;
    if (shortAnswerValue) payload.short_answer = shortAnswerValue;
    
    const yearValue = body.year || body.Year;
    if (yearValue) payload.Year = yearValue;

    const majorValue = body.major || body.Major;
    if (majorValue) payload.major = majorValue;
    
    const studentIdValue = body.student_id || body.studentId || body.StudentId;
    if (studentIdValue) payload.student_id = studentIdValue;

    // Put everything else in form_responses
    payload.form_responses = body;

    // Check if an applicant already exists with this email or student ID (e.g. from attendance check-ins)
    let existingApplicant: any = null;
    if (payload.email) {
      const { data: existingByEmail } = await supabase
        .from("applicants")
        .select("id, form_responses, student_id")
        .ilike("email", payload.email.trim())
        .limit(1);
      if (existingByEmail && existingByEmail.length > 0) {
        existingApplicant = existingByEmail[0];
      }
    }

    if (!existingApplicant && payload.student_id) {
      const cleanSid = String(payload.student_id).replace(/\D/g, "");
      if (cleanSid && cleanSid.length >= 6) {
        const { data: existingBySid } = await supabase
          .from("applicants")
          .select("id, form_responses, student_id")
          .eq("student_id", cleanSid)
          .limit(1);
        if (existingBySid && existingBySid.length > 0) {
          existingApplicant = existingBySid[0];
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
