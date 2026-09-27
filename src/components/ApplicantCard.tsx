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
  Users,
  Scale,
} from "lucide-react";
import {
  RUBRICS,
  getApplicantRubricKey,
  getRubricTotalPoints,
  RubricKey,
  RubricConfig,
} from "@/utils/rubrics";

export interface InterviewComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface GraderAssignmentInfo {
  graderId: string;
  graderName: string;
  status: "assigned" | "completed";
  score?: number;
  grades?: Record<string, number>;
  notes?: string;
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
    | "group_interview"
    | "offered"
    | "rejected";
  score?: number;
  score1?: number;
  score2?: number;
  rank?: number;
  grades?: Record<string, number>;
  hasResume: boolean;
  resumeUrl?: string;
  assignedGraderId?: string;
  assignedGraderName?: string;
  assignedGraders?: GraderAssignmentInfo[];
  scheduledTime?: string | null;
  fallbackTime?: string | null;
  studentId?: string;
  tableNumber?: number;
  formResponses?: any;
  interviewComments?: InterviewComment[];
  shortAnswer?: string;
  major?: string;
  linkedinUrl?: string;
  attendanceCount?: number;
  attendanceEvents?: Array<{
    eventName?: string;
    formTitle?: string;
    submittedAt?: string;
    questions?: string;
    [key: string]: any;
  }>;
}

interface ApplicantCardProps {
  applicant: Applicant;
  isAdmin: boolean;
  isCalibratedView?: boolean;
  graderCalibrationOffsets?: Record<string, number>;
  customRubrics?: Record<RubricKey, RubricConfig>;
  onView: (id: string) => void;
  onAssign?: (id: string) => void;
  onUnassign?: (id: string) => void;
  onAssignSlot?: (applicantId: string, slotIndex: 0 | 1) => void;
  onUnassignSlot?: (applicantId: string, slotIndex: 0 | 1) => void;
  onSendInterview?: (id: string) => void;
  onAdvanceToGroupInterview?: (id: string) => void;
  onReturnToCoffeeChat?: (id: string) => void;
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
  isCalibratedView = false,
  graderCalibrationOffsets = {},
  customRubrics,
  onView,
  onAssign,
  onUnassign,
  onAssignSlot,
  onUnassignSlot,
  onSendInterview,
  onAdvanceToGroupInterview,
  onReturnToCoffeeChat,
  onRescindInterview,
  onSendOffer,
  onRevokeOffer,
  onSendReject,
  onUndoRejection,
  onUngrade,
}: ApplicantCardProps) {
  const activeRubricKey = getApplicantRubricKey(applicant);
  const activeRubric = customRubrics ? customRubrics[activeRubricKey] : RUBRICS[activeRubricKey];
  const maxRubricPoints = getRubricTotalPoints(activeRubric, activeRubricKey);

  const isCalibrated = Boolean(isCalibratedView);
  const offsets = graderCalibrationOffsets || {};

  const graders = applicant.assignedGraders || [];
  const grader1 = graders[0] || (applicant.assignedGraderName ? { graderId: applicant.assignedGraderId || "", graderName: applicant.assignedGraderName, score: applicant.score, status: "completed" as const } : null);
  const grader2 = graders[1] || null;

  const getGraderCalibratedScore = (g: any) => {
    if (!g || g.score === undefined) return undefined;
    if (!isCalibrated) return g.score;
    const offset = offsets[g.graderId] !== undefined ? offsets[g.graderId] : (offsets[g.graderName] !== undefined ? offsets[g.graderName] : 0);
    return Math.max(0, Math.min(maxRubricPoints, parseFloat((g.score + offset).toFixed(1))));
  };

  const getGraderOffset = (g: any) => {
    if (!g || g.score === undefined) return 0;
    return offsets[g.graderId] !== undefined ? offsets[g.graderId] : (offsets[g.graderName] !== undefined ? offsets[g.graderName] : 0);
  };

  const g1Score = getGraderCalibratedScore(grader1);
  const g2Score = getGraderCalibratedScore(grader2);

  const completedScores = [g1Score, g2Score].filter((s): s is number => s !== undefined);
  const displayScore = completedScores.length > 0
    ? parseFloat((completedScores.reduce((a, b) => a + b, 0) / completedScores.length).toFixed(1))
    : applicant.score;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Decorative colored left edge indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all ${
          applicant.status === "completed"
            ? "bg-indigo-500"
            : applicant.status === "interview"
            ? "bg-amber-500"
            : applicant.status === "group_interview"
            ? "bg-purple-500"
            : applicant.status === "offered"
            ? "bg-emerald-500"
            : applicant.status === "rejected"
            ? "bg-rose-500"
            : applicant.status === "in_progress"
            ? "bg-amber-400"
            : "bg-slate-300 dark:bg-slate-700"
        }`}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pl-2">
        {/* Left Side: Applicant Metadata (Clean 2-row layout) */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Row 1: Name, ID, Year, Cohort */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {applicant.name}
            </h3>

            {applicant.studentId && (
              <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                ID: {applicant.studentId}
              </span>
            )}

            {applicant.year && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40">
                🎓 {applicant.year}
              </span>
            )}
          </div>

          {/* Row 2: Dual Graders */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Grader 1 & Grader 2 Explicit Slots */}
            {(() => {
              const g1Offset = getGraderOffset(grader1);
              const g2Offset = getGraderOffset(grader2);

              return (
                <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-800 text-xs shrink-0 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">G1:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {grader1 ? grader1.graderName : "Unassigned"}
                    </span>
                    {grader1?.score !== undefined && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                          isCalibrated && g1Offset !== 0
                            ? "bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300"
                            : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        }`}
                        title={
                          isCalibrated && g1Offset !== 0
                            ? `Raw: ${grader1.score.toFixed(1)} (${g1Offset > 0 ? "+" : ""}${g1Offset.toFixed(1)} curve)`
                            : undefined
                        }
                      >
                        {isCalibrated ? (g1Score?.toFixed(1) || grader1.score.toFixed(1)) : grader1.score.toFixed(1)}
                      </span>
                    )}
                    {isAdmin && (
                      <div className="inline-flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-1.5">
                        <button
                          type="button"
                          onClick={() => onAssignSlot?.(applicant.id, 0)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          {grader1 ? "Edit" : "Assign"}
                        </button>
                        {grader1 && (
                          <button
                            type="button"
                            onClick={() => onUnassignSlot?.(applicant.id, 0)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-slate-300 dark:text-slate-700 font-bold">&bull;</span>

                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">G2:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {grader2 ? grader2.graderName : "Unassigned"}
                    </span>
                    {grader2?.score !== undefined && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                          isCalibrated && g2Offset !== 0
                            ? "bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300"
                            : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        }`}
                        title={
                          isCalibrated && g2Offset !== 0
                            ? `Raw: ${grader2.score.toFixed(1)} (${g2Offset > 0 ? "+" : ""}${g2Offset.toFixed(1)} curve)`
                            : undefined
                        }
                      >
                        {isCalibrated ? (g2Score?.toFixed(1) || grader2.score.toFixed(1)) : grader2.score.toFixed(1)}
                      </span>
                    )}
                    {isAdmin && (
                      <div className="inline-flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-1.5">
                        <button
                          type="button"
                          onClick={() => onAssignSlot?.(applicant.id, 1)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          {grader2 ? "Edit" : "Assign"}
                        </button>
                        {grader2 && (
                          <button
                            type="button"
                            onClick={() => onUnassignSlot?.(applicant.id, 1)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Side: Score, Rank & Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 shrink-0 justify-between lg:justify-end border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
          {/* Score & Rank Group */}
          <div className="flex items-center gap-4">
            {displayScore !== undefined && (
              <div className="text-right">
                <div className="text-xl font-black flex items-baseline justify-end gap-0.5">
                  <span className={isCalibrated ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-slate-100"}>
                    {displayScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">/{maxRubricPoints.toFixed(0)}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isCalibrated ? "⚡ Cal Score" : "Score"}
                </div>
              </div>
            )}

            {applicant.rank && (
              <div className="text-right">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1">
                  <Award className="h-4 w-4 text-amber-500" /> #{applicant.rank}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Rank
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onView(applicant.id)}
              className="flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>

        {/* Action buttons for ADMIN */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Stage 1: File Graded/Completed -> Send to Coffee Chat */}
            {["completed", "assigned", "in_progress"].includes(applicant.status) && onSendInterview && (
              <button
                onClick={() => onSendInterview(applicant.id)}
                className="flex h-8 items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                title="Send to Coffee Chat Stage"
              >
                <Calendar className="h-3.5 w-3.5" />
                Send to Coffee Chat
              </button>
            )}

            {/* Stage 2: In Coffee Chat -> Advance to Group Interview OR Rescind to Graded */}
            {applicant.status === "interview" && (
              <>
                {onAdvanceToGroupInterview && (
                  <button
                    onClick={() => onAdvanceToGroupInterview(applicant.id)}
                    className="flex h-8 items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 px-3 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
                    title="Advance to Group Interview Stage"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Send to Group Interview
                  </button>
                )}
                {onRescindInterview && (
                  <button
                    onClick={() => onRescindInterview(applicant.id)}
                    className="flex h-8 items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-2.5 text-xs font-semibold text-amber-700 transition-colors cursor-pointer"
                    title="Rescind Coffee Chat offer and return to graded status"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Rescind Coffee Chat
                  </button>
                )}
              </>
            )}

            {/* Stage 3: In Group Interview -> Send Final Offer, Reject, OR Return to Coffee Chat */}
            {applicant.status === "group_interview" && (
              <>
                {onSendOffer && (
                  <button
                    onClick={() => onSendOffer(applicant.id)}
                    className="flex h-8 items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
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
                {onReturnToCoffeeChat && (
                  <button
                    onClick={() => onReturnToCoffeeChat(applicant.id)}
                    className="flex h-8 items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 px-2.5 text-xs font-semibold text-purple-700 transition-colors cursor-pointer"
                    title="Return candidate to Coffee Chat stage"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Return to Coffee Chat
                  </button>
                )}
              </>
            )}

            {/* Stage 4: Offered -> Revoke Offer */}
            {applicant.status === "offered" && onRevokeOffer && (
              <button
                onClick={() => onRevokeOffer(applicant.id)}
                className="flex h-8 items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-2.5 text-xs font-semibold text-amber-700 transition-colors cursor-pointer"
                title="Revoke offer and return to graded status"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Revoke Offer
              </button>
            )}

            {/* Stage 5: Rejected -> Undo Rejection */}
            {applicant.status === "rejected" && onUndoRejection && (
              <button
                onClick={() => onUndoRejection(applicant.id)}
                className="flex h-8 items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 text-xs font-bold text-indigo-700 transition-colors cursor-pointer shadow-xs"
                title="Undo rejection"
              >
                <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
                Undo Rejection
              </button>
            )}
          </div>
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
      </div>
    </div>
  );
}
