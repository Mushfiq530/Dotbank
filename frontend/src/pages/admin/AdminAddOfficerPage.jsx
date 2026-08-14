import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import FormInput from "../../components/shared/FormInput";
import { adminNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { UserPlus, AlertCircle, Copy, CheckCheck, KeyRound } from "lucide-react";

export default function AdminAddOfficerPage() {
  const { actor } = useAuth();
  const [form, setForm] = useState({ officerId: "", fullName: "", email: "", phone: "" });
  const [tempPassword, setTempPassword] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setTempPassword(null);
    setLoading(true);
    try {
      const data = await api.post("/officers", form);
      setTempPassword(data.temporaryPassword);
      setForm({ officerId: "", fullName: "", email: "", phone: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout navItems={adminNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-400">
              <UserPlus size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Add Officer</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">A one-time password is generated on creation</p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-3 rounded-xl border border-dangerDark/25 bg-dangerDark/8 px-4 py-3.5"
            >
              <AlertCircle size={16} className="mt-0.5 text-dangerDark shrink-0" />
              <span className="text-sm text-dangerDark">{error}</span>
            </motion.div>
          )}

          <AnimatePresence>
            {tempPassword && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-5 rounded-2xl border border-successDark/25 bg-successDark/8 p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <KeyRound size={16} className="text-successDark" />
                  <p className="font-semibold text-successDark">Officer created successfully!</p>
                </div>
                <p className="text-xs text-ink-muted dark:text-inkDark-muted mb-2">Temporary password (shown once — copy and share securely)</p>
                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-surfaceDark border border-black/8 dark:border-white/8 px-4 py-3">
                  <code className="flex-1 font-mono text-sm font-bold text-ink dark:text-inkDark">{tempPassword}</code>
                  <button onClick={copyPassword} className="flex items-center gap-1.5 rounded-lg bg-surface-sunk dark:bg-surfaceDark-raised px-2.5 py-1.5 text-xs font-semibold text-ink-muted dark:text-inkDark-muted hover:text-ink dark:hover:text-inkDark transition-colors">
                    {copied ? <CheckCheck size={13} className="text-successDark" /> : <Copy size={13} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 space-y-4">
            <FormInput label="Officer ID" placeholder="e.g. OFC-0099" value={form.officerId} onChange={update("officerId")} />
            <FormInput label="Full name" placeholder="Officer's full name" value={form.fullName} onChange={update("fullName")} />
            <FormInput label="Email" type="email" placeholder="officer@example.com" value={form.email} onChange={update("email")} />
            <FormInput label="Phone number" placeholder="01XXXXXXXXX" value={form.phone} onChange={update("phone")} />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-brand py-3.5 text-sm font-bold text-white btn-glow disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Adding officer…
                </span>
              ) : "Add Officer"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  );
}
