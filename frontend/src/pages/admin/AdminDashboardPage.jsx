import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Landmark, ShieldCheck, RefreshCw, ArrowRight, TrendingUp, Activity } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import StatCard from "../../components/shared/StatCard";
import { adminNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const typeColors = {
  DEPOSIT: "text-successDark",
  WITHDRAW: "text-dangerDark",
  TRANSFER: "text-dangerDark",
  BILL_PAYMENT: "text-brand-bluelight",
};

export default function AdminDashboardPage() {
  const { actor } = useAuth();
  const [stats, setStats] = useState({ users: 0, approvedLoans: 0, officers: 0 });
  const [transactions, setTransactions] = useState([]);
  const [spin, setSpin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [users, officers, loans, txns] = await Promise.all([
      api.get("/users"),
      api.get("/officers"),
      api.get("/loan-requests"),
      api.get("/admin/transactions"),
    ]);
    setStats({
      users: (users.users || []).length,
      officers: (officers.officers || []).length,
      approvedLoans: (loans.requests || []).filter((l) => l.status === "APPROVED").length,
    });
    setTransactions(txns.transactions || []);
  };

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, []);

  const refresh = () => {
    setSpin(true);
    loadAll().finally(() => setTimeout(() => setSpin(false), 500));
  };

  return (
    <AppLayout navItems={adminNavItems}>
      <div className="mx-auto max-w-4xl px-5 py-8">
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
          {/* Header */}
          <motion.div variants={fadeUp}>
            <p className="text-sm text-ink-muted dark:text-inkDark-muted">Admin Dashboard</p>
            <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">
              Welcome back, <span className="gradient-text">{actor?.id}</span>
            </h1>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total users" value={loading ? "—" : stats.users} />
            <StatCard icon={Landmark} label="Approved loans" value={loading ? "—" : stats.approvedLoans} accent="success" />
            <StatCard icon={ShieldCheck} label="Total officers" value={loading ? "—" : stats.officers} accent="amber" />
          </motion.div>

          {/* Recent transactions */}
          <motion.div variants={fadeUp} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/4 dark:border-white/4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-brand-blue dark:text-brand-bluelight" />
                <h2 className="font-display text-sm font-bold text-ink dark:text-inkDark">Recent Transactions</h2>
              </div>
              <motion.button
                onClick={refresh}
                whileTap={{ scale: 0.92 }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-blue dark:text-brand-bluelight hover:bg-surface-sunk dark:hover:bg-surfaceDark-raised transition-colors"
              >
                <motion.span animate={{ rotate: spin ? 360 : 0 }} transition={{ duration: 0.5 }}>
                  <RefreshCw size={13} />
                </motion.span>
                Refresh
              </motion.button>
            </div>

            <div className="divide-y divide-black/4 dark:divide-white/4">
              {transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <TrendingUp size={28} className="mx-auto mb-2 text-ink-muted/30 dark:text-inkDark-muted/30" />
                  <p className="text-sm text-ink-muted dark:text-inkDark-muted">No transactions yet.</p>
                </div>
              ) : (
                transactions.map((t, i) => (
                  <motion.div
                    key={t.transaction_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink dark:text-inkDark">{t.account_no}</p>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted">
                        {new Date(t.transaction_time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-xs font-medium ${typeColors[t.transaction_type] || "text-ink-muted dark:text-inkDark-muted"}`}>
                        {t.transaction_type}
                      </span>
                      <span className="font-mono text-sm font-bold text-ink dark:text-inkDark">
                        ${Number(t.amount).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
