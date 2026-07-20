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
} from "lucide-react";

import StatCard from "@/components/StatCard";
import ApplicantCard, { Applicant, InterviewComment } from "@/components/ApplicantCard";
import GradingModal from "@/components/GradingModal";
import CandidateProfileModal from "@/components/CandidateProfileModal";

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

// Initial mock applicants data
const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: "app-1",
    name: "Sarah Jenkins",
    email: "sarah.j@ucla.edu",
    hashId: "8f3a12",
    submissionDate: "2026-07-08",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "John Doe",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-2",
    name: "Jessica Wang",
    email: "jwang@ucla.edu",
    hashId: "9c3b41",
    submissionDate: "2026-07-07",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Jane Smith",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-3",
    name: "David Kim",
    email: "d.kim@ucla.edu",
    hashId: "2c8e41",
    submissionDate: "2026-07-08",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Jane Smith",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-4",
    name: "Michael Brown",
    email: "mbrown@ucla.edu",
    hashId: "9a7b11",
    submissionDate: "2026-07-09",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "John Doe",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-5",
    name: "Emily Davis",
    email: "edavis@ucla.edu",
    hashId: "5f4d22",
    submissionDate: "2026-07-09",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Jane Smith",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-6",
    name: "Ryan Patel",
    email: "rpatel@ucla.edu",
    hashId: "7a1d52",
    submissionDate: "2026-07-07",
    cohort: "Healthcare Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Alex Chen",
    scheduledTime: "10:30 AM",
    interviewComments: [],
  },
  {
    id: "app-7",
    name: "Grace Lee",
    email: "glee@ucla.edu",
    hashId: "8a9f44",
    submissionDate: "2026-07-08",
    cohort: "Healthcare Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Marcus Vance",
    scheduledTime: "10:30 AM",
    interviewComments: [],
  },
  {
    id: "app-8",
    name: "James Wilson",
    email: "jwilson@ucla.edu",
    hashId: "3d2c88",
    submissionDate: "2026-07-09",
    cohort: "Healthcare Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "John Doe",
    scheduledTime: "10:30 AM",
    interviewComments: [],
  },
  {
    id: "app-9",
    name: "Sophia Martinez",
    email: "smartinez@ucla.edu",
    hashId: "7b8e55",
    submissionDate: "2026-07-10",
    cohort: "Healthcare Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Jane Smith",
    scheduledTime: "10:30 AM",
    interviewComments: [],
  },
  {
    id: "app-10",
    name: "Ashley Taylor",
    email: "ataylor@ucla.edu",
    hashId: "2b1a88",
    submissionDate: "2026-07-09",
    cohort: "Healthcare Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Emily Taylor",
    scheduledTime: "10:30 AM",
    interviewComments: [],
  },
  {
    id: "app-11",
    name: "Daniel Anderson",
    email: "danderson@ucla.edu",
    hashId: "4e9a12",
    submissionDate: "2026-07-09",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Alex Chen",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-12",
    name: "Olivia Thomas",
    email: "othomas@ucla.edu",
    hashId: "6a8d54",
    submissionDate: "2026-07-09",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Marcus Vance",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-13",
    name: "William Jackson",
    email: "wjackson@ucla.edu",
    hashId: "1c9b33",
    submissionDate: "2026-07-09",
    cohort: "Management Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Emily Taylor",
    scheduledTime: "09:00 AM",
    interviewComments: [],
  },
  {
    id: "app-14",
    name: "Sophia White",
    email: "swhite@ucla.edu",
    hashId: "5b7a89",
    submissionDate: "2026-07-09",
    cohort: "Healthcare Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Alex Chen",
    scheduledTime: "10:30 AM",
    interviewComments: [],
  },
  {
    id: "app-15",
    name: "Matthew Harris",
    email: "mharris@ucla.edu",
    hashId: "3e8a44",
    submissionDate: "2026-07-09",
    cohort: "Healthcare Consulting",
    status: "assigned",
    hasResume: true,
    assignedGraderName: "Emily Taylor",
    scheduledTime: "10:30 AM",
    interviewComments: [],
  },
];

interface EmailLog {
  id: string;
  recipientName: string;
  recipientEmail: string;
  type: "OFFER" | "REJECTION" | "INTERVIEW";
  timestamp: string;
  status: "SENT" | "FAILED";
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("my_assignments");
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

  // State to switch active grader view (John Doe, Jane Smith, Alex Chen)
  const [activeGraderId, setActiveGraderId] = useState<string>("g1");

  // Accordion active expanded state in Grader widgets
  const [expandedGraderId, setExpandedGraderId] = useState<string | null>(null);

  // Profile View modal state trigger
  const [selectedApplicantForProfile, setSelectedApplicantForProfile] =
    useState<Applicant | null>(null);

  // Check if real Supabase keys are configured in local environment
  const hasSupabaseKeys = useMemo(() => {
    return !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );
  }, []);

  // Listen for Supabase Authentication State changes
  useEffect(() => {
    if (!hasSupabaseKeys) {
      setLoadingAuth(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
      setLoadingAuth(false);
    });

    // Listen to changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole("GRADER");
        setProfileName("Auth User");
      }
    });

    return () => subscription.unsubscribe();
  }, [hasSupabaseKeys]);

  // Synchronize and load applicants list from Supabase if keys are configured
  useEffect(() => {
    if (!hasSupabaseKeys || !session) return;

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
          .select("id, name, role");

        if (profilesList) {
          setDbProfiles(profilesList);
        }

        // 3. Auto-seed 15 applicants if the database is empty
        if (!dbApplicants || dbApplicants.length === 0) {
          console.log("Supabase applicants table is empty, auto-seeding 15 candidates...");
          
          const seedApplicants = INITIAL_APPLICANTS.map((app) => ({
            name: app.name,
            email: app.email,
            cohort: app.cohort,
            status: app.status,
          }));

          const { data: insertedApps, error: insertError } = await supabase
            .from("applicants")
            .insert(seedApplicants)
            .select();

          if (insertError) throw insertError;

          const defaultGraders: Record<string, string> = {
            "Sarah Jenkins": "John Doe",
            "Jessica Wang": "Jane Smith",
            "David Kim": "Jane Smith",
            "Michael Brown": "John Doe",
            "Emily Davis": "Jane Smith",
            "Ryan Patel": "Alex Chen",
            "Grace Lee": "Marcus Vance",
            "James Wilson": "John Doe",
            "Sophia Martinez": "Jane Smith",
            "Ashley Taylor": "Emily Taylor",
            "Daniel Anderson": "Alex Chen",
            "Olivia Thomas": "Marcus Vance",
            "William Jackson": "Emily Taylor",
            "Sophia White": "Alex Chen",
            "Matthew Harris": "Emily Taylor",
          };

          const assignmentsToInsert = [];
          if (insertedApps) {
            if (profilesList && profilesList.length > 0) {
              let pIdx = 0;
              for (const app of insertedApps) {
                const desiredGraderName = defaultGraders[app.name];
                const grader = profilesList.find((p) => p.name === desiredGraderName) || profilesList[pIdx % profilesList.length];
                assignmentsToInsert.push({
                  applicant_id: app.id,
                  grader_id: grader.id,
                  status: "assigned",
                });
                pIdx++;
              }
            } else {
              for (const app of insertedApps) {
                assignmentsToInsert.push({
                  applicant_id: app.id,
                  grader_id: session.user.id,
                  status: "assigned",
                });
              }
            }

            const { error: assignInsertError } = await supabase
              .from("assignments")
              .insert(assignmentsToInsert);

            if (assignInsertError) throw assignInsertError;
          }

          showToast("Successfully seeded 15 candidates in Supabase!", "success");
          window.location.reload();
          return;
        }

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
          if (val) {
            console.log(`Loaded evaluation for applicant "${app.name}":`, val);
          }
          
          const grades = val ? {
            leadership: Number(val.leadership_score),
            problemSolving: Number(val.problem_solving_score),
            communication: Number(val.communication_score),
            essay: val.essay_score ? Number(val.essay_score) : undefined,
          } : undefined;

          const totalScore = grades ? (grades.leadership + grades.problemSolving + grades.communication + (grades.essay || 0)) : undefined;

          // Normalize cohort names from DB to match UI filters
          let normalizedCohort = app.cohort;
          if (app.cohort && app.cohort.toLowerCase().startsWith("manage")) {
            normalizedCohort = "Management Consulting";
          } else if (app.cohort && app.cohort.toLowerCase().startsWith("health")) {
            normalizedCohort = "Healthcare Consulting";
          }

          const comments: InterviewComment[] = [];
          if (val && val.notes) {
            comments.push({
              id: `eval-notes-${app.id}`,
              author: ass?.profiles?.name || "Assigned Grader",
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
            status: app.status,
            score: totalScore !== undefined ? parseFloat(totalScore.toFixed(1)) : undefined,
            grades,
            hasResume: true,
            assignedGraderName: ass?.profiles?.name || (session && ass?.grader_id === session.user.id ? loggedInName : undefined) || "Assigned Grader",
            scheduledTime: normalizedCohort.includes("Health") ? "10:30 AM" : "09:00 AM",
            interviewComments: comments,
            shortAnswer: app.short_answer || undefined,
          };
        });

        // Update local React state with DB entries
        setApplicants(mapped);

      } catch (err: any) {
        console.error("Error fetching applicants from Supabase:", err);
        showToast(`Failed to load data from Supabase: ${err.message}`, "error");
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
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (data) {
        setUserRole(data.role as any);
        setProfileName(data.name);
        showToast(`Authenticated as ${data.name} (${data.role})`, "success");
      }
    } catch (err: any) {
      console.warn("Failed to fetch role from Supabase 'profiles' table:", err.message);
    }
  };

  // Sign In using email/password or magic link
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setLoadingAuth(true);

    try {
      if (showPasswordLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailInput.trim(),
          password: password,
        });
        if (error) throw error;
        showToast("Signed in successfully!", "success");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: emailInput.trim(),
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        showToast("Magic Link sent! Check your inbox.", "success");
      }
    } catch (err: any) {
      showToast(`Auth Error: ${err.message}`, "error");
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

  // Track the logged in user context
  const currentUser = useMemo(() => {
    const name = profileName !== "Auth User" ? profileName : (session?.user?.email?.split("@")[0] || "Auth User");
    const email = session?.user?.email || "auth@bruinstrategy.org";
    const id = session?.user?.id || "g-user";
    
    let activeName = name;
    let activeEmail = email;
    let activeId = id;
    
    if (userRole === "GRADER") {
      const selectedGrader = INITIAL_GRADERS.find((g) => g.id === activeGraderId);
      if (selectedGrader) {
        activeName = selectedGrader.name;
        activeEmail = selectedGrader.email;
        activeId = selectedGrader.id;
      }
    }
    
    return {
      id: activeId,
      name: activeName,
      email: activeEmail,
      role: userRole,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeEmail}`,
    };
  }, [userRole, activeGraderId, session, profileName]);

  // DB States
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
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

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Dynamic ranking calculations helper inside a cohort
  const recalculateRanks = (allApplicants: Applicant[]) => {
    return allApplicants.map((app) => {
      if (app.status !== "completed" || app.score === undefined) {
        return { ...app, rank: undefined };
      }
      const cohortCompletions = allApplicants
        .filter(
          (a) =>
            a.cohort === app.cohort &&
            a.status === "completed" &&
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

    const activeGraders = INITIAL_GRADERS.filter((g) => g.role === "GRADER");
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
          .update({ status: "assigned" })
          .eq("id", applicantId);

        if (appError) throw appError;

        showToast(`Successfully assigned applicant to ${graderName}!`, "success");
        
        setApplicants((prev) =>
          prev.map((app) =>
            app.id === applicantId
              ? { ...app, status: "assigned", assignedGraderName: graderName }
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
  const handleRescheduleApplicant = (
    applicantId: string,
    newTime: "09:00 AM" | "10:30 AM" | null
  ) => {
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

  // Send Offer (Triggers Resend mock)
  const handleSendOffer = async (id: string) => {
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
        console.error("Supabase send offer error:", err);
        showToast(`Error writing to Supabase: ${err.message}`, "error");
        return;
      }
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "offered" } : app))
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
    showToast(`Offer email sent via Resend API to ${applicant.name}!`, "success");
  };

  // Send Reject (Triggers Resend mock)
  const handleSendReject = async (id: string) => {
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
        console.error("Supabase send reject error:", err);
        showToast(`Error writing to Supabase: ${err.message}`, "error");
        return;
      }
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" } : app))
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
    showToast(`Rejection email sent via Resend API to ${applicant.name}.`, "info");
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
      ["completed", "offered", "rejected"].includes(a.status)
    ).length;
    const offered = cohortApplicants.filter(
      (a) => a.status === "offered"
    ).length;

    return { total, assigned, completed, offered };
  }, [applicants, selectedCohort]);

  // Compute dynamic overall cohort average score (out of 25.0)
  const overallAverageScore = useMemo(() => {
    const completedApps = applicants.filter(
      (a) =>
        a.cohort === selectedCohort &&
        ["completed", "offered", "rejected"].includes(a.status) &&
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
        ["completed", "offered", "rejected"].includes(a.status) &&
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
      ["completed", "offered", "rejected"].includes(a.status)
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
    return INITIAL_GRADERS.map((grader) => {
      const assignedApps = applicants.filter(
        (a) => a.assignedGraderName === grader.name
      );
      const completedApps = assignedApps.filter((a) =>
        ["completed", "offered", "rejected"].includes(a.status)
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
  }, [applicants]);

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
        if (a.rank && b.rank) return a.rank - b.rank;
        if (a.score && b.score) return b.score - a.score;
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

  // SIGN IN REQUIRED SCREEN (WHEN LIVE KEYS CONFIGURED)
  if (!session) {
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

    return (
      <div className="flex h-screen w-full bg-slate-100 items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2.5">
            <img
              src="/bruin-strategy-network-logo.png"
              alt="Bruin Strategy"
              className="h-14 w-auto object-contain"
            />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Recruitment Dashboard Sign-In
            </h2>
            <p className="text-xs text-slate-550 max-w-xs leading-relaxed">
              Verify your credentials using Supabase passwordless magic link or password authentication.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Board Member Email
              </label>
              <input
                type="email"
                placeholder="name@bruinstrategy.org"
                value={emailInput === " " ? "" : emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
            
            {showPasswordLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-3 outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              {showPasswordLogin ? "Sign In with Password" : "Send Magic Link"}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowPasswordLogin(!showPasswordLogin)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-750 cursor-pointer underline"
            >
              {showPasswordLogin ? "Use passwordless email Magic Link instead" : "Use email & password sign-in instead"}
            </button>
          </div>
        </div>
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

          {/* Quick Role switcher for testing */}
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
                  showToast(`Switched system view to Grader (${INITIAL_GRADERS.find(g => g.id === activeGraderId)?.name})`, "info");
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  userRole === "GRADER"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Grader
              </button>
            </div>

            {/* Switch between Graders (specifically 3) */}
            {userRole === "GRADER" && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block text-center">
                  ACTING GRADER
                </span>
                <select
                  value={activeGraderId}
                  onChange={(e) => {
                    setActiveGraderId(e.target.value);
                    setStatusFilter("all");
                    showToast(
                      `Switched active grader to ${
                        INITIAL_GRADERS.find((g) => g.id === e.target.value)?.name
                      }`,
                      "info"
                    );
                  }}
                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="g1">John Doe</option>
                  <option value="g2">Jane Smith</option>
                  <option value="g3">Alex Chen</option>
                  <option value="g4">Emily Taylor</option>
                  <option value="g5">Marcus Vance</option>
                </select>
              </div>
            )}
          </div>

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
                        a.assignedGraderName === currentUser.name &&
                        !["completed", "offered", "rejected"].includes(a.status)
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
              <button
                onClick={() => setActiveTab("interviews")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "interviews"
                    ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                    : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
                }`}
              >
                <Calendar className="h-4 w-4 text-slate-555" />
                Interview Scheduling
              </button>
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
                  title="Offers Sent (Round 2)"
                  value={cohortStats.offered}
                  description="Acceptances dispatched via Resend"
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
                          <option value="completed">Completed</option>
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
                          <button
                            onClick={handleResetAllApplicants}
                            className="h-9 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/60 hover:bg-rose-100 px-4 text-xs font-bold text-rose-850 transition-colors cursor-pointer shadow-sm"
                            title="Unassign all applicants and wipe all grades"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-rose-700" />
                            Reset Recruitment Board
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
                                  ["completed", "offered", "rejected"].includes(
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
                            onSendOffer={handleSendOffer}
                            onSendReject={handleSendReject}
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
                                {(dbProfiles.length > 0
                                  ? dbProfiles.filter((p) => p.role === "GRADER")
                                  : INITIAL_GRADERS.filter((g) => g.role === "GRADER")
                                ).map((grader) => (
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

          {/* TAB: INTERVIEW SCHEDULING (ADMIN ONLY) */}
          {activeTab === "interviews" && userRole === "ADMIN" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Round 2 Interview Scheduler &bull; September 15, 2026
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top Management Consulting candidates are assigned to the earlier Morning Block, and Healthcare Consulting candidates to the Mid-Day Block. Reschedule by changing the time dropdown inside each card.
                </p>
              </div>

              {/* Columns for Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* MORNING BLOCK Column */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                        Morning Block: 9:00 AM - 10:00 AM
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Assigned: Top Management Consulting Candidates
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {applicants.filter((a) => a.scheduledTime === "09:00 AM").length} Scheduled
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {applicants.filter((a) => a.scheduledTime === "09:00 AM").length > 0 ? (
                      applicants
                        .filter((a) => a.scheduledTime === "09:00 AM")
                        .map((app) => (
                          <div
                            key={app.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-55/50 hover:border-slate-350 hover:bg-white transition-all shadow-sm space-y-2.5"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-xs font-bold text-slate-800">{app.name}</h5>
                                <span className="text-[9px] text-slate-400 font-mono">#{app.hashId}</span>
                              </div>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-750 border border-indigo-100">
                                {app.cohort}
                              </span>
                            </div>

                            {app.score !== undefined && (
                              <div className="text-[10px] font-semibold text-slate-655 flex items-center gap-1">
                                <Award className="h-3.5 w-3.5 text-amber-505" /> Score: <span className="font-bold text-slate-800">{app.score.toFixed(1)}/25.0</span>
                              </div>
                            )}

                            {/* Reschedule option */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Timing:</span>
                              <select
                                value="09:00 AM"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleRescheduleApplicant(
                                    app.id,
                                    val === "unscheduled" ? null : (val as any)
                                  );
                                }}
                                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                              >
                                <option value="09:00 AM">9:00 AM - 10:00 AM</option>
                                <option value="10:30 AM">10:30 AM - 11:30 AM</option>
                                <option value="unscheduled">Unschedule</option>
                              </select>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        No candidates scheduled in this block.
                      </p>
                    )}
                  </div>
                </div>

                {/* AFTERNOON BLOCK Column */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        Mid-Day Block: 10:30 AM - 11:30 AM
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Assigned: Healthcare Consulting Candidates
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {applicants.filter((a) => a.scheduledTime === "10:30 AM").length} Scheduled
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {applicants.filter((a) => a.scheduledTime === "10:30 AM").length > 0 ? (
                      applicants
                        .filter((a) => a.scheduledTime === "10:30 AM")
                        .map((app) => (
                          <div
                            key={app.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-55/50 hover:border-slate-355 hover:bg-white transition-all shadow-sm space-y-2.5"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-xs font-bold text-slate-800">{app.name}</h5>
                                <span className="text-[9px] text-slate-400 font-mono">#{app.hashId}</span>
                              </div>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-55 text-emerald-800 border border-emerald-100">
                                {app.cohort}
                              </span>
                            </div>

                            {app.score !== undefined && (
                              <div className="text-[10px] font-semibold text-slate-655 flex items-center gap-1">
                                <Award className="h-3.5 w-3.5 text-amber-55" /> Score: <span className="font-bold text-slate-800">{app.score.toFixed(1)}/25.0</span>
                              </div>
                            )}

                            {/* Reschedule option */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Timing:</span>
                              <select
                                value="10:30 AM"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleRescheduleApplicant(
                                    app.id,
                                    val === "unscheduled" ? null : (val as any)
                                  );
                                }}
                                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-55 border border-slate-200 rounded px-1.5 py-0.5 outline-none cursor-pointer"
                              >
                                <option value="09:00 AM">9:00 AM - 10:00 AM</option>
                                <option value="10:30 AM">10:30 AM - 11:30 AM</option>
                                <option value="unscheduled">Unschedule</option>
                              </select>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        No candidates scheduled in this block.
                      </p>
                    )}
                  </div>
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
        />
      )}

    </div>
  );
}
