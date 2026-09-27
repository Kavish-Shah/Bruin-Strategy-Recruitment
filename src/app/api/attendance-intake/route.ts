import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  return NextResponse.json(
    { status: "ok", message: "Attendance intake API is active and ready for POST submissions." },
    { status: 200, headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400, headers: corsHeaders }
        );
      }
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      try {
        const formData = await req.formData();
        for (const [key, val] of formData.entries()) {
          body[key] = val;
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid form data" },
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      try {
        const rawText = await req.text();
        body = JSON.parse(rawText);
      } catch {
        return NextResponse.json(
          { error: "Unable to parse request body" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase environment variables not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fuzzy matching helper
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

    const rawEmail = findValue(["email", "Email", "Email *", "email_address", "emailAddress"]);
    const rawStudentId = findValue([
      "student_id",
      "studentId",
      "Student ID",
      "Student ID #*",
      "Student ID #",
      "uid",
      "UID",
      "sid",
    ]);
    const rawName = findValue(["name", "Name", "Full Name", "candidateName", "candidate_name"]);
    const questions = findValue(["questions", "Questions?", "Questions", "question", "comments"]);
    const rawTitle =
      findValue(["formTitle", "form_title", "title", "eventName", "event_name", "event"]) ||
      "Bruin Strategy Network at UCLA: Info Session Sign-In";

    // Clean and extract event name from Form Title
    let cleanEventName = body.eventName || body.event_name;
    if (!cleanEventName) {
      cleanEventName = rawTitle
        .replace(/Bruin\s+Strategy\s+Network(\s+at\s+UCLA)?\s*[:\-–—]?\s*/gi, "")
        .replace(/\s*Sign[\s-]*In/gi, "")
        .replace(/\s*Attendance/gi, "")
        .trim();
      if (!cleanEventName) cleanEventName = rawTitle;
    }

    const email = rawEmail ? rawEmail.toLowerCase().trim() : null;
    const studentId = rawStudentId ? rawStudentId.trim() : null;
    const cleanStudentId = studentId ? studentId.replace(/\D/g, "") : "";
    const name = rawName ? rawName.trim() : null;
    const submittedAt = body.submittedAt || new Date().toISOString();

    if (!email && !cleanStudentId && !name) {
      return NextResponse.json(
        { error: "At least one identifier (Student ID, Email, or Name) is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch all applicants for 4-tier precision matching
    const { data: allApplicants, error: fetchErr } = await supabase
      .from("applicants")
      .select("id, name, email, student_id, form_responses, status, cohort");

    if (fetchErr || !allApplicants) {
      return NextResponse.json(
        { error: "Failed to fetch applicants from database", details: fetchErr },
        { status: 500, headers: corsHeaders }
      );
    }

    const cleanSubmittedEmail = email || "";
    const submittedUsername = cleanSubmittedEmail ? cleanSubmittedEmail.split("@")[0].trim() : "";
    const cleanSubmittedName = name ? name.toLowerCase().replace(/[^a-z]/g, "") : "";

    let matchedApplicant: any = null;

    // 1. Tier 1: Exact / Cleaned Student ID match (digits only)
    if (!matchedApplicant && cleanStudentId && cleanStudentId.length >= 6) {
      for (const a of allApplicants) {
        const dbCleanId = (a.student_id || "").replace(/\D/g, "");
        if (
          dbCleanId &&
          (dbCleanId === cleanStudentId ||
            dbCleanId.startsWith(cleanStudentId) ||
            cleanStudentId.startsWith(dbCleanId))
        ) {
          matchedApplicant = a;
          break;
        }
        // Also check inside form_responses
        const fId =
          a.form_responses?.["Student ID"] ||
          a.form_responses?.student_id ||
          a.form_responses?.studentId;
        const cleanFId = fId ? String(fId).replace(/\D/g, "") : "";
        if (cleanFId && (cleanFId === cleanStudentId || cleanFId.startsWith(cleanStudentId))) {
          matchedApplicant = a;
          break;
        }
      }
    }

    // 2. Tier 2: Exact Email match
    if (!matchedApplicant && cleanSubmittedEmail) {
      for (const a of allApplicants) {
        const dbEmail = (a.email || "").toLowerCase().trim();
        if (dbEmail && dbEmail === cleanSubmittedEmail) {
          matchedApplicant = a;
          break;
        }
      }
    }

    // 3. Tier 3: Email Username match (e.g. jdoe@g.ucla.edu matches jdoe@ucla.edu)
    if (!matchedApplicant && submittedUsername && submittedUsername.length >= 3) {
      for (const a of allApplicants) {
        const dbEmail = (a.email || "").toLowerCase().trim();
        const dbUser = dbEmail ? dbEmail.split("@")[0].trim() : "";
        if (dbUser && dbUser === submittedUsername) {
          matchedApplicant = a;
          break;
        }
      }
    }

    // 4. Tier 4: Full Name match
    if (!matchedApplicant && cleanSubmittedName && cleanSubmittedName.length >= 4) {
      for (const a of allApplicants) {
        const dbName = (a.name || "").toLowerCase().trim().replace(/[^a-z]/g, "");
        if (dbName && dbName === cleanSubmittedName) {
          matchedApplicant = a;
          break;
        }
      }
    }

    const eventRecord = {
      eventName: cleanEventName,
      formTitle: rawTitle,
      submittedAt,
      questions: questions || null,
      submittedEmail: email,
      submittedStudentId: studentId,
      submittedName: name,
    };

    if (matchedApplicant) {
      // Applicant already exists! Update form_responses
      const existingResponses = matchedApplicant.form_responses || {};
      const existingEvents: any[] = Array.isArray(existingResponses.attendance_events)
        ? [...existingResponses.attendance_events]
        : [];

      // Deduplicate: If same event name submitted on the same day, update instead of duplicating
      const eventDateStr = submittedAt.slice(0, 10);
      const existingIdx = existingEvents.findIndex((e: any) => {
        const sameName = (e.eventName || "").toLowerCase() === cleanEventName.toLowerCase();
        const sameDay = (e.submittedAt || "").slice(0, 10) === eventDateStr;
        return sameName && sameDay;
      });

      if (existingIdx >= 0) {
        existingEvents[existingIdx] = {
          ...existingEvents[existingIdx],
          ...eventRecord,
        };
      } else {
        existingEvents.push(eventRecord);
      }

      const updatedFormResponses = {
        ...existingResponses,
        attendance_events: existingEvents,
        attendance_count: existingEvents.length,
        last_attended_event: cleanEventName,
        last_attended_at: submittedAt,
      };

      const updateData: Record<string, any> = {
        form_responses: updatedFormResponses,
      };

      // If applicant had no student_id in DB, but provided it on the attendance form, backfill it!
      if (!matchedApplicant.student_id && cleanStudentId) {
        updateData.student_id = cleanStudentId;
      }

      const { data: updatedApplicant, error: updateErr } = await supabase
        .from("applicants")
        .update(updateData)
        .eq("id", matchedApplicant.id)
        .select();

      if (updateErr) {
        return NextResponse.json(
          { error: "Failed to update applicant attendance", details: updateErr },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          success: true,
          matched: true,
          applicantId: matchedApplicant.id,
          candidateName: matchedApplicant.name,
          attendanceCount: existingEvents.length,
          event: cleanEventName,
          applicant: updatedApplicant?.[0] || matchedApplicant,
        },
        { headers: corsHeaders }
      );
    } else {
      // Applicant does not exist yet (attending event before official recruitment application submission)
      const newProspectiveApplicant: Record<string, any> = {
        name: name || "Prospective Attendee",
        email: email || `${cleanStudentId || Date.now()}@attendee.bsn.local`,
        cohort: "Management Consulting",
        status: "unassigned",
        student_id: cleanStudentId || null,
        form_responses: {
          is_prospective: true,
          attendance_count: 1,
          attendance_events: [eventRecord],
          last_attended_event: cleanEventName,
          last_attended_at: submittedAt,
        },
      };

      const { data: newApp, error: insertErr } = await supabase
        .from("applicants")
        .insert([newProspectiveApplicant])
        .select();

      if (insertErr) {
        return NextResponse.json(
          { error: "Failed to create attendee record", details: insertErr },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        {
          success: true,
          matched: false,
          createdProspective: true,
          candidateName: newProspectiveApplicant.name,
          attendanceCount: 1,
          event: cleanEventName,
          applicant: newApp?.[0],
        },
        { headers: corsHeaders }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
