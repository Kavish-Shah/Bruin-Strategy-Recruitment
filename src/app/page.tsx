"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import {
  Users,
  ClipboardList,
  CheckSquare,
  Calendar,
  Mail,
  BarChart3,
  Search,
  Sparkles,
  Filter,
  Database,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  Lock,
  RotateCcw,
  Shield,
  Heart,
  Briefcase,
} from "lucide-react";

import StatCard from "@/components/StatCard";
import ApplicantCard, { Applicant, InterviewComment } from "@/components/ApplicantCard";
import GradingModal from "@/components/GradingModal";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import DecisionEmailModal from "@/components/DecisionEmailModal";

// Initial active board members / graders
interface Grader {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "GRADER";
  avatar: string;
}

const INITIAL_GRADERS: Grader[] = [
  {
    id: "g1",
    name: "John Doe",
    email: "john.doe@bruinstrategy.org",
    role: "GRADER",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=John",
  },
  {
    id: "g2",
    name: "Jane Smith",
    email: "jane.smith@bruinstrategy.org",
    role: "GRADER",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jane",
  },
  {
    id: "g3",
    name: "Alex Chen",
    email: "alex.chen@bruinstrategy.org",
    role: "GRADER",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
  },
  {
    id: "g4",
    name: "Emily Taylor",
    email: "emily.taylor@bruinstrategy.org",
    role: "GRADER",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Emily",
  },
  {
    id: "g5",
    name: "Marcus Vance",
    email: "marcus.vance@bruinstrategy.org",
    role: "ADMIN",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus",
  },
];

// Initial mock applicants data - Empty array so ONLY real Supabase applicants are displayed
const INITIAL_APPLICANTS: Applicant[] = [];

interface EmailLog {
  id: string;
  recipientName: string;
  recipientEmail: string;
  type: "OFFER" | "REJECTION" | "INTERVIEW";
  timestamp: string;
  status: "SENT" | "FAILED";
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("applicant_profiles");
  const [selectedCohort, setSelectedCohort] = useState<string>(
    "Management Consulting"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userRole, setUserRole] = useState<"ADMIN" | "GRADER">("ADMIN");

  // Authentication & Sandbox states
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const isSandbox = false;
  const setIsSandbox = (val: boolean) => {};
  const [profileName, setProfileName] = useState<string>("Auth User");
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [emailInput, setEmailInput] = useState<string>(" ");
  const [password, setPassword] = useState<string>("");
  const [showPasswordLogin, setShowPasswordLogin] = useState<boolean>(true);
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [signUpName, setSignUpName] = useState<string>("");
  const [signUpEmail, setSignUpEmail] = useState<string>("");
  const [signUpPassword, setSignUpPassword] = useState<string>("");

  // State to switch active grader view (John Doe, Jane Smith, Alex Chen)
  const [activeGraderId, setActiveGraderId] = useState<string>("g1");

  // Accordion active expanded state in Grader widgets
  const [expandedGraderId, setExpandedGraderId] = useState<string | null>(null);

  // Profile View modal state trigger
  const [selectedApplicantForProfile, setSelectedApplicantForProfile] =
    useState<Applicant | null>(null);

  // Check if real Supabase keys are configured in local environment
  const hasSupabaseKeys = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return !!(
      url &&
      key &&
      !url.includes("placeholder") &&
      !url.includes("your-project-id")
    );
  }, []);

  // Listen for Supabase Authentication State changes
  useEffect(() => {
    if (!hasSupabaseKeys) {
      setLoadingAuth(false);
      return;
    }

    let isMounted = true;

    // Get current session safely
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        const session = data?.session || null;
        setSession(session);
        if (session) {
          fetchUserRole(session.user.id);
        }
        setLoadingAuth(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Supabase auth connection failed, falling back gracefully:", err);
        setLoadingAuth(false);
      });

    // Listen to changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole("ADMIN");
        setProfileName("Admin Board Member");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hasSupabaseKeys]);

  // Synchronize and load applicants list from Supabase if keys are configured
  useEffect(() => {
    if (!hasSupabaseKeys) return;

    const fetchApplicantsFromSupabase = async () => {
      try {
        const loggedInName = profileName !== "Auth User" ? profileName : (session?.user?.email?.split("@")[0] || "Auth User");
        // 1. Fetch all applicants from DB
        const { data: dbApplicants, error: appError } = await supabase
          .from("applicants")
          .select("*");

        if (appError) throw appError;

        // 2. Fetch all assignments, joining profile names and evaluation scores
        const { data: dbAssignments, error: assignError } = await supabase
          .from("assignments")
          .select(`
            id,
            applicant_id,
            grader_id,
            status,
            profiles (
              name
            ),
            evaluations (
              leadership_score,
              problem_solving_score,
              communication_score,
              essay_score,
              notes,
              created_at
            )
          `);

        if (assignError) throw assignError;

        // Fetch all profiles to see who is registered as a grader
        const { data: profilesList } = await supabase
          .from("profiles")
          .select("id, name, role, email");

        setDbProfiles(profilesList || []);

        // Map assignments by applicant_id
        const assignmentMap: Record<string, any> = {};
        if (dbAssignments) {
          for (const ass of dbAssignments) {
            assignmentMap[ass.applicant_id] = ass;
          }
        }

        // 4. Map DB applicants to React state
        const mapped: Applicant[] = dbApplicants.map((app) => {
          const ass = assignmentMap[app.id];
          const val = ass?.evaluations ? (Array.isArray(ass.evaluations) ? ass.evaluations[0] : ass.evaluations) : undefined;
          let grades: any = undefined;

          if (val) {
            grades = {
              leadership: val.leadership_score || 0,
              problemSolving: val.problem_solving_score || 0,
              communication: val.communication_score || 0,
              essay: val.essay_score || 0,
            };
          }

          const totalScore = grades ? (grades.leadership + grades.problemSolving + grades.communication + (grades.essay || 0)) : undefined;

          // Normalize cohort names from DB to match UI filters
          let normalizedCohort = app.cohort;
          if (app.cohort && app.cohort.toLowerCase().startsWith("manage")) {
            normalizedCohort = "Management Consulting";
          } else if (app.cohort && app.cohort.toLowerCase().startsWith("health")) {
            normalizedCohort = "Healthcare Consulting";
          }

          const assignedGraderId = app.assigned_grader_id || ass?.grader_id;

          const graderProfileName = ass?.profiles
            ? (Array.isArray(ass.profiles) ? ass.profiles[0]?.name : ass.profiles.name)
            : undefined;

          const fallbackGraderName = assignedGraderId && profilesList
            ? profilesList.find((p: any) => p.id === assignedGraderId)?.name
            : undefined;

          const assignedGraderName =
            graderProfileName ||
            fallbackGraderName ||
            (session && assignedGraderId === session.user.id ? loggedInName : undefined);

          const comments: InterviewComment[] = [];
          if (val && val.notes) {
            comments.push({
              id: `eval-notes-${app.id}`,
              author: assignedGraderName || "Board Member",
              text: val.notes,
              timestamp: val.created_at ? new Date(val.created_at).toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }) : new Date().toLocaleString(),
            });
          }

          return {
            id: app.id,
            name: app.name,
            email: app.email,
            hashId: app.id.slice(0, 6),
            submissionDate: app.created_at ? app.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            cohort: normalizedCohort,
            year: app.Year || app.year || app.YEAR || (app.cohort && app.cohort.toLowerCase().includes("freshman") ? "Freshman" : app.cohort && app.cohort.toLowerCase().includes("upper") ? "Upperclassman" : "Sophomore"),
            status: app.status,
            score: totalScore !== undefined ? parseFloat(totalScore.toFixed(1)) : undefined,
            grades,
            hasResume: !!(app.resume_url || app.resumeUrl || app.resume || app.Resume),
            resumeUrl: app.resume_url || app.resumeUrl || app.resume || app.Resume,
            assignedGraderId: assignedGraderId || undefined,
            assignedGraderName: assignedGraderName,
            scheduledTime: app.scheduled_time || null,
            fallbackTime: app.fallback_time || null,
            studentId: app.student_id || app.studentId || app.student_id_num || undefined,
            tableNumber: app.table_number || (app.form_responses && app.form_responses.tableNumber) || undefined,
            formResponses: app.form_responses || null,
            interviewComments: comments,
            shortAnswer: app.short_answer || app.shortAnswer || app.Short_Answer || undefined,
          };
        });

        // Update local React state strictly with DB entries from Supabase
        setApplicants(mapped);

      } catch (err: any) {
        console.error("Error fetching applicants from Supabase:", err);
        setApplicants([]);
      }
    };

    fetchApplicantsFromSupabase();
  }, [hasSupabaseKeys, session]);

  // Fetch Grader/Admin role from profiles table inside Supabase
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", userId);

      if (error) throw error;
      if (data && data.length > 0) {
        const userProf = data[0];
        setUserRole(userProf.role as any);
        setProfileName(userProf.name);
        showToast(`Authenticated as ${userProf.name} (${userProf.role})`, "success");
      } else {
        setUserRole("GRADER");
        setProfileName("Grader Board Member");
      }
    } catch (err: any) {
      console.warn("Notice fetching user role:", err.message);
      setUserRole("GRADER");
    }
  };

  // Sign In using email/password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !password) return;
    setLoadingAuth(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: password,
      });
      if (error) throw error;
      showToast("Signed in successfully!", "success");
    } catch (err: any) {
      showToast(`Auth Error: ${err.message}`, "error");
    } finally {
      setLoadingAuth(false);
    }
  };

  // Sign Up new grader account (strictly GRADER role)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = signUpName.trim();
    const cleanEmail = signUpEmail.trim().toLowerCase();
    if (!cleanName || !cleanEmail || !signUpPassword) return;
    setLoadingAuth(true);

    try {
      // 1. Try Supabase Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: signUpPassword,
        options: {
          data: {
            name: cleanName,
            role: "GRADER",
          },
        },
      });

      if (authError) throw authError;

      const userId = authData?.user?.id;
      if (!userId) throw new Error("No user ID returned from sign up");

      // 2. Insert/Upsert new Grader profile into public.profiles table
      const newProfileObj = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: "GRADER",
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert([newProfileObj], { onConflict: "id" });

      if (profileError) {
        console.warn("Notice saving profile to DB:", profileError.message);
      }

      // 3. Update active session & role to GRADER
      setUserRole("GRADER");
      setProfileName(cleanName);
      setSession({
        user: { id: userId, email: cleanEmail },
      } as any);

      // 4. Update dbProfiles state
      setDbProfiles((prev) => [
        ...prev.filter((p) => p.email !== cleanEmail),
        newProfileObj,
      ]);

      showToast(`Grader account created for ${cleanName}! Signed in as Grader.`, "success");
    } catch (err: any) {
      console.error("Sign up error:", err);
      showToast(`Notice: ${err.message}`, "error");
    } finally {
      setLoadingAuth(false);
    }
  };

  // Sign Out handler
  const handleSignOut = async () => {
    if (isSandbox) {
      setIsSandbox(false);
      setSession(null);
      showToast("Logged out of Mock Sandbox", "info");
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast("Successfully signed out of Supabase!", "info");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Dynamically compute active graders based ONLY on profiles in Supabase (dbProfiles) when configured
  const gradersList = useMemo<Grader[]>(() => {
    if (hasSupabaseKeys) {
      if (dbProfiles && dbProfiles.length > 0) {
        return dbProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email || `${p.name.toLowerCase().replace(/\s+/g, ".")}@bruinstrategy.org`,
          role: (p.role === "ADMIN" ? "ADMIN" : "GRADER") as "ADMIN" | "GRADER",
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(p.name)}`,
        }));
      }
      return [];
    }
    return INITIAL_GRADERS;
  }, [hasSupabaseKeys, dbProfiles]);

  // Track the logged in user context
  const currentUser = useMemo(() => {
    const name = profileName !== "Auth User" ? profileName : (session?.user?.email?.split("@")[0] || "Grader Board Member");
    const email = session?.user?.email || "grader@bruinstrategy.org";
    const id = session?.user?.id || "g-user";
    
    return {
      id,
      name,
      email,
      role: userRole,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    };
  }, [profileName, session, userRole]);

  // DB States
  const [applicants, setApplicants] = useState<Applicant[]>(() =>
    hasSupabaseKeys ? [] : INITIAL_APPLICANTS
  );
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([
    {
      id: "log-1",
      recipientName: "Sarah Jenkins",
      recipientEmail: "sarah.j@ucla.edu",
      type: "INTERVIEW",
      timestamp: "2026-07-10 10:45 AM",
      status: "SENT",
    },
    {
      id: "log-2",
      recipientName: "Ryan Patel",
      recipientEmail: "rpatel@ucla.edu",
      type: "INTERVIEW",
      timestamp: "2026-07-10 11:20 AM",
      status: "SENT",
    },
  ]);

  // Grading Modal & Assigning State
  const [gradingApplicant, setGradingApplicant] = useState<Applicant | null>(
    null
  );
  const [assigningApplicantId, setAssigningApplicantId] = useState<
    string | null
  >(null);
  const [decisionEmailTarget, setDecisionEmailTarget] = useState<{
    applicant: Applicant;
    type: "REJECTION" | "OFFER" | "INTERVIEW";
  } | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({ message: "", type: "success", visible: false });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ message, type, visible: true });
  };

  // Coffee Chat Table Assignments state & drag-and-drop support
  const [tableAssignments, setTableAssignments] = useState<Record<string, number>>({});
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverTableKey, setDragOverTableKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("coffee_chat_tables");
      if (saved) setTableAssignments(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const handleAssignTable = async (applicantId: string, tableNum: number) => {
    // 1. Update React state immediately for snappy UI
    setTableAssignments((prev) => {
      const next = { ...prev, [applicantId]: tableNum };
      try {
        localStorage.setItem("coffee_chat_tables", JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    setApplicants((prev) =>
      prev.map((app) => (app.id === applicantId ? { ...app, tableNumber: tableNum } : app))
    );

    // 2. Persist globally to Supabase!
    if (hasSupabaseKeys) {
      try {
        const { error: colErr } = await supabase
          .from("applicants")
          .update({ table_number: tableNum })
          .eq("id", applicantId);

        if (colErr) {
          // Fallback to storing inside form_responses jsonb column
          const existingApp = applicants.find((a) => a.id === applicantId);
          const existingResponses = existingApp?.formResponses || {};
          const updatedResponses = { ...existingResponses, tableNumber: tableNum };

          await supabase
            .from("applicants")
            .update({ form_responses: updatedResponses })
            .eq("id", applicantId);
        }
      } catch (err: any) {
        console.error("Error updating table number in Supabase:", err);
      }
    }

    showToast(`Assigned candidate to Table ${tableNum}`, "success");
  };

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Dynamic ranking calculations helper inside a cohort (Highest score = #1 Rank)
  const recalculateRanks = (allApplicants: Applicant[]) => {
    return allApplicants.map((app) => {
      if (
        !["completed", "interview", "offered", "rejected"].includes(app.status) ||
        app.score === undefined
      ) {
        return { ...app, rank: undefined };
      }
      const cohortCompletions = allApplicants
        .filter(
          (a) =>
            a.cohort === app.cohort &&
            ["completed", "interview", "offered", "rejected"].includes(a.status) &&
            a.score !== undefined
        )
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      const rankIndex = cohortCompletions.findIndex((a) => a.id === app.id);
      return { ...app, rank: rankIndex !== -1 ? rankIndex + 1 : undefined };
    });
  };

  // 1. Round-Robin Distribution Function
  const handleRoundRobinDistribute = async () => {
    if (hasSupabaseKeys && session) {
      try {
        const { data, error } = await supabase.rpc("distribute_applicants_round_robin");
        if (error) throw error;
        
        if (data && data.success) {
          showToast(
            `Distributed ${data.assigned_count} applicants across ${data.graders_count} active graders!`,
            "success"
          );
          window.location.reload();
        } else {
          showToast(data?.message || "Failed to distribute applicants.", "error");
        }
      } catch (err: any) {
        console.error("Error distributing applicants:", err);
        showToast(`Error: ${err.message}`, "error");
      }
      return;
    }

    const unassigned = applicants.filter((a) => a.status === "unassigned");
    if (unassigned.length === 0) {
      showToast("All applicants are already assigned!", "info");
      return;
    }

    const activeGraders = gradersList.filter((g) => g.role === "GRADER");
    if (activeGraders.length === 0) {
      showToast("No active graders available to distribute to.", "error");
      return;
    }

    const updated = [...applicants];
    let graderIndex = 0;

    unassigned.forEach((unassignedApp) => {
      const idx = updated.findIndex((a) => a.id === unassignedApp.id);
      if (idx !== -1) {
        const grader = activeGraders[graderIndex];
        updated[idx] = {
          ...updated[idx],
          status: "assigned",
          assignedGraderName: grader.name,
        };
        graderIndex = (graderIndex + 1) % activeGraders.length;
      }
    });

    setApplicants(updated);
    showToast(
      `Distributed ${unassigned.length} applicants across ${activeGraders.length} active graders!`,
      "success"
    );
  };

  // Manual Assign
  const handleAssignGrader = async (applicantId: string, graderName: string) => {
    if (hasSupabaseKeys && session) {
      try {
        let graderProfile = dbProfiles.find(
          (p) => p.name.toLowerCase() === graderName.toLowerCase()
        );
        
        // Resilient Fallback: If not found by name, try to find any profile with a GRADER role, or any profile at all
        if (!graderProfile) {
          graderProfile = dbProfiles.find((p) => p.role === "GRADER") || dbProfiles[0];
          if (!graderProfile) {
            throw new Error(`No board member profiles found in database.`);
          }
          console.warn(`Grader name "${graderName}" not found. Falling back to profile: ${graderProfile.name}`);
          graderName = graderProfile.name;
        }

        const { data: existingAssignment, error: findError } = await supabase
          .from("assignments")
          .select("id")
          .eq("applicant_id", applicantId)
          .maybeSingle();

        if (findError) throw findError;

        if (existingAssignment) {
          const { error: updateError } = await supabase
            .from("assignments")
            .update({ grader_id: graderProfile.id })
            .eq("id", existingAssignment.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("assignments")
            .insert({
              applicant_id: applicantId,
              grader_id: graderProfile.id,
              status: "assigned",
            });

          if (insertError) throw insertError;
        }

        const { error: appError } = await supabase
          .from("applicants")
          .update({
            status: "assigned",
            assigned_grader_id: graderProfile.id,
          })
          .eq("id", applicantId);

        if (appError && appError.code === "42703") {
          const { error: fallbackError } = await supabase
            .from("applicants")
            .update({ status: "assigned" })
            .eq("id", applicantId);
          if (fallbackError) throw fallbackError;
        } else if (appError) {
          throw appError;
        }

        showToast(`Successfully assigned applicant to ${graderName}!`, "success");
        
        setApplicants((prev) =>
          prev.map((app) =>
            app.id === applicantId
              ? {
                  ...app,
                  status: "assigned",
                  assignedGraderId: graderProfile.id,
                  assignedGraderName: graderName,
                }
              : app
          )
        );
      } catch (err: any) {
        console.error("Supabase manual assign error:", err);
        showToast(`Error assigning grader: ${err.message}`, "error");
      }
      setAssigningApplicantId(null);
      return;
    }

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId
          ? { ...app, status: "assigned", assignedGraderName: graderName }
          : app
      )
    );
    setAssigningApplicantId(null);
    showToast(`Assigned applicant to ${graderName}`, "success");
  };

  // Manual Unassign
  const handleUnassignGrader = async (applicantId: string) => {
    const applicant = applicants.find((a) => a.id === applicantId);
    const applicantName = applicant ? applicant.name : "Applicant";

    if (hasSupabaseKeys && session) {
      try {
        // Delete assignment record
        const { error: assignError } = await supabase
          .from("assignments")
          .delete()
          .eq("applicant_id", applicantId);

        if (assignError) {
          console.warn("Notice deleting assignment record:", assignError.message);
        }

        // Update applicants table: set status to unassigned and assigned_grader_id to null
        const { error: appError } = await supabase
          .from("applicants")
          .update({
            status: "unassigned",
            assigned_grader_id: null,
          })
          .eq("id", applicantId);

        if (appError && appError.code === "42703") {
          const { error: fallbackError } = await supabase
            .from("applicants")
            .update({ status: "unassigned" })
            .eq("id", applicantId);
          if (fallbackError) throw fallbackError;
        } else if (appError) {
          throw appError;
        }

        showToast(`Successfully unassigned ${applicantName}!`, "info");
      } catch (err: any) {
        console.error("Supabase manual unassign error:", err);
        showToast(`Error unassigning grader: ${err.message}`, "error");
        return;
      }
    } else {
      showToast(`Unassigned ${applicantName}`, "info");
    }

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId
          ? {
              ...app,
              status: "unassigned",
              assignedGraderId: undefined,
              assignedGraderName: undefined,
            }
          : app
      )
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === applicantId
        ? {
            ...prev,
            status: "unassigned",
            assignedGraderId: undefined,
            assignedGraderName: undefined,
          }
        : prev
    );
  };

  // Submit Evaluation
  const handleSubmitEvaluation = async (
    applicantId: string,
    grades: { leadership: number; problemSolving: number; communication: number; essay: number },
    notes: string
  ) => {
    console.log("handleSubmitEvaluation received grades:", grades, "notes:", notes);
    const score = parseFloat(
      (grades.leadership + grades.problemSolving + grades.communication + grades.essay).toFixed(
        1
      )
    );

    if (hasSupabaseKeys && session) {
      try {
        let { data: assignment, error: assignError } = await supabase
          .from("assignments")
          .select("id")
          .eq("applicant_id", applicantId)
          .maybeSingle();

        if (assignError) throw assignError;

        let assignmentId = assignment?.id;

        if (!assignmentId) {
          const { data: newAssign, error: createAssignError } = await supabase
            .from("assignments")
            .insert({
              applicant_id: applicantId,
              grader_id: currentUser.id,
              status: "completed",
            })
            .select()
            .single();

          if (createAssignError) throw createAssignError;
          assignmentId = newAssign.id;
        } else {
          const { error: updateAssignError } = await supabase
            .from("assignments")
            .update({ 
              status: "completed",
              grader_id: currentUser.id
            })
            .eq("id", assignmentId);

          if (updateAssignError) throw updateAssignError;
        }

        const { error: evalError } = await supabase
          .from("evaluations")
          .upsert(
            {
              assignment_id: assignmentId,
              leadership_score: grades.leadership,
              problem_solving_score: grades.problemSolving,
              communication_score: grades.communication,
              essay_score: grades.essay,
              notes: notes,
            },
            { onConflict: "assignment_id" }
          );

        if (evalError) throw evalError;

        const { error: appError } = await supabase
          .from("applicants")
          .update({ status: "completed" })
          .eq("id", applicantId);

        if (appError) throw appError;

        showToast("Grade successfully updated in Supabase database!", "success");
      } catch (err: any) {
        console.error("Supabase update error:", err);
        showToast(`Error writing to Supabase: ${err.message}`, "error");
        return;
      }
    } else {
      console.log("Simulating Supabase update query:", {
        query: "UPSERT evaluations / UPDATE applicants",
        payload: {
          applicantId,
          leadership_score: grades.leadership,
          problem_solving_score: grades.problemSolving,
          communication_score: grades.communication,
          essay_score: grades.essay,
          notes,
        },
      });
      showToast(
        "Supabase (Simulated): Evaluation updated successfully!",
        "success"
      );
    }

    setApplicants((prev) => {
      const updated = prev.map((app) => {
        if (app.id === applicantId) {
          return {
            ...app,
            status: "completed" as const,
            score,
            grades,
          };
        }
        return app;
      });
      return recalculateRanks(updated);
    });

    setGradingApplicant(null);
  };

  // Reschedule Applicant timing Block
  const handleRescheduleApplicant = async (
    applicantId: string,
    newTime: "09:00 AM" | "10:30 AM" | "01:00 PM" | null
  ) => {
    if (hasSupabaseKeys && session) {
      try {
        await supabase
          .from("applicants")
          .update({ scheduled_time: newTime })
          .eq("id", applicantId);
      } catch (err: any) {
        console.warn("Notice saving scheduled_time:", err);
      }
    }

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId ? { ...app, scheduledTime: newTime } : app
      )
    );
    const app = applicants.find((a) => a.id === applicantId);
    const label =
      newTime === "09:00 AM"
        ? "9:00 AM Block"
        : newTime === "10:30 AM"
        ? "10:30 AM Block"
        : newTime === "01:00 PM"
        ? "1:00 PM Block"
        : "Unscheduled Queue";
    showToast(`Rescheduled ${app?.name} to the ${label}!`, "success");
  };

  // Add Dynamic Interview Comments inside profile view
  const handleAddInterviewComment = (
    applicantId: string,
    commentText: string,
    authorName: string
  ) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      author: authorName,
      text: commentText,
      timestamp: new Date().toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setApplicants((prev) =>
      prev.map((app) => {
        if (app.id === applicantId) {
          const currentComments = app.interviewComments || [];
          return {
            ...app,
            interviewComments: [...currentComments, newComment],
          };
        }
        return app;
      })
    );

    // Sync state for the open profile modal view
    setSelectedApplicantForProfile((prev) => {
      if (prev && prev.id === applicantId) {
        const currentComments = prev.interviewComments || [];
        return {
          ...prev,
          interviewComments: [...currentComments, newComment],
        };
      }
      return prev;
    });

    console.log("Simulating Supabase comment insert:", {
      query: "INSERT INTO interview_comments",
      payload: { applicantId, author: authorName, text: commentText },
    });
    showToast("Interview comment saved successfully!", "success");
  };

  // Trigger Decision Email Modal Popups (Admin action)
  const handleSendInterview = (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (applicant) {
      setDecisionEmailTarget({ applicant, type: "INTERVIEW" });
    }
  };

  const handleSendOffer = (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (applicant) {
      setDecisionEmailTarget({ applicant, type: "OFFER" });
    }
  };

  const handleSendReject = (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (applicant) {
      setDecisionEmailTarget({ applicant, type: "REJECTION" });
    }
  };

  // Rescind / Revoke Interview Offer (returns candidate to completed/graded status)
  const handleRescindInterview = async (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    if (hasSupabaseKeys && session) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({
            status: "completed",
            scheduled_time: null,
          })
          .eq("id", id);

        if (error) throw error;

        // Try updating fallback_time if column exists in remote DB
        try {
          await supabase
            .from("applicants")
            .update({ fallback_time: null })
            .eq("id", id);
        } catch (_) {}
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase rescind interview error:", errMsg, err);
        showToast(`Supabase update notice: ${errMsg}`, "error");
      }
    }

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: "completed",
              scheduledTime: null,
              fallbackTime: null,
            }
          : app
      )
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: "completed",
            scheduledTime: null,
            fallbackTime: null,
          }
        : prev
    );

    showToast(
      `Rescinded interview offer for ${applicant.name}. Candidate returned to graded list.`,
      "info"
    );
  };

  // Update Primary Scheduled Time and Fallback Time
  const handleUpdateScheduledTimes = async (
    applicantId: string,
    primaryTime: string | null,
    fallbackTime: string | null
  ) => {
    if (hasSupabaseKeys && session) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({
            scheduled_time: primaryTime,
          })
          .eq("id", applicantId);

        if (error) throw error;

        if (fallbackTime !== undefined) {
          try {
            await supabase
              .from("applicants")
              .update({ fallback_time: fallbackTime })
              .eq("id", applicantId);
          } catch (_) {}
        }
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase timing update error:", errMsg, err);
        showToast(`Supabase update notice: ${errMsg}`, "error");
      }
    }

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId
          ? { ...app, scheduledTime: primaryTime, fallbackTime }
          : app
      )
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === applicantId
        ? { ...prev, scheduledTime: primaryTime, fallbackTime }
        : prev
    );

    const app = applicants.find((a) => a.id === applicantId);
    showToast(
      `Updated interview slots for ${app?.name || "candidate"}! (Primary: ${primaryTime || "None"}, Fallback: ${fallbackTime || "None"})`,
      "success"
    );
  };

  // Execution routines after copying & confirming in DecisionEmailModal
  const executeSendInterview = async (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    if (hasSupabaseKeys && session) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({ status: "interview" })
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase send interview error:", errMsg, err);
        showToast(`Supabase update notice: ${errMsg}`, "error");
      }
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "interview" } : app))
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === id ? { ...prev, status: "interview" } : prev
    );

    const newLog: EmailLog = {
      id: `log-${Date.now()}`,
      recipientName: applicant.name,
      recipientEmail: applicant.email,
      type: "INTERVIEW",
      timestamp: new Date().toLocaleString(),
      status: "SENT",
    };

    setEmailLogs((prev) => [newLog, ...prev]);
    showToast(`Copied text & marked ${applicant.name} as Interviewing!`, "success");
  };

  const executeSendOffer = async (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    if (hasSupabaseKeys && session) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({ status: "offered" })
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase send offer error:", errMsg, err);
        showToast(`Supabase update notice: ${errMsg}`, "error");
      }
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "offered" } : app))
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === id ? { ...prev, status: "offered" } : prev
    );

    const newLog: EmailLog = {
      id: `log-${Date.now()}`,
      recipientName: applicant.name,
      recipientEmail: applicant.email,
      type: "OFFER",
      timestamp: new Date().toLocaleString(),
      status: "SENT",
    };

    setEmailLogs((prev) => [newLog, ...prev]);
    showToast(`Copied text & extended offer to ${applicant.name}!`, "success");
  };

  // Revoke / Rescind Offer (returns candidate to completed/graded status needing an offer)
  const handleRevokeOffer = async (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    if (hasSupabaseKeys && session) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({
            status: "completed",
            scheduled_time: null,
          })
          .eq("id", id);

        if (error) throw error;
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase revoke offer error:", errMsg, err);
        showToast(`Supabase update notice: ${errMsg}`, "error");
      }
    }

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: "completed",
              scheduledTime: null,
            }
          : app
      )
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: "completed",
            scheduledTime: null,
          }
        : prev
    );

    showToast(
      `Revoked offer for ${applicant.name}. Candidate returned to graded status needing offer.`,
      "info"
    );
  };

  const executeSendReject = async (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    if (hasSupabaseKeys && session) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({ status: "rejected" })
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase send reject error:", errMsg, err);
        showToast(`Supabase update notice: ${errMsg}`, "error");
      }
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" } : app))
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === id ? { ...prev, status: "rejected" } : prev
    );

    const newLog: EmailLog = {
      id: `log-${Date.now()}`,
      recipientName: applicant.name,
      recipientEmail: applicant.email,
      type: "REJECTION",
      timestamp: new Date().toLocaleString(),
      status: "SENT",
    };

    setEmailLogs((prev) => [newLog, ...prev]);
    showToast(`Copied rejection text & marked ${applicant.name} as Rejected.`, "info");
  };

  // Undo Rejection (Restores candidate with their score & completed/assigned status preserved)
  const handleUndoRejection = async (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    const targetStatus = applicant.score !== undefined ? "completed" : "assigned";

    if (hasSupabaseKeys && session) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({ status: targetStatus })
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Supabase undo rejection error:", err);
        showToast(`Error updating Supabase: ${err.message}`, "error");
        return;
      }
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: targetStatus } : app))
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === id ? { ...prev, status: targetStatus } : prev
    );

    showToast(
      `Rejection undone for ${applicant.name}! Restored score (${applicant.score ?? "N/A"}) & profile.`,
      "success"
    );
  };

  // Ungrade applicant (Admin only)
  const handleUngradeApplicant = async (id: string) => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    if (hasSupabaseKeys && session) {
      try {
        // 1. Find the assignment for this applicant
        const { data: assignment, error: assignError } = await supabase
          .from("assignments")
          .select("id")
          .eq("applicant_id", id)
          .maybeSingle();

        if (assignError) throw assignError;

        if (assignment) {
          // 2. Delete the evaluation first (due to foreign key constraint on assignment_id)
          const { error: evalDeleteError } = await supabase
            .from("evaluations")
            .delete()
            .eq("assignment_id", assignment.id);

          if (evalDeleteError) throw evalDeleteError;

          // 3. Reset assignment status back to 'assigned'
          const { error: updateAssignError } = await supabase
            .from("assignments")
            .update({ status: "assigned" })
            .eq("id", assignment.id);

          if (updateAssignError) throw updateAssignError;
        }

        // 4. Reset applicant status back to 'assigned'
        const { error: appError } = await supabase
          .from("applicants")
          .update({ status: "assigned" })
          .eq("id", id);

        if (appError) throw appError;

        showToast(`Successfully ungraded ${applicant.name} in database!`, "success");
      } catch (err: any) {
        console.error("Supabase ungrade error:", err);
        showToast(`Error writing to Supabase: ${err.message}`, "error");
        return;
      }
    } else {
      console.log("Simulating Supabase ungrade query:", {
        query: "DELETE evaluations / UPDATE assignments & applicants",
        payload: { applicantId: id },
      });
      showToast(`Successfully ungraded ${applicant.name} (simulated)!`, "success");
    }

    setApplicants((prev) => {
      const updated = prev.map((app) => {
        if (app.id === id) {
          return {
            ...app,
            status: "assigned" as const,
            score: undefined,
            grades: undefined,
          };
        }
        return app;
      });
      return recalculateRanks(updated);
    });
    setStatusFilter("all");
  };

  // Reset all sandbox applicants to 'assigned' status (Admin only)
  const handleResetAllApplicants = async () => {
    if (window.confirm("Are you sure you want to reset all applicants to assigned status, wipe all scores, and reset the dashboard?")) {
      if (hasSupabaseKeys && session) {
        try {
          // 1. Delete all assignments (cascades and deletes evaluations too)
          const { error: assignError } = await supabase
            .from("assignments")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

          if (assignError) throw assignError;

          // 2. Reset all applicants to assigned status
          const { error: appError } = await supabase
            .from("applicants")
            .update({ status: "assigned" })
            .neq("id", "00000000-0000-0000-0000-000000000000");

          if (appError) throw appError;

          showToast("Successfully reset all candidates in the database!", "success");
        } catch (err: any) {
          console.error("Supabase reset error:", err);
          showToast(`Error resetting database: ${err.message}`, "error");
          return;
        }
      } else {
        console.log("Simulating board reset:", {
          query: "DELETE assignments & UPDATE applicants to assigned",
        });
        showToast("Sandbox board reset successfully to 'Assigned' status!", "success");
      }

      const defaultGraders: Record<string, string> = {
        "app-1": "John Doe",
        "app-2": "Jane Smith",
        "app-3": "Jane Smith",
        "app-4": "John Doe",
        "app-5": "Jane Smith",
        "app-6": "Alex Chen",
        "app-7": "Marcus Vance",
        "app-8": "John Doe",
        "app-9": "Jane Smith",
        "app-10": "Emily Taylor",
        "app-11": "Alex Chen",
        "app-12": "Marcus Vance",
        "app-13": "Emily Taylor",
        "app-14": "Alex Chen",
        "app-15": "Emily Taylor",
      };

      setApplicants((prev) => {
        const updated = prev.map((app) => ({
          ...app,
          status: "assigned" as const,
          score: undefined,
          grades: undefined,
          assignedGraderName: defaultGraders[app.id] || "John Doe",
          rank: undefined,
        }));
        return updated;
      });
      setStatusFilter("all");
    }
  };

  // Calculate stats dynamically based on cohort
  const cohortStats = useMemo(() => {
    const cohortApplicants = applicants.filter(
      (a) => a.cohort === selectedCohort
    );
    const total = cohortApplicants.length;
    const assigned = cohortApplicants.filter(
      (a) => a.status !== "unassigned"
    ).length;
    const completed = cohortApplicants.filter((a) =>
      ["completed", "interview", "offered", "rejected"].includes(a.status)
    ).length;
    const interviewInvites = cohortApplicants.filter((a) =>
      ["interview", "offered"].includes(a.status)
    ).length;
    const offered = interviewInvites;

    return { total, assigned, completed, offered, interviewInvites };
  }, [applicants, selectedCohort]);

  // Compute dynamic overall cohort average score (out of 25.0)
  const overallAverageScore = useMemo(() => {
    const completedApps = applicants.filter(
      (a) =>
        a.cohort === selectedCohort &&
        ["completed", "interview", "offered", "rejected"].includes(a.status) &&
        a.score !== undefined
    );
    if (completedApps.length === 0) return 0;
    const total = completedApps.reduce((acc, a) => acc + (a.score || 0), 0);
    return parseFloat((total / completedApps.length).toFixed(1));
  }, [applicants, selectedCohort]);

  // Compute dynamic score distribution for custom charts
  const scoreDistribution = useMemo(() => {
    const completedApps = applicants.filter(
      (a) =>
        a.cohort === selectedCohort &&
        ["completed", "interview", "offered", "rejected"].includes(a.status) &&
        a.score !== undefined
    );
    const exceptional = completedApps.filter((a) => (a.score || 0) >= 21).length;
    const competitive = completedApps.filter((a) => (a.score || 0) >= 16 && (a.score || 0) < 21).length;
    const average = completedApps.filter((a) => (a.score || 0) >= 11 && (a.score || 0) < 16).length;
    const needsReview = completedApps.filter((a) => (a.score || 0) < 11).length;
    const total = completedApps.length || 1;
    return {
      exceptional,
      competitive,
      average,
      needsReview,
      exceptionalPercent: (exceptional / total) * 100,
      competitivePercent: (competitive / total) * 100,
      averagePercent: (average / total) * 100,
      needsReviewPercent: (needsReview / total) * 100,
    };
  }, [applicants, selectedCohort]);

  // Compute dynamic funnel stats
  const funnelStats = useMemo(() => {
    const total = applicants.length || 1;
    const evaluated = applicants.filter((a) =>
      ["completed", "interview", "offered", "rejected"].includes(a.status)
    ).length;
    const offered = applicants.filter((a) => a.status === "offered").length;
    return {
      total,
      evaluated,
      offered,
      evaluatedPercent: Math.round((evaluated / total) * 100),
      offeredPercent: Math.round((offered / total) * 100),
    };
  }, [applicants]);

  // Compute grading statistics per grader dynamically (including average scores & expanded collapsibles)
  const graderAssignments = useMemo(() => {
    return gradersList.map((grader) => {
      const assignedApps = applicants.filter(
        (a) => a.assignedGraderName === grader.name
      );
      const completedApps = assignedApps.filter((a) =>
        ["completed", "interview", "offered", "rejected"].includes(a.status)
      );

      const totalScores = completedApps.reduce(
        (acc, app) => acc + (app.score || 0),
        0
      );
      const averageScore =
        completedApps.length > 0
          ? parseFloat((totalScores / completedApps.length).toFixed(1))
          : null;

      return {
        ...grader,
        assignedCount: assignedApps.length,
        completedCount: completedApps.length,
        averageScore,
        gradedApplicants: completedApps,
      };
    });
  }, [gradersList, applicants]);

  // Filter and search applicants
  const filteredApplicants = useMemo(() => {
    return applicants
      .filter((app) => {
        if (app.cohort !== selectedCohort) return false;

        if (
          userRole === "GRADER" &&
          app.assignedGraderName !== currentUser.name
        ) {
          return false;
        }

        if (
          activeTab === "my_assignments" &&
          app.assignedGraderName !== currentUser.name
        ) {
          return false;
        }

        if (statusFilter !== "all" && app.status !== statusFilter) return false;

        const matchText = searchQuery.trim().toLowerCase();
        if (matchText !== "" && !app.name.toLowerCase().includes(matchText)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Highest score (lowest rank #1) first
        if (a.rank !== undefined && b.rank !== undefined) {
          return a.rank - b.rank;
        }
        if (a.rank !== undefined) return -1;
        if (b.rank !== undefined) return 1;

        if (a.score !== undefined && b.score !== undefined) {
          return b.score - a.score;
        }
        if (a.score !== undefined) return -1;
        if (b.score !== undefined) return 1;

        return a.name.localeCompare(b.name);
      });
  }, [
    applicants,
    selectedCohort,
    activeTab,
    statusFilter,
    searchQuery,
    userRole,
    currentUser,
  ]);

  // LOADING STATE
  if (loadingAuth) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Authenticating Recruitment Pipeline...
        </span>
      </div>
    );
  }

  if (!hasSupabaseKeys) {
      return (
        <div className="flex h-screen w-full bg-slate-100 items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Supabase Configuration Missing
            </h2>
            <p className="text-xs text-slate-550 leading-relaxed">
              Please configure your Supabase credentials in your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env.local</code> file in the project root directory.
            </p>
            <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-2 text-[11px] font-mono text-slate-600">
              <p>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
            </div>
            <p className="text-[10px] text-slate-400">
              Once configured, restart your local development server (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded">npm run dev</code>).
            </p>
          </div>
        </div>
      );
    }

  if (!session && !isSandbox) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 pb-6 text-center border-b border-slate-100">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
              <Lock className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {isSignUpMode ? "Create Grader Account" : "Welcome Back"}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {isSignUpMode
                ? "Register to evaluate candidates."
                : "Sign in to access your recruitment dashboard."}
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={isSignUpMode ? handleSignUp : handleSignIn} className="space-y-5">
              {isSignUpMode && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={isSignUpMode ? signUpEmail : emailInput}
                  onChange={(e) => isSignUpMode ? setSignUpEmail(e.target.value) : setEmailInput(e.target.value)}
                  required
                  placeholder="name@bruinstrategy.org"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={isSignUpMode ? signUpPassword : password}
                  onChange={(e) => isSignUpMode ? setSignUpPassword(e.target.value) : setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-3.5 transition-all shadow-sm hover:shadow active:scale-[0.98]"
              >
                {isSignUpMode ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUpMode(!isSignUpMode)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {isSignUpMode
                  ? "Already have an account? Sign In"
                  : "Need a grader account? Create one"}
              </button>
            </div>
          </div>
        </div>
        {toast.visible && (
          <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl text-sm font-bold shadow-lg animate-in fade-in slide-in-from-bottom-4 ${toast.type === "error" ? "bg-rose-500 text-white" : toast.type === "success" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"}`}>
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* LEFT SIDEBAR (NAVIGATION) */}
      <aside className={`w-64 border-r border-slate-200/80 bg-slate-55 flex flex-col justify-between shrink-0 ${isSandbox ? "pt-8" : ""}`}>
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-start bg-white">
            <img
              src="/bruin-strategy-network-logo.png"
              alt="Bruin Strategy Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* SYSTEM ROLE switcher - Only accessible to ADMIN users */}
          {userRole === "ADMIN" && (
            <div className="p-4 mx-3 my-4 rounded-2xl border border-slate-200/60 bg-white shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2 text-center">
                SYSTEM ROLE
              </span>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setUserRole("ADMIN");
                    setActiveTab("applicant_profiles");
                    setStatusFilter("all");
                    showToast("Switched system view to Admin", "info");
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    userRole === "ADMIN"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setUserRole("GRADER");
                    setActiveTab("my_assignments");
                    setStatusFilter("all");
                    showToast(`Switched system view to Grader (${gradersList.find(g => g.id === activeGraderId)?.name || "Grader"})`, "info");
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    (userRole as string) === "GRADER"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Grader
                </button>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab("my_assignments");
                setStatusFilter("all");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "my_assignments"
                  ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                  : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="h-4 w-4 text-slate-550" />
              My Assignments
              {userRole === "GRADER" && (
                <span className="ml-auto bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {
                    applicants.filter(
                      (a) =>
                        (a.assignedGraderName === currentUser.name || a.assignedGraderId === currentUser.id) &&
                        !["completed", "interview", "offered", "rejected"].includes(a.status)
                    ).length
                  }
                </span>
              )}
            </button>

            {userRole === "ADMIN" && (
              <button
                onClick={() => {
                  setActiveTab("applicant_profiles");
                  setStatusFilter("all");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "applicant_profiles"
                    ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                    : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
                }`}
              >
                <Users className="h-4 w-4 text-slate-555" />
                Applicant Profiles
                <span className="ml-auto bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full text-[10px]">
                  {applicants.length}
                </span>
              </button>
            )}

            {userRole === "ADMIN" && (
              <>
                <button
                  onClick={() => setActiveTab("coffee_chats")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "coffee_chats" || activeTab === "interviews"
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                      : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
                  }`}
                >
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Coffee Chats Scheduler
                </button>

                <button
                  onClick={() => setActiveTab("group_interviews")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "group_interviews"
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                      : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
                  }`}
                >
                  <Users className="h-4 w-4 text-purple-600" />
                  Group Interviews
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab("rubric_manager")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "rubric_manager"
                  ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                  : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="h-4 w-4 text-slate-550" />
              Global Rubric Manager
            </button>

            {userRole === "ADMIN" && (
              <button
                onClick={() => setActiveTab("emails")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "emails"
                    ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                    : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
                }`}
              >
                <Mail className="h-4 w-4 text-slate-555" />
                Email Automation Control
              </button>
            )}

            {userRole === "ADMIN" && (
              <button
                onClick={() => setActiveTab("analytics")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                    : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="h-4 w-4 text-slate-550" />
                Cohort Analytics
              </button>
            )}
          </nav>
        </div>

        {/* Profile Footer info */}
        <div className="p-4 border-t border-slate-200/80 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-10 w-10 rounded-full border border-slate-200 bg-slate-55 p-0.5"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800 truncate">
                {currentUser.name}
              </h4>
              <span className="text-[10px] text-slate-500 truncate block">
                {currentUser.email}
              </span>
              <span className="inline-block text-[9px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide border border-slate-200/40">
                {currentUser.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full h-9 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className={`flex-1 flex flex-col overflow-hidden bg-white ${isSandbox ? "pt-8" : ""}`}>
        
        {/* TOP HEADER */}
        <header className="px-8 py-5 border-b border-slate-200/80 bg-white backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              {userRole === "ADMIN" ? "Admin Dashboard" : "Grader Dashboard"}
              <span className="text-xs font-normal text-slate-400">v1.2.0</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Bruin Strategy Winter/Spring Recruitment Cycle
            </p>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            {/* Segmented control for cohort selection */}
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 p-1.5 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2">
                Cohort:
              </span>
              <button
                onClick={() => {
                  setSelectedCohort("Management Consulting");
                  showToast("Switched cohort view to Management Consulting", "info");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCohort === "Management Consulting"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Management Consulting
              </button>
              <button
                onClick={() => {
                  setSelectedCohort("Healthcare Consulting");
                  showToast("Switched cohort view to Healthcare Consulting", "info");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCohort === "Healthcare Consulting"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Healthcare Consulting
              </button>
            </div>

            {/* Health Verification Link Tab */}
            <Link
              href="/health"
              className="h-10 px-4 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-55 transition-all shadow-sm cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Health</span>
            </Link>
          </div>
        </header>

        {/* CONTAINER WITH SCROLL */}
        <div className="flex-1 overflow-y-auto bg-slate-55 p-8 space-y-8">
          
          {/* TAB: APPLICANTS OR ASSIGNMENTS */}
          {(activeTab === "applicant_profiles" ||
            activeTab === "my_assignments") && (
            <>
              {/* TOP KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                  title="Total Submissions"
                  value={cohortStats.total}
                  description="Complete applications received"
                  icon={Database}
                />
                <StatCard
                  title="Assigned to Graders"
                  value={`${cohortStats.assigned}/${cohortStats.total}`}
                  description="Distributed files for evaluation"
                  icon={Users}
                />
                <StatCard
                  title="Grades Completed"
                  value={cohortStats.completed}
                  description={`Evaluations complete (${Math.round(
                    (cohortStats.completed / (cohortStats.total || 1)) * 100
                  )}%)`}
                  icon={CheckSquare}
                />
                <StatCard
                  title="Interview Invites Sent"
                  value={cohortStats.interviewInvites}
                  description="Total Coffee Chat candidates (Scheduled + Queued)"
                  icon={Mail}
                />
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* LIST OF APPLICANTS */}
                <div className="xl:col-span-2 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200/80 rounded-2xl shadow-sm">
                    {/* Search & Filter tools */}
                    <div className="flex flex-1 items-center gap-2 bg-slate-55 border border-slate-200 px-3.5 py-2 rounded-xl">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search applicants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-55 border border-slate-200 px-2.5 py-2 rounded-xl">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-transparent border-none text-xs text-slate-700 font-bold outline-none cursor-pointer"
                        >
                          <option value="all">All Statuses</option>
                          <option value="unassigned">Unassigned</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed / Graded</option>
                          <option value="interview">Interview Stage</option>
                          <option value="offered">Offered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      {userRole === "ADMIN" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRoundRobinDistribute}
                            className="h-9 flex items-center gap-2 rounded-xl bg-amber-55 border border-amber-200/60 hover:bg-amber-100 px-4 text-xs font-bold text-amber-800 transition-colors cursor-pointer shadow-sm"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                            Round-Robin Assign
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Applicant cards list */}
                  <div className="space-y-4">
                    {filteredApplicants.length > 0 ? (
                      filteredApplicants.map((app) => (
                        <div key={app.id} className="relative">
                          <ApplicantCard
                            applicant={app}
                            isAdmin={userRole === "ADMIN"}
                            onView={(id) => {
                              const found = applicants.find((a) => a.id === id);
                              if (found) {
                                // If already rated, open Profile modal. Otherwise open Rubric Grading modal.
                                if (
                                  ["completed", "interview", "offered", "rejected"].includes(
                                    found.status
                                  )
                                ) {
                                  setSelectedApplicantForProfile(found);
                                } else {
                                  setGradingApplicant(found);
                                }
                              }
                            }}
                            onAssign={(id) => setAssigningApplicantId(id)}
                            onUnassign={handleUnassignGrader}
                            onSendInterview={handleSendInterview}
                            onRescindInterview={handleRescindInterview}
                            onSendOffer={handleSendOffer}
                            onRevokeOffer={handleRevokeOffer}
                            onSendReject={handleSendReject}
                            onUndoRejection={handleUndoRejection}
                            onUngrade={handleUngradeApplicant}
                          />

                          {/* Manual Grader Assignment Dropdown overlay */}
                          {assigningApplicantId === app.id && (
                            <div className="absolute top-12 right-6 z-20 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-top-1">
                              <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                  Assign Grader
                                </span>
                                <button
                                  onClick={() => setAssigningApplicantId(null)}
                                  className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                  Close
                                </button>
                              </div>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {gradersList.map((grader) => (
                                  <button
                                    key={grader.id}
                                    onClick={() =>
                                      handleAssignGrader(app.id, grader.name)
                                    }
                                    className="w-full text-left text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-slate-55 hover:text-slate-900 text-slate-600 transition-colors cursor-pointer"
                                  >
                                    {grader.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <AlertTriangle className="h-8 w-8 text-amber-600/50 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-700">
                          No Applicants Found
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          No records match search queries or role filters.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE PANEL */}
                <div className="space-y-8">
                  {/* GRADERS OVERVIEW WIDGET (WITH ACCORDION CLICKABLES & AVERAGE SCORES) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                      Graders Overview
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200/50">
                        {userRole === "ADMIN" ? "Admin View (Interactive)" : "Active"}
                      </span>
                    </h3>
                    
                    <div className="space-y-3.5">
                      {graderAssignments.map((grader) => {
                        const progress =
                          grader.assignedCount > 0
                            ? (grader.completedCount / grader.assignedCount) * 100
                            : 0;
                        const isExpanded = expandedGraderId === grader.id;

                        return (
                          <div
                            key={grader.id}
                            onClick={() => {
                              if (userRole === "ADMIN") {
                                setExpandedGraderId(isExpanded ? null : grader.id);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border border-slate-150 transition-all ${
                              userRole === "ADMIN"
                                ? "cursor-pointer hover:border-slate-300 hover:shadow-sm"
                                : ""
                            } bg-slate-50/30`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                                  <img
                                    src={grader.avatar}
                                    alt={grader.name}
                                    className="h-5 w-5 rounded-full border border-slate-200 bg-white"
                                  />
                                  {grader.name}
                                </span>
                                
                                <span className="text-slate-555 font-medium">
                                  <span className="font-bold text-slate-700">
                                    {grader.completedCount}
                                  </span>
                                  /{grader.assignedCount} graded
                                </span>
                              </div>

                              {/* Average score indicator */}
                              <div className="flex justify-between items-center text-[10px] text-slate-550">
                                <span>Grading Progress</span>
                                {grader.averageScore !== null ? (
                                  <span className="font-bold text-indigo-650 bg-indigo-55 border border-indigo-100/55 px-1.5 py-0.5 rounded">
                                    Avg: {grader.averageScore.toFixed(1)} / 25
                                  </span>
                                ) : (
                                  <span className="italic text-slate-400">No grades yet</span>
                                )}
                              </div>

                              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Graded applicants list (Accordion clickable panel in Admin view) */}
                            {userRole === "ADMIN" && isExpanded && (
                              <div className="mt-3.5 pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Graded candidates ({grader.gradedApplicants.length})
                                </div>
                                
                                {grader.gradedApplicants.length > 0 ? (
                                  <div className="space-y-1">
                                    {grader.gradedApplicants.map((app) => (
                                      <button
                                        key={app.id}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Stop parent click trigger
                                          setSelectedApplicantForProfile(app);
                                        }}
                                        className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-all group font-semibold text-slate-655 cursor-pointer"
                                      >
                                        <span className="truncate max-w-[150px]">{app.name}</span>
                                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 group-hover:text-indigo-605">
                                          Score: {app.score?.toFixed(1)}
                                          <span className="text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-455 italic py-1">
                                    No completed grading records.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* NEXT ROUND STATUS */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5">
                      Next Round Status
                    </h3>
                    <div className="relative border-l border-slate-200 pl-5 space-y-6">
                      
                      <div className="relative">
                        <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">
                            Evaluate Applications
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Graders evaluate written files &amp; resumes.
                          </p>
                          <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1.5 border border-emerald-100">
                            In Progress: {cohortStats.completed}/{cohortStats.total}
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 border border-white flex items-center justify-center animate-pulse">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">
                            Set Interview Schedule
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Set up scheduling integrations for Round 2.
                          </p>
                          <span className="inline-block text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-1.5 border border-blue-100">
                            Queue: {cohortStats.completed - cohortStats.offered} candidates ready
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full bg-slate-200 border border-white flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500">
                            Send Invitations
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Dispatched automatically via Resend templates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* PAGE 1: COFFEE CHATS SCHEDULER (ADMIN ONLY) */}
          {(activeTab === "coffee_chats" || activeTab === "interviews") && userRole === "ADMIN" && (
            <div className="space-y-8 max-w-6xl">
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    ☕ Coffee Chats Scheduler
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fall 2026 Recruitment &bull; 120 Total Candidates (40 per Time Slot &bull; 8 Tables per Slot, 3-6 per table)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Coffee Chat Candidates</span>
                    <span className="text-base font-black text-indigo-700">
                      {applicants.filter((a) => ["interview", "offered", "completed"].includes(a.status)).length} Candidates
                    </span>
                  </div>
                </div>
              </div>

              {/* UNSCHEDULED QUEUE */}
              <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-800">
                      Unscheduled Candidates Queue (Pending Slot Assignment)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200 font-mono">
                    {applicants.filter((a) => (a.status === "interview" || a.status === "offered" || a.status === "completed") && !a.scheduledTime).length} Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {applicants.filter((a) => (a.status === "interview" || a.status === "offered" || a.status === "completed") && !a.scheduledTime).length > 0 ? (
                    applicants
                      .filter((a) => (a.status === "interview" || a.status === "offered" || a.status === "completed") && !a.scheduledTime)
                      .map((app) => (
                        <div key={app.id} className="p-2.5 rounded-xl border border-indigo-200/60 bg-white shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <h6 className="text-xs font-bold text-slate-800 truncate">{app.name}</h6>
                            {app.cohort.toLowerCase().includes("health") ? (
                              <span className="p-1 rounded-md bg-rose-50 border border-rose-100 shrink-0" title="Healthcare Consulting">
                                <Heart className="h-3 w-3 text-rose-500 fill-rose-500/20" />
                              </span>
                            ) : (
                              <span className="p-1 rounded-md bg-indigo-50 border border-indigo-100 shrink-0" title="Management Consulting">
                                <Briefcase className="h-3 w-3 text-indigo-600" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono gap-1">
                            <span>{app.studentId ? `ID: ${app.studentId}` : "ID: --"}</span>
                            {app.fallbackTime && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 shrink-0 font-sans">
                                Fallback: {app.fallbackTime}
                              </span>
                            )}
                          </div>

                          <div className="pt-1 border-t border-slate-100">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value === "rescind_interview") {
                                  handleRescindInterview(app.id);
                                } else if (e.target.value) {
                                  handleRescheduleApplicant(app.id, e.target.value as any);
                                }
                              }}
                              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded px-1.5 py-0.5 outline-none cursor-pointer w-full"
                            >
                              <option value="">Assign Slot...</option>
                              <option value="4:40 - 5:30">4:40 - 5:30</option>
                              <option value="5:45 - 6:35">5:45 - 6:35</option>
                              <option value="6:50 - 7:40">6:50 - 7:40</option>
                              <option value="rescind_interview">Rescind Offer</option>
                            </select>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-full py-4 text-center text-slate-500 text-xs italic bg-white/60 rounded-xl border border-indigo-100">
                      No pending unscheduled Coffee Chat candidates.
                    </div>
                  )}
                </div>
              </div>

              {/* 3 TIME SLOT SECTIONS WITH VISUAL TABLE CHUNKING */}
              {[
                { time: "4:40 - 5:30", label: "Slot 1 (4:40 PM - 5:30 PM)", color: "indigo" },
                { time: "5:45 - 6:35", label: "Slot 2 (5:45 PM - 6:35 PM)", color: "emerald" },
                { time: "6:50 - 7:40", label: "Slot 3 (6:50 PM - 7:40 PM)", color: "purple" },
              ].map((slot) => {
                const slotApps = applicants.filter(
                  (a) =>
                    (a.status === "interview" || a.status === "offered" || a.status === "completed") &&
                    a.scheduledTime &&
                    (a.scheduledTime.includes(slot.time.split(" - ")[0]) || a.scheduledTime.includes(slot.time.split(" - ")[1]))
                );

                // Chunk slot applicants into 8 visual tables with custom table assignment overrides
                const tables = Array.from({ length: 8 }, (_, tableIdx) => {
                  const tableNumber = tableIdx + 1;
                  const tableCandidates = slotApps.filter((app, idx) => {
                    const assignedTable = tableAssignments[app.id];
                    if (assignedTable !== undefined) {
                      return assignedTable === tableNumber;
                    }
                    return (idx % 8) + 1 === tableNumber;
                  });
                  return { tableNumber, tableCandidates };
                });

                return (
                  <div key={slot.time} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full animate-pulse bg-${slot.color}-500`} />
                          {slot.label}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Target: 40 candidates &bull; 8 Tables (Drag & Drop candidates into any Table below)
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border font-mono bg-${slot.color}-50 text-${slot.color}-700 border-${slot.color}-200`}>
                        {slotApps.length} / 40 Scheduled
                      </span>
                    </div>

                    {/* 8 TABLE CARDS GRID WITH DRAG & DROP SUPPORT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {tables.map(({ tableNumber, tableCandidates }) => {
                        const tableKey = `${slot.time}-table-${tableNumber}`;
                        const isOver = dragOverTableKey === tableKey;

                        return (
                          <div
                            key={tableNumber}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                              if (dragOverTableKey !== tableKey) {
                                setDragOverTableKey(tableKey);
                              }
                            }}
                            onDragLeave={(e) => {
                              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                              setDragOverTableKey(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const id = e.dataTransfer.getData("text/plain") || draggedAppId;
                              if (id) {
                                handleAssignTable(id, tableNumber);
                              }
                              setDragOverTableKey(null);
                              setDraggedAppId(null);
                            }}
                            className={`rounded-2xl border p-3.5 space-y-2.5 transition-colors ${
                              isOver
                                ? "border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-200"
                                : "border-slate-200 bg-white shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 pointer-events-none">
                              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                                🪑 Table {tableNumber}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 font-mono">
                                {tableCandidates.length} Seats
                              </span>
                            </div>

                            <div className="space-y-2 min-h-[90px]">
                              {tableCandidates.length > 0 ? (
                                tableCandidates.map((app) => (
                                  <div
                                    key={app.id}
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData("text/plain", app.id);
                                      setDraggedAppId(app.id);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedAppId(null);
                                      setDragOverTableKey(null);
                                    }}
                                    className={`p-2.5 rounded-xl border transition-all space-y-1.5 shadow-2xs cursor-grab active:cursor-grabbing ${
                                      draggedAppId === app.id
                                        ? "opacity-30 border-dashed border-indigo-400 bg-indigo-50/50"
                                        : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-300"
                                    }`}
                                  >
                                    {/* Row 1: Candidate Name & Cohort Icon */}
                                    <div className="flex items-center justify-between gap-1">
                                      <h6 className="text-xs font-bold text-slate-800 truncate">{app.name}</h6>
                                      {app.cohort.toLowerCase().includes("health") ? (
                                        <span className="p-1 rounded-md bg-rose-50 border border-rose-100 shrink-0" title="Healthcare Consulting">
                                          <Heart className="h-3 w-3 text-rose-500 fill-rose-500/20" />
                                        </span>
                                      ) : (
                                        <span className="p-1 rounded-md bg-indigo-50 border border-indigo-100 shrink-0" title="Management Consulting">
                                          <Briefcase className="h-3 w-3 text-indigo-600" />
                                        </span>
                                      )}
                                    </div>

                                    {/* Row 2: Student ID & Fallback Slot INLINE */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono gap-1">
                                      <span>{app.studentId ? `ID: ${app.studentId}` : "ID: --"}</span>
                                      {app.fallbackTime && (
                                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 shrink-0 font-sans">
                                          Fallback: {app.fallbackTime}
                                        </span>
                                      )}
                                    </div>

                                    {/* Row 3: Move Time Slot Selector */}
                                    <div className="pt-1 border-t border-slate-100">
                                      <select
                                        value={slot.time}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === "unscheduled") {
                                            handleRescheduleApplicant(app.id, null);
                                          } else if (val) {
                                            handleRescheduleApplicant(app.id, val as any);
                                          }
                                        }}
                                        className="w-full text-[9px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none cursor-pointer truncate"
                                      >
                                        <option value="4:40 - 5:30">4:40 - 5:30</option>
                                        <option value="5:45 - 6:35">5:45 - 6:35</option>
                                        <option value="6:50 - 7:40">6:50 - 7:40</option>
                                        <option value="unscheduled">Unschedule</option>
                                      </select>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="py-6 text-center text-[10px] text-slate-400 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                  Drag candidate here
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PAGE 2: GROUP INTERVIEWS (ADMIN ONLY) */}
          {activeTab === "group_interviews" && userRole === "ADMIN" && (
            <div className="space-y-8 max-w-6xl">
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    👥 Group Interviews Scheduler
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Round 3 Team Case Study Evaluation, Room Allocations & Panel Schedules.
                  </p>
                </div>
                <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80">
                  Status: To Be Determined
                </span>
              </div>

              {/* TBD PLACEHOLDER CARD */}
              <div className="p-12 rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Clock className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">
                    Group Interviews Schedule & Assignments (To Be Determined)
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                    Group Interview team assignments, case study room allocations, and evaluation panel schedules will be configured and announced following Coffee Chat completion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GLOBAL RUBRIC MANAGER */}
          {activeTab === "rubric_manager" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Global Rubric Manager
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and edit scoring criteria used across all active applicant cohorts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Rubric Card 1 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Metric 1
                    </span>
                    <span className="text-xs font-bold text-slate-500">Weight: 33.3%</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Leadership Initiative</h4>
                  <p className="text-xs text-slate-655 leading-relaxed">
                    Evaluates the candidate's track record of taking charge, leading campus clubs, starting business ventures, or handling group project challenges.
                  </p>
                  <div className="border-t border-slate-100 pt-3 space-y-1 text-[10px] text-slate-500">
                    <div className="flex justify-between"><span className="font-bold">5.0:</span> Executive boards / Founders</div>
                    <div className="flex justify-between"><span className="font-bold">3.0:</span> Project lead / Club chairs</div>
                    <div className="flex justify-between"><span className="font-bold">1.0:</span> No active leadership duties</div>
                  </div>
                </div>

                {/* Rubric Card 2 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      Metric 2
                    </span>
                    <span className="text-xs font-bold text-slate-500">Weight: 33.3%</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Problem Solving</h4>
                  <p className="text-xs text-slate-655 leading-relaxed">
                    Measures structured analytical thinking. Look for numerical estimates, market sizing frameworks, and structured responses to resume questions.
                  </p>
                  <div className="border-t border-slate-100 pt-3 space-y-1 text-[10px] text-slate-500">
                    <div className="flex justify-between"><span className="font-bold">5.0:</span> Deep synthesis / Numerical models</div>
                    <div className="flex justify-between"><span className="font-bold">3.0:</span> Clear structured reasoning</div>
                    <div className="flex justify-between"><span className="font-bold">1.0:</span> Circular, unstructured thoughts</div>
                  </div>
                </div>

                {/* Rubric Card 3 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      Metric 3
                    </span>
                    <span className="text-xs font-bold text-slate-500">Weight: 33.3%</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Communication</h4>
                  <p className="text-xs text-slate-655 leading-relaxed">
                    Assesses presentation clarity, professional alignment, and storytelling capability shown in experiences and writing quality.
                  </p>
                  <div className="border-t border-slate-100 pt-3 space-y-1 text-[10px] text-slate-500">
                    <div className="flex justify-between"><span className="font-bold">5.0:</span> Polished, logical storytelling</div>
                    <div className="flex justify-between"><span className="font-bold">3.0:</span> Articulate, business tone</div>
                    <div className="flex justify-between"><span className="font-bold">1.0:</span> Disorganized writing styles</div>
                  </div>
                </div>
              </div>

              {/* Rubric Settings */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-2">Configure Rubric Settings</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Admin users can alter scores and description weights below. Changes affect next evaluations immediately.
                </p>
                {userRole === "ADMIN" ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => showToast("Rubric weights saved successfully!", "success")}
                      className="h-10 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                    >
                      Save Weights
                    </button>
                    <button className="h-10 rounded-xl border border-slate-200 bg-transparent px-4 text-xs font-bold text-slate-655 hover:bg-slate-55 transition-all cursor-pointer">
                      Add Custom Metric
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 flex gap-2.5 items-center border border-slate-200">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <span className="text-xs text-slate-500">
                      You are viewing as a <span className="font-bold text-slate-700">Grader</span>. Rubric settings are locked and only editable by Administrators.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: EMAIL AUTOMATION CONTROL */}
          {activeTab === "emails" && (
            <div className="space-y-8 max-w-5xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Email Automation Control
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review templates powered by the Resend API and view transaction history logs.
                </p>
              </div>

              {/* API Settings */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <h4 className="text-sm font-bold text-slate-800">Resend API Provider Status</h4>
                  </div>
                  <p className="text-xs text-slate-600 max-w-lg">
                    Supabase actions dispatch mail calls directly via the Resend API. Active verification checks are live for domain <span className="font-bold text-slate-700">@bruinstrategy.org</span>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => showToast("API connection refreshed!", "success")}
                    className="h-10 rounded-xl border border-slate-200 bg-transparent px-4 text-xs font-bold text-slate-655 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Test Integration
                  </button>
                  <button className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 text-xs font-bold text-slate-700 cursor-pointer border border-slate-200/50">
                    API Settings
                  </button>
                </div>
              </div>

              {/* Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Acceptance template */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Offer Email Template
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <span className="text-slate-500 font-medium">Subject:</span>
                      <span className="text-slate-700 font-semibold">Bruin Strategy Network - Round 2 Selection Offer</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 font-mono text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
{`Subject: Bruin Strategy Network - Round 2 Invitation

Hi {{applicant_name}},

Congratulations! The Bruin Strategy recruitment committee has selected you to move forward.

Please schedule your interview using our coordinator link:
{{scheduling_link}}

Warm regards,
Recruitment Committee`}
                    </div>
                  </div>
                </div>

                {/* Rejection template */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Rejection Email Template
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <span className="text-slate-500 font-medium">Subject:</span>
                      <span className="text-slate-700 font-semibold">Bruin Strategy Network - Application Update</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 font-mono text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
{`Subject: Bruin Strategy - Recruitment Update

Hi {{applicant_name}},

Thank you for your interest in Bruin Strategy. Due to a record volume of applicants, we cannot offer you advancement.

We wish you the absolute best in your academic goals.

Best,
Bruin Strategy Board`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Resend Transaction Log History
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="pb-3 pl-2">Recipient</th>
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Sent Time</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Provider</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {emailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-55">
                          <td className="py-3.5 pl-2">
                            <div className="font-bold text-slate-800">{log.recipientName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{log.recipientEmail}</div>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === "OFFER" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                : log.type === "INTERVIEW"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 font-medium">{log.timestamp}</td>
                          <td className="py-3.5">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right pr-2 text-[10px] text-slate-555 font-bold">Resend Mailer</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COHORT ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-8 max-w-5xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Cohort Analytics
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View evaluation trends and grading breakdown graphs.
                </p>
              </div>

              {/* Numerical Overview Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Average Score
                  </span>
                  <div className="text-3xl font-black text-amber-600">
                    {overallAverageScore}
                    <span className="text-sm font-normal text-slate-400 ml-1">/25.0</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Mean evaluation score for graded applicants in cohort.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Completed Evaluations
                  </span>
                  <div className="text-3xl font-black text-indigo-650">
                    {applicants.filter((a) => a.status === "completed" || a.status === "offered").length}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Total files checked and scored across the system.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Remaining in Queue
                  </span>
                  <div className="text-3xl font-black text-rose-600">
                    {applicants.filter((a) => a.status === "unassigned" || a.status === "assigned" || a.status === "in_progress").length}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Total files awaiting final score submissions.
                  </p>
                </div>
              </div>

              {/* Custom CSS Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Score Bucket Distribution */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Applicants Score Distribution (Completed Evaluations)
                  </h4>
                  
                  <div className="space-y-3.5">
                    {/* Bucket 21-25 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Exceptional (21.0 - 25.0)</span>
                        <span className="text-slate-500">{scoreDistribution.exceptional} candidates</span>
                      </div>
                      <div className="h-4 w-full rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded" style={{ width: `${scoreDistribution.exceptionalPercent}%` }} />
                      </div>
                    </div>

                    {/* Bucket 16-21 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Competitive (16.0 - 21.0)</span>
                        <span className="text-slate-550">{scoreDistribution.competitive} candidates</span>
                      </div>
                      <div className="h-4 w-full rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded" style={{ width: `${scoreDistribution.competitivePercent}%` }} />
                      </div>
                    </div>

                    {/* Bucket 11-16 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Average (11.0 - 16.0)</span>
                        <span className="text-slate-550">{scoreDistribution.average} candidates</span>
                      </div>
                      <div className="h-4 w-full rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-amber-400 rounded" style={{ width: `${scoreDistribution.averagePercent}%` }} />
                      </div>
                    </div>

                    {/* Bucket 1-11 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Needs Review (1.0 - 11.0)</span>
                        <span className="text-slate-550">{scoreDistribution.needsReview} candidates</span>
                      </div>
                      <div className="h-4 w-full rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded" style={{ width: `${scoreDistribution.needsReviewPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recruitment Funnel */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recruitment Funnel Overview
                  </h4>
                  
                  <div className="space-y-3.5">
                    {/* Stage 1 */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-xs font-semibold text-slate-400 uppercase tracking-wider">Applied</div>
                      <div className="flex-1 bg-slate-100 h-6 rounded overflow-hidden flex items-center px-3 relative">
                        <div className="absolute inset-y-0 left-0 bg-slate-200 rounded" style={{ width: "100%" }} />
                        <span className="relative z-10 text-[10px] font-bold text-slate-700">{funnelStats.total} candidates (100%)</span>
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluated</div>
                      <div className="flex-1 bg-slate-100 h-6 rounded overflow-hidden flex items-center px-3 relative">
                        <div className="absolute inset-y-0 left-0 bg-indigo-500/10 rounded border-l-2 border-indigo-500" style={{ width: `${funnelStats.evaluatedPercent}%` }} />
                        <span className="relative z-10 text-[10px] font-bold text-indigo-700">{funnelStats.evaluated} evaluated ({funnelStats.evaluatedPercent}%)</span>
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-xs font-semibold text-slate-400 uppercase tracking-wider">Round 2 offer</div>
                      <div className="flex-1 bg-slate-100 h-6 rounded overflow-hidden flex items-center px-3 relative">
                        <div className="absolute inset-y-0 left-0 bg-amber-500/10 rounded border-l-2 border-amber-500" style={{ width: `${funnelStats.offeredPercent}%` }} />
                        <span className="relative z-10 text-[10px] font-bold text-amber-700">{funnelStats.offered} offered ({funnelStats.offeredPercent}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* GRADING MODAL OVERLAY */}
      {gradingApplicant && (
        <GradingModal
          applicant={gradingApplicant}
          onClose={() => setGradingApplicant(null)}
          onSubmitGrade={handleSubmitEvaluation}
        />
      )}

      {/* DETAILED CANDIDATE PROFILE MODAL OVERLAY (WITH INTERVIEW COMMENTS TIMELINE) */}
      {selectedApplicantForProfile && (
        <CandidateProfileModal
          applicant={selectedApplicantForProfile}
          currentUser={currentUser}
          onClose={() => setSelectedApplicantForProfile(null)}
          onAddComment={handleAddInterviewComment}
          onSendInterview={(id) => {
            handleSendInterview(id);
            setSelectedApplicantForProfile(null);
          }}
          onRescindInterview={handleRescindInterview}
          onSendOffer={(id) => {
            handleSendOffer(id);
            setSelectedApplicantForProfile(null);
          }}
          onSendReject={(id) => {
            handleSendReject(id);
            setSelectedApplicantForProfile(null);
          }}
          onUndoRejection={handleUndoRejection}
          onUpdateScheduledTimes={handleUpdateScheduledTimes}
        />
      )}

      {/* CUSTOMIZABLE DECISION EMAIL POPUP MODAL */}
      {decisionEmailTarget && (
        <DecisionEmailModal
          applicant={decisionEmailTarget.applicant}
          type={decisionEmailTarget.type}
          onClose={() => setDecisionEmailTarget(null)}
          onConfirm={(id) => {
            if (decisionEmailTarget.type === "REJECTION") {
              executeSendReject(id);
            } else if (decisionEmailTarget.type === "OFFER") {
              executeSendOffer(id);
            } else if (decisionEmailTarget.type === "INTERVIEW") {
              executeSendInterview(id);
            }
          }}
          showToast={showToast}
        />
      )}

    </div>
  );
}
