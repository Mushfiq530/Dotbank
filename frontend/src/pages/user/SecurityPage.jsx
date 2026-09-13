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
  KeyRound,
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
            Manage two-factor authentication, your password, and your email address.
          </p>
        </motion.div>

        <TwoFactorSection />
        <ChangePasswordSection />
        <ChangeEmailSection />
      </div>
    </AppLayout>
  );
}

// ---------------------------------------------------------------------------
// Two-factor authentication: existing setup/enable flow, plus a disable flow
// that now requires the emailed OTP on top of the current password.
// ---------------------------------------------------------------------------
function TwoFactorSection() {
  const [enabled, setEnabled] = useState(null); // null = loading
  const [mode, setMode] = useState("idle"); // idle | setup | disable
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [manualSecret, setManualSecret] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [password, setPassword] = useState("");
  const [disableOtp, setDisableOtp] = useState("");
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

  async function beginDisable() {
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/2fa-disable/request-otp", {});
      setMode("disable");
      setSuccess("A verification code has been emailed to you.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendDisableOtp() {
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/2fa-disable/request-otp", {});
      setSuccess("A new code has been emailed to you.");
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
      await api.post("/security/2fa-disable/confirm", { password, otp: disableOtp });
      setEnabled(false);
      setMode("idle");
      setPassword("");
      setDisableOtp("");
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
              Enter your password and the code emailed to you to turn off two-factor authentication.
            </p>
            <input
              type="password"
              placeholder="Current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Emailed code"
              value={disableOtp}
              onChange={(e) => setDisableOtp(e.target.value)}
              className={otpInputClass}
            />
            <button type="submit" disabled={busy} className={dangerBtn}>
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
            <button type="button" onClick={resendDisableOtp} disabled={busy} className={ghostBtn}>
              Resend code
            </button>
            <button
              type="button"
              onClick={() => { setMode("idle"); setPassword(""); setDisableOtp(""); resetMessages(); }}
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
            <button onClick={beginDisable} disabled={busy} className="shrink-0 text-sm font-semibold text-dangerDark disabled:opacity-50">
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
// Change password: request an emailed OTP, then submit it together with the
// new password. Separate from the existing SMS-based forgot-password flow.
// ---------------------------------------------------------------------------
function ChangePasswordSection() {
  const [mode, setMode] = useState("idle"); // idle | verify
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function requestOtp() {
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/password-change/request-otp", {});
      setMode("verify");
      setSuccess("A verification code has been emailed to you.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/password-change/request-otp", {});
      setSuccess("A new code has been emailed to you.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/password-change/confirm", { otp, newPassword, confirmPassword });
      setMode("idle");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeader title="Change password" subtitle="Requires a code emailed to your registered address." />
      <Banner error={error} success={success} />
      <div className={cardClass}>
        {mode === "idle" ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted">
                <KeyRound size={18} />
              </div>
              <p className="text-sm font-semibold text-ink dark:text-inkDark">Update your password</p>
            </div>
            <button
              onClick={requestOtp}
              disabled={busy}
              className="shrink-0 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "…" : "Change"}
            </button>
          </div>
        ) : (
          <form onSubmit={confirm} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Emailed code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={otpInputClass}
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Saving…" : "Confirm new password"}
            </button>
            <button type="button" onClick={resendOtp} disabled={busy} className={ghostBtn}>
              Resend code
            </button>
            <button
              type="button"
              onClick={() => { setMode("idle"); setOtp(""); setNewPassword(""); setConfirmPassword(""); resetMessages(); }}
              className={ghostBtn}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Change email: blocked entirely unless 2FA is already enabled. Step 1
// verifies a TOTP code and sends an OTP to the NEW address; step 2 confirms
// that OTP, which is the point the email actually changes.
// ---------------------------------------------------------------------------
function ChangeEmailSection() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [mode, setMode] = useState("idle"); // idle | verify
  const [newEmail, setNewEmail] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [otp, setOtp] = useState("");
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

  async function requestChange(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/email-change/request", { totpCode, newEmail });
      setMode("verify");
      setSuccess(`A verification code has been sent to ${newEmail}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmChange(e) {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    try {
      await api.post("/security/email-change/confirm", { otp });
      setCurrentEmail(newEmail);
      setMode("idle");
      setNewEmail("");
      setTotpCode("");
      setOtp("");
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
            : "Requires your authenticator code, then a code sent to the new address."
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
        ) : mode === "idle" ? (
          <form onSubmit={requestChange} className="space-y-4">
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
              {busy ? "Sending…" : "Send code to new email"}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmChange} className="space-y-4">
            <p className="text-sm text-ink dark:text-inkDark">
              Enter the code sent to <span className="font-semibold">{newEmail}</span>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={otpInputClass}
            />
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Confirming…" : "Confirm new email"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("idle"); setOtp(""); resetMessages(); }}
              className={ghostBtn}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
