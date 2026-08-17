import React from "react";
import {
  FileText,
  UserPlus,
  UserMinus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Calendar,
} from "lucide-react";

export interface InterviewComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  hashId: string;
  submissionDate: string;
  cohort: string;
  year?: string;
  status:
    | "unassigned"
    | "assigned"
    | "in_progress"
    | "completed"
    | "interview"
    | "offered"
    | "rejected";
  score?: number;
  rank?: number;
  grades?: {
    leadership: number;
    problemSolving: number;
    communication: number;
    essay?: number;
  };
  hasResume: boolean;
  resumeUrl?: string;
  assignedGraderId?: string;
  assignedGraderName?: string;
  scheduledTime?: string | null;
  fallbackTime?: string | null;
  studentId?: string;
  tableNumber?: number;
  formResponses?: any;
  interviewComments?: InterviewComment[];
  shortAnswer?: string;
}

interface ApplicantCardProps {
  applicant: Applicant;
  isAdmin: boolean;
  onView: (id: string) => void;
  onAssign?: (id: string) => void;
  onUnassign?: (id: string) => void;
  onSendInterview?: (id: string) => void;
  onRescindInterview?: (id: string) => void;
  onSendOffer?: (id: string) => void;
  onRevokeOffer?: (id: string) => void;
  onSendReject?: (id: string) => void;
  onUndoRejection?: (id: string) => void;
  onUngrade?: (id: string) => void;
}

export default function ApplicantCard({
  applicant,
  isAdmin,
  onView,
  onAssign,
  onUnassign,
  onSendInterview,
  onRescindInterview,
  onSendOffer,
  onRevokeOffer,
  onSendReject,
  onUndoRejection,
  onUngrade,
}: ApplicantCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold";
      case "interview":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 font-bold";
      case "in_progress":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "assigned":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "offered":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 font-bold";
      case "rejected":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    }
  };

  const formattedStatus = applicant.status.replace("_", " ");

  return (
    <div className="group relative flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all">
      {/* Left Side: Applicant Info & Integrated Score Badges */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 shrink-0">
          {applicant.name}
        </h3>

        {applicant.studentId && (
          <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
            ID: {applicant.studentId}
          </span>
        )}

        {applicant.year && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40 shrink-0">
            🎓 {applicant.year}
          </span>
        )}

        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize shrink-0 ${getStatusStyle(
            applicant.status
          )}`}
        >
          {formattedStatus}
        </span>

        {/* Score & Rank Badges - Integrated inline so they NEVER overlap */}
        {applicant.score !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0">
            <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Score: {applicant.score.toFixed(1)}/25
          </span>
        )}

        {applicant.rank && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
            <Award className="h-3 w-3 text-amber-500" /> #{applicant.rank}
          </span>
        )}

        {applicant.assignedGraderName && (
          <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400 font-semibold shrink-0">
            Grader: {applicant.assignedGraderName}
          </span>
        )}

        {applicant.scheduledTime && (
          <span className="rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold px-2 py-0.5 text-xs flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" /> Slot: {applicant.scheduledTime}
          </span>
        )}

        {applicant.fallbackTime && (
          <span className="rounded-md bg-amber-100 text-amber-850 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 text-xs flex items-center gap-1 border border-amber-200 shrink-0">
            <RotateCcw className="h-3 w-3" /> Fallback: {applicant.fallbackTime}
          </span>
        )}
      </div>

      {/* Right Side: Action Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
        <button
          onClick={() => onView(applicant.id)}
          className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>

        {isAdmin && applicant.status === "unassigned" && onAssign && (
          <button
            onClick={() => onAssign(applicant.id)}
            className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 text-blue-600" />
            Assign
          </button>
        )}

        {isAdmin && (applicant.status === "assigned" || applicant.assignedGraderName) && onUnassign && (
          <button
            onClick={() => onUnassign(applicant.id)}
            className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            title="Unassign grader"
          >
            <UserMinus className="h-3.5 w-3.5 text-rose-500" />
            Unassign
          </button>
        )}

        {isAdmin &&
          !["interview", "offered", "rejected"].includes(applicant.status) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {onSendInterview && applicant.status !== "interview" && (
                <button
                  onClick={() => onSendInterview(applicant.id)}
                  className="flex h-8 items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                  title="Send Interview Invitation"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Send to Interview
                </button>
              )}
              {onSendOffer && (
                <button
                  onClick={() => onSendOffer(applicant.id)}
                  className="flex h-8 items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Send Offer
                </button>
              )}
              {onSendReject && (
                <button
                  onClick={() => onSendReject(applicant.id)}
                  className="flex h-8 items-center gap-1 rounded-xl bg-slate-100 hover:bg-rose-50 px-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:bg-slate-800 transition-colors cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              )}
            </div>
          )}

        {applicant.status === "interview" && isAdmin && onRescindInterview && (
          <button
            onClick={() => onRescindInterview(applicant.id)}
            className="flex h-8 items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-2.5 text-xs font-semibold text-amber-700 transition-colors cursor-pointer"
            title="Rescind interview offer and return to graded status"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Rescind Interview Offer
          </button>
        )}

        {applicant.status === "offered" && isAdmin && onRevokeOffer && (
          <button
            onClick={() => onRevokeOffer(applicant.id)}
            className="flex h-8 items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-2.5 text-xs font-semibold text-amber-700 transition-colors cursor-pointer"
            title="Revoke offer and return to graded status"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Revoke Offer
          </button>
        )}

        {applicant.status === "rejected" && isAdmin && onUndoRejection && (
          <button
            onClick={() => onUndoRejection(applicant.id)}
            className="flex h-8 items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 text-xs font-bold text-indigo-700 transition-colors cursor-pointer shadow-xs"
            title="Undo rejection"
          >
            <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
            Undo Rejection
          </button>
        )}

        {isAdmin &&
          ["completed", "interview", "offered", "rejected"].includes(applicant.status) &&
          onUngrade && (
            <button
              onClick={() => onUngrade(applicant.id)}
              className="flex h-8 items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-2.5 text-xs font-semibold text-amber-700 transition-colors cursor-pointer"
              title="Ungrade applicant"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ungrade
            </button>
          )}
      </div>
    </div>
  );
}
