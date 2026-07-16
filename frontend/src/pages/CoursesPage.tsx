import { useEffect, useState } from "react";
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { api } from "@/api";
import type {
  CourseType,
  RecommendedCourse,
  RecommendedMajor,
  AiAnalysis,
} from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { Card } from "@/components/ui/Card";

type TabType = "COURSES" | "MAJOR_FINDER" | "EXTRACURRICULAR";

// Static option constants for questionnaire mapping
const ACADEMIC_OPTIONS = [
  { id: "AA13", label: "Technology & Computing", desc: "기술 & IT" },
  { id: "AA23", label: "Arts & Design", desc: "예술 & 디자인" },
  { id: "AA08", label: "Business & Management", desc: "경영 & 관리" },
];

const ACTIVITY_OPTIONS = [
  { id: "ACT01", label: "Coding & Programming", desc: "소프트웨어 개발" },
  { id: "ACT02", label: "Math & Algorithms", desc: "알고리즘 및 수학" },
  { id: "ACT03", label: "AI Research", desc: "인공지능 연구" },
  { id: "ACT04", label: "Hardware Design", desc: "회로 및 기기 설계" },
  { id: "ACT05", label: "Deep Learning", desc: "모델 학습 및 데이터 분석" },
  { id: "ACT10", label: "Market Analysis", desc: "시장 조사 및 비즈니스 분석" },
  { id: "ACT11", label: "Presentations & Debate", desc: "발표 및 토론 협업" },
  { id: "ACT12", label: "Visual UI Sketching", desc: "인터페이스 스케치" },
  {
    id: "ACT13",
    label: "User Experience Testing",
    desc: "사용성 검증 및 리서치",
  },
];

const STRENGTH_OPTIONS = [
  { id: "ST01", label: "Debugging & Speed", desc: "디버깅 및 문제 해결" },
  { id: "ST02", label: "Logical Reasoning", desc: "논리적 추론 능력" },
  { id: "ST03", label: "Mathematical Analysis", desc: "수학적 분석" },
  { id: "ST04", label: "Research Orientation", desc: "문서 기획 및 리서치" },
  { id: "ST06", label: "Creative Idea Generation", desc: "창의적 사고력" },
  { id: "ST08", label: "Public Speaking", desc: "팀워크 및 커뮤니케이션" },
  { id: "ST09", label: "Team Leadership", desc: "팀 조율 및 리더십" },
  { id: "ST11", label: "Financial Modeling", desc: "재무 분석 및 모델 구축" },
  { id: "ST12", label: "Business Strategy", desc: "기획 및 성장 전략" },
  { id: "ST13", label: "Graphic Design Skills", desc: "시각 그래픽 제작 능력" },
  { id: "ST15", label: "Fast Learning Curve", desc: "빠른 지식 습득력" },
];

const CAREER_OPTIONS = [
  { id: "CA01", label: "Software Engineer", desc: "개발 및 테크 리드" },
  { id: "CA02", label: "AI & Data Scientist", desc: "인공지능 모델러" },
  { id: "CA04", label: "Tech Startup Founder", desc: "기술 창업" },
  { id: "CA06", label: "Business Consultant", desc: "경영 컨설턴트 및 기획자" },
  { id: "CA11", label: "UX/UI Designer", desc: "프로덕트 및 브랜드 디자이너" },
  { id: "CA12", label: "Frontend Developer", desc: "웹/앱 프론트 개발" },
];

const LEARNING_OPTIONS = [
  { id: "LS01", label: "Theoretical Lectures", desc: "이론 중심 강의식 교육" },
  {
    id: "LS02",
    label: "Self-paced Individual Study",
    desc: "자기주도적 개인 학습",
  },
  {
    id: "LS03",
    label: "Practical Project Labs",
    desc: "실전 코딩 및 프로젝트 실습",
  },
  {
    id: "LS04",
    label: "Academic Paper Research",
    desc: "연구 및 학술 논문 분석",
  },
  {
    id: "LS05",
    label: "Creative Design Workshops",
    desc: "비주얼 워크숍 및 협업 실습",
  },
  {
    id: "LS06",
    label: "Hardware Experimentation Labs",
    desc: "하드웨어 실습 및 기계 실험",
  },
  {
    id: "LS08",
    label: "Case Studies & Group business reports",
    desc: "비즈니스 분석 및 조별 보고서",
  },
];

// Mock Extracurricular Programs list based on user's interests
const mockExtracurriculars = [
  {
    id: "e1",
    title: "PNU AI & Software Hackathon 2026",
    category: "CONTEST",
    matchScore: 98,
    matchHint: "Matches your profile interest in AI & Coding Projects",
    deadline: "Aug 12, 2026",
    desc: "Solve regional and university problems using generative AI models. 3 credits equivalency for award winners.",
  },
  {
    id: "e2",
    title: "Global Student Supporters network",
    category: "CLUB",
    matchScore: 92,
    matchHint: "Matches your interest in Korean Language & Culture Exchange",
    deadline: "Sep 02, 2026",
    desc: "Support international exchange students during enrollment. Perfect for boosting conversational Korean skills.",
  },
  {
    id: "e3",
    title: "Venture Startup business incubation",
    category: "PROGRAM",
    matchScore: 89,
    matchHint:
      "Matches your profile career target in Startup & Business Strategy",
    deadline: "Aug 20, 2026",
    desc: "Receive prototype building funds, workspace in PNU startup center, and legal counseling for visas.",
  },
  {
    id: "e4",
    title: "Creative UI/UX Design Workshop",
    category: "WORKSHOP",
    matchScore: 85,
    matchHint: "Matches your focus on Visual UI Sketching & Prototyping",
    deadline: "Aug 30, 2026",
    desc: "Learn Figma to production-ready workflows with industry tech leaders. Designed for international students.",
  },
];

export function CoursesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("COURSES");

  // Tab 1: Courses Recommendations State
  const [filter, setFilter] = useState<CourseType | "ALL">("ALL");
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  // Tab 2: Major Finder Questionnaire State
  const [academic, setAcademic] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [careers, setCareers] = useState<string[]>([]);
  const [learning, setLearning] = useState<string>("");
  const [topik, setTopik] = useState<number>(3);

  const [finderSubmitted, setFinderSubmitted] = useState(false);
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderError, setFinderError] = useState("");
  const [recommendedMajors, setRecommendedMajors] = useState<
    RecommendedMajor[]
  >([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [recoMethod, setRecoMethod] = useState("");

  // Load Course recommendations
  useEffect(() => {
    if (activeTab !== "COURSES") return;
    setCoursesLoading(true);
    api
      .getRecommendedCourses(filter)
      .then(setCourses)
      .catch((err) =>
        setCoursesError(
          err instanceof Error ? err.message : "Failed to load courses.",
        ),
      )
      .finally(() => setCoursesLoading(false));
  }, [filter, activeTab]);

  const profileIncomplete = !user?.major;
  const activeInterests = user?.interests || [];

  // Helper toggle functions for questionnaire
  const toggleSelection = (
    id: string,
    list: string[],
    setList: (v: string[]) => void,
    maxSelect = 3,
  ) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
    } else {
      if (list.length < maxSelect) {
        setList([...list, id]);
      }
    }
  };

  // Major finder submit
  const handleFindMajors = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinderError("");
    if (academic.length === 0) {
      setFinderError("Please select at least one academic area.");
      return;
    }
    if (!learning) {
      setFinderError("Please select a learning preference.");
      return;
    }

    setFinderLoading(true);
    try {
      const response = await api.recommendMajor({
        academicAreas: academic,
        activities,
        strengths,
        careerAreas: careers,
        learningStyles: [learning],
        topikLevel: topik,
        topN: 3,
      });

      if (response.success) {
        setRecommendedMajors(response.recommendations);
        setAiAnalysis(response.aiAnalysis);
        setRecoMethod(response.recommendationMethod);
        setFinderSubmitted(true);
      } else {
        setFinderError("Unable to generate recommendations. Please try again.");
      }
    } catch (err) {
      setFinderError(
        err instanceof Error
          ? err.message
          : "Failed to retrieve recommendations.",
      );
    } finally {
      setFinderLoading(false);
    }
  };

  const handleResetFinder = () => {
    setAcademic([]);
    setActivities([]);
    setStrengths([]);
    setCareers([]);
    setLearning("");
    setTopik(3);
    setFinderSubmitted(false);
    setRecommendedMajors([]);
    setAiAnalysis(null);
    setFinderError("");
  };

  return (
    <div>
      <PageHeader
        title="AI Recommendations Hub"
        subtitle="Match courses, majors, and campus programs to your interests"
      />

      {/* Segment Switcher */}
      <div className="px-5 pt-4">
        <div className="flex rounded-xl bg-pnu-surface border border-pnu-border p-1">
          <button
            onClick={() => setActiveTab("COURSES")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "COURSES"
                ? "bg-white text-pnu-blue-light shadow-sm"
                : "text-pnu-muted hover:text-pnu-text"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Courses
          </button>
          <button
            onClick={() => setActiveTab("MAJOR_FINDER")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "MAJOR_FINDER"
                ? "bg-white text-pnu-blue-light shadow-sm"
                : "text-pnu-muted hover:text-pnu-text"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Major Finder
          </button>
          <button
            onClick={() => setActiveTab("EXTRACURRICULAR")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "EXTRACURRICULAR"
                ? "bg-white text-pnu-blue-light shadow-sm"
                : "text-pnu-muted hover:text-pnu-text"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Clubs & Info
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        {/* Tab 1: COURSES SECTION */}
        {activeTab === "COURSES" && (
          <div className="space-y-4">
            {/* Premium AI Profiler Summary Widget */}
            <div className="rounded-2xl bg-gradient-to-br from-pnu-blue to-pnu-blue-light p-4 text-white shadow-md">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                <h3 className="text-sm font-bold tracking-tight">
                  AI Academic matching Engine
                </h3>
              </div>
              <p className="mt-1 text-[11px] text-white/85 leading-normal">
                Personalized course list compiled by analyzing your academic
                track, graduation checkmarks, and selected interests.
              </p>

              <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-[11px]">
                <div>
                  <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">
                    Target Major
                  </p>
                  <p className="mt-0.5 font-bold truncate">
                    {user?.major || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">
                    Interest Profile
                  </p>
                  <p className="mt-0.5 font-bold truncate">
                    {activeInterests.length > 0
                      ? activeInterests.join(", ")
                      : "No interests set"}
                  </p>
                </div>
              </div>
            </div>

            <CourseFilters value={filter} onChange={setFilter} />

            {profileIncomplete ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Complete your major in Profile to get better recommendations.
              </p>
            ) : null}

            {coursesError ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {coursesError}
              </p>
            ) : null}

            {coursesLoading ? (
              <p className="text-sm text-pnu-muted">Loading courses…</p>
            ) : null}

            {!coursesLoading && courses.length === 0 && !coursesError ? (
              <p className="text-sm text-pnu-muted">
                No matching courses found.
              </p>
            ) : null}

            <div className="space-y-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: MAJOR FINDER SECTION */}
        {activeTab === "MAJOR_FINDER" && (
          <div className="space-y-4">
            {!finderSubmitted ? (
              <form onSubmit={handleFindMajors} className="space-y-5">
                <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-pnu-blue-light mb-1.5">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <h3 className="text-sm font-bold">
                      Academic Fit Questionnaire
                    </h3>
                  </div>
                  <p className="text-[11px] text-pnu-muted leading-normal">
                    This AI-driven evaluator ranks Pusan National University
                    majors that align best with your skills, goals, and language
                    levels.
                  </p>
                </div>

                {finderError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                    {finderError}
                  </p>
                )}

                {/* 1. Academic Area */}
                <div>
                  <label className="text-xs font-bold text-pnu-text block mb-2">
                    1. What fields of study interest you most? (Select up to 2)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {ACADEMIC_OPTIONS.map((opt) => {
                      const active = academic.includes(opt.id);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() =>
                            toggleSelection(opt.id, academic, setAcademic, 2)
                          }
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            active
                              ? "border-pnu-blue-light bg-pnu-blue/5 text-pnu-blue font-bold shadow-sm"
                              : "border-pnu-border bg-white text-pnu-text hover:bg-pnu-surface"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold">{opt.label}</p>
                            <p className="text-[10px] text-pnu-muted">
                              {opt.desc}
                            </p>
                          </div>
                          {active && (
                            <CheckCircle className="h-4 w-4 text-pnu-blue-light" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Activities */}
                <div>
                  <label className="text-xs font-bold text-pnu-text block mb-2">
                    2. Which activities sound most exciting? (Select up to 3)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTIVITY_OPTIONS.map((opt) => {
                      const active = activities.includes(opt.id);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() =>
                            toggleSelection(
                              opt.id,
                              activities,
                              setActivities,
                              3,
                            )
                          }
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[64px] ${
                            active
                              ? "border-pnu-blue-light bg-pnu-blue/5 text-pnu-blue font-bold shadow-sm"
                              : "border-pnu-border bg-white text-pnu-text hover:bg-pnu-surface"
                          }`}
                        >
                          <span className="text-[11px] leading-tight block">
                            {opt.label}
                          </span>
                          <span className="text-[9px] text-pnu-muted block mt-1">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Strengths */}
                <div>
                  <label className="text-xs font-bold text-pnu-text block mb-2">
                    3. Choose your core cognitive or practical strengths (Select
                    up to 3)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STRENGTH_OPTIONS.map((opt) => {
                      const active = strengths.includes(opt.id);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() =>
                            toggleSelection(opt.id, strengths, setStrengths, 3)
                          }
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[64px] ${
                            active
                              ? "border-pnu-blue-light bg-pnu-blue/5 text-pnu-blue font-bold shadow-sm"
                              : "border-pnu-border bg-white text-pnu-text hover:bg-pnu-surface"
                          }`}
                        >
                          <span className="text-[11px] leading-tight block">
                            {opt.label}
                          </span>
                          <span className="text-[9px] text-pnu-muted block mt-1">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Career goals */}
                <div>
                  <label className="text-xs font-bold text-pnu-text block mb-2">
                    4. What are your long-term career goals? (Select up to 2)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CAREER_OPTIONS.map((opt) => {
                      const active = careers.includes(opt.id);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() =>
                            toggleSelection(opt.id, careers, setCareers, 2)
                          }
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[64px] ${
                            active
                              ? "border-pnu-blue-light bg-pnu-blue/5 text-pnu-blue font-bold shadow-sm"
                              : "border-pnu-border bg-white text-pnu-text hover:bg-pnu-surface"
                          }`}
                        >
                          <span className="text-[11px] leading-tight block">
                            {opt.label}
                          </span>
                          <span className="text-[9px] text-pnu-muted block mt-1">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Learning Preferences */}
                <div>
                  <label className="text-xs font-bold text-pnu-text block mb-2">
                    5. Which classroom learning format do you prefer? (Select 1)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {LEARNING_OPTIONS.map((opt) => {
                      const active = learning === opt.id;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setLearning(opt.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            active
                              ? "border-pnu-blue-light bg-pnu-blue/5 text-pnu-blue font-bold shadow-sm"
                              : "border-pnu-border bg-white text-pnu-text hover:bg-pnu-surface"
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold">{opt.label}</p>
                            <p className="text-[10px] text-pnu-muted">
                              {opt.desc}
                            </p>
                          </div>
                          {active && (
                            <CheckCircle className="h-4 w-4 text-pnu-blue-light" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. TOPIK level */}
                <div>
                  <label className="text-xs font-bold text-pnu-text flex justify-between block mb-1">
                    <span>6. What is your current Korean TOPIK Level?</span>
                    <span className="text-pnu-blue-light font-extrabold text-sm">
                      {topik === 0 ? "No TOPIK" : `Level ${topik}`}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={topik}
                    onChange={(e) => setTopik(Number(e.target.value))}
                    className="w-full h-1.5 bg-pnu-border rounded-lg appearance-none cursor-pointer accent-pnu-blue-light my-2"
                  />
                  <div className="flex justify-between text-[9px] text-pnu-muted font-bold px-1">
                    <span>None</span>
                    <span>Lv.1</span>
                    <span>Lv.2</span>
                    <span>Lv.3</span>
                    <span>Lv.4</span>
                    <span>Lv.5</span>
                    <span>Lv.6</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={finderLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-pnu-blue to-pnu-blue-light py-3.5 text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {finderLoading ? (
                    "Analyzing Profiles..."
                  ) : (
                    <>
                      Analyze PNU Department Match
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Results dashboard
              <div className="space-y-4">
                {/* Result header banner */}
                <div className="rounded-2xl bg-gradient-to-br from-pnu-blue to-pnu-blue-light p-4 text-white shadow-md relative overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-5 w-5 text-amber-300 animate-bounce" />
                    <h3 className="text-sm font-bold tracking-tight">
                      AI Matching Results
                    </h3>
                  </div>
                  <p className="mt-1 text-[11px] text-white/85 leading-normal">
                    PNU departments scaled and calculated according to your
                    target subjects, activities, and career objectives.
                  </p>
                  <span className="absolute top-2 right-2 text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                    Method: {recoMethod}
                  </span>
                </div>

                {/* Ranked Major lists */}
                <div className="space-y-3">
                  {recommendedMajors.map((major, idx) => {
                    const rankMedal =
                      idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
                    const rankLabel = `Rank ${major.rank}`;
                    const isEligible =
                      !major.eligibilityNote.includes("may not be met");

                    return (
                      <Card
                        key={major.id}
                        className="border-l-4 border-l-pnu-blue hover:-translate-y-0.5 hover:shadow transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-200">
                                <span className="text-xs leading-none">
                                  {rankMedal}
                                </span>
                                {rankLabel}
                              </span>
                              <span className="text-[10px] font-extrabold text-pnu-blue-light bg-pnu-blue/5 px-1.5 py-0.5 rounded-md">
                                {major.score}% Fit
                              </span>
                            </div>
                            <h4 className="mt-2 text-base font-bold text-pnu-text leading-tight">
                              {major.nameKo}
                            </h4>
                            <p className="text-xs font-semibold text-pnu-muted mt-0.5">
                              {major.name}
                            </p>
                          </div>
                        </div>

                        {/* Matching Explanation */}
                        <p className="mt-3.5 text-xs text-pnu-text bg-pnu-surface p-2.5 rounded-xl leading-normal border border-pnu-border/80">
                          {major.reason}
                        </p>

                        {/* Language Eligibility note */}
                        <div
                          className={`mt-3 flex items-center gap-1.5 text-[10px] font-semibold p-2 rounded-xl border ${
                            isEligible
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                              : "bg-rose-50 text-rose-800 border-rose-100"
                          }`}
                        >
                          {isEligible ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                          )}
                          <span className="flex-1 leading-tight">
                            {major.eligibilityNote}
                          </span>
                        </div>

                        {/* Claude reasoning fallback analysis */}
                        {major.claudeReason && (
                          <p className="mt-3 text-[10px] text-pnu-muted italic leading-relaxed border-t border-pnu-border/50 pt-2.5">
                            AI Comment: &ldquo;{major.claudeReason}&rdquo;
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>

                {/* AI counsel widget / advice */}
                {aiAnalysis && (
                  <div className="rounded-2xl border border-pnu-blue/20 bg-pnu-blue/5 p-4 relative">
                    <div className="flex items-center gap-1.5 text-pnu-blue font-bold mb-2">
                      <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wide">
                        AI diagnostic counseling advice
                      </h4>
                    </div>
                    <p className="text-xs text-pnu-text leading-relaxed font-medium">
                      {aiAnalysis.summary}
                    </p>

                    {aiAnalysis.gapAnalysis &&
                      aiAnalysis.gapAnalysis.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-pnu-blue/10">
                          <p className="text-[10px] font-extrabold text-pnu-blue/80 uppercase tracking-wider mb-2">
                            Preparation Checklist to strengthen profile
                          </p>
                          <ul className="space-y-2">
                            {aiAnalysis.gapAnalysis.map((gap, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-pnu-text"
                              >
                                <span className="text-emerald-500 font-bold mt-0.5">
                                  ✓
                                </span>
                                <span className="flex-1 leading-normal font-medium">
                                  {gap}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                <button
                  onClick={handleResetFinder}
                  className="w-full rounded-xl border border-pnu-border bg-white py-3.5 text-xs font-bold text-pnu-text shadow-sm hover:bg-pnu-surface active:scale-[0.99] transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retake Major Questionnaire
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: EXTRACURRICULAR SECTION */}
        {activeTab === "EXTRACURRICULAR" && (
          <div className="space-y-4">
            {/* Widget */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 p-4 text-white shadow-md">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-200 animate-pulse" />
                <h3 className="text-sm font-bold tracking-tight">
                  Extracurricular Programs matching
                </h3>
              </div>
              <p className="mt-1 text-[11px] text-white/85 leading-normal">
                Discover university clubs, coding contests, legal visa
                information, and global support initiatives tailored to your
                profile.
              </p>
            </div>

            {/* Program lists */}
            <div className="space-y-3.5">
              {mockExtracurriculars.map((program) => (
                <Card
                  key={program.id}
                  className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-l-4 border-l-emerald-600"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-200">
                          <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                          {program.matchScore}% Match
                        </span>
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                          {program.category}
                        </span>
                      </div>
                      <h4 className="mt-2 text-base font-bold text-pnu-text tracking-tight leading-tight">
                        {program.title}
                      </h4>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-pnu-muted leading-normal">
                    {program.desc}
                  </p>

                  <div className="mt-3.5 flex items-center justify-between border-t border-pnu-border pt-3 text-[11px] text-pnu-muted">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-pnu-muted" />
                      <span>Apply before: {program.deadline}</span>
                    </div>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Active
                    </span>
                  </div>

                  <div className="mt-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-2">
                    <p className="text-[10.5px] font-medium text-emerald-700 leading-normal flex items-start gap-1">
                      <span className="text-amber-500">💡</span>
                      <span className="flex-1">{program.matchHint}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
