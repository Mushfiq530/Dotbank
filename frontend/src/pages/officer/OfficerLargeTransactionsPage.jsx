import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Check, X, Clock } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { officerNavItems, adminNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

const typeLabels = {
  BANK_TRANSFER: "Bank Transfer",
  MOBILE_TRANSFER: "Mobile Transfer",
  BILL_PAYMENT: "Bill Payment",
};

export default function OfficerLargeTransactionsPage() {
  const { actor } = useAuth();
  const navItems = actor?.role === "admin" ? adminNavItems : officerNavItems;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/large-transaction-requests")
      .then((d) => setRequests(d.requests || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setActing(id + action);
    try {
      await api.post(`/large-transaction-requests/${id}/${action}`, {});
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const describe = (r) => {
    const payload = r.payload || {};
    if (r.request_type === "BANK_TRANSFER") return `To account ${payload.receiverAccount || "—"} (${payload.receiverBank || "Dot Bank"})`;
    if (r.request_type === "MOBILE_TRANSFER") return `To ${payload.mobile || "—"} via ${payload.provider || "—"}`;
    if (r.request_type === "BILL_PAYMENT") return `${payload.billType || "—"} bill`;
    return "";
  };

  return (
    <AppLayout navItems={navItems}>
      <div className="mx-auto max-w-4xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-dangerDark to-red-400">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Large Transactions</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">
                {requests.length} request{requests.length !== 1 ? "s" : ""} over 1,00,000 awaiting approval
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-5 animate-pulse h-20" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-successDark/8">
                <Check size={28} className="text-successDark" />
              </div>
              <p className="font-semibold text-ink dark:text-inkDark mb-1">All clear!</p>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">No large transactions waiting on review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Customer</p>
                        <p className="text-sm font-bold text-ink dark:text-inkDark">{r.user_name || r.user_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">From account</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark font-mono">{r.account_no}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Type</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{typeLabels[r.request_type] || r.request_type}</p>
                        <p className="text-xs text-ink-muted dark:text-inkDark-muted">{describe(r)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Amount</p>
                        <p className="text-sm font-mono font-bold text-dangerDark">${Number(r.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Requested</p>
                        <p className="text-xs text-ink-muted dark:text-inkDark-muted flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        disabled={!!acting}
                        onClick={() => act(r.id, "approve")}
                        className="flex items-center gap-1.5 rounded-xl bg-successDark/10 px-4 py-2.5 text-sm font-semibold text-successDark hover:bg-successDark/20 disabled:opacity-50 transition-all"
                      >
                        {acting === r.id + "approve" ? <span className="h-3.5 w-3.5 rounded-full border-2 border-successDark/30 border-t-successDark animate-spin" /> : <Check size={15} />}
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        disabled={!!acting}
                        onClick={() => act(r.id, "deny")}
                        className="flex items-center gap-1.5 rounded-xl bg-dangerDark/8 px-4 py-2.5 text-sm font-semibold text-dangerDark hover:bg-dangerDark/15 disabled:opacity-50 transition-all"
                      >
                        {acting === r.id + "deny" ? <span className="h-3.5 w-3.5 rounded-full border-2 border-dangerDark/30 border-t-dangerDark animate-spin" /> : <X size={15} />}
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