import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import FormInput from "../../components/shared/FormInput";
import SuccessModal from "../../components/shared/SuccessModal";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Wallet, PiggyBank, CreditCard, AlertCircle } from "lucide-react";

const accountTypes = [
  { id: "Savings", icon: PiggyBank, desc: "Earn interest on your balance", color: "from-successDark to-teal-400" },
  { id: "Current", icon: CreditCard, desc: "Everyday transactions & transfers", color: "from-brand-blue to-blue-400" },
];

export default function OpenAccountPage() {
  const { actor, accounts, refreshAccounts } = useAuth();
  const [accountType, setAccountType] = useState("Savings");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/account-request", { accountType, initialDeposit: Number(initialDeposit) });
      setShowSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-purple-600">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Open an Account</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Reviewed and approved by an officer</p>
            </div>
          </div>

          {/* Existing accounts */}
          {accounts.length > 0 && (
            <div className="mb-5 rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted mb-3">
                Your existing account{accounts.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {accounts.map((a) => (
                  <div key={a.account_no} className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm font-semibold text-ink dark:text-inkDark">{a.account_type}</span>
                      <span className="text-xs text-ink-muted dark:text-inkDark-muted ml-2 font-mono">{a.account_no}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-ink dark:text-inkDark">${Number(a.balance).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-3 rounded-xl border border-dangerDark/25 bg-dangerDark/8 px-4 py-3.5"
            >
              <AlertCircle size={16} className="mt-0.5 text-dangerDark shrink-0" />
              <span className="text-sm text-dangerDark">{error}</span>
            </motion.div>
          )}

          {/* Account type selector */}
          <div className="mb-5">
            <p className="mb-3 text-sm font-semibold text-ink dark:text-inkDark">Choose account type</p>
            <div className="grid grid-cols-2 gap-3">
              {accountTypes.map(({ id, icon: Icon, desc, color }) => (
                <motion.button
                  key={id}
                  whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAccountType(id)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border px-4 py-5 text-center transition-all ${
                    accountType === id
                      ? "border-brand-blue/40 bg-brand-blue/8 dark:border-brand-bluelight/30 dark:bg-brand-bluelight/8"
                      : "border-black/8 dark:border-white/8 bg-white dark:bg-surfaceDark hover:border-black/15"
                  }`}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color}`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink dark:text-inkDark text-sm">{id}</p>
                    <p className="text-xs text-ink-muted dark:text-inkDark-muted mt-0.5">{desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 space-y-4">
            <FormInput
              label="Initial deposit amount"
              type="number"
              placeholder="Enter initial deposit"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
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
                  Submitting…
                </span>
              ) : "Submit Request"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <SuccessModal
        open={showSuccess}
        title="Request submitted!"
        message="Your account request is pending officer or admin approval. You'll see it once approved."
        onClose={() => { setShowSuccess(false); refreshAccounts(); }}
      />
    </AppLayout>
  );
}
