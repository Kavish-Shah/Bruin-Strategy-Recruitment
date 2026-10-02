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
  Download,
  Copy,
  Coffee,
  UserCheck,
  PieChart,
  Layers,
  FileText,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Scale,
  Sliders,
  Wand2,
} from "lucide-react";

import StatCard from "@/components/StatCard";
import ApplicantCard, { Applicant, GraderAssignmentInfo, InterviewComment } from "@/components/ApplicantCard";
import GradingModal from "@/components/GradingModal";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import DecisionEmailModal from "@/components/DecisionEmailModal";
import {
  RUBRICS,
  RubricKey,
  RubricConfig,
  RubricCriterion,
  getApplicantRubricKey,
  getRubricTotalPoints,
  getRubricCriteriaList,
  getCriterionPercentage,
  getNormalizedBenchmarks,
  BenchmarkItem,
} from "@/utils/rubrics";

// Initial active board members / graders
interface Grader {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "GRADER";
  avatar: string;
  allowedCategories?: string[];
}

export interface GroupInterviewSlot {
  id: string;
  timeSlot: string;
  room: string;
  track: "freshman_management" | "upperclassmen_management" | "healthcare" | "all";
  maxCapacity: number;
  assignedEvaluators: string[];
  assignedCandidateIds: string[];
}

const DEFAULT_GROUP_SLOTS: GroupInterviewSlot[] = [
  {
    id: "gi-1",
    timeSlot: "Thursday Oct 24, 6:00 PM - 7:15 PM",
    room: "Ackerman Hall 2411",
    track: "freshman_management",
    maxCapacity: 6,
    assignedEvaluators: ["John Doe", "Jane Smith"],
    assignedCandidateIds: [],
  },
  {
    id: "gi-2",
    timeSlot: "Thursday Oct 24, 7:30 PM - 8:45 PM",
    room: "Ackerman Hall 2411",
    track: "upperclassmen_management",
    maxCapacity: 6,
    assignedEvaluators: ["Alex Johnson", "Emily Davis"],
    assignedCandidateIds: [],
  },
  {
    id: "gi-3",
    timeSlot: "Friday Oct 25, 6:00 PM - 7:15 PM",
    room: "Public Affairs 1234",
    track: "healthcare",
    maxCapacity: 6,
    assignedEvaluators: ["John Doe", "Michael Chang"],
    assignedCandidateIds: [],
  },
];

const INITIAL_GRADERS: Grader[] = [
  {
    id: "g1",
    name: "John Doe",
    email: "john.doe@bruinstrategy.org",
    role: "GRADER",
    avatar: "/bruinstrategylogo.jpeg",
  },
  {
    id: "g2",
    name: "Jane Smith",
    email: "jane.smith@bruinstrategy.org",
    role: "GRADER",
    avatar: "/bruinstrategylogo.jpeg",
  },
  {
    id: "g3",
    name: "Alex Chen",
    email: "alex.chen@bruinstrategy.org",
    role: "GRADER",
    avatar: "/bruinstrategylogo.jpeg",
  },
  {
    id: "g4",
    name: "Emily Taylor",
    email: "emily.taylor@bruinstrategy.org",
    role: "GRADER",
    avatar: "/bruinstrategylogo.jpeg",
  },
  {
    id: "g5",
    name: "Marcus Vance",
    email: "marcus.vance@bruinstrategy.org",
    role: "ADMIN",
    avatar: "/bruinstrategylogo.jpeg",
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

function extractFormValue(responses: any, candidates: string[]): string | null {
  if (!responses || typeof responses !== "object") return null;
  for (const k of candidates) {
    if (responses[k] !== undefined && responses[k] !== null && String(responses[k]).trim() !== "") {
      return String(responses[k]).trim();
    }
  }
  const raw = responses.rawPayload;
  if (raw && typeof raw === "object") {
    for (const k of candidates) {
      if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== "") {
        return String(raw[k]).trim();
      }
    }
    for (const [key, val] of Object.entries(raw)) {
      if (val && typeof val === "string" && val.trim() !== "") {
        const lowerKey = key.toLowerCase();
        if (candidates.some((c) => lowerKey.includes(c.toLowerCase()))) {
          return val.trim();
        }
      }
    }
  }
  for (const [key, val] of Object.entries(responses)) {
    if (val && typeof val === "string" && val.trim() !== "") {
      const lowerKey = key.toLowerCase();
      if (candidates.some((c) => lowerKey.includes(c.toLowerCase()))) {
        return val.trim();
      }
    }
  }
  return null;
}

function matchesCoffeeChatSlot(scheduledTime: string | null | undefined, slotTime: string): boolean {
  if (!scheduledTime) return false;
  const s = scheduledTime.toLowerCase();
  const clean = s.replace(/[^a-z0-9]/g, "");

  if (slotTime.includes("4:40")) {
    return (
      s.includes("4:40") ||
      s.includes("5:30") ||
      s.includes("5:25") ||
      s.includes("440") ||
      clean.includes("slot1") ||
      s.includes("slot 1") ||
      s.includes("first slot")
    );
  }
  if (slotTime.includes("5:45") || slotTime.includes("5:40")) {
    return (
      s.includes("5:45") ||
      s.includes("6:35") ||
      s.includes("5:40") ||
      s.includes("6:25") ||
      s.includes("545") ||
      s.includes("540") ||
      clean.includes("slot2") ||
      s.includes("slot 2") ||
      s.includes("second slot")
    );
  }
  if (slotTime.includes("6:50") || slotTime.includes("6:40")) {
    return (
      s.includes("6:50") ||
      s.includes("7:40") ||
      s.includes("6:40") ||
      s.includes("7:25") ||
      s.includes("650") ||
      s.includes("640") ||
      clean.includes("slot3") ||
      s.includes("slot 3") ||
      s.includes("third slot")
    );
  }
  return false;
}

function matchesGroupInterviewSlot(scheduledTime: string | null | undefined, slotTime: string): boolean {
  if (!scheduledTime) return false;
  const s = scheduledTime.toLowerCase();
  const clean = s.replace(/[^a-z0-9]/g, "");

  if (slotTime.includes("4:40")) {
    return (
      s.includes("4:40") ||
      s.includes("5:25") ||
      s.includes("5:30") ||
      s.includes("440") ||
      clean.includes("slot1") ||
      s.includes("slot 1") ||
      s.includes("first slot")
    );
  }
  if (slotTime.includes("5:40") || slotTime.includes("5:45")) {
    return (
      s.includes("5:40") ||
      s.includes("6:25") ||
      s.includes("5:45") ||
      s.includes("6:35") ||
      s.includes("540") ||
      s.includes("545") ||
      clean.includes("slot2") ||
      s.includes("slot 2") ||
      s.includes("second slot")
    );
  }
  if (slotTime.includes("6:40") || slotTime.includes("6:50")) {
    return (
      s.includes("6:40") ||
      s.includes("7:25") ||
      s.includes("6:50") ||
      s.includes("7:40") ||
      s.includes("640") ||
      s.includes("650") ||
      clean.includes("slot3") ||
      s.includes("slot 3") ||
      s.includes("third slot")
    );
  }
  return false;
}

function cleanTimeStr(t: any): string | null {
  if (!t) return null;
  const str = String(t).trim();
  if (str === "" || str === "null" || str === "undefined" || str.toLowerCase() === "not assigned" || str.toLowerCase() === "none") {
    return null;
  }
  return str;
}

function extractTimeFromRawPayload(raw: any, keywords: string[]): string | null {
  if (!raw || typeof raw !== "object") return null;
  for (const [k, v] of Object.entries(raw)) {
    const keyLower = k.toLowerCase();
    const matchesAll = keywords.every((kw) => keyLower.includes(kw.toLowerCase()));
    if (matchesAll && typeof v === "string" && v.trim() !== "") {
      return v.trim();
    }
  }
  return null;
}

function getCoffeeChatTimes(formResponses: any, activeScheduledTime?: string | null, activeFallbackTime?: string | null): { scheduledTime: string | null; fallbackTime: string | null } {
  const resp = formResponses || {};

  // 1. Explicit coffee chat keys
  let primary = resp.coffeeChatScheduledTime || resp.coffeeChatPrimarySlot || null;
  let fallback = resp.coffeeChatFallbackTime || resp.coffeeChatFallbackSlot || null;

  // Filter out any accidental group interview timestamps from coffee chat variables
  if (fallback && (fallback.includes("5:25") || fallback.includes("6:25") || fallback.includes("7:25") || fallback.includes("5:40") || fallback.includes("6:40"))) {
    fallback = null;
  }
  if (primary && (primary.includes("5:25") || primary.includes("6:25") || primary.includes("7:25") || primary.includes("5:40") || primary.includes("6:40"))) {
    primary = null;
  }

  // 2. Dynamic extraction from raw payload (strictly coffee chat questions)
  const rawObj = resp.rawPayload;
  if (!primary && rawObj) {
    primary =
      extractTimeFromRawPayload(rawObj, ["coffee", "preferred"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee", "primary"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee", "first"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee", "time"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee", "slot"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee"]);
  }
  if (!fallback && rawObj) {
    fallback =
      extractTimeFromRawPayload(rawObj, ["coffee", "second"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee", "backup"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee", "fallback"]) ||
      extractTimeFromRawPayload(rawObj, ["coffee", "alternative"]);
  }

  // 3. Regular non-group keys: primarySlot / fallbackSlot (ONLY IF NOT matching group times and not equal to groupPrimarySlot)
  const groupPrimary = resp.groupPrimarySlot || resp.groupScheduledTime;
  if (!primary && resp.primarySlot && resp.primarySlot !== groupPrimary && !resp.primarySlot.includes("5:25") && !resp.primarySlot.includes("6:25") && !resp.primarySlot.includes("7:25") && !resp.primarySlot.includes("5:40") && !resp.primarySlot.includes("6:40")) {
    primary = resp.primarySlot;
  }
  if (!primary && resp.scheduledTime && resp.scheduledTime !== groupPrimary && !resp.scheduledTime.includes("5:25") && !resp.scheduledTime.includes("6:25") && !resp.scheduledTime.includes("7:25") && !resp.scheduledTime.includes("5:40") && !resp.scheduledTime.includes("6:40")) {
    primary = resp.scheduledTime;
  }

  const groupFallback = resp.groupFallbackSlot || resp.groupFallbackTime;
  if (!fallback && resp.fallbackSlot && resp.fallbackSlot !== groupFallback && !resp.fallbackSlot.includes("5:25") && !resp.fallbackSlot.includes("6:25") && !resp.fallbackSlot.includes("7:25") && !resp.fallbackSlot.includes("5:40") && !resp.fallbackSlot.includes("6:40")) {
    fallback = resp.fallbackSlot;
  }
  if (!fallback && resp.fallbackTime && resp.fallbackTime !== groupFallback && !resp.fallbackTime.includes("5:25") && !resp.fallbackTime.includes("6:25") && !resp.fallbackTime.includes("7:25") && !resp.fallbackTime.includes("5:40") && !resp.fallbackTime.includes("6:40")) {
    fallback = resp.fallbackTime;
  }

  return {
    scheduledTime: cleanTimeStr(primary),
    fallbackTime: cleanTimeStr(fallback),
  };
}

function getGroupInterviewTimes(formResponses: any, activeScheduledTime?: string | null, activeFallbackTime?: string | null): { scheduledTime: string | null; fallbackTime: string | null } {
  const resp = formResponses || {};

  // 1. Explicit group interview keys
  let primary = resp.groupPrimarySlot || resp.groupScheduledTime || null;
  let fallback = resp.groupFallbackSlot || resp.groupFallbackTime || null;

  // Filter out any accidental coffee chat timestamps from group interview variables
  if (fallback && (fallback.includes("5:30") || fallback.includes("6:35") || fallback.includes("7:40") || fallback.includes("5:45") || fallback.includes("6:50"))) {
    fallback = null;
  }
  if (primary && (primary.includes("5:30") || primary.includes("6:35") || primary.includes("7:40") || primary.includes("5:45") || primary.includes("6:50"))) {
    primary = null;
  }

  // 2. Dynamic extraction from rawGroupPayload / rawPayload (strictly group interview questions)
  const rawObj = resp.rawGroupPayload || resp.rawPayload;
  if (!primary && rawObj) {
    primary =
      extractTimeFromRawPayload(rawObj, ["group", "preferred"]) ||
      extractTimeFromRawPayload(rawObj, ["group", "primary"]) ||
      extractTimeFromRawPayload(rawObj, ["group", "time"]) ||
      extractTimeFromRawPayload(rawObj, ["group"]);
  }
  if (!fallback && rawObj) {
    fallback =
      extractTimeFromRawPayload(rawObj, ["group", "second"]) ||
      extractTimeFromRawPayload(rawObj, ["group", "fallback"]) ||
      extractTimeFromRawPayload(rawObj, ["group", "backup"]) ||
      extractTimeFromRawPayload(rawObj, ["group", "alternative"]);
  }

  // 3. Fallback to primarySlot / fallbackSlot if it contains group interview time patterns
  if (!primary && resp.primarySlot && (resp.primarySlot.includes("5:25") || resp.primarySlot.includes("6:25") || resp.primarySlot.includes("7:25") || resp.primarySlot.includes("5:40") || resp.primarySlot.includes("6:40"))) {
    primary = resp.primarySlot;
  }
  if (!fallback && resp.fallbackSlot && (resp.fallbackSlot.includes("5:25") || resp.fallbackSlot.includes("6:25") || resp.fallbackSlot.includes("7:25") || resp.fallbackSlot.includes("5:40") || resp.fallbackSlot.includes("6:40"))) {
    fallback = resp.fallbackSlot;
  }

  return {
    scheduledTime: cleanTimeStr(primary),
    fallbackTime: cleanTimeStr(fallback),
  };
}

export function getApplicantCalibratedScore(
  app: Applicant,
  isCalibrated: boolean,
  offsets: Record<string, number>,
  maxPoints: number = 25.0
): {
  effectiveScore: number | undefined;
  rawScore: number | undefined;
  isCalibrated: boolean;
  graderScores: { graderName: string; rawScore: number; offset: number; calibratedScore: number }[];
} {
  const completedGraders = (app.assignedGraders || []).filter(
    (g) => g.status === "completed" && g.score !== undefined
  );

  if (completedGraders.length === 0) {
    if (app.score !== undefined) {
      return {
        effectiveScore: app.score,
        rawScore: app.score,
        isCalibrated: false,
        graderScores: [],
      };
    }
    return {
      effectiveScore: undefined,
      rawScore: undefined,
      isCalibrated: false,
      graderScores: [],
    };
  }

  const rawSum = completedGraders.reduce((sum, g) => sum + (g.score || 0), 0);
  const rawScore = parseFloat((rawSum / completedGraders.length).toFixed(1));

  if (!isCalibrated) {
    return {
      effectiveScore: rawScore,
      rawScore,
      isCalibrated: false,
      graderScores: completedGraders.map((g) => ({
        graderName: g.graderName,
        rawScore: g.score || 0,
        offset: 0,
        calibratedScore: g.score || 0,
      })),
    };
  }

  const graderScores = completedGraders.map((g) => {
    const raw = g.score || 0;
    const offset = offsets[g.graderId] !== undefined 
      ? offsets[g.graderId] 
      : (offsets[g.graderName] !== undefined ? offsets[g.graderName] : 0);
    const calibrated = Math.max(0, Math.min(maxPoints, parseFloat((raw + offset).toFixed(1))));
    return {
      graderName: g.graderName,
      rawScore: raw,
      offset,
      calibratedScore: calibrated,
    };
  });

  const calibratedSum = graderScores.reduce((sum, g) => sum + g.calibratedScore, 0);
  const effectiveScore = parseFloat((calibratedSum / graderScores.length).toFixed(1));

  return {
    effectiveScore,
    rawScore,
    isCalibrated: true,
    graderScores,
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("applicant_profiles");
  const [selectedCohort, setSelectedCohort] = useState<string>("Management Consulting");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [selectedRubricTab, setSelectedRubricTab] = useState<RubricKey>("freshman_management");

  // Statistical Grader Calibration State (After-the-fact normalization)
  const [graderCalibrationOffsets, setGraderCalibrationOffsets] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bsn_grader_calibration_offsets");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {};
  });

  const isCalibratedView = useMemo(() => {
    return (
      Object.keys(graderCalibrationOffsets).length > 0 &&
      Object.values(graderCalibrationOffsets).some((v) => v !== 0)
    );
  }, [graderCalibrationOffsets]);
  const [rubricsState, setRubricsState] = useState<Record<RubricKey, RubricConfig>>(RUBRICS);
  const [isEditingRubrics, setIsEditingRubrics] = useState<boolean>(false);
  const [activeRubricBenchmarkPoints, setActiveRubricBenchmarkPoints] = useState<Record<string, string>>({});
  const [graderPermissions, setGraderPermissions] = useState<Record<string, string[]>>({});
  const [userRole, setUserRole] = useState<"ADMIN" | "GRADER">("ADMIN");
  const [assigningSlotInfo, setAssigningSlotInfo] = useState<{ applicantId: string; slotIndex: 0 | 1 } | null>(null);

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

  // Load saved custom rubrics from LocalStorage & Supabase on mount
  useEffect(() => {
    const ensureTenCategories = (stateObj: Record<RubricKey, RubricConfig>) => {
      const copy = { ...stateObj };
      (Object.keys(copy) as RubricKey[]).forEach((key) => {
        if (copy[key] && Array.isArray(copy[key].criteriaList)) {
          const list = copy[key].criteriaList;
          const hasOverall = list.some((c) => c.id === "overall_impression" || c.name.toLowerCase().includes("overall"));
          if (!hasOverall) {
            copy[key] = {
              ...copy[key],
              criteriaList: [
                ...list,
                {
                  id: "overall_impression",
                  name: "Overall Evaluator Recommendation",
                  maxScore: 5.0,
                  description: "Evaluator's holistic impression of candidate readiness, potential, and hiring priority.",
                  benchmarks: [
                    { id: "b1", point: 1.0, guidance: "1.0 - Do Not Recommend" },
                    { id: "b2", point: 3.0, guidance: "3.0 - Recommend for Next Round" },
                    { id: "b3", point: 5.0, guidance: "5.0 - Strongest Hire Recommendation" },
                  ],
                },
              ],
            };
          }
        }
      });
      return copy;
    };

    try {
      const savedLocal = localStorage.getItem("bsn_custom_rubrics");
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed && typeof parsed === "object") {
          const migrated = ensureTenCategories(parsed);
          setRubricsState(migrated);
          try {
            localStorage.setItem("bsn_custom_rubrics", JSON.stringify(migrated));
          } catch (_) {}
        }
      }
    } catch (_) {}

    if (hasSupabaseKeys) {
      supabase
        .from("recruitment_settings")
        .select("setting_value")
        .eq("setting_key", "custom_rubrics")
        .single()
        .then(
          ({ data }) => {
            if (data && data.setting_value) {
              const migrated = ensureTenCategories(data.setting_value);
              setRubricsState(migrated);
              try {
                localStorage.setItem("bsn_custom_rubrics", JSON.stringify(migrated));
              } catch (_) {}
            }
          },
          () => {}
        );
    }
  }, [hasSupabaseKeys]);

  // Listen for Supabase Authentication State changes
  useEffect(() => {
    if (!hasSupabaseKeys) {
      setLoadingAuth(false);
      return;
    }

    let isMounted = true;

    // Get current session safely with stale token recovery
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          // Clear stale or invalid refresh token automatically
          supabase.auth.signOut().catch(() => {});
          if (isMounted) {
            setSession(null);
            setUserRole("ADMIN");
            setLoadingAuth(false);
          }
          return;
        }
        if (!isMounted) return;
        const session = data?.session || null;
        setSession(session);
        if (session) {
          fetchUserRole(session.user.id);
        }
        setLoadingAuth(false);
      })
      .catch(() => {
        if (!isMounted) return;
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUserRole("ADMIN");
        setLoadingAuth(false);
      });

    // Listen to changes safely
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT" || !session) {
        setSession(null);
        setUserRole("ADMIN");
        setProfileName("Admin Board Member");
      } else {
        setSession(session);
        fetchUserRole(session.user.id);
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
            created_at,
            profiles (
              name
            ),
            evaluations (
              *
            )
          `)
          .order("created_at", { ascending: true });

        if (assignError) throw assignError;

        // Fetch all profiles to see who is registered as a grader
        const { data: profilesList } = await supabase
          .from("profiles")
          .select("id, name, role, email");

        setDbProfiles(profilesList || []);

        // Map assignments by applicant_id (supporting dual graders per applicant)
        const assignmentMap: Record<string, any[]> = {};
        if (dbAssignments) {
          for (const ass of dbAssignments) {
            if (!assignmentMap[ass.applicant_id]) {
              assignmentMap[ass.applicant_id] = [];
            }
            assignmentMap[ass.applicant_id].push(ass);
          }
        }

        // 4. Map DB applicants to React state
        const mapped: Applicant[] = dbApplicants.map((app) => {
          const appAssList = assignmentMap[app.id] || [];

          const assignedGraders: GraderAssignmentInfo[] = appAssList.map((ass) => {
            const val = ass?.evaluations ? (Array.isArray(ass.evaluations) ? ass.evaluations[0] : ass.evaluations) : undefined;
            
            let parsedGrades: Record<string, number> | undefined = undefined;
            let parsedTotalScore: number | undefined = undefined;
            let cleanNotes = val?.notes || "";

            // 1. Try reading raw_scores JSON column
            if (val?.raw_scores && typeof val.raw_scores === "object" && Object.keys(val.raw_scores).length > 0) {
              parsedGrades = val.raw_scores;
            }

            // 2. Try reading total_score NUMERIC column
            if (val?.total_score !== undefined && val?.total_score !== null && Number(val.total_score) > 0) {
              parsedTotalScore = Number(val.total_score);
            }

            // 3. Fallback: Parse notes for [EVAL_GRADES]: JSON string metadata
            if (val?.notes && val.notes.includes("[EVAL_GRADES]:")) {
              try {
                const parts = val.notes.split("[EVAL_GRADES]:");
                cleanNotes = parts[0].trim();
                const parsedObj = JSON.parse(parts[1]);
                if (parsedObj && typeof parsedObj === "object") {
                  if (parsedObj._totalScore !== undefined && (!parsedTotalScore || parsedTotalScore === 0)) {
                    parsedTotalScore = Number(parsedObj._totalScore);
                  }
                  delete parsedObj._totalScore;
                  if (!parsedGrades || Object.keys(parsedGrades).length === 0) {
                    parsedGrades = parsedObj;
                  }
                }
              } catch (_) {}
            }

            // 4. Calculate sum from parsedGrades if total score is still missing
            let calculatedSumFromGrades: number | undefined = undefined;
            if (parsedGrades && Object.keys(parsedGrades).length > 0) {
              const sum = Object.values(parsedGrades).reduce((acc, v) => acc + (Number(v) || 0), 0);
              calculatedSumFromGrades = parseFloat(sum.toFixed(1));
            }

            // 5. Final fallback score resolution
            const finalScore = parsedTotalScore && parsedTotalScore > 0
              ? parsedTotalScore
              : calculatedSumFromGrades && calculatedSumFromGrades > 0
              ? calculatedSumFromGrades
              : val && (val.leadership_score || val.problem_solving_score || val.communication_score || val.essay_score)
              ? ((Number(val.leadership_score) || 0) + (Number(val.problem_solving_score) || 0) + (Number(val.communication_score) || 0) + (Number(val.essay_score) || 0))
              : undefined;

            const finalGrades = parsedGrades || (val ? {
              leadership: Number(val.leadership_score) || 0,
              problemSolving: Number(val.problem_solving_score) || 0,
              communication: Number(val.communication_score) || 0,
              essay: Number(val.essay_score) || 0,
            } : undefined);

            const graderProfileName = ass?.profiles
              ? (Array.isArray(ass.profiles) ? ass.profiles[0]?.name : ass.profiles.name)
              : undefined;

            const fallbackGraderName = ass.grader_id && profilesList
              ? profilesList.find((p: any) => p.id === ass.grader_id)?.name
              : undefined;

            return {
              graderId: ass.grader_id,
              graderName: graderProfileName || fallbackGraderName || "Board Member",
              status: val ? "completed" : "assigned",
              score: finalScore,
              grades: finalGrades,
              notes: cleanNotes,
            };
          });

          const completedGraders = assignedGraders.filter((g) => g.status === "completed" && g.score !== undefined);
          let overallScore: number | undefined = undefined;
          if (completedGraders.length > 0) {
            const sum = completedGraders.reduce((acc, curr) => acc + (curr.score || 0), 0);
            overallScore = parseFloat((sum / completedGraders.length).toFixed(1));
          }

          let computedStatus: Applicant["status"] = (app.status || "unassigned") as any;
          if (["completed", "interview", "group_interview", "offered", "rejected"].includes(app.status)) {
            computedStatus = app.status as any;
          } else if (app.form_responses && app.form_responses.stageStatus === "group_interview") {
            computedStatus = "group_interview";
          } else if (completedGraders.length > 0) {
            computedStatus = "completed";
          } else if (assignedGraders.length > 0) {
            computedStatus = "assigned";
          }

          // Normalize cohort names from DB to match UI filters
          let normalizedCohort = "Management Consulting";
          if (app.cohort && app.cohort.toLowerCase().includes("health")) {
            normalizedCohort = "Healthcare Consulting";
          } else if (app.cohort) {
            normalizedCohort = "Management Consulting";
          }

          const primaryGrader = assignedGraders[0];

          const isGroupInterviewStage = computedStatus === "group_interview";

          let resolvedPrimaryTime: string | null = null;
          let resolvedFallbackTime: string | null = null;

          if (isGroupInterviewStage) {
            const { scheduledTime: groupPrimary, fallbackTime: groupFallback } = getGroupInterviewTimes(app.form_responses);
            resolvedPrimaryTime = groupPrimary || (app.status === "group_interview" ? cleanTimeStr(app.scheduled_time) : null);
            resolvedFallbackTime = groupFallback || (app.status === "group_interview" ? cleanTimeStr(app.fallback_time) : null);
          } else {
            const { scheduledTime: coffeePrimary, fallbackTime: coffeeFallback } = getCoffeeChatTimes(app.form_responses);
            resolvedPrimaryTime = coffeePrimary || (app.status === "interview" ? cleanTimeStr(app.scheduled_time) : null);
            resolvedFallbackTime = coffeeFallback || (app.status === "interview" ? cleanTimeStr(app.fallback_time) : null);
          }

          const finalScheduledTime = cleanTimeStr(resolvedPrimaryTime);
          const finalFallbackTime = cleanTimeStr(resolvedFallbackTime);

          return {
            id: app.id,
            name: app.name,
            email: app.email,
            hashId: app.id.slice(0, 6),
            submissionDate: app.created_at ? app.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            cohort: normalizedCohort,
            year: app.Year || app.year || app.YEAR || (app.cohort && app.cohort.toLowerCase().includes("freshman") ? "Freshman" : app.cohort && app.cohort.toLowerCase().includes("upper") ? "Upperclassman" : "Sophomore"),
            status: computedStatus,
            score: overallScore,
            score1: assignedGraders[0]?.score,
            score2: assignedGraders[1]?.score,
            assignedGraderId: primaryGrader?.graderId,
            assignedGraderName: primaryGrader?.graderName,
            assignedGraders,
            hasResume: !!(app.resume_url || app.resumeUrl || app.resume || app.Resume),
            resumeUrl: app.resume_url || app.resumeUrl || app.resume || app.Resume,
            scheduledTime: finalScheduledTime || undefined,
            fallbackTime: finalFallbackTime || undefined,
            studentId: app.student_id || (app.form_responses && (app.form_responses.student_id || app.form_responses.studentId || app.form_responses.uid)),
            tableNumber: app.table_number || (app.form_responses && (app.form_responses.table_number || app.form_responses.tableNumber)),
            formResponses: app.form_responses,
            shortAnswer: app.short_answer || (app.form_responses && app.form_responses.short_answer),
            major: app.major || (app.form_responses && app.form_responses.major),
            linkedinUrl: app.linkedin_url || app.linkedin || app.linkedinUrl || (app.form_responses && (app.form_responses.linkedinUrl || app.form_responses.linkedin)),
            attendanceCount:
              typeof app.form_responses?.attendance_count === "number"
                ? app.form_responses.attendance_count
                : Array.isArray(app.form_responses?.attendance_events)
                ? app.form_responses.attendance_events.length
                : 0,
            attendanceEvents:
              app.form_responses?.attendance_events ||
              app.form_responses?.attendanceEvents ||
              [],
          };
        });

        // Update local React state strictly with DB entries from Supabase
        setApplicants(mapped);

      } catch (err: any) {
        console.warn("Notice fetching applicants from Supabase:", err?.message || err);
      }
    };

    fetchApplicantsFromSupabase();

    // Setup Realtime subscription and 10s auto-refresh for Google Form updates
    const channel = supabase
      .channel("applicants-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applicants" },
        () => {
          fetchApplicantsFromSupabase();
        }
      )
      .subscribe();

    const intervalId = setInterval(() => {
      fetchApplicantsFromSupabase();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
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
        return dbProfiles
          .filter((p) => p.role === "GRADER")
          .map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email || `${p.name.toLowerCase().replace(/\s+/g, ".")}@bruinstrategy.org`,
            role: "GRADER" as const,
            avatar: "/bruinstrategylogo.jpeg",
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
      avatar: "/bruinstrategylogo.jpeg",
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
    type: "REJECTION" | "OFFER" | "INTERVIEW" | "PERSONALIZED_FEEDBACK";
  } | null>(null);

  // Toast Notification State (Silenced per user request)
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    visible: boolean;
  }>({ message: "", type: "success", visible: false });

  const showToast = (
    _message: string,
    _type: "success" | "error" | "info" | "warning" = "success"
  ) => {
    // Silenced
    setToast({ message: "", type: "success", visible: false });
  };

  // Coffee Chat Table Assignments state & drag-and-drop support
  const [tableAssignments, setTableAssignments] = useState<Record<string, number>>({});
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverTableKey, setDragOverTableKey] = useState<string | null>(null);

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

  const handleAdvanceToGroupInterview = async (applicantId: string) => {
    const applicant = applicants.find((a) => a.id === applicantId);

    const formResponsesCopy = { ...(applicant?.formResponses || {}) };
    formResponsesCopy.stageStatus = "group_interview";

    // 1. If currently in Coffee Chat with a valid Coffee Chat time, archive it
    if (applicant?.scheduledTime && !applicant.scheduledTime.includes("5:25") && !applicant.scheduledTime.includes("6:25") && !applicant.scheduledTime.includes("7:25")) {
      formResponsesCopy.coffeeChatScheduledTime = applicant.scheduledTime;
      formResponsesCopy.coffeeChatPrimarySlot = applicant.scheduledTime;
    }
    if (applicant?.fallbackTime && !applicant.fallbackTime.includes("5:25") && !applicant.fallbackTime.includes("6:25") && !applicant.fallbackTime.includes("7:25")) {
      formResponsesCopy.coffeeChatFallbackTime = applicant.fallbackTime;
      formResponsesCopy.coffeeChatFallbackSlot = applicant.fallbackTime;
    }

    // 2. Retrieve the candidate's exact Group Interview submission times from form_responses
    const { scheduledTime: groupPrimary, fallbackTime: groupFallback } = getGroupInterviewTimes(formResponsesCopy);

    if (groupPrimary) formResponsesCopy.groupPrimarySlot = groupPrimary;
    if (groupPrimary) formResponsesCopy.groupScheduledTime = groupPrimary;
    if (groupFallback) formResponsesCopy.groupFallbackSlot = groupFallback;
    if (groupFallback) formResponsesCopy.groupFallbackTime = groupFallback;

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId
          ? {
              ...app,
              status: "group_interview",
              formResponses: formResponsesCopy,
              scheduledTime: groupPrimary || undefined,
              fallbackTime: groupFallback || undefined,
              tableNumber: undefined,
            }
          : app
      )
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === applicantId
        ? {
            ...prev,
            status: "group_interview",
            formResponses: formResponsesCopy,
            scheduledTime: groupPrimary || undefined,
            fallbackTime: groupFallback || undefined,
            tableNumber: undefined,
          }
        : prev
    );

    if (hasSupabaseKeys) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({
            status: "group_interview",
            scheduled_time: groupPrimary || null,
            fallback_time: groupFallback || null,
            form_responses: formResponsesCopy,
          })
          .eq("id", applicantId);

        if (error) {
          const mainErr = error.message || error.details || (typeof error === "object" ? JSON.stringify(error) : String(error));
          console.warn("Primary group_interview ENUM update notice, executing form_responses fallback:", mainErr);

          await supabase
            .from("applicants")
            .update({
              form_responses: formResponsesCopy,
              scheduled_time: groupPrimary || null,
            })
            .eq("id", applicantId);
        }
      } catch (err: any) {
        console.error("Error advancing candidate to group interview in Supabase:", err);
      }
    }

    showToast(`Advanced ${applicant?.name || "candidate"} to Group Interview stage`, "success");
  };

  const handleReturnToCoffeeChat = async (applicantId: string) => {
    const applicant = applicants.find((a) => a.id === applicantId);
    const formResponsesCopy = { ...(applicant?.formResponses || {}) };
    delete formResponsesCopy.stageStatus;

    // 1. If currently in Group Interview with a valid Group Interview time, archive it
    if (applicant?.scheduledTime && (applicant.scheduledTime.includes("5:25") || applicant.scheduledTime.includes("6:25") || applicant.scheduledTime.includes("7:25") || applicant.scheduledTime.includes("5:40") || applicant.scheduledTime.includes("6:40"))) {
      formResponsesCopy.groupScheduledTime = applicant.scheduledTime;
      formResponsesCopy.groupPrimarySlot = applicant.scheduledTime;
    }
    if (applicant?.fallbackTime && (applicant.fallbackTime.includes("5:25") || applicant.fallbackTime.includes("6:25") || applicant.fallbackTime.includes("7:25") || applicant.fallbackTime.includes("5:40") || applicant.fallbackTime.includes("6:40"))) {
      formResponsesCopy.groupFallbackTime = applicant.fallbackTime;
      formResponsesCopy.groupFallbackSlot = applicant.fallbackTime;
    }

    // 2. Retrieve the candidate's exact Coffee Chat submission times from form_responses
    const { scheduledTime: coffeePrimary, fallbackTime: coffeeFallback } = getCoffeeChatTimes(formResponsesCopy);

    if (coffeePrimary) formResponsesCopy.coffeeChatPrimarySlot = coffeePrimary;
    if (coffeePrimary) formResponsesCopy.coffeeChatScheduledTime = coffeePrimary;
    if (coffeeFallback) formResponsesCopy.coffeeChatFallbackSlot = coffeeFallback;
    if (coffeeFallback) formResponsesCopy.coffeeChatFallbackTime = coffeeFallback;

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId
          ? {
              ...app,
              status: "interview",
              formResponses: formResponsesCopy,
              scheduledTime: coffeePrimary || undefined,
              fallbackTime: coffeeFallback || undefined,
            }
          : app
      )
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === applicantId
        ? {
            ...prev,
            status: "interview",
            formResponses: formResponsesCopy,
            scheduledTime: coffeePrimary || undefined,
            fallbackTime: coffeeFallback || undefined,
          }
        : prev
    );

    if (hasSupabaseKeys) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({
            status: "interview",
            scheduled_time: coffeePrimary || null,
            fallback_time: coffeeFallback || null,
            form_responses: formResponsesCopy,
          })
          .eq("id", applicantId);

        if (error) {
          await supabase
            .from("applicants")
            .update({
              status: "interview",
              scheduled_time: coffeePrimary || null,
              form_responses: formResponsesCopy,
            })
            .eq("id", applicantId);
        }
      } catch (err: any) {
        console.error("Error returning candidate to coffee chat in Supabase:", err);
      }
    }

    showToast(`Returned ${applicant?.name || "candidate"} to Coffee Chat (${coffeePrimary || "Unscheduled"})`, "success");
  };

  // Load grader pool permissions state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bsn_grader_permissions");
      if (saved) setGraderPermissions(JSON.parse(saved));
    } catch (_) {}

    if (hasSupabaseKeys) {
      supabase
        .from("recruitment_settings")
        .select("setting_value")
        .eq("setting_key", "grader_permissions")
        .maybeSingle()
        .then(
          ({ data }) => {
            if (data?.setting_value) {
              setGraderPermissions(data.setting_value);
              try {
                localStorage.setItem("bsn_grader_permissions", JSON.stringify(data.setting_value));
              } catch (_) {}
            }
          },
          () => {}
        );
    }
  }, [hasSupabaseKeys]);

  const handleToggleGraderCategory = async (graderId: string, categoryKey: string) => {
    const defaultCategories = ["freshman_management", "upperclassmen_management", "healthcare"];
    const currentAllowed = graderPermissions[graderId] || defaultCategories;

    let nextAllowed: string[];
    if (currentAllowed.includes(categoryKey)) {
      if (currentAllowed.length <= 1) {
        showToast("Grader must have at least one allowed pool category.", "info");
        return;
      }
      nextAllowed = currentAllowed.filter((c) => c !== categoryKey);
    } else {
      nextAllowed = [...currentAllowed, categoryKey];
    }

    const updatedMap = { ...graderPermissions, [graderId]: nextAllowed };
    setGraderPermissions(updatedMap);

    try {
      localStorage.setItem("bsn_grader_permissions", JSON.stringify(updatedMap));
    } catch (_) {}

    if (hasSupabaseKeys) {
      try {
        await supabase.from("recruitment_settings").upsert({
          setting_key: "grader_permissions",
          setting_value: updatedMap,
        });
      } catch (_) {}
    }

    showToast("Updated grader pool permissions", "success");
  };

  const handleCopyAllRejectedEmails = () => {
    const rejectedApps = applicants.filter((a) => a.status === "rejected");
    if (rejectedApps.length === 0) {
      showToast("No rejected candidates found.", "info");
      return;
    }
    const emailList = rejectedApps.map((a) => a.email).join(", ");
    navigator.clipboard.writeText(emailList);
    showToast(`Copied ${rejectedApps.length} rejected candidate emails to clipboard!`, "success");
  };

  const handleExportRejectionsCSV = () => {
    const rejectedApps = applicants.filter((a) => a.status === "rejected");
    if (rejectedApps.length === 0) {
      showToast("No rejected candidates to export.", "info");
      return;
    }

    const headers = ["Name", "Email", "Student ID", "Cohort", "Year", "Overall Score", "Status"];
    const rows = rejectedApps.map((a) => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.studentId || ""}"`,
      `"${a.cohort}"`,
      `"${a.year || ""}"`,
      a.score !== undefined ? a.score.toFixed(1) : "",
      `"${a.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bruin_Strategy_Network_Rejected_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported rejected candidates CSV successfully!", "success");
  };

  // Group Interviews state & management handlers
  const [groupSlots, setGroupSlots] = useState<GroupInterviewSlot[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bsn_group_interview_slots");
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_GROUP_SLOTS;
  });

  const [isAddGroupSlotOpen, setIsAddGroupSlotOpen] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState("Saturday Oct 26, 2:00 PM - 3:15 PM");
  const [newSlotRoom, setNewSlotRoom] = useState("Ackerman Hall 2412");
  const [newSlotTrack, setNewSlotTrack] = useState<"freshman_management" | "upperclassmen_management" | "healthcare" | "all">("freshman_management");
  const [newSlotCapacity, setNewSlotCapacity] = useState(6);

  const saveGroupSlots = (updatedSlots: GroupInterviewSlot[]) => {
    setGroupSlots(updatedSlots);
    try {
      localStorage.setItem("bsn_group_interview_slots", JSON.stringify(updatedSlots));
    } catch (_) {}
    if (hasSupabaseKeys) {
      supabase
        .from("recruitment_settings")
        .upsert({ setting_key: "group_interview_slots", setting_value: updatedSlots })
        .then(() => {});
    }
  };

  const handleAddGroupSlot = () => {
    const newSlot: GroupInterviewSlot = {
      id: `gi-${Date.now()}`,
      timeSlot: newSlotTime,
      room: newSlotRoom,
      track: newSlotTrack,
      maxCapacity: newSlotCapacity,
      assignedEvaluators: [currentUser.name || "Board Member"],
      assignedCandidateIds: [],
    };
    const updated = [...groupSlots, newSlot];
    saveGroupSlots(updated);
    setIsAddGroupSlotOpen(false);
    showToast("Added Group Interview session room!", "success");
  };

  const handleRemoveGroupSlot = (slotId: string) => {
    const updated = groupSlots.filter((s) => s.id !== slotId);
    saveGroupSlots(updated);
    showToast("Removed Group Interview session", "info");
  };

  const handleAssignCandidateToGroupSlot = (candidateId: string, targetSlotId: string | null) => {
    const updated = groupSlots.map((slot) => {
      const filteredCandidates = slot.assignedCandidateIds.filter((id) => id !== candidateId);
      if (slot.id === targetSlotId) {
        if (filteredCandidates.length >= slot.maxCapacity) {
          showToast("Session is already at maximum capacity!", "error");
          return slot;
        }
        return { ...slot, assignedCandidateIds: [...filteredCandidates, candidateId] };
      }
      return { ...slot, assignedCandidateIds: filteredCandidates };
    });
    saveGroupSlots(updated);
    showToast("Updated candidate room assignment!", "success");
  };

  const handleToggleEvaluatorInSlot = (slotId: string, evaluatorName: string) => {
    const updated = groupSlots.map((slot) => {
      if (slot.id === slotId) {
        const exists = slot.assignedEvaluators.includes(evaluatorName);
        const updatedEvaluators = exists
          ? slot.assignedEvaluators.filter((e) => e !== evaluatorName)
          : [...slot.assignedEvaluators, evaluatorName];
        return { ...slot, assignedEvaluators: updatedEvaluators };
      }
      return slot;
    });
    saveGroupSlots(updated);
    showToast("Updated evaluator assignment", "success");
  };

  const handleAutoBalanceGroupTeams = () => {
    const eligibleApps = applicants.filter((a) => ["interview", "offered", "completed"].includes(a.status));
    if (eligibleApps.length === 0) {
      showToast("No eligible candidates found to assign.", "info");
      return;
    }

    const slotsCopy = groupSlots.map((s) => ({ ...s, assignedCandidateIds: [] as string[] }));

    const fmApps = eligibleApps.filter((a) => getApplicantRubricKey(a) === "freshman_management");
    const umApps = eligibleApps.filter((a) => getApplicantRubricKey(a) === "upperclassmen_management");
    const hcApps = eligibleApps.filter((a) => getApplicantRubricKey(a) === "healthcare");

    const assignPoolToSlots = (pool: Applicant[], trackKey: string) => {
      const matchingSlots = slotsCopy.filter((s) => s.track === trackKey || s.track === "all");
      if (matchingSlots.length === 0) return;
      let slotIdx = 0;
      pool.forEach((app) => {
        let attempts = 0;
        while (attempts < matchingSlots.length) {
          const curSlot = matchingSlots[slotIdx % matchingSlots.length];
          if (curSlot.assignedCandidateIds.length < curSlot.maxCapacity) {
            curSlot.assignedCandidateIds.push(app.id);
            slotIdx++;
            break;
          }
          slotIdx++;
          attempts++;
        }
      });
    };

    assignPoolToSlots(fmApps, "freshman_management");
    assignPoolToSlots(umApps, "upperclassmen_management");
    assignPoolToSlots(hcApps, "healthcare");

    saveGroupSlots(slotsCopy);
    showToast(`Auto-balanced ${eligibleApps.length} candidates into Group Interview teams!`, "success");
  };

  const handleExportGroupInterviewsCSV = () => {
    const headers = ["Session Time", "Room", "Track", "Max Capacity", "Assigned Evaluators", "Candidate Name", "Candidate Email", "Candidate Track", "Score"];
    const rows: string[][] = [];

    groupSlots.forEach((slot) => {
      const evaluatorsStr = slot.assignedEvaluators.join("; ");
      if (slot.assignedCandidateIds.length === 0) {
        rows.push([
          `"${slot.timeSlot}"`,
          `"${slot.room}"`,
          `"${slot.track}"`,
          `${slot.maxCapacity}`,
          `"${evaluatorsStr}"`,
          "No Candidates Assigned",
          "",
          "",
          "",
        ]);
      } else {
        slot.assignedCandidateIds.forEach((cId) => {
          const cand = applicants.find((a) => a.id === cId);
          rows.push([
            `"${slot.timeSlot}"`,
            `"${slot.room}"`,
            `"${slot.track}"`,
            `${slot.maxCapacity}`,
            `"${evaluatorsStr}"`,
            `"${cand?.name || "Unknown"}"`,
            `"${cand?.email || ""}"`,
            `"${cand ? getApplicantRubricKey(cand) : ""}"`,
            cand?.score !== undefined ? cand.score.toFixed(1) : "",
          ]);
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BSN_Group_Interviews_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported Group Interviews schedule CSV!", "success");
  };

  const handleUpdateCriterionField = (
    rKey: RubricKey,
    cId: string,
    field: string,
    val: any
  ) => {
    setRubricsState((prev) => {
      const curRubric = prev[rKey] || RUBRICS[rKey];
      const list = getRubricCriteriaList(curRubric, rKey);
      const updatedList = list.map((c) => {
        if (c.id !== cId) return c;

        let updated = { ...c };
        if (field.startsWith("benchmarks.")) {
          const bKey = field.split(".")[1] as "low" | "mid" | "high";
          updated.benchmarks = {
            ...updated.benchmarks,
            [bKey]: val,
          };
        } else if (field === "maxScore") {
          updated.maxScore = Number(val) || 0;
        } else {
          updated = { ...updated, [field]: val };
        }
        return updated;
      });

      return {
        ...prev,
        [rKey]: {
          ...curRubric,
          criteriaList: updatedList,
        },
      };
    });
  };

  const handleUpdateCriterionBenchmarkItem = (
    rKey: RubricKey,
    cId: string,
    bmId: string,
    field: "point" | "guidance",
    val: any
  ) => {
    setRubricsState((prev) => {
      const curRubric = prev[rKey] || RUBRICS[rKey];
      const list = getRubricCriteriaList(curRubric, rKey);
      const updatedList = list.map((c) => {
        if (c.id !== cId) return c;
        const benchmarks = getNormalizedBenchmarks(c);
        const updatedBm = benchmarks.map((bm) =>
          bm.id === bmId
            ? { ...bm, [field]: field === "point" ? Number(val) || 0 : val }
            : bm
        );
        return { ...c, benchmarks: updatedBm };
      });
      return {
        ...prev,
        [rKey]: {
          ...curRubric,
          criteriaList: updatedList,
        },
      };
    });
  };

  const handleAddCriterionBenchmarkItem = (rKey: RubricKey, cId: string) => {
    setRubricsState((prev) => {
      const curRubric = prev[rKey] || RUBRICS[rKey];
      const list = getRubricCriteriaList(curRubric, rKey);
      const updatedList = list.map((c) => {
        if (c.id !== cId) return c;
        const benchmarks = getNormalizedBenchmarks(c);
        const nextPoint = (benchmarks.length > 0 ? Math.max(...benchmarks.map((b) => b.point)) : 0) + 1;
        const newItem: BenchmarkItem = {
          id: `bm_${Date.now()}`,
          point: Math.min(nextPoint, c.maxScore || 5),
          guidance: "Guidance note for this point value...",
        };
        return { ...c, benchmarks: [...benchmarks, newItem] };
      });
      return {
        ...prev,
        [rKey]: {
          ...curRubric,
          criteriaList: updatedList,
        },
      };
    });
  };

  const handleDeleteCriterionBenchmarkItem = (rKey: RubricKey, cId: string, bmId: string) => {
    setRubricsState((prev) => {
      const curRubric = prev[rKey] || RUBRICS[rKey];
      const list = getRubricCriteriaList(curRubric, rKey);
      const updatedList = list.map((c) => {
        if (c.id !== cId) return c;
        const benchmarks = getNormalizedBenchmarks(c);
        if (benchmarks.length <= 1) return c;
        return { ...c, benchmarks: benchmarks.filter((bm) => bm.id !== bmId) };
      });
      return {
        ...prev,
        [rKey]: {
          ...curRubric,
          criteriaList: updatedList,
        },
      };
    });
  };

  const handleAddRubricCategory = (rKey: RubricKey) => {
    setRubricsState((prev) => {
      const curRubric = prev[rKey] || RUBRICS[rKey];
      const list = getRubricCriteriaList(curRubric, rKey);
      const newCatId = `cat_${Date.now()}`;
      const newCat: RubricCriterion = {
        id: newCatId,
        name: `Category #${list.length + 1}`,
        maxScore: 5.0,
        description: "Description and guidance notes for evaluating this category...",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Needs improvement" },
          { id: "b2", point: 3.0, guidance: "3.0 - Meets expectations" },
          { id: "b3", point: 5.0, guidance: "5.0 - Exceeds expectations" },
        ],
      };
      return {
        ...prev,
        [rKey]: {
          ...curRubric,
          criteriaList: [...list, newCat],
        },
      };
    });
  };

  const handleDeleteRubricCategory = (rKey: RubricKey, cId: string) => {
    setRubricsState((prev) => {
      const curRubric = prev[rKey] || RUBRICS[rKey];
      const list = getRubricCriteriaList(curRubric, rKey);
      if (list.length <= 1) return prev;
      return {
        ...prev,
        [rKey]: {
          ...curRubric,
          criteriaList: list.filter((c) => c.id !== cId),
        },
      };
    });
  };

  const handleCopyFreshmanRubricToAll = () => {
    setRubricsState((prev) => {
      const fmRubric = prev.freshman_management || RUBRICS.freshman_management;
      const copiedList = JSON.parse(JSON.stringify(fmRubric.criteriaList || []));

      const updated = {
        ...prev,
        upperclassmen_management: {
          ...prev.upperclassmen_management,
          criteriaList: JSON.parse(JSON.stringify(copiedList)),
        },
        healthcare: {
          ...prev.healthcare,
          criteriaList: JSON.parse(JSON.stringify(copiedList)),
        },
      };

      try {
        localStorage.setItem("bsn_custom_rubrics", JSON.stringify(updated));
      } catch (_) {}

      if (hasSupabaseKeys) {
        try {
          supabase.from("recruitment_settings").upsert({
            setting_key: "custom_rubrics",
            setting_value: updated,
          });
        } catch (_) {}
      }

      return updated;
    });

    showToast("Successfully copied Freshman Management rubric categories & points to Upperclassmen & Healthcare tracks!", "success");
  };

  const handleSaveRubrics = async () => {
    try {
      localStorage.setItem("bsn_custom_rubrics", JSON.stringify(rubricsState));
    } catch (_) {}

    if (hasSupabaseKeys) {
      try {
        await supabase.from("recruitment_settings").upsert({
          setting_key: "custom_rubrics",
          setting_value: rubricsState,
        });
      } catch (_) {}
    }

    setIsEditingRubrics(false);
    showToast("Rubric configurations saved globally!", "success");
  };

  const handleResetRubrics = async () => {
    setRubricsState(RUBRICS);
    try {
      localStorage.removeItem("bsn_custom_rubrics");
    } catch (_) {}

    if (hasSupabaseKeys) {
      try {
        await supabase
          .from("recruitment_settings")
          .delete()
          .eq("setting_key", "custom_rubrics");
      } catch (_) {}
    }

    setIsEditingRubrics(false);
    showToast("Rubrics restored to standard defaults!", "info");
  };

  // Export Coffee Chat candidates and schedule to CSV for Google Sheets
  const handleExportCoffeeChatsCSV = () => {
    const coffeeChatApps = applicants.filter((a) =>
      ["interview", "offered", "completed"].includes(a.status)
    );

    if (coffeeChatApps.length === 0) {
      showToast("No Coffee Chat candidates to export.", "info");
      return;
    }

    const headers = [
      "Candidate Name",
      "Student ID",
      "Email Address",
      "Cohort Track",
      "Scheduling Status",
      "Scheduled Time (Primary)",
      "Fallback Choice",
      "Assigned Table",
      "Evaluation Score",
    ];

    const rows = coffeeChatApps.map((a) => {
      const tableNum =
        tableAssignments[a.id] ||
        a.tableNumber ||
        (a.formResponses && a.formResponses.tableNumber) ||
        "Unassigned";

      return [
        `"${(a.name || "").replace(/"/g, '""')}"`,
        `"${(a.studentId || "").replace(/"/g, '""')}"`,
        `"${(a.email || "").replace(/"/g, '""')}"`,
        `"${(a.cohort || "").replace(/"/g, '""')}"`,
        `"${a.scheduledTime ? "Scheduled" : "Unscheduled Queue"}"`,
        `"${(a.scheduledTime || "Not Scheduled").replace(/"/g, '""')}"`,
        `"${(a.fallbackTime || "None").replace(/"/g, '""')}"`,
        `"${typeof tableNum === "number" ? `Table ${tableNum}` : tableNum}"`,
        `"${a.score !== undefined ? a.score : "N/A"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Bruin_Strategy_Coffee_Chats_Schedule_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${coffeeChatApps.length} candidates to CSV for Google Sheets!`, "success");
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

  // Category-Aware Dual-Grader Round-Robin Distribution (2 Graders Per Applicant)
  const handleRoundRobinDistribute = async () => {
    if (applicants.length === 0) {
      showToast("No applicants available to assign.", "info");
      return;
    }

    // Strictly distribute only to accounts with GRADER role (excludes ADMIN)
    const activeGraders = gradersList.filter((g) => g.role === "GRADER");
    if (activeGraders.length === 0) {
      showToast("No active graders available.", "error");
      return;
    }

    const graderCounts: Record<string, number> = {};
    activeGraders.forEach((g) => {
      graderCounts[g.id] = 0;
    });

    // Track co-grading pair frequencies to ensure maximum diversity across reviewers
    const pairCounts: Record<string, number> = {};
    const getPairKey = (id1: string, id2: string) => [id1, id2].sort().join("-");

    const isHealthTrack = selectedCohort.toLowerCase().includes("health");

    // Pre-seed grader counts and pair frequencies ONLY with completed evaluations so that
    // any work already done by a grader is locked and credited toward their overall load.
    applicants.forEach((app) => {
      const appIsHealth = (app.cohort || "").toLowerCase().includes("health");
      if (isHealthTrack !== appIsHealth) return;

      const completed = (app.assignedGraders || []).filter(
        (ag) => ag.status === "completed" || ag.score !== undefined
      );
      completed.forEach((ag) => {
        if (graderCounts[ag.graderId] !== undefined) {
          graderCounts[ag.graderId]++;
        }
      });
      if (completed.length >= 2) {
        const k = getPairKey(completed[0].graderId, completed[1].graderId);
        pairCounts[k] = (pairCounts[k] || 0) + 1;
      }
    });

    let assignedCount = 0;
    const newAssignmentsToInsert: any[] = [];

    const nextApplicants = applicants.map((app) => {
      const appIsHealth = (app.cohort || "").toLowerCase().includes("health");
      if (isHealthTrack !== appIsHealth) return app;

      // Lock in any grader who has ALREADY completed an evaluation (preserves their score & notes)
      const currentGraders = (app.assignedGraders || []).filter(
        (ag) => ag.status === "completed" || ag.score !== undefined
      );
      if (currentGraders.length >= 2) return app;

      const appPool = getApplicantRubricKey(app);

      const eligibleGraders = activeGraders.filter((g) => {
        const allowed = graderPermissions[g.id] || g.allowedCategories || ["freshman_management", "upperclassmen_management", "healthcare"];
        return allowed.includes(appPool);
      });

      const poolGraders = eligibleGraders.length > 0 ? eligibleGraders : activeGraders;
      const needed = 2 - currentGraders.length;

      for (let i = 0; i < needed; i++) {
        const availableGraders = poolGraders.filter(
          (g) => !currentGraders.some((cg) => cg.graderId === g.id)
        );

        if (availableGraders.length === 0) break;

        // When pairing with Grader 1, prioritize reviewers with whom Grader 1 has co-graded the least,
        // tie-breaking by lowest overall assignment load.
        if (currentGraders.length === 1) {
          const firstGraderId = currentGraders[0].graderId;
          availableGraders.sort((a, b) => {
            const pairCountA = pairCounts[getPairKey(firstGraderId, a.id)] || 0;
            const pairCountB = pairCounts[getPairKey(firstGraderId, b.id)] || 0;
            if (pairCountA !== pairCountB) return pairCountA - pairCountB;
            const loadA = graderCounts[a.id] || 0;
            const loadB = graderCounts[b.id] || 0;
            if (loadA !== loadB) return loadA - loadB;
            return Math.random() - 0.5;
          });
        } else {
          // Slot 1: Pick reviewer with lowest overall workload
          availableGraders.sort((a, b) => {
            const loadA = graderCounts[a.id] || 0;
            const loadB = graderCounts[b.id] || 0;
            if (loadA !== loadB) return loadA - loadB;
            return Math.random() - 0.5;
          });
        }

        const chosenGrader = availableGraders[0];

        currentGraders.push({
          graderId: chosenGrader.id,
          graderName: chosenGrader.name,
          status: "assigned",
        });

        graderCounts[chosenGrader.id] = (graderCounts[chosenGrader.id] || 0) + 1;
        assignedCount++;

        newAssignmentsToInsert.push({
          applicant_id: app.id,
          grader_id: chosenGrader.id,
          status: "assigned",
        });
      }

      // Record the pair formed to ensure future applicants get diverse pairings
      if (currentGraders.length >= 2) {
        const pKey = getPairKey(currentGraders[0].graderId, currentGraders[1].graderId);
        pairCounts[pKey] = (pairCounts[pKey] || 0) + 1;
      }

      const primaryGrader = currentGraders[0];
      const newStatus = currentGraders.length > 0 ? (app.status === "unassigned" ? "assigned" : app.status) : app.status;

      return {
        ...app,
        assignedGraderId: primaryGrader?.graderId,
        assignedGraderName: primaryGrader?.graderName,
        assignedGraders: currentGraders,
        status: newStatus as any,
      };
    });

    setApplicants(nextApplicants);

    if (hasSupabaseKeys && newAssignmentsToInsert.length > 0) {
      try {
        const targetCohortAppIds = applicants
          .filter((app) => isHealthTrack === (app.cohort || "").toLowerCase().includes("health"))
          .map((app) => app.id);

        // 1. Delete ONLY pending/un-graded assignments for this cohort.
        // Completed evaluations (status: "completed") and their scores/notes are 100% preserved!
        const { error: delErr } = await supabase
          .from("assignments")
          .delete()
          .in("applicant_id", targetCohortAppIds)
          .eq("status", "assigned");

        if (delErr) {
          console.error("Error clearing old pending assignments:", delErr);
        }

        // 2. Insert new balanced, diverse assignments in safe batches of 200
        for (let i = 0; i < newAssignmentsToInsert.length; i += 200) {
          const chunk = newAssignmentsToInsert.slice(i, i + 200);
          const { error: insErr } = await supabase.from("assignments").insert(chunk);
          if (insErr) {
            console.error("Error inserting round robin chunk:", insErr);
          }
        }

        // 3. Update status to assigned for previously unassigned candidates
        const assignedIds = Array.from(new Set(newAssignmentsToInsert.map((a) => a.applicant_id)));
        await supabase
          .from("applicants")
          .update({ status: "assigned" })
          .in("id", assignedIds)
          .eq("status", "unassigned");
      } catch (err: any) {
        console.error("Error bulk saving round robin assignments:", err);
      }
    }

    showToast(
      `Round-Robin assigned 2 graders each to eligible candidates (${assignedCount} total assignments)!`,
      "success"
    );
  };

  // Statistical Grader Calibration: One-Click Auto-Equalization (After-the-fact)
  const handleAutoEqualizeGraders = () => {
    // 1. Find all completed evaluations across the pool
    const completedApps = applicants.filter(
      (a) => ["completed", "interview", "group_interview", "offered", "rejected"].includes(a.status) && a.score !== undefined
    );

    if (completedApps.length === 0) {
      showToast("No completed evaluations found yet. Run Auto-Equalize after evaluations have been submitted.", "info");
      return;
    }

    // 2. Compute overall cohort benchmark average score
    const totalPoolScore = completedApps.reduce((acc, a) => acc + (a.score || 0), 0);
    const overallMean = parseFloat((totalPoolScore / completedApps.length).toFixed(2));

    // 3. Compute each grader's specific average score across their graded pool
    const newOffsets: Record<string, number> = {};
    let equalizedCount = 0;

    gradersList.forEach((grader) => {
      const graderApps = applicants.filter((a) => {
        const matchesList = a.assignedGraders && a.assignedGraders.some(
          (ag) => (ag.graderId === grader.id || ag.graderName.toLowerCase() === grader.name.toLowerCase()) && ag.status === "completed" && ag.score !== undefined
        );
        const matchesSingle = (a.assignedGraderId === grader.id || a.assignedGraderName?.toLowerCase() === grader.name.toLowerCase()) && a.score !== undefined;
        return Boolean(matchesList || matchesSingle);
      });

      const scores: number[] = [];
      graderApps.forEach((a) => {
        const match = a.assignedGraders?.find(
          (ag) => (ag.graderId === grader.id || ag.graderName.toLowerCase() === grader.name.toLowerCase()) && ag.status === "completed" && ag.score !== undefined
        );
        if (match?.score !== undefined) {
          scores.push(match.score);
        } else if (a.score !== undefined) {
          scores.push(a.score);
        }
      });

      if (scores.length > 0) {
        const graderAvg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const delta = parseFloat((overallMean - graderAvg).toFixed(1));
        newOffsets[grader.id] = delta;
        newOffsets[grader.name] = delta;
        equalizedCount++;
      } else {
        newOffsets[grader.id] = 0;
        newOffsets[grader.name] = 0;
      }
    });

    setGraderCalibrationOffsets(newOffsets);
    if (typeof window !== "undefined") {
      localStorage.setItem("bsn_grader_calibration_offsets", JSON.stringify(newOffsets));
    }

    showToast(
      `⚡ Auto-equalized ${equalizedCount} reviewers to cohort baseline (${overallMean.toFixed(1)} pts)!`,
      "success"
    );
  };

  const handleResetCalibration = () => {
    setGraderCalibrationOffsets({});
    if (typeof window !== "undefined") {
      localStorage.removeItem("bsn_grader_calibration_offsets");
    }
    showToast("Reset all equalizations to raw scores.", "info");
  };

  const handleUpdateGraderOffset = (graderId: string, graderName: string, delta: number) => {
    setGraderCalibrationOffsets((prev) => {
      const updated = { ...prev, [graderId]: delta, [graderName]: delta };
      if (typeof window !== "undefined") {
        localStorage.setItem("bsn_grader_calibration_offsets", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Manual Assign to Specific Grader Slot (0 = Grader 1, 1 = Grader 2)
  const handleAssignGraderSlot = async (
    applicantId: string,
    slotIndex: 0 | 1,
    graderName: string
  ) => {
    let graderProfile = dbProfiles.find(
      (p) => p.name.toLowerCase() === graderName.toLowerCase()
    );

    if (!graderProfile) {
      graderProfile = dbProfiles.find((p) => p.role === "GRADER") || dbProfiles[0];
      if (!graderProfile) {
        showToast("No board member profiles found in database.", "error");
        return;
      }
      graderName = graderProfile.name;
    }

    if (hasSupabaseKeys) {
      try {
        // Fetch existing assignments sorted by created_at ascending for deterministic slot 0 / slot 1 ordering
        const { data: existingAssignments, error: findError } = await supabase
          .from("assignments")
          .select("id, grader_id, created_at")
          .eq("applicant_id", applicantId)
          .order("created_at", { ascending: true });

        if (findError) throw findError;

        const currentAssignments = existingAssignments || [];

        // Check if grader is already assigned in another slot for this candidate
        const isAlreadyAssignedInOtherSlot = currentAssignments.some(
          (a: any, idx: number) => idx !== slotIndex && a.grader_id === graderProfile.id
        );

        if (isAlreadyAssignedInOtherSlot) {
          showToast(`${graderName} is already assigned to this candidate as Grader ${slotIndex === 0 ? 2 : 1}!`, "warning");
          return;
        }

        const targetAssignment = currentAssignments[slotIndex];

        if (targetAssignment) {
          if (targetAssignment.grader_id !== graderProfile.id) {
            const { error: updateError } = await supabase
              .from("assignments")
              .update({ grader_id: graderProfile.id, status: "assigned" })
              .eq("id", targetAssignment.id);

            if (updateError) throw updateError;
          }
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

        await supabase
          .from("applicants")
          .update({ status: "assigned" })
          .eq("id", applicantId);

        showToast(`Successfully assigned Grader ${slotIndex + 1} to ${graderName}!`, "success");
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase slot assign error:", errMsg, err);
        showToast(`Notice assigning grader: ${errMsg}`, "info");
      }
    } else {
      showToast(`Assigned Grader ${slotIndex + 1} to ${graderName}`, "success");
    }

    setApplicants((prev) =>
      prev.map((app) => {
        if (app.id !== applicantId) return app;

        const currentGraders = [...(app.assignedGraders || [])];
        const gId = graderProfile?.id || `g_${Date.now()}`;
        const newAssignmentInfo: GraderAssignmentInfo = {
          graderId: gId,
          graderName: graderName,
          status: "assigned",
        };

        if (slotIndex === 0) {
          currentGraders[0] = newAssignmentInfo;
        } else {
          if (!currentGraders[0]) {
            currentGraders[0] = { graderId: "", graderName: "Unassigned", status: "assigned" };
          }
          currentGraders[1] = newAssignmentInfo;
        }

        const validNames = currentGraders
          .map((g) => g.graderName)
          .filter((n) => n && n !== "Unassigned");

        return {
          ...app,
          status: "assigned",
          assignedGraders: currentGraders,
          assignedGraderId: currentGraders[0]?.graderId || gId,
          assignedGraderName: validNames.join(" & ") || graderName,
        };
      })
    );
    setAssigningSlotInfo(null);
  };

  // Manual Unassign for Specific Grader Slot (0 = Grader 1, 1 = Grader 2)
  const handleUnassignGraderSlot = async (applicantId: string, slotIndex: 0 | 1) => {
    const applicant = applicants.find((a) => a.id === applicantId);
    const applicantName = applicant ? applicant.name : "Applicant";

    if (hasSupabaseKeys) {
      try {
        const { data: existingAssignments, error: findError } = await supabase
          .from("assignments")
          .select("id, grader_id")
          .eq("applicant_id", applicantId);

        if (findError) throw findError;

        const targetAssignment = existingAssignments ? existingAssignments[slotIndex] : null;

        if (targetAssignment) {
          const { error: deleteError } = await supabase
            .from("assignments")
            .delete()
            .eq("id", targetAssignment.id);

          if (deleteError) throw deleteError;
        }

        const remainingCount = (existingAssignments ? existingAssignments.length : 0) - (targetAssignment ? 1 : 0);

        if (remainingCount <= 0) {
          await supabase
            .from("applicants")
            .update({ status: "unassigned" })
            .eq("id", applicantId);
        }

        showToast(`Unassigned Grader ${slotIndex + 1} for ${applicantName}!`, "info");
      } catch (err: any) {
        console.error("Supabase unassign slot error:", err);
        showToast(`Error unassigning grader: ${err.message}`, "error");
      }
    } else {
      showToast(`Unassigned Grader ${slotIndex + 1} for ${applicantName}`, "info");
    }

    setApplicants((prev) =>
      prev.map((app) => {
        if (app.id !== applicantId) return app;

        const currentGraders = [...(app.assignedGraders || [])];
        if (slotIndex === 0) {
          currentGraders.shift();
        } else if (currentGraders.length > 1) {
          currentGraders.splice(1, 1);
        }

        const validNames = currentGraders
          .map((g) => g.graderName)
          .filter((n) => n && n !== "Unassigned");

        const newStatus = validNames.length === 0 ? "unassigned" : app.status;

        return {
          ...app,
          status: newStatus,
          assignedGraders: currentGraders,
          assignedGraderId: currentGraders[0]?.graderId,
          assignedGraderName: validNames.join(" & ") || undefined,
        };
      })
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
    grades: Record<string, number>,
    notes: string
  ) => {
    console.log("handleSubmitEvaluation received grades:", grades, "notes:", notes);
    const totalScore = parseFloat(
      Object.values(grades).reduce((sum, val) => sum + (Number(val) || 0), 0).toFixed(1)
    );

    const notesWithMetadata = notes && notes.trim()
      ? `${notes.trim()}\n\n[EVAL_GRADES]:${JSON.stringify({ ...grades, _totalScore: totalScore })}`
      : `[EVAL_GRADES]:${JSON.stringify({ ...grades, _totalScore: totalScore })}`;

    if (hasSupabaseKeys) {
      try {
        let { data: assignmentsList, error: assignError } = await supabase
          .from("assignments")
          .select("id, grader_id")
          .eq("applicant_id", applicantId);

        if (assignError) throw assignError;

        let assignment = assignmentsList?.find((a: any) => a.grader_id === currentUser.id);
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

        let { error: evalError } = await supabase
          .from("evaluations")
          .upsert(
            {
              assignment_id: assignmentId,
              total_score: totalScore,
              raw_scores: grades,
              notes: notes.trim(),
            },
            { onConflict: "assignment_id" }
          );

        if (evalError) {
          // Automatic fallback to notes metadata if raw_scores/total_score columns don't exist yet
          const { error: fallbackError } = await supabase
            .from("evaluations")
            .upsert(
              {
                assignment_id: assignmentId,
                notes: notesWithMetadata,
              },
              { onConflict: "assignment_id" }
            );
          if (fallbackError) throw fallbackError;
        }

        // Check if all assigned graders for this applicant have now completed their evaluation
        const { data: allAssignments } = await supabase
          .from("assignments")
          .select("id, status")
          .eq("applicant_id", applicantId);

        const totalAssignments = allAssignments?.length || 2;
        const completedAssignmentsCount = allAssignments?.filter((a: any) => a.status === "completed").length || 1;
        const isFullyGraded = completedAssignmentsCount >= totalAssignments;
        const nextStatus = isFullyGraded ? "completed" : "in_progress";

        const { error: appError } = await supabase
          .from("applicants")
          .update({ status: nextStatus })
          .eq("id", applicantId);

        if (appError) throw appError;

        showToast("Grade successfully updated in Supabase database!", "success");
      } catch (err: any) {
        console.error("Supabase evaluation submission error:", err);
      }
    }

    // Update local state dynamically
    setApplicants((prev) =>
      prev.map((app) => {
        if (app.id !== applicantId) return app;
        const updatedGraders = (app.assignedGraders || []).map((g) => {
          if (g.graderId === currentUser.id || !g.graderId) {
            return { ...g, status: "completed" as const, score: totalScore, grades: grades, notes: notes };
          }
          return g;
        });

        const completedGraders = updatedGraders.filter((g) => g.status === "completed" && g.score !== undefined);
        const isFullyGraded = completedGraders.length >= (updatedGraders.length > 0 ? updatedGraders.length : 2);
        const overallScore = completedGraders.length > 0
          ? parseFloat((completedGraders.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedGraders.length).toFixed(1))
          : totalScore;

        return {
          ...app,
          status: isFullyGraded ? "completed" : "in_progress",
          score: overallScore,
          grades: grades,
          notes: notes,
          assignedGraders: updatedGraders.length > 0 ? updatedGraders : [
            { graderId: currentUser.id, graderName: currentUser.name, status: "completed" as const, score: totalScore, grades: grades, notes: notes }
          ]
        };
      })
    );

    setGradingApplicant(null);
  };

  // Reschedule Applicant timing Block
  const handleRescheduleApplicant = async (
    applicantId: string,
    newTime: string | null
  ) => {
    await handleUpdateScheduledTimes(applicantId, newTime, undefined as any);
    const app = applicants.find((a) => a.id === applicantId);
    showToast(`Rescheduled ${app?.name || "candidate"} to ${newTime || "Unscheduled Queue"}!`, "success");
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

    let formResponsesCopy = { ...(applicant.formResponses || {}) };
    
    // Archive Coffee Chat times
    if (applicant.scheduledTime) {
      formResponsesCopy.coffeeChatScheduledTime = applicant.scheduledTime;
    }
    if (applicant.fallbackTime) {
      formResponsesCopy.coffeeChatFallbackTime = applicant.fallbackTime;
    }

    if (hasSupabaseKeys) {
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
            .update({ fallback_time: null, form_responses: formResponsesCopy })
            .eq("id", id);
        } catch (_) {
          await supabase
            .from("applicants")
            .update({ form_responses: formResponsesCopy })
            .eq("id", id);
        }
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

  const handleUpdateScheduledTimes = async (
    applicantId: string,
    primaryTime: string | null,
    fallbackTime: string | null
  ) => {
    const applicant = applicants.find((a) => a.id === applicantId);
    const existingResponses = applicant?.formResponses || {};
    const effectiveFallback = fallbackTime !== undefined ? fallbackTime : applicant?.fallbackTime || null;

    const isGroup = applicant?.status === "group_interview" || existingResponses?.stageStatus === "group_interview";

    const updatedResponses = { ...existingResponses };
    
    if (isGroup) {
      updatedResponses.stageStatus = "group_interview";
      updatedResponses.groupScheduledTime = primaryTime;
      updatedResponses.groupPrimarySlot = primaryTime;
      updatedResponses.groupFallbackTime = effectiveFallback;
      updatedResponses.groupFallbackSlot = effectiveFallback;
    } else {
      updatedResponses.primarySlot = primaryTime;
      updatedResponses.scheduledTime = primaryTime;
      updatedResponses.coffeeChatScheduledTime = primaryTime;
      updatedResponses.coffeeChatPrimarySlot = primaryTime;
      updatedResponses.fallbackSlot = effectiveFallback;
      updatedResponses.fallbackTime = effectiveFallback;
      updatedResponses.coffeeChatFallbackTime = effectiveFallback;
      updatedResponses.coffeeChatFallbackSlot = effectiveFallback;
    }

    if (hasSupabaseKeys) {
      try {
        const { error: updateErr } = await supabase
          .from("applicants")
          .update({
            scheduled_time: primaryTime,
            fallback_time: effectiveFallback,
            form_responses: updatedResponses,
          })
          .eq("id", applicantId);

        if (updateErr) {
          // Fallback update without fallback_time column if column isn't present
          await supabase
            .from("applicants")
            .update({
              scheduled_time: primaryTime,
              form_responses: updatedResponses,
            })
            .eq("id", applicantId);
        }
      } catch (err: any) {
        console.error("Supabase timing update error:", err);
      }
    }

    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId
          ? { ...app, scheduledTime: primaryTime, fallbackTime: effectiveFallback, formResponses: updatedResponses }
          : app
      )
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === applicantId
        ? { ...prev, scheduledTime: primaryTime, fallbackTime: effectiveFallback, formResponses: updatedResponses }
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

    let formResponsesCopy = { ...(applicant.formResponses || {}) };
    const { scheduledTime: restoredPrimary, fallbackTime: restoredFallback } = getCoffeeChatTimes(
      formResponsesCopy,
      applicant.scheduledTime,
      applicant.fallbackTime
    );

    if (hasSupabaseKeys) {
      try {
        const updateData: any = { status: "interview" };
        if (restoredPrimary) updateData.scheduled_time = restoredPrimary;
        if (restoredFallback) updateData.fallback_time = restoredFallback;
        
        const { error } = await supabase
          .from("applicants")
          .update(updateData)
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        const errMsg = err?.message || err?.details || (typeof err === "object" ? JSON.stringify(err) : String(err));
        console.error("Supabase send interview error:", errMsg, err);
        showToast(`Supabase update notice: ${errMsg}`, "error");
      }
    }

    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "interview", scheduledTime: restoredPrimary || undefined, fallbackTime: restoredFallback || undefined } : app))
    );

    setSelectedApplicantForProfile((prev) =>
      prev && prev.id === id ? { ...prev, status: "interview", scheduledTime: restoredPrimary || undefined, fallbackTime: restoredFallback || undefined } : prev
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

    if (hasSupabaseKeys) {
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

    if (hasSupabaseKeys) {
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

    if (hasSupabaseKeys) {
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

    if (hasSupabaseKeys) {
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

    if (hasSupabaseKeys) {
      try {
        // 1. Find all assignments for this applicant (supporting dual graders)
        const { data: assignmentsList, error: assignError } = await supabase
          .from("assignments")
          .select("id")
          .eq("applicant_id", id);

        if (assignError) throw assignError;

        if (assignmentsList && assignmentsList.length > 0) {
          const assignmentIds = assignmentsList.map((a: any) => a.id);

          // 2. Delete evaluations associated with all assignments for this applicant
          const { error: evalDeleteError } = await supabase
            .from("evaluations")
            .delete()
            .in("assignment_id", assignmentIds);

          if (evalDeleteError) throw evalDeleteError;

          // 3. Reset assignment statuses back to 'assigned'
          const { error: updateAssignError } = await supabase
            .from("assignments")
            .update({ status: "assigned" })
            .in("id", assignmentIds);

          if (updateAssignError) throw updateAssignError;
        }

        // 4. Reset applicant status back to 'assigned' in Supabase
        const { error: appError } = await supabase
          .from("applicants")
          .update({ status: "assigned" })
          .eq("id", id);

        if (appError) throw appError;

        // 5. Update local React state immediately
        setApplicants((prev) =>
          prev.map((app) => {
            if (app.id !== id) return app;
            const resetGraders = (app.assignedGraders || []).map((g) => ({
              ...g,
              status: "assigned" as const,
              score: undefined,
              grades: undefined,
              notes: undefined,
            }));
            return {
              ...app,
              status: "assigned",
              score: undefined,
              grades: undefined,
              assignedGraders: resetGraders,
            };
          })
        );

        showToast(`Successfully ungraded ${applicant.name} in database!`, "success");
      } catch (err: any) {
        console.error("Supabase ungrade error:", err);
        showToast(`Error writing to Supabase: ${err.message || JSON.stringify(err)}`, "error");
        return;
      }
    } else {
      setApplicants((prev) =>
        prev.map((app) => {
          if (app.id !== id) return app;
          const resetGraders = (app.assignedGraders || []).map((g) => ({
            ...g,
            status: "assigned" as const,
            score: undefined,
            grades: undefined,
            notes: undefined,
          }));
          return {
            ...app,
            status: "assigned" as const,
            score: undefined,
            grades: undefined,
            assignedGraders: resetGraders,
          };
        })
      );
      showToast(`Successfully ungraded ${applicant.name}!`, "success");
    }
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
    const isHealthCohort = selectedCohort.toLowerCase().includes("health");
    const cohortApplicants = applicants.filter((a) =>
      isHealthCohort
        ? (a.cohort && a.cohort.toLowerCase().includes("health"))
        : (!a.cohort || !a.cohort.toLowerCase().includes("health"))
    );
    const total = cohortApplicants.length;
    const assigned = cohortApplicants.filter(
      (a) => a.status !== "unassigned"
    ).length;
    const completed = cohortApplicants.filter((a) =>
      ["completed", "interview", "group_interview", "offered", "rejected"].includes(a.status) ||
      (a.score !== undefined && a.score !== null) ||
      (a.assignedGraders && a.assignedGraders.some((g) => g.status === "completed" || g.score !== undefined))
    ).length;
    const interviewInvites = cohortApplicants.filter((a) =>
      ["interview", "group_interview", "offered"].includes(a.status)
    ).length;
    const offered = cohortApplicants.filter((a) => a.status === "offered").length;

    return { total, assigned, completed, offered, interviewInvites };
  }, [applicants, selectedCohort]);

  const currentRubricTotalPoints = useMemo(() => {
    const rub = rubricsState[selectedRubricTab] || RUBRICS[selectedRubricTab];
    return getRubricTotalPoints(rub, selectedRubricTab);
  }, [rubricsState, selectedRubricTab]);

  // Compute dynamic overall cohort average score (Combined across all applicants)
  const overallAverageScore = useMemo(() => {
    const completedApps = applicants.filter(
      (a) =>
        ["completed", "interview", "group_interview", "offered", "rejected"].includes(a.status) &&
        a.score !== undefined
    );
    if (completedApps.length === 0) return 0;
    const total = completedApps.reduce((acc, a) => acc + (a.score || 0), 0);
    return parseFloat((total / completedApps.length).toFixed(1));
  }, [applicants]);

  // Compute dynamic score distribution for custom charts (Combined across all applicants)
  const scoreDistribution = useMemo(() => {
    const completedApps = applicants.filter(
      (a) =>
        ["completed", "interview", "group_interview", "offered", "rejected"].includes(a.status) &&
        a.score !== undefined
    );
    const maxPts = currentRubricTotalPoints || 25.0;
    const exceptional = completedApps.filter((a) => (a.score || 0) >= maxPts * 0.85).length;
    const competitive = completedApps.filter((a) => (a.score || 0) >= maxPts * 0.70 && (a.score || 0) < maxPts * 0.85).length;
    const average = completedApps.filter((a) => (a.score || 0) >= maxPts * 0.50 && (a.score || 0) < maxPts * 0.70).length;
    const needsReview = completedApps.filter((a) => (a.score || 0) < maxPts * 0.50).length;
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
  }, [applicants, currentRubricTotalPoints]);

  // Compute dynamic funnel stats reflecting written evaluation, Coffee Chats, and Group Interviews (Combined across all applicants)
  const funnelStats = useMemo(() => {
    const cohortApps = applicants;

    const total = cohortApps.length || 1;
    const evaluated = cohortApps.filter((a) =>
      ["completed", "interview", "group_interview", "offered", "rejected"].includes(a.status)
    ).length;
    const coffeeChats = cohortApps.filter((a) =>
      ["interview", "group_interview", "offered"].includes(a.status)
    ).length;
    const groupInterviews = cohortApps.filter((a) =>
      ["group_interview", "offered"].includes(a.status)
    ).length;
    const offered = cohortApps.filter((a) => a.status === "offered").length;
    const rejected = cohortApps.filter((a) => a.status === "rejected").length;

    return {
      total: cohortApps.length,
      evaluated,
      coffeeChats,
      groupInterviews,
      offered,
      rejected,
      evaluatedPercent: Math.round((evaluated / total) * 100),
      coffeeChatsPercent: Math.round((coffeeChats / total) * 100),
      groupInterviewsPercent: Math.round((groupInterviews / total) * 100),
      offeredPercent: Math.round((offered / total) * 100),
      // Step-by-step conversion rates
      evalToCoffeePercent: evaluated > 0 ? Math.round((coffeeChats / evaluated) * 100) : 0,
      coffeeToGroupPercent: coffeeChats > 0 ? Math.round((groupInterviews / coffeeChats) * 100) : 0,
      groupToOfferPercent: groupInterviews > 0 ? Math.round((offered / groupInterviews) * 100) : 0,
    };
  }, [applicants]);

  // Stage Breakdown Analytics for Coffee Chats, Group Interviews, Tracks, and Demographics (Combined)
  const stageAnalytics = useMemo(() => {
    const cohortApps = applicants;

    // 1. Coffee Chat metrics
    const coffeeActive = cohortApps.filter((a) => a.status === "interview");
    const coffeeAll = cohortApps.filter((a) => ["interview", "group_interview", "offered"].includes(a.status));
    const coffeeSlot1 = coffeeActive.filter((a) => matchesCoffeeChatSlot(a.scheduledTime, "4:40 - 5:30")).length;
    const coffeeSlot2 = coffeeActive.filter((a) => matchesCoffeeChatSlot(a.scheduledTime, "5:45 - 6:35")).length;
    const coffeeSlot3 = coffeeActive.filter((a) => matchesCoffeeChatSlot(a.scheduledTime, "6:50 - 7:40")).length;
    const coffeeAssigned = coffeeSlot1 + coffeeSlot2 + coffeeSlot3;
    const coffeeUnscheduled = Math.max(0, coffeeActive.length - coffeeAssigned);
    const coffeeFormsSubmitted = coffeeActive.filter((a) => {
      const resp = a.formResponses;
      return !!(resp?.primarySlot || resp?.coffeeChatPrimarySlot || resp?.coffeeChatScheduledTime || resp?.rawPayload);
    }).length;

    // 2. Group Interview metrics
    const groupActive = cohortApps.filter((a) => a.status === "group_interview");
    const groupAll = cohortApps.filter((a) => ["group_interview", "offered"].includes(a.status));
    const groupSlot1 = groupActive.filter((a) => matchesGroupInterviewSlot(a.scheduledTime, "4:40 - 5:25")).length;
    const groupSlot2 = groupActive.filter((a) => matchesGroupInterviewSlot(a.scheduledTime, "5:40 - 6:25")).length;
    const groupSlot3 = groupActive.filter((a) => matchesGroupInterviewSlot(a.scheduledTime, "6:40 - 7:25")).length;
    const groupAssigned = groupSlot1 + groupSlot2 + groupSlot3;
    const groupUnscheduled = Math.max(0, groupActive.length - groupAssigned);
    const groupFormsSubmitted = groupActive.filter((a) => {
      const resp = a.formResponses;
      return !!(resp?.groupPrimarySlot || resp?.groupScheduledTime || resp?.rawGroupPayload);
    }).length;

    // 3. Track Comparison (Management Consulting vs. Healthcare Consulting)
    const mgmtApps = applicants.filter((a) => a.cohort === "Management Consulting");
    const healthApps = applicants.filter((a) => a.cohort === "Healthcare Consulting");

    const computeTrackStats = (trackApps: Applicant[]) => {
      const total = trackApps.length;
      const graded = trackApps.filter((a) => ["completed", "interview", "group_interview", "offered", "rejected"].includes(a.status));
      const scores = graded.filter((a) => a.score !== undefined).map((a) => a.score as number);
      const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
      const coffee = trackApps.filter((a) => a.status === "interview").length;
      const group = trackApps.filter((a) => a.status === "group_interview").length;
      const offered = trackApps.filter((a) => a.status === "offered").length;
      const rejected = trackApps.filter((a) => a.status === "rejected").length;
      return { total, graded: graded.length, avgScore, coffee, group, offered, rejected };
    };

    // 4. Academic Year Demographics
    const totalAppsCount = cohortApps.length || 1;
    const yearCounts = {
      freshman: cohortApps.filter((a) => (a.year || "").toLowerCase().includes("fresh")).length,
      sophomore: cohortApps.filter((a) => (a.year || "").toLowerCase().includes("soph")).length,
      junior: cohortApps.filter((a) => (a.year || "").toLowerCase().includes("jun")).length,
      upperclassman: cohortApps.filter((a) => (a.year || "").toLowerCase().includes("upper") || (a.year || "").toLowerCase().includes("sen")).length,
    };

    return {
      coffeeActiveCount: coffeeActive.length,
      coffeeAllCount: coffeeAll.length,
      coffeeSlot1,
      coffeeSlot2,
      coffeeSlot3,
      coffeeAssigned,
      coffeeUnscheduled,
      coffeeFormsSubmitted,
      coffeeFormRate: coffeeActive.length > 0 ? Math.round((coffeeFormsSubmitted / coffeeActive.length) * 100) : 0,

      groupActiveCount: groupActive.length,
      groupAllCount: groupAll.length,
      groupSlot1,
      groupSlot2,
      groupSlot3,
      groupAssigned,
      groupUnscheduled,
      groupFormsSubmitted,
      groupFormRate: groupActive.length > 0 ? Math.round((groupFormsSubmitted / groupActive.length) * 100) : 0,

      mgmtStats: computeTrackStats(mgmtApps),
      healthStats: computeTrackStats(healthApps),

      yearCounts,
      yearPercentages: {
        freshman: Math.round((yearCounts.freshman / totalAppsCount) * 100),
        sophomore: Math.round((yearCounts.sophomore / totalAppsCount) * 100),
        junior: Math.round((yearCounts.junior / totalAppsCount) * 100),
        upperclassman: Math.round((yearCounts.upperclassman / totalAppsCount) * 100),
      },
    };
  }, [applicants, selectedCohort]);

  // Compute grading statistics per grader dynamically (including average scores & expanded collapsibles)
  const graderAssignments = useMemo(() => {
    return gradersList
      .filter((grader) => grader.role === "GRADER")
      .map((grader) => {
      const assignedApps = applicants.filter((a) => {
        const matchesList = a.assignedGraders && a.assignedGraders.some(
          (ag) => ag.graderId === grader.id || ag.graderName.toLowerCase() === grader.name.toLowerCase()
        );
        const matchesSingle = 
          (a.assignedGraderId && a.assignedGraderId === grader.id) ||
          (a.assignedGraderName && a.assignedGraderName.toLowerCase() === grader.name.toLowerCase());
        return Boolean(matchesList || matchesSingle);
      });

      const gradedList: { applicant: Applicant; score: number }[] = [];
      const pendingList: Applicant[] = [];

      assignedApps.forEach((app) => {
        const agMatch = app.assignedGraders?.find(
          (ag) => ag.graderId === grader.id || ag.graderName.toLowerCase() === grader.name.toLowerCase()
        );
        
        if (agMatch) {
          if (agMatch.status === "completed" && agMatch.score !== undefined) {
            gradedList.push({ applicant: app, score: agMatch.score });
          } else {
            pendingList.push(app);
          }
        } else if (["completed", "interview", "group_interview", "offered", "rejected"].includes(app.status) && app.score !== undefined) {
          gradedList.push({ applicant: app, score: app.score });
        } else {
          pendingList.push(app);
        }
      });

      const completedCount = gradedList.length;
      const assignedCount = assignedApps.length;
      const pendingCount = pendingList.length;
      const completionPercent = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

      const scores = gradedList.map((g) => g.score);
      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      const averageScore = completedCount > 0 ? parseFloat((totalScore / completedCount).toFixed(1)) : null;
      const highestScore = scores.length > 0 ? Math.max(...scores) : null;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : null;

      const offset = graderCalibrationOffsets[grader.id] !== undefined
        ? graderCalibrationOffsets[grader.id]
        : (graderCalibrationOffsets[grader.name] !== undefined ? graderCalibrationOffsets[grader.name] : 0);

      const calibratedAverageScore = averageScore !== null 
        ? parseFloat(Math.max(0, Math.min(25.0, averageScore + offset)).toFixed(1))
        : null;

      const biasSeverity = offset > 0.3 ? "Harsh" : (offset < -0.3 ? "Lenient" : "Balanced");

      return {
        ...grader,
        assignedCount,
        completedCount,
        pendingCount,
        completionPercent,
        averageScore,
        highestScore,
        lowestScore,
        offset,
        calibratedAverageScore,
        biasSeverity,
        gradedApplicants: gradedList.map((g) => g.applicant),
        gradedItems: gradedList,
        pendingApplicants: pendingList,
      };
    });
  }, [gradersList, applicants, graderCalibrationOffsets]);

  // Filter and search applicants
  const filteredApplicants = useMemo(() => {
    return applicants
      .filter((app) => {
        const isHealthTrack = selectedCohort.toLowerCase().includes("health");
        const appIsHealth = (app.cohort || "").toLowerCase().includes("health");
        if (isHealthTrack !== appIsHealth) return false;

        if (userRole === "GRADER" || activeTab === "my_assignments") {
          const isAssignedToUser =
            (app.assignedGraders && app.assignedGraders.some((ag) => ag.graderId === currentUser.id || ag.graderName === currentUser.name)) ||
            app.assignedGraderName === currentUser.name ||
            app.assignedGraderId === currentUser.id;

          if (!isAssignedToUser) return false;

          const userAllowed = graderPermissions[currentUser.id] || ["freshman_management", "upperclassmen_management", "healthcare"];
          const appPool = getApplicantRubricKey(app);
          if (!userAllowed.includes(appPool)) return false;
        }

        if (statusFilter !== "all" && app.status !== statusFilter) return false;

        if (yearFilter !== "all") {
          const isFreshman =
            (app.year && app.year.toLowerCase().includes("freshman")) ||
            (app.cohort && app.cohort.toLowerCase().includes("freshman"));

          if (yearFilter === "freshman" && !isFreshman) return false;
          if (yearFilter === "upperclassman" && isFreshman) return false;
        }

        const matchText = searchQuery.trim().toLowerCase();
        if (
          matchText !== "" &&
          !app.name.toLowerCase().includes(matchText) &&
          !app.email.toLowerCase().includes(matchText) &&
          !(app.studentId && app.studentId.toLowerCase().includes(matchText)) &&
          !(app.scheduledTime && app.scheduledTime.toLowerCase().includes(matchText))
        ) {
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

        const scoreA = getApplicantCalibratedScore(a, isCalibratedView, graderCalibrationOffsets).effectiveScore;
        const scoreB = getApplicantCalibratedScore(b, isCalibratedView, graderCalibrationOffsets).effectiveScore;

        if (scoreA !== undefined && scoreB !== undefined) {
          return scoreB - scoreA;
        }
        if (scoreA !== undefined) return -1;
        if (scoreB !== undefined) return 1;

        return a.name.localeCompare(b.name);
      });
  }, [
    applicants,
    selectedCohort,
    activeTab,
    statusFilter,
    yearFilter,
    searchQuery,
    userRole,
    currentUser,
    isCalibratedView,
    graderCalibrationOffsets,
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
                  Coffee Chats
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
              <>
                <button
                  onClick={() => setActiveTab("rejections")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "rejections"
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                      : "text-slate-655 hover:bg-slate-200/40 hover:text-slate-900"
                  }`}
                >
                  <XCircle className="h-4 w-4 text-rose-500" />
                  Rejected Candidates
                  <span className="ml-auto bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                    {applicants.filter((a) => a.status === "rejected").length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("emails")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "emails"
                      ? "bg-white text-slate-900 border border-slate-200/50 shadow-sm"
                      : "text-slate-600 hover:bg-slate-200/40 hover:text-slate-900"
                  }`}
                >
                  <Mail className="h-4 w-4 text-slate-500" />
                  Email Controls
                </button>
              </>
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
              className="h-10 w-10 rounded-full border border-slate-200 bg-white p-0.5 object-cover shrink-0 shadow-2xs"
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
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200/80 rounded-2xl shadow-xs">
                    {/* Search & Filter tools */}
                    <div className="flex flex-1 items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                      <Search className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search applicants by name, email, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
                      />
                    </div>

                    {/* Filter & Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status Filter */}
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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
                          <option value="interview">☕ Coffee Chat</option>
                          <option value="group_interview">👥 Group Interview</option>
                          <option value="offered">🏆 Offered</option>
                          <option value="rejected">✉️ Rejected</option>
                        </select>
                      </div>

                      {/* Year Filter */}
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                        <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <select
                          value={yearFilter}
                          onChange={(e) => setYearFilter(e.target.value)}
                          className="bg-transparent border-none text-xs text-slate-700 font-bold outline-none cursor-pointer"
                        >
                          <option value="all">All Years</option>
                          <option value="freshman">Freshmen</option>
                          <option value="upperclassman">Upperclassmen</option>
                        </select>
                      </div>

                      {/* Round-Robin Assign */}
                      {userRole === "ADMIN" && (
                        <button
                          onClick={handleRoundRobinDistribute}
                          className="h-[34px] flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200/80 hover:bg-amber-100 px-3.5 text-xs font-bold text-amber-800 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                          title="Distribute 2 graders evenly across all candidates"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                          Round-Robin
                        </button>
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
                            currentUser={currentUser}
                            isCalibratedView={isCalibratedView}
                            graderCalibrationOffsets={graderCalibrationOffsets}
                            onGrade={(id) => {
                              const found = applicants.find((a) => a.id === id);
                              if (found) {
                                setGradingApplicant(found);
                              }
                            }}
                            onView={(id) => {
                              const found = applicants.find((a) => a.id === id);
                              if (found) {
                                setSelectedApplicantForProfile(found);
                              }
                            }}
                            onAssignSlot={(id, slotIdx) => setAssigningSlotInfo({ applicantId: id, slotIndex: slotIdx })}
                            onUnassignSlot={handleUnassignGraderSlot}
                            customRubrics={rubricsState}
                            onSendInterview={handleSendInterview}
                            onAdvanceToGroupInterview={handleAdvanceToGroupInterview}
                            onReturnToCoffeeChat={handleReturnToCoffeeChat}
                            onRescindInterview={handleRescindInterview}
                            onSendOffer={handleSendOffer}
                            onRevokeOffer={handleRevokeOffer}
                            onSendReject={handleSendReject}
                            onUndoRejection={handleUndoRejection}
                            onUngrade={handleUngradeApplicant}
                          />

                          {/* Manual Grader Assignment Dropdown overlay for Slot 1 or Slot 2 */}
                          {assigningSlotInfo && assigningSlotInfo.applicantId === app.id && (
                            <div className="absolute top-12 right-6 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 dark:bg-slate-900 dark:border-slate-800">
                              <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                                  Assign Grader {assigningSlotInfo.slotIndex + 1}
                                </span>
                                <button
                                  onClick={() => setAssigningSlotInfo(null)}
                                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {gradersList.filter((g) => g.role === "GRADER").map((grader) => (
                                  <button
                                    key={grader.id}
                                    onClick={() =>
                                      handleAssignGraderSlot(
                                        assigningSlotInfo.applicantId,
                                        assigningSlotInfo.slotIndex,
                                        grader.name
                                      )
                                    }
                                    className="w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-slate-800 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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
                                
                                <span className="text-slate-500 font-medium">
                                  <span className="font-bold text-slate-700">
                                    {grader.completedCount}
                                  </span>
                                  /{grader.assignedCount} graded
                                </span>
                              </div>

                              {/* Average score indicator */}
                              <div className="flex justify-between items-center text-[10px] text-slate-500">
                                <span>Grading Progress</span>
                                {grader.averageScore !== null ? (
                                  <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                    Avg: {grader.averageScore.toFixed(1)} / {currentRubricTotalPoints.toFixed(0)}
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

                              {/* Grader Category Pool Permissions (Interactive in Admin view) */}
                              <div className="pt-2 border-t border-slate-100 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Allowed Applicant Pools:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    { key: "freshman_management", label: "🎓 Freshman" },
                                    { key: "upperclassmen_management", label: "💼 Upperclassmen" },
                                    { key: "healthcare", label: "❤️ Healthcare" },
                                  ].map((cat) => {
                                    const allowed = graderPermissions[grader.id] || grader.allowedCategories || ["freshman_management", "upperclassmen_management", "healthcare"];
                                    const isPermitted = allowed.includes(cat.key);
                                    return (
                                      <button
                                        key={cat.key}
                                        onClick={() => {
                                          if (userRole === "ADMIN") {
                                            handleToggleGraderCategory(grader.id, cat.key);
                                          }
                                        }}
                                        title={userRole === "ADMIN" ? `Toggle ${cat.label} for ${grader.name}` : undefined}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                                          userRole === "ADMIN" ? "cursor-pointer hover:scale-105" : "cursor-default"
                                        } ${
                                          isPermitted
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60"
                                        }`}
                                      >
                                        {cat.label}
                                      </button>
                                    );
                                  })}
                                </div>
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
                    ☕ Coffee Chats
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fall 2026 Recruitment &bull; 120 Total Candidates (40 per Time Slot &bull; 8 Tables per Slot, 3-6 per table)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportCoffeeChatsCSV}
                    title="Export Schedule to Google Sheets (CSV)"
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Coffee Chat Candidates</span>
                    <span className="text-base font-black text-indigo-700">
                      {applicants.filter((a) => a.status === "interview").length} Candidates
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
                    {applicants.filter((a) => a.status === "interview" && (!a.scheduledTime || (!matchesCoffeeChatSlot(a.scheduledTime, "4:40 - 5:30") && !matchesCoffeeChatSlot(a.scheduledTime, "5:45 - 6:35") && !matchesCoffeeChatSlot(a.scheduledTime, "6:50 - 7:40")))).length} Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {applicants.filter((a) => a.status === "interview" && (!a.scheduledTime || (!matchesCoffeeChatSlot(a.scheduledTime, "4:40 - 5:30") && !matchesCoffeeChatSlot(a.scheduledTime, "5:45 - 6:35") && !matchesCoffeeChatSlot(a.scheduledTime, "6:50 - 7:40")))).length > 0 ? (
                    applicants
                      .filter((a) => a.status === "interview" && (!a.scheduledTime || (!matchesCoffeeChatSlot(a.scheduledTime, "4:40 - 5:30") && !matchesCoffeeChatSlot(a.scheduledTime, "5:45 - 6:35") && !matchesCoffeeChatSlot(a.scheduledTime, "6:50 - 7:40"))))
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

                          <div className="pt-1 border-t border-slate-100 space-y-1">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value === "advance_group_interview") {
                                  handleAdvanceToGroupInterview(app.id);
                                } else if (e.target.value === "rescind_interview") {
                                  handleRescindInterview(app.id);
                                } else if (e.target.value) {
                                  handleRescheduleApplicant(app.id, e.target.value as any);
                                }
                              }}
                              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded px-1.5 py-0.5 outline-none cursor-pointer w-full"
                            >
                              <option value="">Assign Slot / Action...</option>
                              <option value="4:40 - 5:30">4:40 - 5:30</option>
                              <option value="5:45 - 6:35">5:45 - 6:35</option>
                              <option value="6:50 - 7:40">6:50 - 7:40</option>
                              <option value="advance_group_interview">👥 Send to Group Interview</option>
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
                  (a) => a.status === "interview" && matchesCoffeeChatSlot(a.scheduledTime, slot.time)
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
                                          if (val === "advance_group_interview") {
                                            handleAdvanceToGroupInterview(app.id);
                                          } else if (val === "unscheduled") {
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
                                        <option value="advance_group_interview">👥 Send to Group Interview</option>
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
                    👥 Group Interviews
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fall 2026 Recruitment &bull; Group Interview Round 3 Case Study Schedule &bull; 8 Tables per Time Slot
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportCoffeeChatsCSV}
                    title="Export Schedule to Google Sheets (CSV)"
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Group Interview Candidates</span>
                    <span className="text-base font-black text-purple-700">
                      {applicants.filter((a) => a.status === "group_interview").length} Candidates
                    </span>
                  </div>
                </div>
              </div>

              {/* UNSCHEDULED QUEUE */}
              <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <h5 className="text-xs font-bold text-slate-800">
                      Unscheduled Group Interview Candidates (Pending Slot Assignment)
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200 font-mono">
                    {applicants.filter((a) => a.status === "group_interview" && (!a.scheduledTime || (!matchesGroupInterviewSlot(a.scheduledTime, "4:40 - 5:25") && !matchesGroupInterviewSlot(a.scheduledTime, "5:40 - 6:25") && !matchesGroupInterviewSlot(a.scheduledTime, "6:40 - 7:25")))).length} Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {applicants.filter((a) => a.status === "group_interview" && (!a.scheduledTime || (!matchesGroupInterviewSlot(a.scheduledTime, "4:40 - 5:25") && !matchesGroupInterviewSlot(a.scheduledTime, "5:40 - 6:25") && !matchesGroupInterviewSlot(a.scheduledTime, "6:40 - 7:25")))).length > 0 ? (
                    applicants
                      .filter((a) => a.status === "group_interview" && (!a.scheduledTime || (!matchesGroupInterviewSlot(a.scheduledTime, "4:40 - 5:25") && !matchesGroupInterviewSlot(a.scheduledTime, "5:40 - 6:25") && !matchesGroupInterviewSlot(a.scheduledTime, "6:40 - 7:25"))))
                      .map((app) => (
                        <div key={app.id} className="p-2.5 rounded-xl border border-purple-200/60 bg-white shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <h6 className="text-xs font-bold text-slate-800 truncate">{app.name}</h6>
                            {app.cohort.toLowerCase().includes("health") ? (
                              <span className="p-1 rounded-md bg-rose-50 border border-rose-100 shrink-0" title="Healthcare Consulting">
                                <Heart className="h-3 w-3 text-rose-500 fill-rose-500/20" />
                              </span>
                            ) : (
                              <span className="p-1 rounded-md bg-purple-50 border border-purple-100 shrink-0" title="Management Consulting">
                                <Briefcase className="h-3 w-3 text-purple-600" />
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

                          <div className="pt-1 border-t border-slate-100 space-y-1">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value === "return_coffee_chat") {
                                  handleReturnToCoffeeChat(app.id);
                                } else if (e.target.value === "send_offer") {
                                  handleSendOffer(app.id);
                                } else if (e.target.value === "send_reject") {
                                  handleSendReject(app.id);
                                } else if (e.target.value) {
                                  handleRescheduleApplicant(app.id, e.target.value as any);
                                }
                              }}
                              className="text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded px-1.5 py-0.5 outline-none cursor-pointer w-full"
                            >
                              <option value="">Assign Slot / Action...</option>
                              <option value="4:40 - 5:25">4:40 - 5:25</option>
                              <option value="5:40 - 6:25">5:40 - 6:25</option>
                              <option value="6:40 - 7:25">6:40 - 7:25</option>
                              <option value="return_coffee_chat">☕ Move Back to Coffee Chat</option>
                              <option value="send_offer">🏆 Extend Final Offer</option>
                              <option value="send_reject">✉️ Send Rejection</option>
                            </select>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-full py-4 text-center text-slate-500 text-xs italic bg-white/60 rounded-xl border border-purple-100">
                      No pending unscheduled Group Interview candidates.
                    </div>
                  )}
                </div>
              </div>

              {/* 3 TIME SLOT SECTIONS WITH VISUAL TABLE CHUNKING */}
              {[
                { time: "4:40 - 5:25", label: "Slot 1 (4:40 PM - 5:25 PM)", color: "purple" },
                { time: "5:40 - 6:25", label: "Slot 2 (5:40 PM - 6:25 PM)", color: "indigo" },
                { time: "6:40 - 7:25", label: "Slot 3 (6:40 PM - 7:25 PM)", color: "emerald" },
              ].map((slot) => {
                const slotApps = applicants.filter(
                  (a) => a.status === "group_interview" && matchesGroupInterviewSlot(a.scheduledTime, slot.time)
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
                          8 Tables per Slot &bull; Drag & Drop candidates into any Table below
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border font-mono bg-${slot.color}-50 text-${slot.color}-700 border-${slot.color}-200`}>
                        {slotApps.length} Scheduled
                      </span>
                    </div>

                    {/* 8 TABLE CARDS GRID WITH DRAG & DROP SUPPORT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {tables.map(({ tableNumber, tableCandidates }) => {
                        const tableKey = `group-${slot.time}-table-${tableNumber}`;
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
                                ? "border-purple-500 bg-purple-50/80 ring-2 ring-purple-200"
                                : "border-slate-200 bg-white shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-150 pb-1.5 pointer-events-none">
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
                                        ? "opacity-30 border-dashed border-purple-400 bg-purple-50/50"
                                        : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-purple-300"
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
                                        <span className="p-1 rounded-md bg-purple-50 border border-purple-100 shrink-0" title="Management Consulting">
                                          <Briefcase className="h-3 w-3 text-purple-600" />
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
                                          if (val === "return_coffee_chat") {
                                            handleReturnToCoffeeChat(app.id);
                                          } else if (val === "unscheduled") {
                                            handleRescheduleApplicant(app.id, null);
                                          } else if (val) {
                                            handleRescheduleApplicant(app.id, val as any);
                                          }
                                        }}
                                        className="w-full text-[9px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none cursor-pointer truncate"
                                      >
                                        <option value="4:40 - 5:25">4:40 - 5:25</option>
                                        <option value="5:40 - 6:25">5:40 - 6:25</option>
                                        <option value="6:40 - 7:25">6:40 - 7:25</option>
                                        <option value="return_coffee_chat">☕ Return to Coffee Chat</option>
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

          {/* TAB: GLOBAL RUBRIC MANAGER */}
          {activeTab === "rubric_manager" && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    📋 Global Rubric Manager
                  </h3>
                </div>
                {userRole === "ADMIN" && (
                  <div className="flex items-center gap-2">

                    <button
                      onClick={() => setIsEditingRubrics(!isEditingRubrics)}
                      className={`h-9 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        isEditingRubrics
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {isEditingRubrics ? "Cancel Editing" : "✏️ Edit Rubrics"}
                    </button>
                  </div>
                )}
              </div>

              {/* 3-Rubric Segmented Tab Switcher */}
              <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
                {(["freshman_management", "upperclassmen_management", "healthcare"] as RubricKey[]).map((rKey) => {
                  const r = rubricsState[rKey] || RUBRICS[rKey];
                  const isActive = selectedRubricTab === rKey;
                  return (
                    <button
                      key={rKey}
                      onClick={() => setSelectedRubricTab(rKey)}
                      className={`flex-1 min-w-[200px] flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? r.color === "indigo"
                            ? "bg-indigo-50/90 border-indigo-200/90 text-indigo-900 shadow-2xs ring-1 ring-indigo-200/60"
                            : r.color === "amber"
                            ? "bg-amber-50/90 border-amber-200/90 text-amber-900 shadow-2xs ring-1 ring-amber-200/60"
                            : "bg-rose-50/90 border-rose-200/90 text-rose-900 shadow-2xs ring-1 ring-rose-200/60"
                          : "bg-slate-50/60 border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <span className="text-base">{r.iconEmoji}</span>
                        <div>
                          <span className="block font-black text-xs">{r.title}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Rubric Info Card */}
              {(() => {
                const cur = rubricsState[selectedRubricTab] || RUBRICS[selectedRubricTab];
                const criteriaList = getRubricCriteriaList(cur, selectedRubricTab);
                const totalRubricPts = getRubricTotalPoints(cur, selectedRubricTab);

                return (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                            <span>{cur.iconEmoji}</span> {cur.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{cur.subtitle}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-2xs font-mono">
                            Total Rubric Score: {totalRubricPts} Points ({criteriaList.length} Categories)
                          </span>
                          {isEditingRubrics && (
                            <button
                              type="button"
                              onClick={() => handleAddRubricCategory(selectedRubricTab)}
                              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              + Add New Category
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isEditingRubrics && (
                        <div className="pt-2 border-t border-slate-100">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Rubric Title</label>
                          <input
                            type="text"
                            value={cur.title}
                            onChange={(e) =>
                              setRubricsState((prev) => ({
                                ...prev,
                                [selectedRubricTab]: { ...prev[selectedRubricTab], title: e.target.value },
                              }))
                            }
                            className="w-full bg-slate-55 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* 9 Rubric Category Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {criteriaList.map((criterion, idx) => {
                        const calculatedWeightPct = getCriterionPercentage(criterion, cur, selectedRubricTab);
                        const benchmarks = getNormalizedBenchmarks(criterion);
                        const activeBmId = activeRubricBenchmarkPoints[criterion.id] || benchmarks[0]?.id;
                        const activeBmObj = benchmarks.find((b) => b.id === activeBmId) || benchmarks[0];

                        return (
                          <div key={criterion.id || idx} className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-2xs flex flex-col justify-between">
                            {isEditingRubrics ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold text-slate-400">
                                      Category #{idx + 1}
                                    </span>
                                    {criteriaList.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRubricCategory(selectedRubricTab, criterion.id)}
                                        className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
                                        title="Delete Category"
                                      >
                                        ✕ Remove
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200" title="Calculated Weight Percentage (Read-only)">
                                    Weight: {calculatedWeightPct} (Auto)
                                  </span>
                                </div>

                                <div>
                                  <label className="text-[9px] font-bold uppercase text-slate-400 block">Category Name</label>
                                  <input
                                    type="text"
                                    value={criterion.name}
                                    onChange={(e) => handleUpdateCriterionField(selectedRubricTab, criterion.id, "name", e.target.value)}
                                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-bold uppercase text-slate-400 block">Category Points Max</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    step="1"
                                    value={criterion.maxScore}
                                    onChange={(e) => handleUpdateCriterionField(selectedRubricTab, criterion.id, "maxScore", e.target.value)}
                                    className="w-full bg-slate-55 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-black text-indigo-700 outline-none font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="text-[9px] font-bold uppercase text-slate-400 block">Description / Guidance</label>
                                  <textarea
                                    value={criterion.description}
                                    onChange={(e) => handleUpdateCriterionField(selectedRubricTab, criterion.id, "description", e.target.value)}
                                    className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none h-14 resize-none"
                                  />
                                </div>

                                {/* Editable Benchmark Guidance Points */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-bold uppercase text-slate-400 block">Benchmark Guidance Points</label>
                                    <button
                                      type="button"
                                      onClick={() => handleAddCriterionBenchmarkItem(selectedRubricTab, criterion.id)}
                                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                    >
                                      + Add Guidance Point
                                    </button>
                                  </div>

                                  <div className="space-y-2">
                                    {benchmarks.map((bm) => (
                                      <div key={bm.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 w-28">
                                            <span className="text-[9px] font-bold text-slate-400">Pts:</span>
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={bm.point}
                                              onChange={(e) => handleUpdateCriterionBenchmarkItem(selectedRubricTab, criterion.id, bm.id, "point", e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-indigo-700 outline-none"
                                            />
                                          </div>
                                          {benchmarks.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteCriterionBenchmarkItem(selectedRubricTab, criterion.id, bm.id)}
                                              className="text-[10px] text-rose-500 hover:text-rose-700 font-bold px-1"
                                            >
                                              ✕ Remove
                                            </button>
                                          )}
                                        </div>
                                        <input
                                          type="text"
                                          value={bm.guidance}
                                          onChange={(e) => handleUpdateCriterionBenchmarkItem(selectedRubricTab, criterion.id, bm.id, "guidance", e.target.value)}
                                          placeholder="Guidance description..."
                                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 outline-none"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="text-xs font-extrabold text-slate-800">
                                      {idx + 1}. {criterion.name}
                                    </h5>
                                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0 font-mono">
                                      {criterion.maxScore} Pts ({calculatedWeightPct})
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {criterion.description}
                                  </p>
                                </div>

                                {/* Benchmark Guidance View */}
                                <div className="border-t border-slate-100 pt-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase text-slate-400">Benchmark Guidance Points</span>
                                  </div>
                                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                    {benchmarks.map((bm) => {
                                      const isActive = activeBmId === bm.id;
                                      return (
                                        <button
                                          key={bm.id}
                                          type="button"
                                          onClick={() => setActiveRubricBenchmarkPoints((prev) => ({ ...prev, [criterion.id]: bm.id }))}
                                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all border shrink-0 cursor-pointer ${
                                            isActive
                                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                          }`}
                                        >
                                          {bm.point.toFixed(1)} Pts
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {activeBmObj && (
                                    <div className="p-2.5 rounded-xl bg-slate-55 border border-slate-200/80 text-[11px] text-slate-700 leading-relaxed font-sans shadow-2xs">
                                      <strong className="font-bold text-indigo-700">{activeBmObj.point.toFixed(1)} Pts Guidance:</strong> {activeBmObj.guidance}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Rubric Settings Action Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Global Persistence Settings</h4>
                </div>
                {userRole === "ADMIN" ? (
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={handleSaveRubrics}
                      className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 text-xs font-bold text-white transition-colors cursor-pointer shadow-sm"
                    >
                      Save All Changes
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

          {/* TAB: REJECTED CANDIDATES DIRECTORY */}
          {activeTab === "rejections" && userRole === "ADMIN" && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    🚫 Rejected Candidates Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage all rejected candidates, copy email addresses for batch broadcast, or send individual general rejections / autogenerated feedback emails.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyAllRejectedEmails}
                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Copy comma-separated list of all rejected candidate emails to Bcc in your email client"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy All Rejected Emails ({applicants.filter((a) => a.status === "rejected").length})
                  </button>

                  <button
                    onClick={handleExportRejectionsCSV}
                    className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                    title="Export CSV list of all rejected candidates"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Rejected Candidates Table */}
              <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search rejected candidates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none w-64"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    Total Rejected: <span className="font-bold text-slate-800">{applicants.filter((a) => a.status === "rejected").length}</span>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Candidate Name</th>
                        <th className="py-3 px-4">Email Address</th>
                        <th className="py-3 px-4">Track / Cohort</th>
                        <th className="py-3 px-4">Year Level</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium">
                      {applicants
                        .filter((a) => a.status === "rejected")
                        .filter((a) => searchQuery === "" || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {app.name}
                              {app.studentId && <span className="block text-[10px] text-slate-400 font-mono">ID: {app.studentId}</span>}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono">
                              <span className="flex items-center gap-1.5">
                                {app.email}
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(app.email);
                                    showToast(`Copied email for ${app.name}!`, "success");
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5"
                                  title="Copy email"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                                {app.cohort}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{app.year || "--"}</td>
                            <td className="py-3 px-4 font-black text-rose-600">
                              {app.score !== undefined ? `${app.score.toFixed(1)}/${getRubricTotalPoints(rubricsState[getApplicantRubricKey(app)] || RUBRICS[getApplicantRubricKey(app)]).toFixed(0)}` : "--"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setDecisionEmailTarget({ applicant: app, type: "REJECTION" })}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition-all cursor-pointer"
                                  title="Draft General Rejection Email with Feedback Request Form link"
                                >
                                  ✉️ General Rejection
                                </button>

                                <button
                                  onClick={() => setDecisionEmailTarget({ applicant: app, type: "PERSONALIZED_FEEDBACK" })}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200 transition-all cursor-pointer"
                                  title="Draft Detailed Personalized Feedback Email"
                                >
                                  📝 Send Feedback
                                </button>

                                <button
                                  onClick={() => handleUndoRejection(app.id)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] border border-slate-200 transition-all cursor-pointer"
                                  title="Undo Rejection"
                                >
                                  🔄 Undo
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {applicants.filter((a) => a.status === "rejected").length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            No candidates are currently marked as rejected.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EMAIL CONTROLS */}
          {activeTab === "emails" && (
            <div className="space-y-8 max-w-5xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Email Controls
                </h3>
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
                      <span className="text-slate-700 font-semibold">Bruin Strategy Network - Coffee Chat Invitation</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 font-mono text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap">
{`Subject: Bruin Strategy Network - Coffee Chat Invitation

Hi {{applicant_name}},

Congratulations! The Bruin Strategy Network recruitment committee has selected you to move forward to a Coffee Chat.

Please select your preferred time slot using our form:
{{scheduling_link}}

Warm regards,
Bruin Strategy Network Recruitment Committee`}
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
{`Subject: Bruin Strategy Network - Recruitment Update

Hi {{applicant_name}},

Thank you for your interest in Bruin Strategy Network. Due to a record volume of applicants, we cannot offer you advancement.

We wish you the absolute best in your academic goals.

Best,
Bruin Strategy Network Board`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COHORT ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-8 max-w-6xl">
              {/* Header (Combined View Across All Applicants) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2.5">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                    Cohort Analytics & Grader Profiles
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl self-start sm:self-auto border border-slate-200/60">
                  <span>Total Applicants: <strong className="text-indigo-700">{applicants.length}</strong></span>
                  <span className="text-slate-300">•</span>
                  <span>Evaluated: <strong className="text-emerald-700">{funnelStats.evaluated}</strong></span>
                </div>
              </div>

              {/* 5-Card Numerical KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Average Written Score */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 space-y-2 shadow-xs hover:border-indigo-200 transition-all">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    Avg Overall Score
                  </span>
                  <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1">
                    {overallAverageScore}
                    <span className="text-xs font-medium text-slate-400">/{currentRubricTotalPoints.toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Mean score across all graded applicants.
                  </p>
                </div>

                {/* Completed Written Evaluations */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 space-y-2 shadow-xs hover:border-indigo-200 transition-all">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-indigo-500" />
                    Written Evaluations
                  </span>
                  <div className="text-2xl font-black text-indigo-600 flex items-baseline gap-1">
                    {funnelStats.evaluated}
                    <span className="text-xs font-medium text-slate-400">/ {funnelStats.total} ({funnelStats.evaluatedPercent}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded" style={{ width: `${funnelStats.evaluatedPercent}%` }} />
                  </div>
                </div>

                {/* Coffee Chats (Round 1) */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 space-y-2 shadow-xs hover:border-amber-200 transition-all">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <Coffee className="h-3.5 w-3.5 text-amber-600" />
                    ☕ Coffee Chats
                  </span>
                  <div className="text-2xl font-black text-amber-700 flex items-baseline gap-1">
                    {funnelStats.coffeeChats}
                    <span className="text-xs font-medium text-slate-400">({funnelStats.coffeeChatsPercent}% of pool)</span>
                  </div>
                  <p className="text-[10px] text-amber-700/80 font-medium">
                    {stageAnalytics.coffeeActiveCount} currently active in stage
                  </p>
                </div>

                {/* Group Interviews (Round 2) */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 space-y-2 shadow-xs hover:border-emerald-200 transition-all">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    👥 Group Interviews
                  </span>
                  <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1">
                    {funnelStats.groupInterviews}
                    <span className="text-xs font-medium text-slate-400">({funnelStats.groupInterviewsPercent}% of pool)</span>
                  </div>
                  <p className="text-[10px] text-emerald-700/80 font-medium">
                    {stageAnalytics.groupActiveCount} currently active in stage
                  </p>
                </div>

                {/* Final Offers */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 space-y-2 shadow-xs hover:border-violet-200 transition-all">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                    🎉 Final Offers
                  </span>
                  <div className="text-2xl font-black text-violet-700 flex items-baseline gap-1">
                    {funnelStats.offered}
                    <span className="text-xs font-medium text-slate-400">({funnelStats.offeredPercent}% of pool)</span>
                  </div>
                </div>
              </div>

              {/* Reviewer Profiles & Grading Analytics Section */}
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                      Reviewer Profiles & Grading Telemetry
                    </h4>
                  </div>

                  {/* Calibration Action Suite */}
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    {/* Auto-Equalize Action */}
                    <button
                      type="button"
                      onClick={handleAutoEqualizeGraders}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xs transition-all cursor-pointer"
                      title="Automatically calculate real grader averages and equalize all reviewers to the cohort mean"
                    >
                      <Wand2 className="h-3.5 w-3.5 text-white" />
                      ⚡ Auto-Equalize Graders
                    </button>

                    {/* Reset Button */}
                    {isCalibratedView && (
                      <button
                        type="button"
                        onClick={handleResetCalibration}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                        title="Reset all calibration adjustments back to zero"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Reviewer Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {graderAssignments.map((grader) => {
                    const isExpanded = expandedGraderId === grader.id;
                    const isFullyCompleted = grader.assignedCount > 0 && grader.pendingCount === 0;
                    const hasOffset = grader.offset !== 0;

                    return (
                      <div
                        key={grader.id}
                        className={`rounded-3xl border bg-white p-5 space-y-4 shadow-xs transition-all ${
                          isFullyCompleted
                            ? "border-emerald-200/80 hover:border-emerald-300"
                            : "border-slate-200 hover:border-indigo-200"
                        }`}
                      >
                        {/* Grader Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={grader.avatar || "/bruinstrategylogo.jpeg"}
                                alt={grader.name}
                                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                              />
                              {isFullyCompleted && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                                  <CheckCircle className="h-3 w-3" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-sm text-slate-800 leading-tight">
                                {grader.name}
                              </h5>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {grader.role}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                isFullyCompleted
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : grader.completedCount > 0
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {isFullyCompleted
                                ? "All Done"
                                : `${grader.pendingCount} Pending`}
                            </span>

                            {hasOffset && (
                              <span
                                className={`text-[9px] font-extrabold px-2 py-0.2 rounded-md ${
                                  grader.offset > 0.3
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : grader.offset < -0.3
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {grader.offset > 0 ? `+${grader.offset.toFixed(1)}` : grader.offset.toFixed(1)} curve ({grader.biasSeverity})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Evaluation Progress</span>
                            <span className="text-slate-800 font-bold">
                              {grader.completedCount} / {grader.assignedCount} ({grader.completionPercent}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFullyCompleted
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-r from-indigo-500 to-violet-500"
                              }`}
                              style={{ width: `${grader.completionPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {/* Raw Average */}
                          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">Raw Avg</span>
                            <span className="text-sm font-black text-slate-800">
                              {grader.averageScore !== null ? grader.averageScore : "—"}
                            </span>
                          </div>

                          {/* Curve Adjustment Delta */}
                          <div className={`p-2.5 rounded-2xl border ${
                            hasOffset
                              ? grader.offset > 0
                                ? "bg-amber-50/70 border-amber-200 text-amber-900"
                                : "bg-blue-50/70 border-blue-200 text-blue-900"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}>
                            <span className="text-[9px] font-bold block uppercase opacity-80">Curve Offset</span>
                            <span className="text-sm font-black">
                              {grader.offset > 0 ? `+${grader.offset.toFixed(1)}` : grader.offset < 0 ? `${grader.offset.toFixed(1)}` : "0.0"} pts
                            </span>
                          </div>

                          {/* Fair Equalized Average */}
                          <div className="bg-violet-50/70 p-2.5 rounded-2xl border border-violet-200">
                            <span className="text-[9px] font-bold text-violet-700 block uppercase">Fair Avg</span>
                            <span className="text-sm font-black text-violet-900">
                              {grader.calibratedAverageScore !== null ? grader.calibratedAverageScore : "—"}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Graded Candidates Toggle */}
                        {grader.gradedItems && grader.gradedItems.length > 0 && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setExpandedGraderId(isExpanded ? null : grader.id)}
                              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 py-2 px-3 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            >
                              <span>Graded Applicants ({grader.gradedItems.length})</span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>

                            {/* Expanded Candidate Breakdown List */}
                            {isExpanded && (
                              <div className="mt-2.5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {grader.gradedItems.map(({ applicant: app, score }) => {
                                  const raw = score;
                                  const cal = Math.max(0, Math.min(25.0, parseFloat((raw + grader.offset).toFixed(1))));

                                  return (
                                    <div
                                      key={app.id}
                                      onClick={() => setSelectedApplicantForProfile(app)}
                                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-indigo-50/60 border border-slate-150 text-xs transition-colors cursor-pointer"
                                    >
                                      <div className="truncate pr-2">
                                        <span className="font-bold text-slate-800 block truncate">{app.name}</span>
                                        <span className="text-[10px] text-slate-500 truncate block">{app.cohort}</span>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="font-extrabold text-slate-800 text-xs block">
                                          {isCalibratedView ? `${cal.toFixed(1)} pts` : `${raw.toFixed(1)} pts`}
                                        </span>
                                        {isCalibratedView && grader.offset !== 0 && (
                                          <span className="text-[9px] text-slate-400 block">
                                            (Raw: {raw.toFixed(1)})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
          customRubrics={rubricsState}
          currentUser={currentUser}
          onClose={() => setGradingApplicant(null)}
          onSubmitGrade={handleSubmitEvaluation}
        />
      )}

      {/* DETAILED CANDIDATE PROFILE MODAL OVERLAY (WITH INTERVIEW COMMENTS TIMELINE) */}
      {selectedApplicantForProfile && (
        <CandidateProfileModal
          applicant={selectedApplicantForProfile}
          customRubrics={rubricsState}
          currentUser={currentUser}
          isCalibratedView={isCalibratedView}
          graderCalibrationOffsets={graderCalibrationOffsets}
          onClose={() => setSelectedApplicantForProfile(null)}
          onOpenGrading={(app) => {
            setSelectedApplicantForProfile(null);
            setGradingApplicant(app);
          }}
          onAddComment={handleAddInterviewComment}
          onSendInterview={(id) => {
            handleSendInterview(id);
            setSelectedApplicantForProfile(null);
          }}
          onAdvanceToGroupInterview={(id) => {
            handleAdvanceToGroupInterview(id);
            setSelectedApplicantForProfile(null);
          }}
          onReturnToCoffeeChat={(id) => {
            handleReturnToCoffeeChat(id);
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

      {/* ADD GROUP INTERVIEW SESSION ROOM MODAL */}
      {isAddGroupSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                👥 Add Group Interview Session Room
              </h3>
              <button
                onClick={() => setIsAddGroupSlotOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Slot & Date</label>
                <input
                  type="text"
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  placeholder="e.g. Thursday Oct 24, 6:00 PM - 7:15 PM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Room / Building Location</label>
                <input
                  type="text"
                  value={newSlotRoom}
                  onChange={(e) => setNewSlotRoom(e.target.value)}
                  placeholder="e.g. Ackerman Hall 2411"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Track Category</label>
                <select
                  value={newSlotTrack}
                  onChange={(e) => setNewSlotTrack(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="freshman_management">👶 Freshman Management</option>
                  <option value="upperclassmen_management">🎓 Upperclassmen Management</option>
                  <option value="healthcare">🩺 Healthcare Track</option>
                  <option value="all">🌟 All Tracks (Mixed Session)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Candidate Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newSlotCapacity}
                  onChange={(e) => setNewSlotCapacity(parseInt(e.target.value) || 6)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsAddGroupSlotOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGroupSlot}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
