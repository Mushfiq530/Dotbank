import { useRef, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { User, CreditCard, Wallet, Camera, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { actor, accounts, refreshActor } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handlePictureChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("picture", file);
      await api.upload("/profile-picture", formData);
      await refreshActor();
    } catch (err) {
      setError(err.message || "Couldn't upload the picture. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  }

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Profile header */}
          <div className="mb-6 rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden">
            <div className="h-20 bg-gradient-brand" />
            <div className="px-6 pb-6">
              <div className="relative -mt-8 mb-4 inline-flex">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePictureChange}
                />
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-brand shadow-glowSm ring-4 ring-white dark:ring-surfaceDark">
                  {actor?.profilePictureUrl ? (
                    <img
                      src={actor.profilePictureUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-white" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-surfaceDark border border-black/10 dark:border-white/10 shadow-card text-ink-muted dark:text-inkDark-muted hover:text-brand-blue dark:hover:text-brand-bluelight transition-colors"
                  title="Change profile picture"
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                </button>
              </div>
              {error && (
                <p className="mb-2 text-xs font-medium text-dangerDark">{error}</p>
              )}
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">{actor?.id || "—"}</h1>
              <span className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-blue dark:text-brand-bluelight">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-blue dark:bg-brand-bluelight" />
                Personal Account
              </span>
            </div>
          </div>

          {/* Accounts */}
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-ink-muted dark:text-inkDark-muted" />
            <p className="text-sm font-semibold text-ink dark:text-inkDark">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </p>
          </div>

          {accounts.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-8 text-center">
              <CreditCard size={28} className="mx-auto mb-2 text-ink-muted/30 dark:text-inkDark-muted/30" />
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">No accounts yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((a, i) => (
                <motion.div
                  key={a.account_no}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
                        <CreditCard size={14} className="text-white" />
                      </div>
                      <span className="font-semibold text-ink dark:text-inkDark">{a.account_type}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      a.status === "BLOCKED"
                        ? "bg-dangerDark/10 text-dangerDark"
                        : "bg-successDark/10 text-successDark"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${a.status === "BLOCKED" ? "bg-dangerDark" : "bg-successDark"}`} />
                      {a.status === "BLOCKED" ? "Frozen" : "Active"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted mb-0.5">Account number</p>
                      <p className="font-mono text-sm font-semibold text-ink dark:text-inkDark">{a.account_no}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted mb-0.5">Balance</p>
                      <p className="font-mono text-sm font-bold text-ink dark:text-inkDark">${Number(a.balance).toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}