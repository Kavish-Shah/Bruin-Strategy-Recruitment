import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = body.email?.trim()?.toLowerCase();
    const primarySlot = body.primarySlot || body.scheduled_time || body.primary_slot;
    const fallbackSlot = body.fallbackSlot || body.fallback_time || body.fallback_slot;
    const studentId = body.studentId || body.student_id || body.uid ? String(body.studentId || body.student_id || body.uid).trim() : null;
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

    // 1. PRIMARY MATCH: Search by Student ID first
    if (studentId) {
      const cleanId = studentId.replace(/\D/g, ""); // e.g. 905123456
      
      // Try exact student_id match
      let { data: byId } = await supabase
        .from("applicants")
        .select("id, name, email, student_id, form_responses")
        .eq("student_id", studentId);

      if ((!byId || byId.length === 0) && cleanId) {
        let { data: byClean } = await supabase
          .from("applicants")
          .select("id, name, email, student_id, form_responses")
          .eq("student_id", cleanId);
        byId = byClean;
      }

      if (byId && byId.length > 0) {
        applicant = byId[0];
      }
    }

    // 2. FALLBACK MATCH: Search by Email if Student ID didn't match
    if (!applicant && email) {
      const { data: byEmail } = await supabase
        .from("applicants")
        .select("id, name, email, student_id, form_responses")
        .ilike("email", email);

      if (byEmail && byEmail.length > 0) {
        applicant = byEmail[0];
      }
    }

    if (!applicant) {
      return NextResponse.json(
        { error: `Applicant with Student ID '${studentId}' or Email '${email}' not found` },
        { status: 404 }
      );
    }

    const formResponsesPayload = {
      submittedAt,
      primarySlot: primarySlot || null,
      fallbackSlot: fallbackSlot || null,
      studentId: studentId || null,
      rawPayload: body,
    };

    // 2. Update scheduled_time, fallback_time, student_id, form_responses, and status
    const updateData: Record<string, any> = {
      status: "interview",
    };
    if (primarySlot) updateData.scheduled_time = primarySlot;
    if (fallbackSlot) updateData.fallback_time = fallbackSlot;
    if (studentId) updateData.student_id = studentId;

    // Try including form_responses column if column exists
    try {
      updateData.form_responses = formResponsesPayload;
    } catch (_) {}

    const { error: updateErr } = await supabase
      .from("applicants")
      .update(updateData)
      .eq("id", applicant.id);

    if (updateErr) {
      // Fallback update without form_responses in case column is not migrated yet
      delete updateData.form_responses;
      const { error: fallbackErr } = await supabase
        .from("applicants")
        .update(updateData)
        .eq("id", applicant.id);

      if (fallbackErr) {
        return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
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
