import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import SearchBox from "../../components/shared/SearchBox";
import { adminNavItems } from "../../router/navItems";
import { api } from "../../api/client";
import { Search, ArrowDownLeft, ArrowUpRight, Zap } from "lucide-react";

const typeIcons = {
  DEPOSIT: { icon: ArrowDownLeft, color: "text-successDark", bg: "bg-successDark/8" },
  WITHDRAW: { icon: ArrowUpRight, color: "text-dangerDark", bg: "bg-dangerDark/8" },
  TRANSFER: { icon: ArrowUpRight, color: "text-dangerDark", bg: "bg-dangerDark/8" },
  BILL_PAYMENT: { icon: Zap, color: "text-brand-bluelight", bg: "bg-brand-blue/8" },
};

export default function AdminStatementViewerPage() {
  const [query, setQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.get(`/transactions?accountNo=${encodeURIComponent(query)}`);
      setTransactions(data.transactions || []);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout navItems={adminNavItems}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-violet-400">
              <Search size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Statement Viewer</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Search by account number to view any user's transactions</p>
            </div>
          </div>

          <div className="mb-6">
            <SearchBox
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onSubmit={handleSearch}
              placeholder="e.g. ACC20260723123456"
            />
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-4 animate-pulse flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-black/5 dark:bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-black/5 dark:bg-white/5" />
                    <div className="h-2.5 w-20 rounded bg-black/5 dark:bg-white/5" />
                  </div>
                  <div className="h-3 w-16 rounded bg-black/5 dark:bg-white/5" />
                </div>
              ))}
            </div>
          )}

          {!loading && searched && transactions.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-12 text-center">
              <Search size={28} className="mx-auto mb-3 text-ink-muted/30 dark:text-inkDark-muted/30" />
              <p className="font-semibold text-ink dark:text-inkDark">No transactions found</p>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted mt-1">No results for "{query}"</p>
            </motion.div>
          )}

          {!loading && transactions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark overflow-hidden">
              <div className="px-5 py-4 border-b border-black/4 dark:border-white/4">
                <p className="text-sm font-semibold text-ink dark:text-inkDark">{query} — {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="divide-y divide-black/4 dark:divide-white/4">
                {transactions.map((t, i) => {
                  const conf = typeIcons[t.transaction_type] || typeIcons.WITHDRAW;
                  const Icon = conf.icon;
                  return (
                    <motion.div key={t.transaction_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 px-5 py-4">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${conf.bg}`}>
                        <Icon size={15} className={conf.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink dark:text-inkDark">{t.transaction_type}</p>
                        <p className="text-xs text-ink-muted dark:text-inkDark-muted">
                          {new Date(t.transaction_time).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <span className={`font-mono text-sm font-bold ${conf.color}`}>${Number(t.amount).toFixed(2)}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}