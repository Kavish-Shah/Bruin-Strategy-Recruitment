import React from "react";
import {
  FileText,
  UserPlus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  RotateCcw,
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
  status:
    | "unassigned"
    | "assigned"
    | "in_progress"
    | "completed"
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
  assignedGraderName?: string;
  scheduledTime?: "09:00 AM" | "10:30 AM" | null;
  interviewComments?: InterviewComment[];
}

interface ApplicantCardProps {
  applicant: Applicant;
  isAdmin: boolean;
  onView: (id: string) => void;
  onAssign?: (id: string) => void;
  onSendOffer?: (id: string) => void;
  onSendReject?: (id: string) => void;
  onUngrade?: (id: string) => void;
}

export default function ApplicantCard({
  applicant,
  isAdmin,
  onView,
  onAssign,
  onSendOffer,
  onSendReject,
  onUngrade,
}: ApplicantCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "in_progress":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "assigned":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "offered":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/10";
    }
  };

  const formattedStatus = applicant.status.replace("_", " ");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm transition-all duration-300 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-slate-700 backdrop-blur-md">
      {/* Decorative colored left edge depending on status */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
          applicant.status === "completed"
            ? "bg-emerald-500"
            : applicant.status === "in_progress"
            ? "bg-amber-500"
            : applicant.status === "offered"
            ? "bg-purple-500"
            : applicant.status === "rejected"
            ? "bg-rose-500"
            : applicant.status === "assigned"
            ? "bg-blue-500"
            : "bg-slate-300 dark:bg-slate-700"
        }`}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Applicant Info */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {applicant.name}
            </h3>
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
              #{applicant.hashId}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {applicant.cohort}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${getStatusStyle(
                applicant.status
              )}`}
            >
              {formattedStatus}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {applicant.submissionDate}
            </span>
            {applicant.hasResume && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <FileText className="h-3.5 w-3.5" />
                Resume.pdf
              </span>
            )}
            {applicant.assignedGraderName && (
              <span className="rounded-md bg-blue-500/5 px-2 py-0.5 text-slate-500 dark:text-slate-400">
                Grader: <span className="font-medium text-slate-700 dark:text-slate-300">{applicant.assignedGraderName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Score, Rank & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0 lg:justify-end">
          {/* Score & Rank Group */}
          <div className="flex items-center gap-6">
            {/* Score Display */}
            <div className="text-right">
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {applicant.score !== undefined ? applicant.score.toFixed(1) : "--"}
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                  /25
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                Score <TrendingUp className="h-3 w-3" />
              </div>
            </div>

            {applicant.rank && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-2xl font-black text-slate-800 dark:text-slate-100">
                  <Award className="h-5 w-5 text-amber-500" /> #{applicant.rank}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Cohort Rank
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(applicant.id)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>

            {isAdmin && applicant.status === "unassigned" && onAssign && (
              <button
                onClick={() => onAssign(applicant.id)}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Assign
              </button>
            )}

            {isAdmin &&
              applicant.status === "completed" &&
              onSendOffer &&
              onSendReject && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSendReject(applicant.id)}
                    className="flex h-9 items-center gap-1 rounded-xl bg-slate-100 hover:bg-rose-50 px-3.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => onSendOffer(applicant.id)}
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Send Offer
                  </button>
                </div>
              )}

            {applicant.status === "offered" && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-50 px-3.5 text-xs font-bold text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-950">
                Offer Sent
              </span>
            )}

            {applicant.status === "rejected" && (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-500 dark:bg-slate-950/20 dark:text-slate-400 border border-slate-100 dark:border-slate-900">
                Rejected
              </span>
            )}

            {isAdmin &&
              ["completed", "offered", "rejected"].includes(applicant.status) &&
              onUngrade && (
                <button
                  onClick={() => onUngrade(applicant.id)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3.5 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                  title="Wipe score and send back to grader's feed to regrade"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Ungrade
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
