import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = body.email?.trim()?.toLowerCase() || body.Email?.trim()?.toLowerCase();
    
    // Fuzzy key matcher for Google Forms / AppScript payload keys
    const findValueInBody = (candidates: string[]) => {
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

    const primarySlot = findValueInBody([
      "primarySlot",
      "scheduled_time",
      "primary_slot",
      "primaryTime",
      "primary_time",
      "groupPrimarySlot",
      "groupScheduledTime",
      "firstChoice",
      "first_choice",
      "1st Choice",
      "First Choice",
      "Primary Time Slot",
      "Primary Slot",
      "Select Primary Coffee Chat Slot",
      "Primary Preference",
      "Primary Coffee Chat Slot",
      "Select primary coffee chat time",
      "Please select your preferred Group Interview time",
      "Group Interview Time",
      "Group Interview Slot",
      "preferred time",
      "primary",
      "first",
      "1st",
    ]);

    const fallbackSlot = findValueInBody([
      "fallbackSlot",
      "fallback_time",
      "fallback_slot",
      "fallbackTime",
      "groupFallbackSlot",
      "groupFallbackTime",
      "secondChoice",
      "second_choice",
      "2nd Choice",
      "Second Choice",
      "Fallback Time Slot",
      "Fallback Slot",
      "Select Fallback Coffee Chat Slot",
      "Fallback Preference",
      "Fallback Coffee Chat Slot",
      "Select fallback coffee chat time",
      "Please select your fallback Group Interview time",
      "alternative time",
      "fallback",
      "second",
      "2nd",
    ]);

    const studentId = body.studentId || body.student_id || body.uid || body.UID ? String(body.studentId || body.student_id || body.uid || body.UID).trim() : null;
    const submittedAt = body.submittedAt || new Date().toISOString();

    if (!studentId && !email) {
      return NextResponse.json(
        { error: "Either Student ID or Email address is required in payload" },
        { status: 400 }
      );
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

    let applicant: any = null;
    const candidateName = body.name || body.Name || body.candidateName || body.candidate_name ? String(body.name || body.Name || body.candidateName || body.candidate_name).trim() : null;

    // Load all applicants from Supabase for 4-tier precision matching
    const { data: allApplicants, error: fetchErr } = await supabase
      .from("applicants")
      .select("id, name, email, student_id, form_responses, status, scheduled_time, fallback_time");

    if (fetchErr || !allApplicants) {
      return NextResponse.json(
        { error: "Failed to fetch applicants from database", details: fetchErr },
        { status: 500 }
      );
    }

    const cleanSubmittedId = studentId ? studentId.replace(/\D/g, "") : "";
    const cleanSubmittedEmail = email ? email.toLowerCase().trim() : "";
    const submittedUsername = cleanSubmittedEmail ? cleanSubmittedEmail.split("@")[0].trim() : "";
    const cleanSubmittedName = candidateName ? candidateName.toLowerCase().trim().replace(/[^a-z]/g, "") : "";

    // 1. Tier 1: Exact / Cleaned Student ID match (digits only)
    if (!applicant && cleanSubmittedId && cleanSubmittedId.length >= 6) {
      for (const a of allApplicants) {
        const dbCleanId = (a.student_id || "").replace(/\D/g, "");
        if (dbCleanId && (dbCleanId === cleanSubmittedId || dbCleanId.startsWith(cleanSubmittedId) || cleanSubmittedId.startsWith(dbCleanId))) {
          applicant = a;
          break;
        }
      }
    }

    // 2. Tier 2: Exact Email match
    if (!applicant && cleanSubmittedEmail) {
      for (const a of allApplicants) {
        const dbEmail = (a.email || "").toLowerCase().trim();
        if (dbEmail && dbEmail === cleanSubmittedEmail) {
          applicant = a;
          break;
        }
      }
    }

    // 3. Tier 3: Email Username match (e.g. kvshah@g.ucla.edu matches kvshah@ucla.edu)
    if (!applicant && submittedUsername && submittedUsername.length >= 3) {
      for (const a of allApplicants) {
        const dbEmail = (a.email || "").toLowerCase().trim();
        const dbUser = dbEmail ? dbEmail.split("@")[0].trim() : "";
        if (dbUser && dbUser === submittedUsername) {
          applicant = a;
          break;
        }
      }
    }

    // 4. Tier 4: Full Name match
    if (!applicant && cleanSubmittedName && cleanSubmittedName.length >= 4) {
      for (const a of allApplicants) {
        const dbName = (a.name || "").toLowerCase().trim().replace(/[^a-z]/g, "");
        if (dbName && dbName === cleanSubmittedName) {
          applicant = a;
          break;
        }
      }
    }

    if (!applicant) {
      return NextResponse.json(
        { error: `Applicant with Student ID '${studentId}', Email '${email}', or Name '${candidateName}' not found` },
        { status: 404 }
      );
    }

    // Preserve current candidate status if already in group_interview, or if form payload specifies group interview
    const isGroupInterviewPayload =
      (body.status && String(body.status).toLowerCase().includes("group")) ||
      (body.stage && String(body.stage).toLowerCase().includes("group")) ||
      (body.formType && String(body.formType).toLowerCase().includes("group")) ||
      (body.form_type && String(body.form_type).toLowerCase().includes("group")) ||
      (body.title && String(body.title).toLowerCase().includes("group")) ||
      (applicant.status === "group_interview") ||
      (applicant.form_responses && applicant.form_responses.stageStatus === "group_interview") ||
      (applicant.notes && typeof applicant.notes === "string" && applicant.notes.includes("[STAGE]: group_interview"));

    const targetStatus = isGroupInterviewPayload
      ? "group_interview"
      : applicant.status === "unassigned" || applicant.status === "assigned" || applicant.status === "completed"
      ? "interview"
      : applicant.status || "interview";

    const formResponsesPayload = {
      ...(applicant.form_responses || {}),
      submittedAt,
      studentId: studentId || null,
      stageStatus: targetStatus,
    };
    
    if (targetStatus === "group_interview") {
      formResponsesPayload.rawGroupPayload = body;
      // Archive existing Coffee Chat times if they were in scheduled_time
      if (applicant.scheduled_time && !formResponsesPayload.coffeeChatScheduledTime) {
        formResponsesPayload.coffeeChatScheduledTime = applicant.scheduled_time;
      }
      if (applicant.fallback_time && !formResponsesPayload.coffeeChatFallbackTime) {
        formResponsesPayload.coffeeChatFallbackTime = applicant.fallback_time;
      }
      formResponsesPayload.groupPrimarySlot = primarySlot || null;
      formResponsesPayload.groupScheduledTime = primarySlot || null;
      formResponsesPayload.groupFallbackSlot = fallbackSlot || null;
      formResponsesPayload.groupFallbackTime = fallbackSlot || null;
    } else {
      formResponsesPayload.rawPayload = body;
      // Archive existing Group Interview times if they were in scheduled_time
      if (applicant.scheduled_time && !formResponsesPayload.groupScheduledTime) {
        formResponsesPayload.groupScheduledTime = applicant.scheduled_time;
      }
      if (applicant.fallback_time && !formResponsesPayload.groupFallbackTime) {
        formResponsesPayload.groupFallbackTime = applicant.fallback_time;
      }
      formResponsesPayload.primarySlot = primarySlot || null;
      formResponsesPayload.coffeeChatPrimarySlot = primarySlot || null;
      formResponsesPayload.coffeeChatScheduledTime = primarySlot || null;
      formResponsesPayload.fallbackSlot = fallbackSlot || null;
      formResponsesPayload.coffeeChatFallbackSlot = fallbackSlot || null;
      formResponsesPayload.coffeeChatFallbackTime = fallbackSlot || null;
    }

    // Update scheduled_time, fallback_time, student_id, form_responses, and status
    const updateData: Record<string, any> = {
      status: targetStatus,
    };
    if (primarySlot) updateData.scheduled_time = primarySlot;
    if (fallbackSlot) updateData.fallback_time = fallbackSlot;
    if (studentId) updateData.student_id = studentId;
    updateData.form_responses = formResponsesPayload;

    let { error: updateErr } = await supabase
      .from("applicants")
      .update(updateData)
      .eq("id", applicant.id);

    if (updateErr) {
      // Fallback 1: If PostgreSQL enum applicant_status rejected 'group_interview'
      if (updateErr.message && updateErr.message.includes("group_interview")) {
        delete updateData.status;
      }
      // Fallback 2: Retry update without problematic fields
      const { error: fallbackErr } = await supabase
        .from("applicants")
        .update(updateData)
        .eq("id", applicant.id);

      if (fallbackErr) {
        delete updateData.form_responses;
        await supabase
          .from("applicants")
          .update(updateData)
          .eq("id", applicant.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated interview slots and saved form responses for ${applicant.name}`,
      applicant: {
        id: applicant.id,
        email: applicant.email,
        scheduled_time: primarySlot,
        fallback_time: fallbackSlot,
        form_responses: formResponsesPayload,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
