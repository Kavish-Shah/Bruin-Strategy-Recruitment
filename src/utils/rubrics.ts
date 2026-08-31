export type RubricKey = "freshman_management" | "upperclassmen_management" | "healthcare";

export interface BenchmarkItem {
  id: string;
  point: number;       // e.g. 1.0, 3.0, 5.0, 10.0
  guidance: string;    // e.g. "Club founder / High-impact freshman leader"
}

export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number; // Points assigned to this category (e.g. 5, 10, 15)
  description: string;
  benchmarks: BenchmarkItem[];
}

export interface RubricConfig {
  key: RubricKey;
  title: string;
  subtitle: string;
  badge: string;
  color: "indigo" | "amber" | "rose";
  iconEmoji: string;
  targetAudience: string;
  criteriaList: RubricCriterion[];
}

export function getNormalizedBenchmarks(criterion: any): BenchmarkItem[] {
  if (criterion && Array.isArray(criterion.benchmarks) && criterion.benchmarks.length > 0) {
    return criterion.benchmarks;
  }
  
  if (criterion && criterion.benchmarkTabs && Array.isArray(criterion.benchmarkTabs)) {
    return criterion.benchmarkTabs.map((t: any, idx: number) => ({
      id: t.id || `bm_${idx}`,
      point: idx === 0 ? 1 : idx === 1 ? Math.round((criterion.maxScore || 5) / 2) : (criterion.maxScore || 5),
      guidance: t.guidance || t.label || "",
    }));
  }

  const bObj = criterion?.benchmarks;
  const maxScore = criterion?.maxScore || 5;

  if (bObj && typeof bObj === "object" && !Array.isArray(bObj)) {
    const list: BenchmarkItem[] = [];
    if (bObj.low) list.push({ id: "bm_low", point: 1.0, guidance: bObj.low });
    if (bObj.mid) list.push({ id: "bm_mid", point: Math.round(maxScore / 2), guidance: bObj.mid });
    if (bObj.high) list.push({ id: "bm_high", point: maxScore, guidance: bObj.high });
    if (list.length > 0) return list;
  }

  return [
    { id: "bm_1", point: 1.0, guidance: "Minimal initiative or basic performance" },
    { id: "bm_3", point: Math.round(maxScore / 2), guidance: "Solid performance meeting standard expectations" },
    { id: "bm_5", point: maxScore, guidance: "Exceptional performance exceeding expectations" },
  ];
}

const OVERALL_RECOMMENDATION_CRITERION: RubricCriterion = {
  id: "overall_impression",
  name: "Overall Evaluator Recommendation",
  maxScore: 5.0,
  description: "Evaluator's holistic impression of candidate readiness, potential, and hiring priority.",
  benchmarks: [
    { id: "b1", point: 1.0, guidance: "1.0 - Do Not Recommend" },
    { id: "b2", point: 3.0, guidance: "3.0 - Recommend for Next Round" },
    { id: "b3", point: 5.0, guidance: "5.0 - Strongest Hire Recommendation" },
  ],
};

export function getRubricCriteriaList(rubric?: RubricConfig, rubricKey?: RubricKey): RubricCriterion[] {
  let list: RubricCriterion[] = [];
  if (rubric && Array.isArray(rubric.criteriaList) && rubric.criteriaList.length > 0) {
    list = rubric.criteriaList;
  } else if (rubricKey && RUBRICS[rubricKey] && Array.isArray(RUBRICS[rubricKey].criteriaList)) {
    list = RUBRICS[rubricKey].criteriaList;
  } else {
    list = RUBRICS.freshman_management.criteriaList;
  }

  const hasOverall = list.some((c) => c.id === "overall_impression" || c.name.toLowerCase().includes("overall"));
  if (!hasOverall) {
    return [...list, OVERALL_RECOMMENDATION_CRITERION];
  }

  return list;
}

export function getRubricTotalPoints(rubric?: RubricConfig, rubricKey?: RubricKey): number {
  const list = getRubricCriteriaList(rubric, rubricKey);
  return list.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0);
}

export function getCriterionPercentage(criterion: RubricCriterion, rubric?: RubricConfig, rubricKey?: RubricKey): string {
  const total = getRubricTotalPoints(rubric, rubricKey);
  if (!total) return "0.0%";
  const pct = ((Number(criterion.maxScore) || 0) / total) * 100;
  return `${pct.toFixed(1)}%`;
}

export const RUBRICS: Record<RubricKey, RubricConfig> = {
  freshman_management: {
    key: "freshman_management",
    title: "Freshman Management Consulting Rubric",
    subtitle: "Evaluates raw problem-solving potential, leadership drive, and growth mindset across 10 rubric categories.",
    badge: "Freshman Management",
    color: "indigo",
    iconEmoji: "🎓",
    targetAudience: "Management Consulting Track • Freshmen Applicants",
    criteriaList: [
      {
        id: "leadership",
        name: "Leadership & Initiative",
        maxScore: 5.0,
        description: "Evaluates high school & freshman club involvement, proactive drive, taking charge in group settings, and ambition.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Minimal initiative or passive member" },
          { id: "b2", point: 3.0, guidance: "3.0 - Active project lead / club chair" },
          { id: "b3", point: 5.0, guidance: "5.0 - Club founder / High-impact freshman leader" },
        ],
      },
      {
        id: "problem_solving",
        name: "Problem Solving & Aptitude",
        maxScore: 5.0,
        description: "Measures logical reasoning, curiosity, and ability to break down unfamiliar business problems.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Unstructured or circular reasoning" },
          { id: "b2", point: 3.0, guidance: "3.0 - Good logic & structured approach" },
          { id: "b3", point: 5.0, guidance: "5.0 - Exceptional analytical intuition" },
        ],
      },
      {
        id: "quant_intuition",
        name: "Analytical & Quantitative Intuition",
        maxScore: 5.0,
        description: "Assesses comfort with quantitative data, mental math estimation, and structured data synthesis.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Struggles with data logic" },
          { id: "b2", point: 3.0, guidance: "3.0 - Sound quantitative reasoning" },
          { id: "b3", point: 5.0, guidance: "5.0 - Flawless quantitative intuition" },
        ],
      },
      {
        id: "business_curiosity",
        name: "Business Curiosity & Acumen",
        maxScore: 5.0,
        description: "Evaluates general business interest, awareness of industry trends, and strategic curiosity.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Surface-level business interest" },
          { id: "b2", point: 3.0, guidance: "3.0 - Strong curiosity in business strategy" },
          { id: "b3", point: 5.0, guidance: "5.0 - Exceptional strategic curiosity & commercial awareness" },
        ],
      },
      {
        id: "articulateness",
        name: "Articulateness & Communication",
        maxScore: 5.0,
        description: "Evaluates clarity of expression, active listening, confidence, and structured speech.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Disorganized or hard to follow" },
          { id: "b2", point: 3.0, guidance: "3.0 - Clear, structured speech" },
          { id: "b3", point: 5.0, guidance: "5.0 - Highly articulate & persuasive presentation" },
        ],
      },
      {
        id: "teamwork",
        name: "Teamwork & Collaboration",
        maxScore: 5.0,
        description: "Assesses collaborative spirit, willingness to help teammates, and interpersonal emotional intelligence.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Uncollaborative or dominant" },
          { id: "b2", point: 3.0, guidance: "3.0 - Solid team player" },
          { id: "b3", point: 5.0, guidance: "5.0 - Empathetic, uplifting team player" },
        ],
      },
      {
        id: "essay",
        name: "Short Answer Essay & Vision",
        maxScore: 10.0,
        description: "Assesses genuine passion for management consulting, quality of written response, and alignment with BSN values.",
        benchmarks: [
          { id: "b1", point: 2.0, guidance: "2.0 - Generic or brief response" },
          { id: "b2", point: 6.0, guidance: "6.0 - Thoughtful rationale & clear interest" },
          { id: "b3", point: 10.0, guidance: "10.0 - Outstanding essay, deep passion & BSN alignment" },
        ],
      },
      {
        id: "growth_mindset",
        name: "Growth Mindset & Receptivity",
        maxScore: 5.0,
        description: "Measures openness to feedback, coachability, and eagerness to learn from constructive critiques.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Defensive or resistant to feedback" },
          { id: "b2", point: 3.0, guidance: "3.0 - Open & receptive to suggestions" },
          { id: "b3", point: 5.0, guidance: "5.0 - Eagerly seeks feedback & adapts instantly" },
        ],
      },
      {
        id: "values_alignment",
        name: "BSN Values Alignment",
        maxScore: 5.0,
        description: "Evaluates integrity, commitment to peer mentorship, professional ethics, and community contribution.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Low alignment with club culture" },
          { id: "b2", point: 3.0, guidance: "3.0 - Strong fit with core values" },
          { id: "b3", point: 5.0, guidance: "5.0 - Exemplary cultural fit & community builder" },
        ],
      },
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
  },
  upperclassmen_management: {
    key: "upperclassmen_management",
    title: "Upperclassmen Management Consulting Rubric",
    subtitle: "Evaluates proven leadership impact, structured business acumen, professional presentation, and career vision.",
    badge: "Upperclassmen Management",
    color: "amber",
    iconEmoji: "💼",
    targetAudience: "Management Consulting Track • Sophomores, Juniors & Seniors",
    criteriaList: [
      {
        id: "leadership",
        name: "Leadership & Demonstrated Impact",
        maxScore: 5.0,
        description: "Evaluates executive board positions, internship accomplishments, project ownership, and quantifiable outcomes.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Passive member / limited ownership" },
          { id: "b2", point: 3.0, guidance: "3.0 - Executive board / Internship project lead" },
          { id: "b3", point: 5.0, guidance: "5.0 - Proven track record of high-impact leadership" },
        ],
      },
      {
        id: "business_acumen",
        name: "Business Acumen & Frameworks",
        maxScore: 5.0,
        description: "Measures application of business frameworks, market sizing, strategic logic, and case study decomposition.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Basic or non-strategic reasoning" },
          { id: "b2", point: 3.0, guidance: "3.0 - Structured frameworks & sound logic" },
          { id: "b3", point: 5.0, guidance: "5.0 - Advanced strategic synthesis & financial acumen" },
        ],
      },
      {
        id: "financial_logic",
        name: "Quantitative & Financial Logic",
        maxScore: 5.0,
        description: "Evaluates financial modeling intuition, profit driver analysis, and quantitative rigor.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Struggles with financial concepts" },
          { id: "b2", point: 3.0, guidance: "3.0 - Solid grasp of financial & business metrics" },
          { id: "b3", point: 5.0, guidance: "5.0 - Masterful financial & quantitative analysis" },
        ],
      },
      {
        id: "case_synthesis",
        name: "Strategic Problem Synthesis",
        maxScore: 5.0,
        description: "Assesses ability to synthesize complex case information into clear, actionable business recommendations.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Unfocused or disjointed summary" },
          { id: "b2", point: 3.0, guidance: "3.0 - Clear synthesis & key takeaways" },
          { id: "b3", point: 5.0, guidance: "5.0 - Senior executive-level problem synthesis" },
        ],
      },
      {
        id: "executive_comm",
        name: "Executive Communication & Pitch",
        maxScore: 5.0,
        description: "Measures client-ready presentation skills, conciseness, executive presence, and confidence.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Informal or disorganized delivery" },
          { id: "b2", point: 3.0, guidance: "3.0 - Professional, clear & structured pitch" },
          { id: "b3", point: 5.0, guidance: "5.0 - Client-ready executive presence & poise" },
        ],
      },
      {
        id: "client_readiness",
        name: "Client Readiness & Professionalism",
        maxScore: 5.0,
        description: "Evaluates professional demeanor, poise under questioning, and readiness for client engagements.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Unpolished presentation" },
          { id: "b2", point: 3.0, guidance: "3.0 - Professional & dependable" },
          { id: "b3", point: 5.0, guidance: "5.0 - Exceptionally polished & client ready" },
        ],
      },
      {
        id: "essay",
        name: "Short Answer Essay & Rationale",
        maxScore: 10.0,
        description: "Evaluates depth of consulting rationale, career goals, past experiences, and potential value add to BSN.",
        benchmarks: [
          { id: "b1", point: 2.0, guidance: "2.0 - Surface-level interest or generic goals" },
          { id: "b2", point: 6.0, guidance: "6.0 - Strong background & clear career vision" },
          { id: "b3", point: 10.0, guidance: "10.0 - Exceptional rationale, proven drive & value-add" },
        ],
      },
      {
        id: "internship_impact",
        name: "Past Internship Ownership",
        maxScore: 5.0,
        description: "Measures depth of responsibility, initiative, and measurable achievements in previous summer internships.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Limited task execution" },
          { id: "b2", point: 3.0, guidance: "3.0 - Owned key deliverables & projects" },
          { id: "b3", point: 5.0, guidance: "5.0 - High strategic impact & executive commendations" },
        ],
      },
      {
        id: "network_contribution",
        name: "Bruin Strategy Network Contribution",
        maxScore: 5.0,
        description: "Assesses readiness to lead client teams, mentor underclassmen, and contribute actively to club operations.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Low commitment to mentorship" },
          { id: "b2", point: 3.0, guidance: "3.0 - Committed club contributor" },
          { id: "b3", point: 5.0, guidance: "5.0 - Outstanding future project leader & mentor" },
        ],
      },
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
  },
  healthcare: {
    key: "healthcare",
    title: "Healthcare Consulting Rubric (All Years)",
    subtitle: "Evaluates healthcare domain curiosity, interdisciplinary analytical thinking, empathy, and health consulting passion.",
    badge: "Healthcare Consulting",
    color: "rose",
    iconEmoji: "❤️",
    targetAudience: "Healthcare Consulting Track • All Year Levels",
    criteriaList: [
      {
        id: "health_domain",
        name: "Healthcare Domain Interest & Drive",
        maxScore: 5.0,
        description: "Evaluates curiosity in digital health, pharma, medtech, clinical research, or health policy trends.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Limited healthcare interest shown" },
          { id: "b2", point: 3.0, guidance: "3.0 - Solid curiosity in health innovation" },
          { id: "b3", point: 5.0, guidance: "5.0 - Deep healthcare domain passion & research drive" },
        ],
      },
      {
        id: "scientific_thinking",
        name: "Analytical & Scientific Thinking",
        maxScore: 5.0,
        description: "Measures data-driven reasoning, structured problem decomposition, and analysis of health scenarios.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Descriptive / superficial reasoning" },
          { id: "b2", point: 3.0, guidance: "3.0 - Methodical & structured scientific logic" },
          { id: "b3", point: 5.0, guidance: "5.0 - Rigorous quantitative & analytical synthesis" },
        ],
      },
      {
        id: "health_innovation",
        name: "Health Policy & Innovation Curiosity",
        maxScore: 5.0,
        description: "Assesses awareness of healthcare regulations, biotech breakthroughs, and healthcare delivery systems.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Unaware of health industry trends" },
          { id: "b2", point: 3.0, guidance: "3.0 - Informed on key health innovations" },
          { id: "b3", point: 5.0, guidance: "5.0 - Cutting-edge understanding of biotech & health tech" },
        ],
      },
      {
        id: "data_problem_solving",
        name: "Data-Driven Problem Solving",
        maxScore: 5.0,
        description: "Evaluates ability to analyze medical data, clinical outcomes, and health economics logically.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Struggles with health data analysis" },
          { id: "b2", point: 3.0, guidance: "3.0 - Methodical health data interpretation" },
          { id: "b3", point: 5.0, guidance: "5.0 - Outstanding quantitative & clinical data synthesis" },
        ],
      },
      {
        id: "interdisciplinary_comm",
        name: "Interdisciplinary Communication",
        maxScore: 5.0,
        description: "Measures ability to explain technical health topics clearly, empathetic communication, and teamwork.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Overly jargon-heavy or unclear" },
          { id: "b2", point: 3.0, guidance: "3.0 - Clear, empathetic & articulate communicator" },
          { id: "b3", point: 5.0, guidance: "5.0 - Captivating interdisciplinary communicator" },
        ],
      },
      {
        id: "empathetic_teamwork",
        name: "Empathetic Team Collaboration",
        maxScore: 5.0,
        description: "Assesses empathy for patient/client outcomes, collaborative listening, and team harmony.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Unempathetic or uncollaborative" },
          { id: "b2", point: 3.0, guidance: "3.0 - Empathetic & supportive teammate" },
          { id: "b3", point: 5.0, guidance: "5.0 - Exemplary empathetic leader & collaborator" },
        ],
      },
      {
        id: "essay",
        name: "Healthcare Essay & Mission Alignment",
        maxScore: 10.0,
        description: "Evaluates passion for healthcare consulting, alignment with BSN Healthcare track goals, and vision for impact.",
        benchmarks: [
          { id: "b1", point: 2.0, guidance: "2.0 - Basic essay without health focus" },
          { id: "b2", point: 6.0, guidance: "6.0 - Clear healthcare consulting rationale" },
          { id: "b3", point: 10.0, guidance: "10.0 - Outstanding essay, deep passion & BSN alignment" },
        ],
      },
      {
        id: "clinical_research",
        name: "Clinical/Research Initiative",
        maxScore: 5.0,
        description: "Evaluates hands-on research, hospital volunteering, clinical shadowing, or medtech project ownership.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - No relevant clinical/health experience" },
          { id: "b2", point: 3.0, guidance: "3.0 - Active research / health volunteering" },
          { id: "b3", point: 5.0, guidance: "5.0 - Significant research publication / clinical leadership" },
        ],
      },
      {
        id: "healthcare_value_add",
        name: "BSN Healthcare Value Add",
        maxScore: 5.0,
        description: "Measures potential contributions to healthcare client projects, workshop leadership, and peer growth.",
        benchmarks: [
          { id: "b1", point: 1.0, guidance: "1.0 - Limited track contribution" },
          { id: "b2", point: 3.0, guidance: "3.0 - Valuable track member" },
          { id: "b3", point: 5.0, guidance: "5.0 - High-impact healthcare leader & client project driver" },
        ],
      },
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
  },
};

export function getApplicantRubricKey(applicant: { cohort?: string; year?: string }): RubricKey {
  const isHealthcare = applicant.cohort?.toLowerCase().includes("health");
  if (isHealthcare) return "healthcare";

  const isFreshman =
    (applicant.year && applicant.year.toLowerCase().includes("freshman")) ||
    (applicant.cohort && applicant.cohort.toLowerCase().includes("freshman"));

  return isFreshman ? "freshman_management" : "upperclassmen_management";
}
