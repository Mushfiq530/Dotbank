import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import FormInput from "../../components/shared/FormInput";
import { officerNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";

export default function OfficerProfilePage() {
  const { actor } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const data = await api.post("/officer/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setResult({ success: true, message: data.message || "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout navItems={officerNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-violet-400">
              <KeyRound size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">
                {actor?.id || "Officer"}
              </h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Change your password</p>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
                  result.success
                    ? "border-successDark/25 bg-successDark/8 text-successDark"
                    : "border-dangerDark/25 bg-dangerDark/8 text-dangerDark"
                }`}
              >
                {result.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
                <span className="text-sm font-medium">{result.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 space-y-4"
          >
            <FormInput
              label="Current password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <FormInput
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <FormInput
              label="Confirm new password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-brand py-3.5 text-sm font-bold text-white btn-glow disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Updating…
                </span>
              ) : (
                "Change Password"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  );
}