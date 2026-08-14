import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import FormInput from "../../components/shared/FormInput";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Landmark, CheckCircle2, XCircle, Info, Clock, Wallet } from "lucide-react";

const badgeStyles = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-brand-blue/10 text-brand-bluelight",
  DENIED: "bg-dangerDark/10 text-dangerDark",
  REPAID: "bg-successDark/10 text-successDark",
};

export default function LoanRequestPage() {
  const { actor, account, accounts, selectAccount, refreshAccount } = useAuth();
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [myLoans, setMyLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [repayingId, setRepayingId] = useState(null);

  const loadLoans = () => {
    setLoansLoading(true);
    api.get("/my-loans")
      .then((d) => setMyLoans(d.loans || []))
      .catch(() => setMyLoans([]))
      .finally(() => setLoansLoading(false));
  };

  useEffect(() => { loadLoans(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      await api.post("/loan-request", { accountNo: account?.account_no, amount: Number(amount) });
      setResult({ success: true, message: "Loan request submitted for review." });
      setAmount("");
      loadLoans();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (loanId) => {
    setRepayingId(loanId);
    setResult(null);
    try {
      const data = await api.post(`/loan-requests/${encodeURIComponent(loanId)}/repay`, {});
      setResult({ success: true, message: data.message || "Loan repaid successfully." });
      loadLoans();
      refreshAccount();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setRepayingId(null);
    }
  };

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400">
              <Landmark size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Request a Loan</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Reviewed by an officer or admin</p>
            </div>
          </div>

          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-blue/15 bg-brand-blue/5 px-4 py-4">
            <Info size={16} className="mt-0.5 text-brand-bluelight shrink-0" />
            <div>
              <p className="text-sm font-semibold text-ink dark:text-inkDark">How it works</p>
              <p className="text-xs text-ink-muted dark:text-inkDark-muted mt-0.5 leading-relaxed">
                Submit your request and an officer or admin will review it. Once approved, the amount is credited to your account automatically. You can repay it in full any time from the list below.
              </p>
            </div>
          </div>

          {!account && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3.5">
              <XCircle size={16} className="text-amber-500 shrink-0" />
              <span className="text-sm text-amber-600 dark:text-amber-400">You need an active account to request a loan.</span>
            </div>
          )}

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

          <form onSubmit={handleSubmit} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 space-y-4 mb-8">
            {accounts.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted dark:text-inkDark-muted">From account</label>
                <select
                  value={account?.account_no || ""}
                  onChange={(e) => selectAccount(e.target.value)}
                  className="input-base font-mono"
                >
                  {accounts.map((a) => (
                    <option key={a.account_no} value={a.account_no}>
                      {a.account_no} — {a.account_type} (${Number(a.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <FormInput label="Loan amount" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={!account || loading}
              className="w-full rounded-xl bg-gradient-brand py-3.5 text-sm font-bold text-white btn-glow disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Submitting…
                </span>
              ) : "Submit Loan Request"}
            </motion.button>
          </form>

          {/* My loans */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">Your Loans</p>

            {loansLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-4 animate-pulse h-16" />
                ))}
              </div>
            ) : myLoans.length === 0 ? (
              <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-8 text-center">
                <Wallet size={24} className="mx-auto mb-2 text-ink-muted/30 dark:text-inkDark-muted/30" />
                <p className="text-sm text-ink-muted dark:text-inkDark-muted">No loan requests yet.</p>
              </div>
            ) : (
              <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden divide-y divide-black/4 dark:divide-white/4">
                {myLoans.map((loan) => (
                  <div key={loan.loan_id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink dark:text-inkDark font-mono">${Number(loan.amount).toFixed(2)}</p>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted font-mono">{loan.account_no}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[loan.status] || badgeStyles.PENDING}`}>
                        {loan.status}
                      </span>
                      {loan.status === "APPROVED" && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={repayingId === loan.loan_id}
                          onClick={() => handleRepay(loan.loan_id)}
                          className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {repayingId === loan.loan_id ? (
                            <span className="flex items-center gap-1.5"><Clock size={12} className="animate-spin" /> Repaying…</span>
                          ) : "Repay Loan"}
                        </motion.button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}