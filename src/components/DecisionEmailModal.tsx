import React, { useState, useMemo } from "react";
import { X, Copy, Check, Mail, Sparkles, Send, FileText } from "lucide-react";
import { Applicant } from "./ApplicantCard";

interface DecisionEmailModalProps {
  applicant: Applicant;
  type: "REJECTION" | "OFFER" | "INTERVIEW" | "PERSONALIZED_FEEDBACK";
  onClose: () => void;
  onConfirm: (id: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function DecisionEmailModal({
  applicant,
  type,
  onClose,
  onConfirm,
  showToast,
}: DecisionEmailModalProps) {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  // Generate dynamic feedback line based on candidate's lowest ranked evaluation score (averaging dual graders)
  const lowestFeedbackInfo = useMemo(() => {
    let leadership = applicant.grades?.leadership;
    let problemSolving = applicant.grades?.problemSolving;
    let communication = applicant.grades?.communication;
    let essay = applicant.grades?.essay;

    // Aggregate from assignedGraders if available
    if (applicant.assignedGraders && applicant.assignedGraders.length > 0) {
      const completedWithGrades = applicant.assignedGraders.filter(
        (g) => g.status === "completed" && g.grades
      );

      if (completedWithGrades.length > 0) {
        const leadSum = completedWithGrades.reduce((acc, g) => acc + (g.grades?.leadership || 0), 0);
        const solveSum = completedWithGrades.reduce((acc, g) => acc + (g.grades?.problemSolving || 0), 0);
        const commSum = completedWithGrades.reduce((acc, g) => acc + (g.grades?.communication || 0), 0);
        const essaySum = completedWithGrades.reduce((acc, g) => acc + (g.grades?.essay || 0), 0);

        leadership = leadSum / completedWithGrades.length;
        problemSolving = solveSum / completedWithGrades.length;
        communication = commSum / completedWithGrades.length;
        essay = essaySum / completedWithGrades.length;
      }
    }

    if (leadership === undefined || problemSolving === undefined || communication === undefined) {
      return {
        categoryLabel: "Overall Application Cohort Cutoff",
        lowestScore: null,
        feedback:
          "Due to an exceptionally high volume of competitive applications this quarter, we were unable to advance your candidate profile to the interview stage.",
      };
    }

    const scores = [
      {
        key: "problemSolving",
        label: "Quantitative & Analytical Problem Solving",
        score: problemSolving,
        ratio: problemSolving / 5.0,
        feedback:
          "Our evaluation panel noted that while your background is impressive, we encourage you to further strengthen your quantitative problem-solving and structured analytical case breakdown for future recruitment cycles.",
      },
      {
        key: "leadership",
        label: "Leadership Impact & Project Ownership",
        score: leadership,
        ratio: leadership / 5.0,
        feedback:
          "While your overall profile shows promise, our review panel recommends focusing on highlighting tangible project ownership, team initiative, and quantifiable leadership impact in future applications.",
      },
      {
        key: "communication",
        label: "Communication & Synthesis",
        score: communication,
        ratio: communication / 5.0,
        feedback:
          "Our reviewers recommend continuing to refine structured verbal & written communication, executive presentation delivery, and concise synthesis of key insights.",
      },
      {
        key: "essay",
        label: "Written Short Answer Response",
        score: essay || 0,
        ratio: (essay || 0) / 10.0,
        feedback:
          "While your qualifications are notable, our team felt your short-answer essay response could have provided deeper specific alignment with Bruin Strategy Network's client deliverables and team mission.",
      },
    ];

    // Sort ascending by ratio (relative percentage of max score)
    scores.sort((a, b) => a.ratio - b.ratio);
    const lowest = scores[0];

    return {
      categoryLabel: lowest.label,
      lowestScore: lowest.score,
      feedback: lowest.feedback,
    };
  }, [applicant]);

  // Pre-filled Email Subject Line
  const initialSubject = useMemo(() => {
    if (type === "REJECTION") {
      return `Bruin Strategy Network Recruitment Update - ${applicant.name}`;
    } else if (type === "PERSONALIZED_FEEDBACK") {
      return `Bruin Strategy Network - Application Feedback for ${applicant.name}`;
    } else if (type === "OFFER") {
      return `Congratulations! Offer from Bruin Strategy Network - ${applicant.name}`;
    } else {
      return `Invitation to Coffee Chat / Interview - Bruin Strategy Network (${applicant.name})`;
    }
  }, [applicant, type]);

  const [googleFormUrl, setGoogleFormUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bsn_interview_form_url") || "https://forms.gle/bruin-strategy-network-interview-slots";
    }
    return "https://forms.gle/bruin-strategy-network-interview-slots";
  });

  const [feedbackFormUrl, setFeedbackFormUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bsn_feedback_form_url") || "https://forms.gle/bsn-feedback-request";
    }
    return "https://forms.gle/bsn-feedback-request";
  });

  // Pre-filled Email Body Text
  const initialBody = useMemo(() => {
    if (type === "REJECTION") {
      return `Dear ${applicant.name},

Thank you so much for taking the time to apply to Bruin Strategy Network. We truly appreciate the effort and thought you put into your application.

After a thorough review by our evaluation panel, we regret to inform you that we are unable to advance your application to the interview stage for this recruitment cycle. Due to a record volume of competitive applicants, our selection process was exceptionally selective.

If you would like to receive personalized evaluation feedback from our grading committee, please fill out our Feedback Request Form below:
${feedbackFormUrl}

We know how much time and energy goes into student organization recruitment, and we strongly encourage you to re-apply in our upcoming recruitment cycle. 

We wish you the very best in all your future academic and professional endeavors at UCLA!

Warm regards,
Bruin Strategy Network Executive Board
UCLA | bruinstrategy.org`;
    } else if (type === "PERSONALIZED_FEEDBACK") {
      return `Dear ${applicant.name},

Thank you for requesting personalized feedback on your Bruin Strategy Network application for the ${applicant.cohort} track.

Constructive Feedback from Your Evaluation Committee:
${lowestFeedbackInfo.feedback}

We hope this guidance is helpful for your future growth and upcoming recruitment cycles!

Warm regards,
Bruin Strategy Network Executive Board`;
    } else if (type === "OFFER") {
      return `Dear ${applicant.name},

On behalf of the Bruin Strategy Network Executive Board, we are thrilled to extend you an offer to join BSN for the ${applicant.cohort} cohort!

Your application demonstrated exceptional analytical rigor, leadership potential, and alignment with our mission.

Please reply to this email by Sunday at 11:59 PM PST to confirm your acceptance of this offer.

Congratulations again, and welcome to Bruin Strategy Network!

Best regards,
Bruin Strategy Network Executive Board`;
    } else {
      return `Dear ${applicant.name},

We are pleased to inform you that you have been selected for a Coffee Chat with Bruin Strategy Network for the ${applicant.cohort} track!

Please fill out our Interview Slot Preference Form to select your preferred primary time slot and your secondary fallback time slot:
${googleFormUrl}

We look forward to meeting you soon!

Best regards,
Bruin Strategy Network Executive Board`;
    }
  }, [applicant, type, lowestFeedbackInfo, googleFormUrl, feedbackFormUrl]);

  const [subjectText, setSubjectText] = useState(initialSubject);
  const [bodyText, setBodyText] = useState(initialBody);

  const handleUpdateFormUrl = (newUrl: string) => {
    setGoogleFormUrl(newUrl);
    if (typeof window !== "undefined") {
      localStorage.setItem("bsn_interview_form_url", newUrl);
    }
    setBodyText((prev) => {
      return prev.replace(/https:\/\/forms\.gle\/[^\s]+/g, newUrl);
    });
    showToast("Updated Interview Form URL!", "success");
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(subjectText);
    setCopiedSubject(true);
    showToast("Email Subject copied to clipboard!", "success");
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(bodyText);
    setCopiedBody(true);
    showToast("Email Body copied to clipboard!", "success");
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleConfirmAndMark = () => {
    navigator.clipboard.writeText(bodyText);
    onConfirm(applicant.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 dark:bg-slate-950 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                type === "REJECTION"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : type === "OFFER"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              }`}
            >
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Draft Customized {type === "REJECTION" ? "Rejection" : type === "OFFER" ? "Offer" : "Interview"} Email
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                To: <span className="font-semibold text-slate-700 dark:text-slate-300">{applicant.name}</span> ({applicant.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Google Form Link Manager Bar (Only visible for Interview Emails) */}
        {type === "INTERVIEW" && (
          <div className="bg-indigo-50/60 border-b border-indigo-100 p-3 px-6 dark:bg-indigo-950/20 dark:border-indigo-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 shrink-0">
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                Google Form Scheduling URL:
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={googleFormUrl}
                  onChange={(e) => handleUpdateFormUrl(e.target.value)}
                  placeholder="https://forms.gle/..."
                  className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Dynamic Lowest Score Feedback Badge */}
          {type === "REJECTION" && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Auto-Extracted Lowest Score Feedback Category
                </span>
                {lowestFeedbackInfo.lowestScore !== null && (
                  <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md font-mono text-[11px]">
                    Score: {lowestFeedbackInfo.lowestScore}/5
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 font-medium">
                <span className="font-bold underline">{lowestFeedbackInfo.categoryLabel}:</span> {lowestFeedbackInfo.feedback}
              </p>
            </div>
          )}

          {/* Subject Line Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Email Subject
              </label>
              <button
                type="button"
                onClick={handleCopySubject}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                {copiedSubject ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied Subject!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Subject</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={subjectText}
              onChange={(e) => setSubjectText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email Body Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Email Body Text (Copy &amp; Pasteable)
              </label>
              <button
                type="button"
                onClick={handleCopyBody}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                {copiedBody ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied Body!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Email Body</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={11}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50 dark:bg-slate-950 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyBody}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-indigo-600" />
              Copy Body Only
            </button>
            
            <button
              type="button"
              onClick={handleConfirmAndMark}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
                type === "REJECTION"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  : type === "OFFER"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
              }`}
            >
              <Check className="h-4 w-4" />
              Copy Text &amp; Mark as {type === "REJECTION" ? "Rejected" : type === "OFFER" ? "Offered" : "Interviewing"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
