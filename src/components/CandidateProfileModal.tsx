import React, { useState } from "react";
import {
  X,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  Send,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { Applicant, InterviewComment } from "./ApplicantCard";

interface CandidateProfileModalProps {
  applicant: Applicant;
  currentUser: { name: string; email: string; role: string };
  onClose: () => void;
  onAddComment: (applicantId: string, commentText: string, author: string) => void;
}

const getMockEssay = (name: string, cohort: string = "Management Consulting") => {
  let response = "";
  if (name.includes("Jenkins") || name.includes("Sarah")) {
    response = "I am a sophomore Cognitive Science major at UCLA. I am passionate about management consulting, specifically corporate strategy and operations. Having worked as a growth analyst intern, I love structuring ambiguous business problems and look forward to contributing my analytical skills to Bruin Strategy Network.";
  } else if (name.includes("Wang") || name.includes("Jessica")) {
    response = "I'm a sophomore studying Economics and Math at UCLA. I've always been drawn to financial modeling and market entry strategy. With experience in consulting projects and demo days, I'm excited to help clients solve their hardest problems through Bruin Strategy Network.";
  } else if (name.includes("Kim") || name.includes("David")) {
    response = "I am a Cognitive Science student at UCLA. I love analyzing user behavior and economic frameworks. Having worked as an associate consultant on campus, I'm eager to apply structured frameworks to real-world logistics challenges at Bruin Strategy Network.";
  } else if (name.includes("Patel") || name.includes("Ryan")) {
    response = "I'm a sophomore at UCLA majoring in Biology with a minor in Bioinformatics. I'm deeply interested in the intersection of healthcare operations and data analytics. I hope to leverage my quantitative background to solve complex biotech industry cases within Bruin Strategy Network.";
  } else if (name.includes("Lee") || name.includes("Grace")) {
    response = "I am a Cognitive Science major at UCLA with a focus on computing. I have a strong interest in digital health and patient outcomes strategy. I am eager to apply my data analysis skills to healthcare consulting projects at Bruin Strategy Network.";
  } else {
    const area = cohort.toLowerCase().includes("health") ? "healthcare consulting" : "management consulting";
    response = `I am a student at UCLA studying Cognitive Science and Economics. I'm passionate about solving complex operational challenges in ${area}. Having worked on several student-run advisory projects, I hope to apply my strategic thinking and quantitative analysis to Bruin Strategy Network.`;
  }

  const wordCount = response.split(/\s+/).filter(Boolean).length;

  return (
    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
        Application Question: Tell me about yourself.
      </h3>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0 mb-3">
        Word Count: {wordCount} words (Limit: 50 words)
      </p>
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300 italic shadow-sm">
        "{response}"
      </div>
    </div>
  );
};

export default function CandidateProfileModal({
  applicant,
  currentUser,
  onClose,
  onAddComment,
}: CandidateProfileModalProps) {
  const [commentText, setCommentText] = useState("");
  const [zoom, setZoom] = useState(100);

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(applicant.id, commentText, currentUser.name);
    setCommentText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] flex flex-col rounded-3xl border border-slate-200/80 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-650 dark:text-indigo-400">
                <User className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Candidate Profile View
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Overview &amp; Timeline Comments for <span className="font-semibold text-slate-800 dark:text-slate-200">{applicant.name}</span> &bull; ID: <span className="font-mono">{applicant.hashId}</span>
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-150 p-2 text-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 hover:text-slate-655 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - Side-by-Side Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Resume Reader & Essay Box (60% width) */}
          <div className="w-full md:w-3/5 bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800">
            
            {/* Top Half: Resume Reader */}
            <div className="h-1/2 flex flex-col overflow-hidden border-b border-slate-200 dark:border-slate-800">
              <div className="h-11 border-b border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  resume_v1.pdf ({zoom}%)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                  <button
                    onClick={() => setZoom(100)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start bg-slate-100 dark:bg-slate-950">
                <div
                  className="bg-white text-slate-800 shadow-lg rounded-lg w-full max-w-[800px] aspect-[1/1.4] p-10 font-serif border border-slate-200 dark:border-slate-800 transition-all origin-top duration-200"
                  style={{ transform: `scale(${zoom / 100})`, marginBottom: "2rem" }}
                >
                  {/* Simulated Resume */}
                  <div className="h-full flex flex-col justify-between">
                    <div>
                      <div className="text-center border-b-2 border-slate-800 pb-4">
                        <h1 className="text-3xl font-bold tracking-tight uppercase">{applicant.name}</h1>
                        <div className="text-xs font-sans text-slate-500 mt-1.5 flex justify-center gap-4">
                          <span>{applicant.email}</span>
                          <span>&bull;</span>
                          <span>(310) 555-0199</span>
                          <span>&bull;</span>
                          <span>Los Angeles, CA</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h2 className="text-sm font-bold font-sans uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-0.5 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-slate-500 font-sans" /> Education
                        </h2>
                        <div className="mt-2 text-xs">
                          <div className="flex justify-between font-bold">
                            <span>University of California, Los Angeles (UCLA)</span>
                            <span className="font-sans">Expected June 2028</span>
                          </div>
                          <div className="flex justify-between italic">
                            <span>B.S. Cognitive Science, Specialization in Computing</span>
                            <span className="font-sans">GPA: 3.92/4.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h2 className="text-sm font-bold font-sans uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-0.5 flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 text-slate-500 font-sans" /> Experience
                        </h2>
                        <div className="mt-2.5 space-y-3.5 text-xs">
                          <div>
                            <div className="flex justify-between font-bold">
                              <span>Apex Venture Partners &mdash; Growth Analyst Intern</span>
                              <span className="font-sans">June 2025 &ndash; Sept 2025</span>
                            </div>
                            <ul className="list-disc ml-4 mt-1 text-slate-600 font-sans space-y-1">
                              <li>Analyzed B2B SaaS startup pitches; created market sizing models.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-slate-200 pt-3 text-xs text-center font-sans text-slate-400">
                      &bull; End of Resume Document &bull;
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Half: The Essay Box */}
            <div className="h-1/2 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="h-11 border-b border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  Essay Response
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  Personal Statement
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
                {getMockEssay(applicant.name, applicant.cohort)}
              </div>
            </div>

          </div>

          {/* Right Side: Scorecard & Activity Timeline (40% width) */}
          <div className="w-full md:w-2/5 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Scorecard Overview */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 space-y-4 dark:border-slate-800 dark:bg-slate-950/20">
                <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Evaluation Scorecard</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-indigo-650">
                      {applicant.score !== undefined ? applicant.score.toFixed(1) : "--"}
                    </span>
                    <span className="text-xs text-slate-500">/25.0</span>
                  </div>
                </div>

                {applicant.grades ? (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Lead</span>
                      <span className="font-black text-slate-800">{applicant.grades.leadership}/5.0</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Solve</span>
                      <span className="font-black text-slate-800">{applicant.grades.problemSolving}/5.0</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Comm</span>
                      <span className="font-black text-slate-800">{applicant.grades.communication}/5.0</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Essay</span>
                      <span className="font-black text-slate-800">
                        {applicant.grades.essay !== undefined ? `${applicant.grades.essay}/10` : "--"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-450 italic text-center">Unrated</p>
                )}
              </div>

              {/* Status & Grader Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
                  <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-wider">Status</span>
                  <span className="font-black text-slate-700 dark:text-slate-300 capitalize">{applicant.status.replace("_", " ")}</span>
                </div>
                <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
                  <span className="text-slate-400 block font-bold uppercase text-[9px] tracking-wider">Assigned Grader</span>
                  <span className="font-black text-slate-700 dark:text-slate-300">{applicant.assignedGraderName || "Not Assigned"}</span>
                </div>
              </div>

              {/* Scheduled Block */}
              <div className="rounded-xl border border-slate-150 p-3.5 bg-indigo-50/30 flex items-center justify-between dark:border-slate-800 dark:bg-indigo-950/10">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-[10px] uppercase">Interview Timing</span>
                    <span className="text-xs text-slate-655 dark:text-slate-400 font-semibold">
                      {applicant.scheduledTime ? `${applicant.scheduledTime} Block` : "Unscheduled"}
                    </span>
                  </div>
                </div>
                {applicant.scheduledTime && (
                  <span className="text-[9px] font-black bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded uppercase dark:bg-indigo-950 dark:text-indigo-300">
                    Active
                  </span>
                )}
              </div>

              {/* Timeline Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Evaluation Comments Timeline</span>
                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {applicant.interviewComments && applicant.interviewComments.length > 0 ? (
                    applicant.interviewComments.map((comment) => (
                      <div key={comment.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 shadow-sm relative dark:border-slate-800 dark:bg-slate-950/30">
                        <div className="flex justify-between items-center text-[10px] text-slate-450 border-b border-slate-100 pb-1.5 mb-2 dark:border-slate-800/80">
                          <span className="font-black text-slate-655 dark:text-slate-400">{comment.author}</span>
                          <span>{comment.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-655 dark:text-slate-350">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-xs text-slate-450 italic">No interview comments logged yet.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Sticky Comment Editor Footer */}
            <div className="border-t border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <form onSubmit={handleAddCommentSubmit} className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
                  <span className="font-bold text-slate-700">Writing as:</span>
                  <span className="bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded font-black">
                    {currentUser.name} ({currentUser.role})
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <textarea
                    placeholder="Input future interview comments, notes, or reviews..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 resize-none shadow-sm transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="h-12 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm cursor-pointer shrink-0 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
