import React, { useState } from "react";
import {
  X,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  AlertCircle,
  BookOpen,
  Briefcase,
  Layers,
} from "lucide-react";
import { Applicant } from "./ApplicantCard";

interface GradingModalProps {
  applicant: Applicant;
  onClose: () => void;
  onSubmitGrade: (
    applicantId: string,
    grades: { leadership: number; problemSolving: number; communication: number; essay: number },
    notes: string
  ) => void;
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

export default function GradingModal({
  applicant,
  onClose,
  onSubmitGrade,
}: GradingModalProps) {
  const [leadership, setLeadership] = useState(
    applicant.grades?.leadership || 3.0
  );
  const [problemSolving, setProblemSolving] = useState(
    applicant.grades?.problemSolving || 3.0
  );
  const [communication, setCommunication] = useState(
    applicant.grades?.communication || 3.0
  );
  const [essayScore, setEssayScore] = useState(
    applicant.grades?.essay || 5
  );
  const [notes, setNotes] = useState("");
  const [zoom, setZoom] = useState(100);

  // Calculate overall score (sum of the core rubric + essay score, max 25)
  const totalScore = leadership + problemSolving + communication + essayScore;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitGrade(
      applicant.id,
      {
        leadership,
        problemSolving,
        communication,
        essay: essayScore,
      },
      notes
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] flex flex-col rounded-3xl border border-slate-200/80 bg-slate-55 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Rubric Evaluation & Resume
              </h2>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Applicant: <span className="font-semibold text-slate-600 dark:text-slate-400">{applicant.name}</span> &bull; ID: <span className="font-mono">{applicant.hashId}</span>
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-100 p-2 text-slate-400 hover:bg-slate-55 dark:border-slate-800 dark:hover:bg-slate-900 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - Side-by-Side Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Mock PDF Resume Reader & Essay Box (60% width) */}
          <div className="w-full md:w-3/5 bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800">
            
            {/* Top Half: Resume Reader */}
            <div className="h-1/2 flex flex-col overflow-hidden border-b border-slate-200 dark:border-slate-800">
              {/* Resume PDF Toolbar */}
              <div className="h-11 border-b border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  resume_v1.pdf ({zoom}%)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => setZoom(100)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Downloading resume_v1.pdf")}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 cursor-pointer"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Resume Viewer Canvas */}
              <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start bg-slate-100 dark:bg-slate-950">
                <div
                  className="bg-white text-slate-800 shadow-lg rounded-lg w-full max-w-[800px] aspect-[1/1.4] p-10 font-serif border border-slate-200 dark:border-slate-800 transition-all origin-top duration-200"
                  style={{ transform: `scale(${zoom / 100})`, marginBottom: "2rem" }}
                >
                  {/* Simulated Beautiful PDF Resume */}
                  <div className="h-full flex flex-col justify-between">
                    <div>
                      {/* Header */}
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

                      {/* Education */}
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
                          <div className="mt-1 text-slate-600 font-sans leading-relaxed">
                            Relevant Coursework: CS 31/32, Microeconomics, Quantitative Methods, Social Psychology.
                          </div>
                        </div>
                      </div>

                      {/* Professional Experience */}
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
                            <ul className="list-disc ml-4 mt-1 text-slate-600 font-sans space-y-1 leading-relaxed">
                              <li>Analyzed 40+ seed-stage B2B SaaS startup pitches; created market sizing and unit economics models.</li>
                              <li>Formulated thesis report on emerging FinTech infrastructure, leading to a $1.2M seed-round term sheet.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="mt-6 border-t border-slate-200 pt-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-bold font-sans text-slate-500 block uppercase tracking-wider text-[10px]">Technical</span>
                          <span className="font-sans text-slate-600 text-[11px]">Python, SQL, Excel, Git</span>
                        </div>
                        <div>
                          <span className="font-bold font-sans text-slate-500 block uppercase tracking-wider text-[10px]">Interests</span>
                          <span className="font-sans text-slate-600 text-[11px]">Ultra-running, Sci-Fi novels, Barista training</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Half: The Essay Box */}
            <div className="h-1/2 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              {/* Essay Toolbar */}
              <div className="h-11 border-b border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                  Essay Response
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
                  Case Study Challenge
                </span>
              </div>
              {/* Essay Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
                {getMockEssay(applicant.name, applicant.cohort)}
              </div>
            </div>

          </div>

          {/* Right Side: Rubric Form (40% width) */}
          <div className="w-full md:w-2/5 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto">
              
              {/* Form Content */}
              <div className="p-6 space-y-6">
                
                {/* Rubric Card Alert */}
                <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                        Grading Standards
                      </h4>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5 leading-relaxed">
                        Score each core criteria from 1.0 to 5.0 and the essay evaluation from 1 to 10. Total score sums up to a maximum of 25.0. Be objective and leave thorough notes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Score Summary Display */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 text-center">
                  <div className="text-4xl font-black text-slate-800 dark:text-white">
                    {totalScore.toFixed(1)}
                    <span className="text-lg text-slate-400 dark:text-slate-500 font-normal">
                      /25.0
                    </span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1 block">
                    Calculated Score
                  </span>
                </div>

                {/* Leadership Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      Leadership
                    </label>
                    <span className="text-sm font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg dark:bg-indigo-500/10 dark:text-indigo-400">
                      {leadership.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={leadership}
                    onChange={(e) => setLeadership(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    <span>1.0 - Minimal initiative</span>
                    <span>3.0 - Solid manager</span>
                    <span>5.0 - Visionary leader</span>
                  </div>
                </div>

                {/* Problem Solving Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Problem Solving
                    </label>
                    <span className="text-sm font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg dark:bg-amber-500/10 dark:text-amber-400">
                      {problemSolving.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={problemSolving}
                    onChange={(e) => setProblemSolving(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 dark:bg-slate-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    <span>1.0 - Lacks structure</span>
                    <span>3.0 - Framework applied</span>
                    <span>5.0 - Flawless synthesis</span>
                  </div>
                </div>

                {/* Communication Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Communication
                    </label>
                    <span className="text-sm font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded-lg dark:bg-teal-500/10 dark:text-teal-400">
                      {communication.toFixed(1)} / 5.0
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={communication}
                    onChange={(e) => setCommunication(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:bg-slate-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    <span>1.0 - Hard to follow</span>
                    <span>3.0 - Structured, clear</span>
                    <span>5.0 - Extremely persuasive</span>
                  </div>
                </div>

                {/* Essay Evaluation Score Slider */}
                <div className="space-y-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Essay Evaluation
                    </label>
                    <span className="text-sm font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg dark:bg-blue-500/10 dark:text-blue-400">
                      {essayScore} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={essayScore}
                    onChange={(e) => setEssayScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    <span>1 - Weak logic</span>
                    <span>5 - Capable analysis</span>
                    <span>10 - C-Suite ready</span>
                  </div>
                </div>

                {/* Notes Textarea */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Evaluation Notes
                  </label>
                  <textarea
                    placeholder="Provide specific notes regarding resumes, strengths, weaknesses, and performance markers..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200/80 bg-white p-3 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                    required
                  />
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="border-t border-slate-200/80 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
                >
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
