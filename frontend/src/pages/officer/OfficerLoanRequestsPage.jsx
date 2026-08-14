import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Landmark, Check, X, Clock } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { officerNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function OfficerLoanRequestsPage() {
  const { actor } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = () => api.get("/loan-requests")
    .then((d) => setLoans((d.requests || []).filter((l) => l.status === "PENDING")))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setActing(id + action);
    try {
      await api.post(`/loan-requests/${id}/${action}`, { actorName: actor?.id });
      load();
    } finally {
      setActing(null);
    }
  };

  return (
    <AppLayout navItems={officerNavItems}>
      <div className="mx-auto max-w-4xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-blue-400">
              <Landmark size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Loan Requests</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">
                {loans.length} pending request{loans.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-5 animate-pulse">
                  <div className="flex justify-between">
                    <div className="flex gap-8">
                      {[80,100].map((w) => <div key={w} className="space-y-2"><div className="h-3 rounded bg-black/5 dark:bg-white/5" style={{ width: w }} /><div className="h-2.5 rounded bg-black/5 dark:bg-white/5" style={{ width: w * 0.7 }} /></div>)}
                    </div>
                    <div className="flex gap-2"><div className="h-9 w-24 rounded-xl bg-black/5 dark:bg-white/5" /><div className="h-9 w-20 rounded-xl bg-black/5 dark:bg-white/5" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-successDark/8">
                <Check size={28} className="text-successDark" />
              </div>
              <p className="font-semibold text-ink dark:text-inkDark mb-1">All clear!</p>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">No pending loan requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((l, i) => (
                <motion.div
                  key={l.loan_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Loan ID</p>
                        <p className="text-sm font-bold text-ink dark:text-inkDark font-mono">{l.loan_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Account</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{l.account_no}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Amount</p>
                        <p className="text-sm font-mono font-bold text-ink dark:text-inkDark">${Number(l.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Requested</p>
                        <p className="text-xs text-ink-muted dark:text-inkDark-muted flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        disabled={!!acting}
                        onClick={() => act(l.loan_id, "approve")}
                        className="flex items-center gap-1.5 rounded-xl bg-successDark/10 px-4 py-2.5 text-sm font-semibold text-successDark hover:bg-successDark/20 disabled:opacity-50 transition-all"
                      >
                        {acting === l.loan_id + "approve" ? <span className="h-3.5 w-3.5 rounded-full border-2 border-successDark/30 border-t-successDark animate-spin" /> : <Check size={15} />}
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        disabled={!!acting}
                        onClick={() => act(l.loan_id, "deny")}
                        className="flex items-center gap-1.5 rounded-xl bg-dangerDark/8 px-4 py-2.5 text-sm font-semibold text-dangerDark hover:bg-dangerDark/15 disabled:opacity-50 transition-all"
                      >
                        {acting === l.loan_id + "deny" ? <span className="h-3.5 w-3.5 rounded-full border-2 border-dangerDark/30 border-t-dangerDark animate-spin" /> : <X size={15} />}
                        Reject
                      </motion.button>
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
