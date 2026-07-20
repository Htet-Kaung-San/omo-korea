import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { GraduationCap, Eye, EyeOff, ArrowLeft, Check, ChevronRight, ChevronLeft, Languages, MapPin, Sparkles, BookOpen } from "lucide-react";
import { api } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { NATIONALITY_OPTIONS, ACADEMIC_HIERARCHY } from "@/data/options";
import { LANGUAGE_OPTIONS } from "@/i18n/languages";
import type { LanguageCode } from "@/i18n/languages";

// ── SignupPage ────────────────────────────────────────────────────────────────

export function SignupPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const renderTermsLine = () => {
    if (language === "ko") {
      return (
        <span>
          가입 시{" "}
          <Link
            to="/terms"
            className="text-[#2563EB] font-semibold hover:underline"
          >
            이용약관
          </Link>{" "}
          및{" "}
          <Link
            to="/privacy"
            className="text-[#2563EB] font-semibold hover:underline"
          >
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </span>
      );
    }
    if (language === "zh") {
      return (
        <span>
          注册即表示你同意我们的{" "}
          <Link
            to="/terms"
            className="text-[#2563EB] font-semibold hover:underline"
          >
            条款
          </Link>{" "}
          与{" "}
          <Link
            to="/privacy"
            className="text-[#2563EB] font-semibold hover:underline"
          >
            隐私政策
          </Link>
          。
        </span>
      );
    }
    return (
      <span>
        By signing up you agree to our{" "}
        <Link
          to="/terms"
          className="text-[#2563EB] font-semibold hover:underline"
        >
          Terms
        </Link>{" "}
        &{" "}
        <Link
          to="/privacy"
          className="text-[#2563EB] font-semibold hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </span>
    );
  };

  const [step, setStep] = useState(1);

  // Profile Basic details (Step 1)
  const [nationality, setNationality] = useState("");
  const [inKorea, setInKorea] = useState<boolean | null>(null);

  // MBTI state
  const [mbti, setMbti] = useState("");

  // Visa & Academic Details (Step 2)
  const [visaStatus, setVisaStatus] = useState(""); // D-2 or D-4
  const [d2Semester, setD2Semester] = useState(""); // 1st sem or 2nd sem
  const [d4Year, setD4Year] = useState("2026");
  const [d4Intake, setD4Intake] = useState("03"); // March
  const [d4Suffix] = useState(() => String(Math.floor(100 + Math.random() * 900)));
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [major, setMajor] = useState("");

  // Credentials & Consent (Step 3)
  const [studentIdInput, setStudentIdInput] = useState(""); // for D-2
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [hasNoStudentId, setHasNoStudentId] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#EEF2F7]">
        <p className="text-sm text-pnu-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  const isD4 = visaStatus === "D-4";

  // Calculated D-4 IDs
  const calculatedD4Id = `${d4Year}${d4Intake}${d4Suffix.padStart(3, "0")}`;

  // For D-2 students who do not have an ID yet, generate a temporary 9-digit ID starting with 999
  const calculatedD2TempId = `999${d4Year.substring(2)}${d4Suffix.padStart(4, "0")}`;

  const finalStudentId = isD4 ? calculatedD4Id : (hasNoStudentId ? calculatedD2TempId : studentIdInput.trim());

  // Step 1 Validation: Language preference (implicit), Nationality, inKorea check, and completed MBTI
  const isStep1Valid =
    nationality.trim().length > 0 &&
    inKorea !== null &&
    mbti.length === 4;

  // Step 2 Validation: Visa status, D-2 semester (if D-2), and completed Major
  const isStep2Valid =
    visaStatus.length > 0 &&
    (visaStatus === "D-2" ? d2Semester.length > 0 : true) &&
    major.trim().length > 0;

  // Step 3 Validation: Student ID check (if D-2 and has ID), Full name, Passwords, and Consent agreement
  const isD2IdValid = hasNoStudentId || /^\d{9}$/.test(studentIdInput.trim());
  const isStep3Valid =
    (isD4 ? true : isD2IdValid) &&
    name.trim().length > 0 &&
    password.length > 0 &&
    confirmPw.length > 0 &&
    password === confirmPw &&
    agreed;

  const nextStep = () => {
    setError("");
    if (step === 1 && !isStep1Valid) {
      setError("Please select nationality, location option, and complete your MBTI.");
      return;
    }
    if (step === 2 && !isStep2Valid) {
      setError("Please select visa status, semester option (if D-2), and complete major details.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isStep3Valid) {
      if (!isD4 && !isD2IdValid) {
        setError("Student ID must be a 9-digit number.");
        return;
      }
      if (password !== confirmPw) {
        setError(t("auth.passwordMismatch"));
        return;
      }
      setError("Please complete all account fields, name, and accept the Terms.");
      return;
    }

    setSubmitting(true);
    try {
      await api.signup({
        studentId: finalStudentId,
        name: name.trim(),
        nationality: nationality.trim(),
        major: major.trim(),
        student_type: visaStatus === "D-2" ? "Current" : "Freshman",
        visa_status: visaStatus,
        password,
        language_pref: language,
        is_in_korea: inKorea ?? true,
        mbti: mbti,
        d2_semester: visaStatus === "D-2" && d2Semester ? Number(d2Semester) : undefined,
      });

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-4 py-3.5 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] text-[15px] outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all";

  const selectCls =
    "w-full px-4 py-3.5 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-[15px] outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all";

  return (
    <div
      className="min-h-screen bg-[#E8EEF5] flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Mobile frame */}
      <div
        className="relative bg-[#F8FAFC] w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 400,
          borderRadius: 40,
          boxShadow: "0 24px 80px rgba(30,58,138,0.18)",
        }}
      >
        {/* Status bar spacer */}
        <div className="h-11 flex-shrink-0" />

        {/* Header */}
        <div className="px-5 pt-2 pb-2 flex items-center gap-3 flex-shrink-0">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-[#334155]" />
            </button>
          ) : (
            <Link
              to="/login"
              className="w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
              aria-label={t("auth.backToLogin")}
            >
              <ArrowLeft className="w-4 h-4 text-[#334155]" />
            </Link>
          )}
          <div>
            <h1 className="text-[20px] font-bold text-[#0F172A] leading-tight flex items-center gap-2">
              <GraduationCap
                className="w-5 h-5 text-[#2563EB]"
                strokeWidth={2}
              />
              {t("auth.signupTitle")}
            </h1>
            <p className="text-[13px] text-[#64748B] leading-snug">
              {t("auth.signupSubtitle")}
            </p>
          </div>
        </div>

        {/* Scrollable form */}
        <div
          className="px-5 pb-6 overflow-y-auto max-h-[600px]"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-4 px-2 pt-2">
            {[
              { id: 1, label: language === "ko" ? "기본정보" : "Identity" },
              { id: 2, label: language === "ko" ? "비자/학적" : "Academic" },
              { id: 3, label: language === "ko" ? "계정설정" : "Account" },
            ].map((s, index, arr) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-300 ${
                      step >= s.id
                        ? "bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.4)]"
                        : "bg-[#E2E8F0] text-[#64748B]"
                    }`}
                  >
                    {step > s.id ? (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    ) : (
                      s.id
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium mt-1 transition-all ${
                      step >= s.id ? "text-[#1E3A8A] font-semibold" : "text-[#94A3B8]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {index < arr.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${
                      step > s.id ? "bg-[#2563EB]" : "bg-[#E2E8F0]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] p-6 space-y-4 transition-all duration-300"
          >
            {/* STEP 1: Basic Preferences & Personality */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Language Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A] flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-[#2563EB]" />
                    Preferred Language / 주언어 설정
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    className={selectCls}
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.nativeLabel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nationality Picker */}
                <div className="space-y-1.5 border-t border-[#E2E8F0] pt-3.5">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A]">
                    {t("auth.nationalityLabel")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{t("profile.selectNationality") || "Select nationality"}</option>
                    {NATIONALITY_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location selector check (In Korea or not) */}
                <div className="space-y-1.5 border-t border-dashed border-[#E2E8F0] pt-3">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#2563EB]" />
                    Are you currently in PNU or South Korea?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInKorea(true)}
                      className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                        inKorea === true
                          ? "bg-[#2563EB] border-[#2563EB] text-white"
                          : "bg-white border-[#E2E8F0] text-[#64748B]"
                      }`}
                    >
                      Yes, I am in Korea
                    </button>
                    <button
                      type="button"
                      onClick={() => setInKorea(false)}
                      className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                        inKorea === false
                          ? "bg-[#2563EB] border-[#2563EB] text-white"
                          : "bg-white border-[#E2E8F0] text-[#64748B]"
                      }`}
                    >
                      No, I am overseas
                    </button>
                  </div>
                </div>

                {/* MBTI Select Dropdown */}
                <div className="space-y-1.5 border-t border-[#E2E8F0] pt-3.5">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    Select your MBTI Type <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-[#64748B] leading-snug">
                    Used to help recommendations find fields matching your learning and social styles.
                  </p>
                  <select
                    value={mbti}
                    onChange={(e) => setMbti(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select MBTI</option>
                    {[
                      "INTJ", "INTP", "ENTJ", "ENTP",
                      "INFJ", "INFP", "ENFJ", "ENFP",
                      "ISTJ", "ISFJ", "ESTJ", "ESFJ",
                      "ISTP", "ISFP", "ESTP", "ESFP"
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Visa Designation & Academic Info */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Visa Selector (conditional based on inKorea check) */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A]">
                    {inKorea
                      ? "Select your current Visa Designation"
                      : "Select your planned Visa Type"} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={visaStatus}
                    onChange={(e) => {
                      setVisaStatus(e.target.value);
                      setD2Semester("");
                    }}
                    className={selectCls}
                  >
                    <option value="">Select Visa Type</option>
                    <option value="D-2">D-2 (Student Visa)</option>
                    <option value="D-4">D-4 (Language Trainee)</option>
                  </select>
                </div>

                {/* Conditional Specifics for D-2 or D-4 */}
                {visaStatus === "D-2" && (
                  <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-fade-in">
                    <label className="block text-[13px] font-semibold text-[#1E3A8A]">
                      Which D-2 semester did you join? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[10px] text-[#64748B] mb-2 leading-relaxed">
                      Visa extension is required after 2 years. Please specify the semester you started your D-2 visa.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setD2Semester("1st Semester")}
                        className={`py-2 rounded-lg border font-bold text-xs transition-all ${
                          d2Semester === "1st Semester"
                            ? "bg-[#1E3A8A] border-[#1E3A8A] text-white"
                            : "bg-white border-[#E2E8F0] text-[#64748B]"
                        }`}
                      >
                        1st Semester
                      </button>
                      <button
                        type="button"
                        onClick={() => setD2Semester("2nd Semester")}
                        className={`py-2 rounded-lg border font-bold text-xs transition-all ${
                          d2Semester === "2nd Semester"
                            ? "bg-[#1E3A8A] border-[#1E3A8A] text-white"
                            : "bg-white border-[#E2E8F0] text-[#64748B]"
                        }`}
                      >
                        2nd Semester
                      </button>
                    </div>
                  </div>
                )}

                {visaStatus === "D-4" && (
                  /* D-4 ID preview and intake selects */
                  <div className="space-y-2.5 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] animate-fade-in">
                    <p className="text-[12px] font-bold text-[#1E3A8A]">
                      Generate Language Trainee (D-4) ID
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#64748B] font-semibold mb-1">Intake Year</label>
                        <select
                          value={d4Year}
                          onChange={(e) => setD4Year(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-lg p-1.5 text-xs text-[#0F172A] outline-none"
                        >
                          <option value="2026">2026</option>
                          <option value="2025">2025</option>
                          <option value="2024">2024</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#64748B] font-semibold mb-1">Intake Term</label>
                        <select
                          value={d4Intake}
                          onChange={(e) => setD4Intake(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-lg p-1.5 text-xs text-[#0F172A] outline-none"
                        >
                          <option value="03">March (03)</option>
                          <option value="06">June (06)</option>
                          <option value="09">Sept (09)</option>
                          <option value="12">Dec (12)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-[#EEF2F7] border border-[#CBD5E1] p-2.5 rounded-xl flex items-center justify-between mt-2">
                      <span className="text-[10px] font-bold text-[#64748B]">YOUR ASSIGNED ID</span>
                      <span className="text-sm font-black text-[#1E3A8A] tracking-wider select-all">{calculatedD4Id}</span>
                    </div>
                  </div>
                )}

                {/* Academic Fields Hierarchy */}
                <div className="space-y-3 border-t border-[#E2E8F0] pt-3.5">
                  <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1">
                    Academic Fields Selection
                  </h3>

                  {/* College Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold text-[#64748B] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                      College <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCollege}
                      onChange={(e) => {
                        setSelectedCollege(e.target.value);
                        setSelectedDept("");
                        setMajor("");
                      }}
                      className={selectCls}
                    >
                      <option value="">Select College</option>
                      {ACADEMIC_HIERARCHY.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold text-[#64748B] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDept}
                      disabled={!selectedCollege}
                      onChange={(e) => {
                        setSelectedDept(e.target.value);
                        setMajor("");
                      }}
                      className={selectCls}
                    >
                      <option value="">
                        {selectedCollege ? "Select Department" : "Select College first"}
                      </option>
                      {(ACADEMIC_HIERARCHY.find((c) => c.name === selectedCollege)?.departments || []).map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Major Select */}
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-semibold text-[#64748B] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                      {t("profile.major")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={major}
                      disabled={!selectedDept}
                      onChange={(e) => setMajor(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">
                        {selectedDept ? t("profile.selectMajor") || "Select major" : "Select Department first"}
                      </option>
                      {((ACADEMIC_HIERARCHY.find((c) => c.name === selectedCollege)
                        ?.departments || []).find((d) => d.name === selectedDept)
                        ?.majors || []).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Credentials Setup & Account Consent */}
            {step === 3 && (
              <div className="space-y-4">
                {!isD4 ? (
                  /* Standard D-2 Student ID input */
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[13px] font-semibold text-[#1E3A8A]">
                        {t("auth.studentIdLabel")} <span className="text-red-500">*</span>
                      </label>
                      <label className="flex items-center gap-1 text-[11px] text-[#64748B] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasNoStudentId}
                          onChange={(e) => setHasNoStudentId(e.target.checked)}
                          className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                        />
                        I don't have a Student ID yet
                      </label>
                    </div>
                    {!hasNoStudentId ? (
                      <input
                        type="text"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        placeholder={t("auth.studentIdPlaceholder")}
                        className={inputCls}
                        maxLength={9}
                      />
                    ) : (
                      <div className="bg-[#EEF2F7] border border-[#CBD5E1] p-3 rounded-2xl flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748B]">TEMPORARY REGISTERED ID</span>
                        <span className="text-xs font-black text-[#1E3A8A] tracking-wider">{calculatedD2TempId}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* D-4 Assigned student ID indicator */
                  <div className="space-y-1.5 bg-[#EEF2F7] border border-[#CBD5E1] p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-[#64748B]">YOUR ASSIGNED D-4 ID</span>
                    <span className="text-sm font-black text-[#1E3A8A] tracking-wider">{calculatedD4Id}</span>
                  </div>
                )}

                {/* Full Name input */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A]">
                    {t("auth.nameLabel")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.namePlaceholder")}
                    className={inputCls}
                    autoComplete="name"
                  />
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A]">
                    {t("auth.passwordLabel")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.passwordPlaceholder")}
                      className={`${inputCls} pr-12`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                      aria-label="Toggle Password"
                    >
                      {showPw ? (
                        <EyeOff className="w-[18px] h-[18px]" />
                      ) : (
                        <Eye className="w-[18px] h-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password input */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#1E3A8A]">
                    {t("auth.confirmPasswordLabel")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      className={`${inputCls} pr-12`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                      aria-label="Toggle Confirm Password"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-[18px] h-[18px]" />
                      ) : (
                        <Eye className="w-[18px] h-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Agreement check */}
                <div className="flex items-start gap-3 w-full text-left pt-2.5 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setAgreed((v) => !v)}
                    className={`mt-0.5 w-4 h-4 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      agreed ? "border-[#2563EB] bg-[#2563EB]" : "border-[#CBD5E1]"
                    }`}
                  >
                    {agreed && (
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <span className="text-[11px] text-[#64748B] leading-relaxed select-none">
                    {renderTermsLine()}
                  </span>
                </div>
              </div>
            )}

            {/* Error alerts */}
            {error && (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 font-semibold"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* Success alerts */}
            {success && (
              <p
                className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-600 font-semibold"
                role="alert"
              >
                {success}
              </p>
            )}

            {/* Step navigation actions */}
            <div className="flex items-center gap-3 pt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-[14px] font-bold text-[15px] text-[#1E3A8A] bg-[#EEF2F7] hover:bg-[#E2E8F0] transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {language === "ko" ? "이전" : "Back"}
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="flex-1 py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                    boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                  }}
                >
                  {language === "ko" ? "다음" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !isStep3Valid}
                  className="flex-1 py-3.5 rounded-[14px] font-bold text-[15px] text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
                    boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                  }}
                >
                  {submitting ? t("auth.creatingAccount") : t("auth.createAccount")}
                </button>
              )}
            </div>

            {/* Back link */}
            <p className="text-center text-[13px] text-[#64748B] pt-1">
              {t("auth.alreadyHave")}{" "}
              <Link
                to="/login"
                className="text-[#2563EB] font-semibold hover:text-[#1E3A8A] transition-colors"
              >
                {t("auth.login")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
