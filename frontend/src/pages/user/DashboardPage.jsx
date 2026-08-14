import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import BalanceCard from "../../components/shared/BalanceCard";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  ArrowUpRight, ArrowDownLeft, Zap, Landmark, Plus,
  TrendingUp, ArrowRight, CreditCard,
} from "lucide-react";

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const typeIcons = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAW: ArrowUpRight,
  TRANSFER: ArrowUpRight,
  BILL_PAYMENT: Zap,
  LOAN: Landmark,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { actor, account, accounts, selectAccount } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (!account) return;
    setLoadingTx(true);
    api.get(`/transactions?accountNo=${encodeURIComponent(account.account_no)}`)
      .then((d) => setTransactions(d.transactions || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoadingTx(false));
  }, [account]);

  const quickActions = [
    { icon: ArrowUpRight, label: "Transfer", to: "/user/withdraw", color: "from-brand-blue to-blue-400" },
    { icon: Zap, label: "Pay Bill", to: "/user/pay-bill", color: "from-purple-600 to-violet-400" },
    { icon: Landmark, label: "Loan", to: "/user/loan", color: "from-amber-500 to-orange-400" },
    { icon: TrendingUp, label: "Statement", to: "/user/statement", color: "from-successDark to-teal-400" },
  ];

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-3xl px-5 py-8">
        {/* Greeting */}
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
          <motion.div variants={fadeUp}>
            <p className="text-sm text-ink-muted dark:text-inkDark-muted">Good day 👋</p>
            <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">
              {actor ? actor.id : "Welcome back"}
            </h1>
          </motion.div>

          {/* Account selector (multi-account) */}
          {accounts.length > 1 && (
            <motion.div variants={fadeUp}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">
                Your Accounts
              </p>
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.account_no}
                    onClick={() => selectAccount(a.account_no)}
                    className={`rounded-xl border px-4 py-2.5 text-left text-xs transition-all ${
                      account?.account_no === a.account_no
                        ? "border-brand-blue/40 bg-brand-blue/8 dark:border-brand-bluelight/30 dark:bg-brand-bluelight/8 shadow-glowSm"
                        : "border-black/8 dark:border-white/8 bg-white dark:bg-surfaceDark hover:border-brand-blue/20"
                    }`}
                  >
                    <div className="font-semibold text-ink dark:text-inkDark">{a.account_type}</div>
                    <div className="font-mono text-ink-muted dark:text-inkDark-muted">{a.account_no}</div>
                    <div className="font-mono font-bold text-ink dark:text-inkDark mt-0.5">
                      ${Number(a.balance).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Balance card + account info */}
          {accounts.length > 0 ? (
            <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
              <BalanceCard
                balance={Number(account?.balance || 0)}
                accountType={account?.account_type || "Account"}
                accountNo={account?.account_no || ""}
              />
              {/* Account details card */}
              <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard size={16} className="text-brand-blue dark:text-brand-bluelight" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">Account Details</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted">Account number</p>
                      <p className="font-mono text-sm font-semibold text-ink dark:text-inkDark">{account?.account_no}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted">Account type</p>
                      <p className="text-sm font-semibold text-ink dark:text-inkDark">{account?.account_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted">Status</p>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        account?.status === "BLOCKED"
                          ? "bg-dangerDark/10 text-dangerDark"
                          : "bg-successDark/10 text-successDark"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${account?.status === "BLOCKED" ? "bg-dangerDark" : "bg-successDark"}`} />
                        {account?.status === "BLOCKED" ? "Frozen" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/user/open-account")}
                  className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-blue dark:text-brand-bluelight hover:underline"
                >
                  <Plus size={12} /> Open another account
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={fadeUp}
              onClick={() => navigate("/user/open-account")}
              className="cursor-pointer rounded-card border-2 border-dashed border-black/10 dark:border-white/10 p-10 text-center hover:border-brand-blue/30 dark:hover:border-brand-bluelight/30 transition-colors group"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/8 group-hover:bg-brand-blue/15 transition-colors">
                <Plus size={24} className="text-brand-blue dark:text-brand-bluelight" />
              </div>
              <p className="font-display font-bold text-ink dark:text-inkDark text-lg">Open your first account</p>
              <p className="mt-1.5 text-sm text-ink-muted dark:text-inkDark-muted">
                Request a savings or current account — an officer will approve it shortly.
              </p>
            </motion.div>
          )}

          {/* Quick actions */}
          {accounts.length > 0 && (
            <motion.div variants={fadeUp}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">Quick Actions</p>
              <div className="grid grid-cols-4 gap-3">
                {quickActions.map(({ icon: Icon, label, to, color }) => (
                  <motion.button
                    key={label}
                    whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(to)}
                    className="flex flex-col items-center gap-2.5 rounded-2xl border border-black/5 dark:border-white/8 bg-white dark:bg-surfaceDark p-4 shadow-card dark:shadow-cardDark transition-all hover:border-brand-blue/20 hover:shadow-glowSm"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color}`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-ink dark:text-inkDark">{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent transactions */}
          {account && (
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">Recent Transactions</p>
                <button
                  onClick={() => navigate("/user/statement")}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-blue dark:text-brand-bluelight hover:underline"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>

              <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden">
                {loadingTx ? (
                  <div className="space-y-3 p-4">
                    {[1,2,3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5 shimmer" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-32 rounded bg-black/5 dark:bg-white/5 shimmer" />
                          <div className="h-2.5 w-20 rounded bg-black/5 dark:bg-white/5 shimmer" />
                        </div>
                        <div className="h-3 w-16 rounded bg-black/5 dark:bg-white/5 shimmer" />
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-10 text-center">
                    <TrendingUp size={28} className="mx-auto mb-2 text-ink-muted/30 dark:text-inkDark-muted/30" />
                    <p className="text-sm text-ink-muted dark:text-inkDark-muted">No transactions yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/4 dark:divide-white/4">
                    {transactions.slice(0, 8).map((t, i) => {
                      const isCredit = t.transaction_type === "DEPOSIT";
                      const Icon = typeIcons[t.transaction_type] || ArrowUpRight;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 px-4 py-3.5"
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isCredit ? "bg-successDark/8 text-successDark" : "bg-dangerDark/8 text-dangerDark"
                          }`}>
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink dark:text-inkDark">{t.transaction_type}</p>
                            <p className="text-xs text-ink-muted dark:text-inkDark-muted">
                              {new Date(t.transaction_time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className={`font-mono text-sm font-semibold ${isCredit ? "text-successDark" : "text-dangerDark"}`}>
                            {isCredit ? "+" : "-"}${Number(t.amount).toFixed(2)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
