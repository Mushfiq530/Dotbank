import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import AppLayout from "../../components/layout/AppLayout";
import { userNavItems } from "../../router/navItems";
import { api } from "../../api/client";
import {
  ShieldCheck,
  ShieldOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
} from "lucide-react";

const cardClass =
  "rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6";
const inputClass =
  "w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-inkDark outline-none focus:border-brand-blue";
const otpInputClass = inputClass + " text-center tracking-[0.4em] font-mono";
const primaryBtn =
  "w-full rounded-xl bg-gradient-brand py-3 text-sm font-bold text-white shadow-glowSm disabled:opacity-50";
const dangerBtn =
  "w-full rounded-xl bg-dangerDark py-3 text-sm font-bold text-white disabled:opacity-50";
const ghostBtn =
  "w-full py-2 text-center text-xs font-semibold text-ink-muted dark:text-inkDark-muted hover:text-brand-blue dark:hover:text-brand-bluelight transition-colors disabled:opacity-50";

function Banner({ error, success }) {
  if (!error && !success) return null;
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
        error
          ? "bg-dangerDark/10 text-dangerDark"
          : "bg-successDark/10 text-successDark"
      }`}
    >
      {error ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
      <span>{error || success}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-base font-bold text-ink dark:text-inkDark">{title}</h2>
      {subtitle && <p className="text-xs text-ink-muted dark:text-inkDark-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function SecurityPage() {
  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8 space-y-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Security</h1>
          <p className="text-sm text-ink-muted dark:text-inkDark-muted mt-1">
            Manage two-factor authentication and your email address.
          </p>
        </motion.div>

        <TwoFactorSection />
        <ChangeEmailSection />
      </div>
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// Two-factor authentication: setup/enable, and disable with just your
// current password (the original, simple flow — no emailed code).
// ---------------------------------------------------------------------------
function TwoFactorSection() {
  const [enabled, setEnabled] = useState(null); // null = loading
  const [mode, setMode] = useState("idle"); // idle | setup | disable
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [manualSecret, setManualSecret] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/2fa/status")
      .then((data) => setEnabled(!!data.enabled))
      .catch(() => setEnabled(false));
  }, []);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function beginSetup() {
    resetMessages();
    setBusy(true);
    try {
      const data = await api.post("/2fa/setup", {});
      setManualSecret(data.secret);
      setQrDataUrl(await QRCode.toDataURL(data.provisioningUri, { width: 220, margin: 1 }));
      setMode("setup");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      await api.post("/2fa/confirm", { code: setupCode });
      setEnabled(true);
      setMode("idle");
      setSetupCode("");
      setQrDataUrl(null);
      setSuccess("Two-factor authentication is now enabled.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      await api.post("/2fa/disable", { password });
      setEnabled(false);
      setMode("idle");
      setPassword("");
      setSuccess("Two-factor authentication has been disabled.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeader
        title="Two-factor authentication"
        subtitle="Adds a code from an authenticator app when you sign in."
      />
      <Banner error={error} success={success} />
      <div className={cardClass}>
        {enabled === null ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted dark:text-inkDark-muted">
            <Loader2 size={16} className="animate-spin" /> Checking status…
          </div>
        ) : mode === "setup" ? (
          <form onSubmit={confirmSetup} className="space-y-4">
            <p className="text-sm text-ink dark:text-inkDark">
              Scan this with an authenticator app (Google Authenticator, Authy, etc.):
            </p>
            {qrDataUrl && <img src={qrDataUrl} alt="2FA QR code" className="mx-auto rounded-lg" />}
            <p className="text-xs text-center text-ink-muted dark:text-inkDark-muted">
              Or enter manually: <span className="font-mono">{manualSecret}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              className={otpInputClass}
            />
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Verifying…" : "Confirm & enable"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("idle"); setQrDataUrl(null); setSetupCode(""); resetMessages(); }}
              className={ghostBtn}
            >
              Cancel
            </button>
          </form>
        ) : mode === "disable" ? (
          <form onSubmit={confirmDisable} className="space-y-4">
            <p className="text-sm text-ink dark:text-inkDark">
              Enter your password to turn off two-factor authentication.
            </p>
            <input
              type="password"
              placeholder="Current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
            <button type="submit" disabled={busy} className={dangerBtn}>
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("idle"); setPassword(""); resetMessages(); }}
              className={ghostBtn}
            >
              Cancel
            </button>
          </form>
        ) : enabled ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-successDark/10 text-successDark">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink dark:text-inkDark">2FA is on</p>
                <p className="text-xs text-ink-muted dark:text-inkDark-muted">A code is required at login</p>
              </div>
            </div>
            <button onClick={() => setMode("disable")} disabled={busy} className="shrink-0 text-sm font-semibold text-dangerDark disabled:opacity-50">
              Disable
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted">
                <ShieldOff size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink dark:text-inkDark">2FA is off</p>
                <p className="text-xs text-ink-muted dark:text-inkDark-muted">Turn it on for extra protection</p>
              </div>
            </div>
            <button
              onClick={beginSetup}
              disabled={busy}
              className="shrink-0 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Enable"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Change email: blocked entirely unless 2FA is already enabled. A valid
// authenticator code is enough to change it immediately — no emailed code.
// ---------------------------------------------------------------------------
function ChangeEmailSection() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/2fa/status").then((data) => setTwoFaEnabled(!!data.enabled)).catch(() => setTwoFaEnabled(false));
    api.get("/me").then((data) => setCurrentEmail(data.email || "")).catch(() => {});
  }, []);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function submit(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/email-change", { totpCode, newEmail });
      setCurrentEmail(newEmail);
      setNewEmail("");
      setTotpCode("");
      setSuccess("Email address updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeader
        title="Change email"
        subtitle={
          twoFaEnabled === false
            ? "Enable two-factor authentication above before changing your email."
            : "Requires your authenticator code."
        }
      />
      <Banner error={error} success={success} />
      <div className={cardClass}>
        {twoFaEnabled === null ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted dark:text-inkDark-muted">
            <Loader2 size={16} className="animate-spin" /> Checking status…
          </div>
        ) : twoFaEnabled === false ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted">
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink dark:text-inkDark truncate">Current: {currentEmail}</p>
              <p className="text-xs text-ink-muted dark:text-inkDark-muted">2FA required to change this</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-xs text-ink-muted dark:text-inkDark-muted">Current: {currentEmail}</p>
            <input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Authenticator app code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className={otpInputClass}
            />
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Updating…" : "Update email"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
