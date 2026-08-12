import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import {
  ACADEMIC_HIERARCHY,
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
  Database,
  ChevronRight,
  ChevronLeft,
  Lock,
  BookOpen,
  FileText,
  Bookmark,
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

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-pnu-muted">
        {label}
      </p>
      <p className="text-[15px] font-semibold text-pnu-text break-words">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function ProfileInfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-4 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function ProfilePage() {
  const { user, logout, refreshUser, isAdmin } = useAuth();
  const { t, language, setLanguage, options, localeLoading } = useLanguage();
  const navigate = useNavigate();

  const [activeSubView, setActiveSubView] = useState<
    "menu" | "profile" | "language" | "account" | "settings"
  >("menu");

  // Contact + security (account settings only)
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setDeletionRequested(user.deletion_requested || false);
  }, [user]);

  const academicPlacement = useMemo(() => {
    if (!user?.major) {
      return { college: "", department: "" };
    }

    for (const college of ACADEMIC_HIERARCHY) {
      for (const dept of college.departments) {
        if (dept.majors.includes(user.major)) {
          return { college: college.name, department: dept.name };
        }
      }
    }

    return { college: "", department: "" };
  }, [user?.major]);

  async function handleRequestDeletion() {
    if (!user) return;
    const confirmDelete = window.confirm(t("profile.deletionConfirm"));
    if (!confirmDelete) return;

    setRequestingDelete(true);
    try {
      await api.requestAccountDeletion(user.studentId);
      setDeletionRequested(true);
      setMessage(t("profile.deletionSuccess"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || t("profile.deletionError"));
    } finally {
      setRequestingDelete(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (activeSubView === "account" && newPassword) {
      if (!currentPassword) {
        setError(t("profile.currentPasswordRequired"));
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t("profile.passwordMismatch"));
        return;
      }
    }

    if (!user) return;

    setSaving(true);
    try {
      await api.updateProfile({
        name: user?.name || "",
        nationality: user?.nationality || "",
        major: user?.major || "",
        interests: user?.interests || [],
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
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

    const menuRows = [
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
        key: "saved",
        label: t("profile.saved"),
        icon: Bookmark,
        onClick: () => navigate("/profile/saved"),
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

          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5 divide-y divide-black/5">
            {menuRows.map((row) => (
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
              {t("common.goBack")}
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

  // ── VIEW 2: Language Selection Subview ──────────────────────────────────
  if (activeSubView === "language") {
    const handleLangSelect = async (code: typeof language) => {
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
              {t("common.goBack")}
            </button>
            <h1 className="flex-1 text-center pr-12 text-sm font-bold text-pnu-text">
              {t("profile.language")}
            </h1>
          </div>
        </header>

        <div className="px-5 py-5 space-y-4 animate-fade-in">
          <p className="text-xs text-pnu-muted leading-relaxed">
            {t("profile.languageHint")}
          </p>

          <div className="bg-white border border-pnu-border rounded-2xl shadow-sm overflow-hidden divide-y divide-pnu-border/80">
            {options.map((option) => (
              <button
                key={option.code}
                type="button"
                disabled={localeLoading}
                onClick={() => handleLangSelect(option.code)}
                className={[
                  "w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left disabled:opacity-60",
                  language === option.code
                    ? "bg-pnu-blue/5 text-pnu-blue"
                    : "text-pnu-text",
                ].join(" ")}
              >
                <span className="text-xs font-semibold">
                  {option.nativeLabel} ({option.code.toUpperCase()})
                </span>
                {language === option.code ? (
                  <span className="h-2 w-2 rounded-full bg-pnu-blue" />
                ) : null}
              </button>
            ))}
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
              {t("common.goBack")}
            </button>
            <h1 className="flex-1 text-center pr-12 text-sm font-bold text-pnu-text">
              {t("profile.tabAccount")}
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
              {t("profile.contactInformation")}
            </h3>
            <Input
              label={t("profile.emailAddress")}
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
              {t("profile.dangerZone")}
            </h3>
            <p className="text-[11px] text-red-600/85 leading-relaxed">
              {t("profile.dangerZoneHint")}
            </p>
            {deletionRequested ? (
              <div className="flex items-center justify-center rounded-xl bg-red-100/70 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700">
                {t("profile.deletionPending")}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestDeletion}
                disabled={requestingDelete}
                className="w-full flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white shadow hover:bg-red-700 transition-all disabled:opacity-60 cursor-pointer"
              >
                {requestingDelete ? t("profile.submittingRequest") : t("profile.requestDeletion")}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ── VIEW 4: Personal Information (read-only official records) ─────────────
  const intakeYear = user?.studentId?.slice(0, 4) || "";
  const intakeTermLabel =
    user?.intake_term === "September"
      ? t("profile.intakeFall")
      : t("profile.intakeSpring");
  const studentStatusLabel =
    user?.studentType === "Freshman"
      ? t("auth.demoFreshman")
      : t("auth.demoNonFreshman");

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
            {t("common.goBack")}
          </button>
          <h1 className="flex-1 text-center pr-12 text-sm font-bold text-pnu-text">
            {t("profile.personalInfo")}
          </h1>
        </div>
      </header>

      <div className="space-y-4 px-5 py-5 animate-fade-in">
        <p className="rounded-xl bg-slate-100 px-3.5 py-3 text-[12px] leading-relaxed text-pnu-muted">
          {t("profile.officialInfoNotice")}
        </p>

        <ProfileInfoSection title={t("profile.contactInformation")}>
          <ReadOnlyField label={t("profile.studentId")} value={user?.studentId} />
          <ReadOnlyField label={t("profile.fullName")} value={user?.name} />
          <ReadOnlyField label={t("profile.nationality")} value={user?.nationality} />
          <ReadOnlyField label={t("profile.emailAddress")} value={user?.email} />
          <ReadOnlyField label={t("profile.phone")} value={user?.phone} />
          <ReadOnlyField label={t("profile.status")} value={studentStatusLabel} />
        </ProfileInfoSection>

        <ProfileInfoSection title={t("profile.academicFields")}>
          <ReadOnlyField label={t("profile.college")} value={academicPlacement.college} />
          <ReadOnlyField label={t("profile.department")} value={academicPlacement.department} />
          <ReadOnlyField label={t("profile.major")} value={user?.major} />
          <ReadOnlyField label={t("profile.intakeYear")} value={intakeYear} />
          <ReadOnlyField label={t("profile.intakeTerm")} value={intakeTermLabel} />
        </ProfileInfoSection>

        <ProfileInfoSection title={t("profile.visaInfo")}>
          <ReadOnlyField
            label={t("profile.visaSelection")}
            value={user?.visaStatus || t("profile.none")}
          />
          <p className="text-[12px] leading-relaxed text-pnu-muted">
            {t("profile.visaHint")}
          </p>
        </ProfileInfoSection>
      </div>
    </div>
  );
}
