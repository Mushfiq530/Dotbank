import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { TrendingUp, TrendingDown, Zap, BarChart3 } from "lucide-react";

const typeMap = {
  DEPOSIT: "deposit",
  WITHDRAW: "withdrawal",
  TRANSFER: "withdrawal",
  BILL_PAYMENT: "billPayment",
};

const stats = [
  { key: "deposit", label: "Deposits", icon: TrendingUp, color: "text-successDark", bg: "bg-successDark/8" },
  { key: "withdrawal", label: "Withdrawals", icon: TrendingDown, color: "text-dangerDark", bg: "bg-dangerDark/8" },
  { key: "billPayment", label: "Bills Paid", icon: Zap, color: "text-brand-bluelight", bg: "bg-brand-blue/8" },
];

export default function MiniStatementPage() {
  const { actor, account, accounts, selectAccount } = useAuth();
  const [byMonth, setByMonth] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    api.get(`/transactions?accountNo=${encodeURIComponent(account.account_no)}`).then((data) => {
      const groups = {};
      for (const t of data.transactions || []) {
        const month = new Date(t.transaction_time).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        groups[month] ??= { month, deposit: 0, withdrawal: 0, billPayment: 0 };
        const bucket = typeMap[t.transaction_type];
        if (bucket) groups[month][bucket] += Number(t.amount);
      }
      setByMonth(Object.values(groups));
    }).catch(() => setByMonth([])).finally(() => setLoading(false));
  }, [account]);

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-successDark to-teal-400">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Mini Statement</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Monthly breakdown of account activity</p>
            </div>
          </div>

          {accounts.length > 0 && (
            <div className="mb-6">
              <label className="mb-1.5 block text-xs font-medium text-ink-muted dark:text-inkDark-muted">Account</label>
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

          {!account ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-10 text-center">
              <BarChart3 size={32} className="mx-auto mb-3 text-ink-muted/30 dark:text-inkDark-muted/30" />
              <p className="text-ink-muted dark:text-inkDark-muted">Open an account to see your statement.</p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[1,2].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-5 animate-pulse">
                  <div className="h-4 w-32 bg-black/5 dark:bg-white/5 rounded mb-4" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1,2,3].map((j) => <div key={j} className="h-10 rounded-xl bg-black/5 dark:bg-white/5" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : byMonth.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-10 text-center">
              <BarChart3 size={32} className="mx-auto mb-3 text-ink-muted/30 dark:text-inkDark-muted/30" />
              <p className="text-ink-muted dark:text-inkDark-muted">No activity yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {byMonth.map((m, idx) => {
                const maxVal = Math.max(m.deposit, m.withdrawal, m.billPayment, 1);
                return (
                  <motion.div
                    key={m.month}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.3 }}
                    className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-display text-base font-bold text-ink dark:text-inkDark">{m.month}</p>
                      <span className="text-xs text-ink-muted dark:text-inkDark-muted font-mono">
                        Net: <span className={m.deposit - m.withdrawal - m.billPayment >= 0 ? "text-successDark" : "text-dangerDark"}>
                          {m.deposit - m.withdrawal - m.billPayment >= 0 ? "+" : ""}${(m.deposit - m.withdrawal - m.billPayment).toFixed(2)}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {stats.map((s) => (
                        <div key={s.key}>
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} mb-2`}>
                            <s.icon size={16} className={s.color} />
                          </div>
                          <p className="text-[11px] text-ink-muted dark:text-inkDark-muted mb-0.5">{s.label}</p>
                          <p className={`font-mono text-sm font-bold ${s.color}`}>${m[s.key].toFixed(2)}</p>
                          {/* Mini bar */}
                          <div className="mt-2 h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(m[s.key] / maxVal) * 100}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.06 + 0.2, ease: "easeOut" }}
                              className={`h-full rounded-full ${s.key === "deposit" ? "bg-successDark" : s.key === "withdrawal" ? "bg-dangerDark" : "bg-brand-blue"}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}