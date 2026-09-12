import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import AppLayout from "../../components/layout/AppLayout";
import { userNavItems } from "../../router/navItems";
import { api } from "../../api/client";
import { ShieldCheck, ShieldOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TwoFactorSetupPage() {
  const [enabled, setEnabled] = useState(null); // null = loading
  const [step, setStep] = useState("idle"); // idle | scanning | disabling
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/2fa/status").then((data) => setEnabled(!!data.enabled)).catch(() => setEnabled(false));
  }, []);

  async function startSetup() {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await api.post("/2fa/setup", {});
      setSecret(data.secret);
      const dataUrl = await QRCode.toDataURL(data.provisioningUri, { width: 220, margin: 1 });
      setQrDataUrl(dataUrl);
      setStep("scanning");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/2fa/confirm", { code });
      setEnabled(true);
      setStep("idle");
      setCode("");
      setQrDataUrl(null);
      setSuccess("Two-factor authentication is now enabled on your account.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function disableTwoFactor(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/2fa/disable", { password });
      setEnabled(false);
      setStep("idle");
      setPassword("");
      setSuccess("Two-factor authentication has been disabled.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-white mb-1">Security</h1>
          <p className="text-sm text-ink-muted dark:text-inkDark-muted mb-6">
            Add an extra layer of protection to your account with an authenticator app.
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/8 px-4 py-3.5 text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-success/25 bg-success/8 px-4 py-3.5 text-success">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6">
            {enabled === null ? (
              <div className="flex items-center gap-2 text-ink-muted dark:text-inkDark-muted text-sm">
                <Loader2 size={16} className="animate-spin" /> Checking status…
              </div>
            ) : step === "scanning" ? (
              <form onSubmit={confirmCode} className="space-y-4">
                <p className="text-sm text-ink dark:text-inkDark">
                  Scan this QR code with Google Authenticator, Authy, or any TOTP app:
                </p>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="2FA QR code" className="mx-auto rounded-lg" />
                )}
                <p className="text-xs text-ink-muted dark:text-inkDark-muted text-center">
                  Can't scan it? Enter this code manually: <span className="font-mono">{secret}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter the 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-center text-lg tracking-widest text-ink dark:text-white outline-none focus:border-brand-blue"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Confirm & Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("idle"); setQrDataUrl(null); setCode(""); }}
                  className="w-full text-center text-sm text-ink-muted dark:text-inkDark-muted"
                >
                  Cancel
                </button>
              </form>
            ) : step === "disabling" ? (
              <form onSubmit={disableTwoFactor} className="space-y-4">
                <p className="text-sm text-ink dark:text-inkDark">
                  Enter your password to turn off two-factor authentication.
                </p>
                <input
                  type="password"
                  placeholder="Current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-white outline-none focus:border-brand-blue"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-danger py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {loading ? "Disabling…" : "Disable 2FA"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("idle"); setPassword(""); }}
                  className="w-full text-center text-sm text-ink-muted dark:text-inkDark-muted"
                >
                  Cancel
                </button>
              </form>
            ) : enabled ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">2FA is enabled</p>
                    <p className="text-xs text-ink-muted dark:text-inkDark-muted">Your account requires a code at login</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep("disabling")}
                  className="text-sm font-semibold text-danger"
                >
                  Disable
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted">
                    <ShieldOff size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-white">2FA is off</p>
                    <p className="text-xs text-ink-muted dark:text-inkDark-muted">Turn it on for extra account protection</p>
                  </div>
                </div>
                <button
                  onClick={startSetup}
                  disabled={loading}
                  className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {loading ? "…" : "Enable"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
