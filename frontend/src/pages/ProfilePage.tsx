import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import {
  INTEREST_OPTIONS,
  ACADEMIC_HIERARCHY,
  NATIONALITY_OPTIONS,
} from "@/data/options";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import pnuCharacter from "@/assets/pnu-character.png";
import {
  User,
  Globe,
  LogOut,
  Bell,
  Database,
  ChevronRight,
  ChevronLeft,
  Lock,
  BookOpen,
  FileText,
  Plane,
  Bookmark,
  Inbox,
  HelpCircle,
  Settings,
} from "lucide-react";

function yearLabelFromStudentId(studentId?: string, studentType?: string): string {
  if (!studentId || studentId.length < 4) {
    return studentType === "Freshman" ? "1st Year" : "Student";
  }
  const intakeYear = Number(studentId.slice(0, 4));
  if (!Number.isFinite(intakeYear)) {
    return studentType === "Freshman" ? "1st Year" : "Student";
  }
  const now = new Date();
  const academicYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  const year = Math.max(1, Math.min(6, academicYear - intakeYear + 1));
  const ordinal =
    year === 1 ? "1st" : year === 2 ? "2nd" : year === 3 ? "3rd" : `${year}th`;
  return `${ordinal} Year`;
}

export function ProfilePage() {
  const { user, logout, refreshUser, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [activeSubView, setActiveSubView] = useState<
    "menu" | "profile" | "language" | "account" | "visa" | "settings"
  >("menu");
  const [unreadCount, setUnreadCount] = useState(0);

  // Base details
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [major, setMajor] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [intakeTerm, setIntakeTerm] = useState<"March" | "September">("March");

  // Expanded contact details
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [visaStatus, setVisaStatus] = useState("");

  // Security settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setNationality(user.nationality);
    setMajor(user.major);
    setInterests(user.interests);
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setVisaStatus(user.visaStatus || "");
    setCompletedCourses(user.completed_courses || []);
    setDeletionRequested(user.deletion_requested || false);
    setIntakeTerm(user.intake_term || "March");

    // Resolve College and Department from user's current major
    if (user.major) {
      for (const college of ACADEMIC_HIERARCHY) {
        for (const dept of college.departments) {
          if (dept.majors.includes(user.major)) {
            setSelectedCollege(college.name);
            setSelectedDept(dept.name);
            break;
          }
        }
      }
    }
  }, [user]);

  useEffect(() => {
    api
      .getNotifications()
      .then((items) => setUnreadCount(items.length))
      .catch(() => setUnreadCount(0));
  }, []);

  // Load all catalog courses when editing profile
  useEffect(() => {
    if (activeSubView === "profile") {
      api.getCourses()
        .then((data) => {
          setAllCourses(data || []);
        })
        .catch((err) => {
          console.error("Failed to load courses for checklist:", err);
        });
    }
  }, [activeSubView]);

  function toggleInterest(tag: string) {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function toggleCompletedCourse(courseName: string) {
    setCompletedCourses((prev) =>
      prev.includes(courseName)
        ? prev.filter((c) => c !== courseName)
        : [...prev, courseName],
    );
  }

  async function handleRequestDeletion() {
    if (!user) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to request account deletion? This will ask the administrator to permanently delete your profile, checklists, class schedules, and forum posts/comments. This action is irreversible."
    );
    if (!confirmDelete) return;

    setRequestingDelete(true);
    try {
      await api.requestAccountDeletion(user.studentId);
      setDeletionRequested(true);
      setMessage("Account deletion request has been submitted successfully to the administrator.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Failed to request account deletion.");
    } finally {
      setRequestingDelete(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (activeSubView === "profile" && (!name.trim() || !nationality || !major)) {
      setError(t("profile.requiredError"));
      return;
    }

    if (activeSubView === "account" && newPassword) {
      if (!currentPassword) {
        setError("Current password is required to change password.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t("profile.passwordMismatch"));
        return;
      }
    }

    setSaving(true);
    try {
      await api.updateProfile({
        name: name.trim(),
        nationality,
        major,
        interests,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        visaStatus: visaStatus || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
        completed_courses: completedCourses,
        intake_term: intakeTerm,
      });
      await refreshUser();

      // Clear password inputs on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(t("profile.saveSuccess"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  }

  // ── VIEW 1: Main Menu Directory ───────────────────────────────────────────
  if (activeSubView === "menu") {
    const yearMajor = [
      yearLabelFromStudentId(user?.studentId, user?.studentType),
      user?.major,
    ]
      .filter(Boolean)
      .join(" • ");

    const infoRows = [
      {
        key: "personal",
        label: t("profile.personalInfo"),
        icon: User,
        onClick: () => {
          setError("");
          setMessage("");
          setActiveSubView("profile");
        },
      },
      {
        key: "records",
        label: t("profile.academicRecords"),
        icon: BookOpen,
        onClick: () => navigate("/profile/academic-records"),
      },
      {
        key: "documents",
        label: t("profile.documents"),
        icon: FileText,
        onClick: () => navigate("/profile/documents"),
      },
      {
        key: "visa",
        label: t("profile.visaInfo"),
        icon: Plane,
        onClick: () => {
          setError("");
          setMessage("");
          setActiveSubView("visa");
        },
      },
    ];

    const activityRows = [
      {
        key: "notifications",
        label: t("profile.notifications"),
        icon: Bell,
        badge: unreadCount,
        onClick: () => navigate("/notifications"),
      },
      {
        key: "saved",
        label: t("profile.saved"),
        icon: Bookmark,
        onClick: () => navigate("/profile/saved"),
      },
      {
        key: "requests",
        label: t("profile.requests"),
        icon: Inbox,
        onClick: () => navigate("/profile/requests"),
      },
      {
        key: "help",
        label: t("profile.helpSupport"),
        icon: HelpCircle,
        onClick: () => navigate("/support"),
      },
    ];

    return (
      <div>
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <h1 className="text-[22px] font-bold tracking-tight text-pnu-text">
            {t("nav.profile")}
          </h1>
          <button
            type="button"
            onClick={() => setActiveSubView("settings")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-pnu-muted shadow-sm ring-1 ring-black/5"
            aria-label={t("profile.settings")}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-4 py-4">
          <div className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-black/5">
            <img
              src={pnuCharacter}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-pnu-blue/15"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[17px] font-semibold tracking-tight text-pnu-text">
                {user?.name || "Student"}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-pnu-muted">{yearMajor}</p>
              <p className="mt-1 truncate text-[12px] font-medium text-pnu-text">
                {user?.studentId}
              </p>
              {user?.email ? (
                <p className="truncate text-[12px] text-pnu-muted">{user.email}</p>
              ) : null}
            </div>
          </div>

          <div>
            <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-pnu-muted">
              {t("profile.myInformation")}
            </h2>
            <div className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5 divide-y divide-black/5">
              {infoRows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={row.onClick}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#F2F2F7]"
                >
                  <div className="flex items-center gap-3 text-pnu-text">
                    <row.icon className="h-5 w-5 shrink-0 text-pnu-blue" />
                    <span className="text-[15px] font-medium">{row.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-pnu-muted/60" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-pnu-muted">
              {t("profile.myActivities")}
            </h2>
            <div className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5 divide-y divide-black/5">
              {activityRows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={row.onClick}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#F2F2F7]"
                >
                  <div className="flex items-center gap-3 text-pnu-text">
                    <row.icon className="h-5 w-5 shrink-0 text-pnu-blue" />
                    <span className="text-[15px] font-medium">{row.label}</span>
                    {"badge" in row && row.badge && row.badge > 0 ? (
                      <span className="rounded-full bg-[#FF3B30] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {row.badge > 99 ? "99+" : row.badge}
                      </span>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 text-pnu-muted/60" />
                </button>
              ))}

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#F2F2F7]"
                >
                  <div className="flex items-center gap-3 text-pnu-text">
                    <Database className="h-5 w-5 shrink-0 text-pnu-blue" />
                    <span className="text-[15px] font-medium">Admin Knowledge Portal</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-pnu-muted/60" />
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("profile.logoutConfirm"))) {
                logout();
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#FF3B30]/10 px-4 py-3.5 text-[15px] font-semibold text-[#FF3B30] active:bg-[#FF3B30]/15"
          >
            <LogOut className="h-5 w-5" />
            {t("profile.logout")}
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW: Settings (Account + Language shortcuts) ─────────────────────────
  if (activeSubView === "settings") {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col bg-pnu-surface">
        <header className="sticky top-0 z-10 border-b border-pnu-border bg-pnu-surface/95 px-4 py-3.5 backdrop-blur">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveSubView("menu")}
              className="flex items-center text-sm font-semibold text-pnu-blue"
            >
              <ChevronLeft className="mr-0.5 h-5 w-5" />
              {t("common.back")}
            </button>
            <h1 className="flex-1 pr-12 text-center text-sm font-bold text-pnu-text">
              {t("profile.settings")}
            </h1>
          </div>
        </header>
        <div className="space-y-3 px-4 py-4">
          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setActiveSubView("account");
            }}
            className="flex w-full items-center justify-between rounded-[18px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-pnu-blue" />
              <span className="text-[15px] font-medium text-pnu-text">
                {t("profile.tabAccount") || "Account & Security"}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-pnu-muted/60" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView("language")}
            className="flex w-full items-center justify-between rounded-[18px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-pnu-blue" />
              <span className="text-[15px] font-medium text-pnu-text">
                {t("profile.language")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-pnu-blue/10 px-2.5 py-0.5 text-[11px] font-bold uppercase text-pnu-blue">
                {language}
              </span>
              <ChevronRight className="h-4 w-4 text-pnu-muted/60" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW: Visa Information ────────────────────────────────────────────────
  if (activeSubView === "visa") {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col bg-pnu-surface">
        <header className="sticky top-0 z-10 border-b border-pnu-border bg-pnu-surface/95 px-4 py-3.5 backdrop-blur">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setActiveSubView("menu");
              }}
              className="flex items-center text-sm font-semibold text-pnu-blue"
            >
              <ChevronLeft className="mr-0.5 h-5 w-5" />
              {t("common.back")}
            </button>
            <h1 className="flex-1 pr-12 text-center text-sm font-bold text-pnu-text">
              {t("profile.visaInfo")}
            </h1>
          </div>
        </header>
        <form onSubmit={handleSave} className="space-y-4 px-4 py-5">
          {message ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : null}
          <Card className="space-y-3 p-4">
            <label className="block text-[13px] font-semibold text-pnu-text">
              {t("profile.visaSelection") || "Visa status"}
            </label>
            <select
              value={visaStatus}
              onChange={(e) => setVisaStatus(e.target.value)}
              className="w-full rounded-xl border border-pnu-border bg-white px-3 py-2.5 text-sm text-pnu-text"
            >
              <option value="">Select visa</option>
              <option value="D-2">D-2</option>
              <option value="D-4">D-4</option>
              <option value="None">None</option>
            </select>
            <p className="text-[12px] leading-relaxed text-pnu-muted">
              {t("profile.visaHint")}
            </p>
          </Card>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? t("common.loading") : t("profile.save")}
          </Button>
        </form>
      </div>
    );
  }

  // ── VIEW 2: Language Selection Subview ──────────────────────────────────
  if (activeSubView === "language") {
    const handleLangSelect = async (code: "en" | "ko" | "zh") => {
      try {
        setLanguage(code);
        if (user?.studentId) {
          await api.updateLanguagePreference(user.studentId, code);
        }
      } catch (err) {
        console.error("Failed to sync language selection to DB:", err);
      }
    };

    return (
      <div className="flex flex-col bg-pnu-surface min-h-[calc(100dvh-56px)]">
        <header className="sticky top-0 z-10 border-b border-pnu-border bg-pnu-surface/95 px-4 py-3.5 backdrop-blur">
          <div className="flex items-center">
            <button
              onClick={() => setActiveSubView("menu")}
              className="flex items-center text-sm font-semibold text-pnu-blue hover:text-pnu-blue-light"
            >
              <ChevronLeft className="mr-0.5 h-5 w-5" />
              Back
            </button>
            <h1 className="flex-1 text-center pr-12 text-sm font-bold text-pnu-text">
              Language Settings
            </h1>
          </div>
        </header>

        <div className="px-5 py-5 space-y-4 animate-fade-in">
          <p className="text-xs text-pnu-muted leading-relaxed">
            Select your preferred display language for announcements, countdown
            checklists, and AI assistant interactions.
          </p>

          <div className="bg-white border border-pnu-border rounded-2xl shadow-sm overflow-hidden divide-y divide-pnu-border/80">
            {/* English */}
            <button
              onClick={() => handleLangSelect("en")}
              className={[
                "w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left",
                language === "en"
                  ? "bg-pnu-blue/5 text-pnu-blue"
                  : "text-pnu-text",
              ].join(" ")}
            >
              <span className="text-xs font-semibold">English (EN)</span>
              {language === "en" && (
                <span className="h-2 w-2 rounded-full bg-pnu-blue" />
              )}
            </button>

            {/* Korean */}
            <button
              onClick={() => handleLangSelect("ko")}
              className={[
                "w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left",
                language === "ko"
                  ? "bg-pnu-blue/5 text-pnu-blue"
                  : "text-pnu-text",
              ].join(" ")}
            >
              <span className="text-xs font-semibold">한국어 (KO)</span>
              {language === "ko" && (
                <span className="h-2 w-2 rounded-full bg-pnu-blue" />
              )}
            </button>

            {/* Chinese */}
            <button
              onClick={() => handleLangSelect("zh")}
              className={[
                "w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left",
                language === "zh"
                  ? "bg-pnu-blue/5 text-pnu-blue"
                  : "text-pnu-text",
              ].join(" ")}
            >
              <span className="text-xs font-semibold">中文 (ZH)</span>
              {language === "zh" && (
                <span className="h-2 w-2 rounded-full bg-pnu-blue" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW 3: Account & Security Subview ─────────────────────────────────
  if (activeSubView === "account") {
    return (
      <div className="flex flex-col bg-pnu-surface min-h-[calc(100dvh-56px)]">
        <header className="sticky top-0 z-10 border-b border-pnu-border bg-pnu-surface/95 px-4 py-3.5 backdrop-blur">
          <div className="flex items-center">
            <button
              onClick={() => {
                setError("");
                setMessage("");
                setActiveSubView("menu");
              }}
              className="flex items-center text-sm font-semibold text-pnu-blue hover:text-pnu-blue-light"
            >
              <ChevronLeft className="mr-0.5 h-5 w-5" />
              Back
            </button>
            <h1 className="flex-1 text-center pr-12 text-sm font-bold text-pnu-text">
              {t("profile.tabAccount") || "Account & Security"}
            </h1>
          </div>
        </header>

        <form
          className="space-y-5 px-5 py-5 animate-fade-in"
          onSubmit={handleSave}
        >
          {/* Contact Details */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-pnu-border shadow-sm">
            <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
              Contact Information
            </h3>
            <Input
              label="Email Address"
              type="email"
              placeholder={t("profile.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label={t("profile.phone")}
              placeholder={t("profile.phonePlaceholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Password Settings */}
          <div className="space-y-4 bg-white p-5 rounded-2xl border border-pnu-border shadow-sm">
            <h3 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
              {t("profile.securityTitle")}
            </h3>
            <Input
              type="password"
              label={t("profile.currentPassword")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              label={t("profile.newPassword")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              label={t("profile.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Status Prompts */}
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 font-semibold">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-semibold">
              {message}
            </p>
          ) : null}

          <Button type="submit" fullWidth disabled={saving}>
            {saving ? t("profile.saving") : t("profile.save")}
          </Button>

          {/* Danger Zone: Account Deletion */}
          <div className="space-y-4 bg-red-50/50 p-5 rounded-2xl border border-red-200/60 shadow-sm mt-4 text-left">
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              Danger Zone
            </h3>
            <p className="text-[11px] text-red-600/85 leading-relaxed">
              Once you request account deletion, the administrator will permanently delete your profile and wipe all related checklists, class schedules, and forum posts/comments. This action is irreversible.
            </p>
            {deletionRequested ? (
              <div className="flex items-center justify-center rounded-xl bg-red-100/70 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700">
                Deletion Request Pending Admin Review
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestDeletion}
                disabled={requestingDelete}
                className="w-full flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white shadow hover:bg-red-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                {requestingDelete ? "Submitting Request..." : "Request Account Deletion"}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ── VIEW 4: Profile Edit Subview ─────────────────────────────────────────
  return (
    <div className="flex flex-col bg-pnu-surface min-h-[calc(100dvh-56px)]">
      <header className="sticky top-0 z-10 border-b border-pnu-border bg-pnu-surface/95 px-4 py-3.5 backdrop-blur">
        <div className="flex items-center">
          <button
            onClick={() => {
              setError("");
              setMessage("");
              setActiveSubView("menu");
            }}
            className="flex items-center text-sm font-semibold text-pnu-blue hover:text-pnu-blue-light"
          >
            <ChevronLeft className="mr-0.5 h-5 w-5" />
            Back
          </button>
          <h1 className="flex-1 text-center pr-12 text-sm font-bold text-pnu-text">
            Profile Settings
          </h1>
        </div>
      </header>

      <form
        className="space-y-5 px-5 py-5 animate-fade-in"
        onSubmit={handleSave}
      >
        {/* Profile Statistics Dashboard Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pnu-muted">
              {t("profile.studentId")}
            </p>
            <p className="mt-1 text-sm font-semibold text-pnu-text truncate">
              {user?.studentId}
            </p>
          </Card>
          <Card>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pnu-muted">
              {t("profile.status")}
            </p>
            <p className="mt-1 text-sm font-semibold text-pnu-text truncate">
              {user?.studentType === "Freshman"
                ? t("auth.demoFreshman")
                : t("auth.demoNonFreshman")}
            </p>
          </Card>
          <Card>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pnu-muted">
              {t("profile.visa")}
            </p>
            <p className="mt-1 text-sm font-semibold text-pnu-text truncate">
              {user?.visaStatus || "None"}
            </p>
          </Card>
        </div>

        {/* Basic Personal Profile Inputs */}
        <Input
          label={t("profile.fullName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3.5">
          {/* Nationality Picker */}
          <div className="space-y-1.5">
            <label
              htmlFor="nationality"
              className="block text-sm font-medium text-pnu-text"
            >
              {t("profile.nationality")}
            </label>
            <select
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20"
            >
              <option value="">{t("profile.selectNationality")}</option>
              {NATIONALITY_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Visa Selection dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="visaStatus"
              className="block text-sm font-medium text-pnu-text"
            >
              {t("profile.visaSelection")}
            </label>
            <select
              id="visaStatus"
              value={visaStatus}
              onChange={(e) => setVisaStatus(e.target.value)}
              className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20"
            >
              <option value="">None</option>
              <option value="D-2">D-2 Student Visa</option>
              <option value="D-4">D-4 Language Trainee</option>
              <option value="D-10">D-10 Job Seeker</option>
              <option value="F-2">F-2 Resident</option>
            </select>
          </div>
        </div>

        {/* Academic Hierarchy: College -> Department -> Major */}
        <div className="space-y-3.5 border-t border-pnu-border/40 pt-4 mt-2">
          <h3 className="text-xs font-bold text-pnu-text uppercase tracking-wider mb-1">
            Academic Fields
          </h3>

          {/* College Select */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-pnu-text flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-pnu-muted" />
              College
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => {
                setSelectedCollege(e.target.value);
                setSelectedDept("");
                setMajor("");
              }}
              className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20"
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
            <label className="block text-sm font-medium text-pnu-text flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-pnu-muted" />
              Department
            </label>
            <select
              value={selectedDept}
              disabled={!selectedCollege}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setMajor("");
              }}
              className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20 disabled:opacity-65"
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
            <label className="block text-sm font-medium text-pnu-text flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-pnu-muted" />
              {t("profile.major")}
            </label>
            <select
              value={major}
              disabled={!selectedDept}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20 disabled:opacity-65"
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

          {/* Intake Details & Predicted Status */}
          <div className="grid grid-cols-2 gap-3 mt-3 border-t border-pnu-border/40 pt-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-sm font-medium text-pnu-text">Intake Year</label>
              <div className="w-full rounded-xl border border-pnu-border bg-slate-50 px-3.5 py-3 text-sm text-pnu-muted font-bold select-none">
                {parseInt(user?.studentId?.substring(0, 4) || "2024")}
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="block text-sm font-medium text-pnu-text">Intake Term</label>
              <select
                value={intakeTerm}
                onChange={(e) => setIntakeTerm(e.target.value as any)}
                className="w-full rounded-xl border border-pnu-border bg-white px-3.5 py-3 text-sm outline-none focus:border-pnu-blue-light focus:ring-2 focus:ring-pnu-blue-light/20 font-bold"
              >
                <option value="March">Spring (March)</option>
                <option value="September">Fall (September)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Academic standing calculation card */}
          {(() => {
            const parsedIntakeYear = parseInt(user?.studentId?.substring(0, 4) || "2024");
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;

            let semestersCompleted = 0;
            let iterYear = parsedIntakeYear;
            let iterTerm = intakeTerm;

            while (iterYear < currentYear || (iterYear === currentYear && (
              iterTerm === "March" && currentMonth >= 7
            ))) {
              semestersCompleted++;
              if (iterTerm === "March") {
                iterTerm = "September";
              } else {
                iterTerm = "March";
                iterYear++;
              }
            }

            const upcomingSem = (currentMonth >= 3 && currentMonth <= 8) ? "Fall" : "Spring";
            const upcomingSemTermStr = upcomingSem === "Fall" ? "2nd Semester" : "1st Semester";

            const nextSemesterNumber = semestersCompleted + 1;
            const enteringYearNum = Math.min(4, Math.ceil(nextSemesterNumber / 2));
            const enteringYearStr = enteringYearNum === 1 ? "1st Year"
                                  : enteringYearNum === 2 ? "2nd Year"
                                  : enteringYearNum === 3 ? "3rd Year"
                                  : "4th Year";

            const targetRecommendationLabel = `${enteringYearStr} - ${upcomingSemTermStr}`;

            return (
              <div className="mt-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 text-left space-y-1.5 animate-fade-in">
                <p className="text-xs font-bold text-[#1E3A8A]">
                  Predicted Academic Standing
                </p>
                <p className="text-[11px] text-[#2563EB] font-bold leading-normal">
                  Based on entering PNU in {intakeTerm === "March" ? "March" : "September"} {parsedIntakeYear}, you have completed <span className="underline">{semestersCompleted} semesters</span>.
                </p>
                <p className="text-[11px] text-pnu-muted leading-relaxed font-medium">
                  For next semester (starting {upcomingSem === "Fall" ? "September" : "March"} {currentYear}), you will enter your <span className="text-pnu-text font-bold">{enteringYearStr} (calendar {upcomingSemTermStr})</span>. The AI counselor will recommend courses targeting <span className="text-pnu-primary font-bold">{targetRecommendationLabel}</span>.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Completed Courses Checklist (only for Current/Non-Freshman students) */}
        {user?.studentType !== "Freshman" && allCourses.length > 0 && (
          <div className="space-y-2 border-t border-pnu-border/40 pt-4 mt-2 text-left animate-fade-in">
            <label className="block text-sm font-semibold text-pnu-text">
              Completed Courses Checklist
            </label>
            <p className="text-[11px] text-pnu-muted leading-relaxed">
              Check off all courses you have already completed. The AI counselor will review this list to avoid recommending subjects you have already taken!
            </p>
            <div className="mt-2.5 bg-white border border-pnu-border rounded-xl overflow-hidden divide-y divide-pnu-border/50 shadow-sm max-h-[220px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {Array.from(new Map(allCourses.map((c) => [c.nameEn || c.nameKo, c])).values()).map((c) => {
                const isChecked = completedCourses.includes(c.nameEn || c.nameKo);
                const courseLabel = c.nameEn || c.nameKo;
                return (
                  <label
                    key={c.id || c.course_id}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-pnu-text truncate">{courseLabel}</p>
                      <p className="text-[10px] text-pnu-muted mt-0.5 font-medium">{c.credits} Credits • {c.department || c.type}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCompletedCourse(courseLabel)}
                      className="h-4.5 w-4.5 rounded-[5px] border-pnu-border text-pnu-blue focus:ring-pnu-blue cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Interest Chips */}
        <div className="space-y-2 border-t border-pnu-border/40 pt-4 mt-2">
          <p className="text-sm font-medium text-pnu-text">
            {t("profile.interests")}
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((tag) => {
              const active = interests.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-pnu-blue text-white"
                      : "border border-pnu-border bg-white text-pnu-muted hover:text-pnu-text",
                  ].join(" ")}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Error / Success Prompts */}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 font-semibold">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-semibold">
            {message}
          </p>
        ) : null}

        {/* Save Triggers */}
        <Button type="submit" fullWidth disabled={saving}>
          {saving ? t("profile.saving") : t("profile.save")}
        </Button>
      </form>
    </div>
  );
}
