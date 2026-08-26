import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, Check, X, Clock, CheckCircle2, XCircle } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import FormInput from "../../components/shared/FormInput";
import { officerNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export default function OfficerDepositRequestsPage() {
  const { actor } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [accountInputs, setAccountInputs] = useState({});

  const [requesterName, setRequesterName] = useState("");
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const load = () => api.get("/deposit-requests")
    .then((d) => setRequests((d.requests || []).filter((r) => r.status === "PENDING")))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);
    try {
      await api.post("/deposit-requests", {
        requesterName,
        source,
        amount: Number(amount),
        actorName: actor?.id,
      });
      setResult({ success: true, message: "Deposit intake recorded." });
      setRequesterName("");
      setSource("");
      setAmount("");
      load();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (id, action) => {
    const accountNo = accountInputs[id];
    if (action === "approve" && !accountNo) {
      setResult({ success: false, message: "Enter the account number to credit before approving." });
      return;
    }
    setActing(id + action);
    setResult(null);
    try {
      await api.post(`/deposit-requests/${encodeURIComponent(id)}/${action}`, {
        accountNo,
        actorName: actor?.id,
      });
      load();
    } catch (err) {
      setResult({ success: false, message: err.message });
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
              <PiggyBank size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Deposit Requests</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Record walk-in cash deposits and match them to an account</p>
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

          {/* New deposit intake */}
          <form onSubmit={handleCreate} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 space-y-4 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">New deposit intake</p>
            <FormInput label="Requester name" placeholder="Name of the person depositing" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} required />
            <FormInput label="Source" placeholder="e.g. Cash, Cheque" value={source} onChange={(e) => setSource(e.target.value)} required />
            <FormInput label="Amount" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-brand py-3.5 text-sm font-bold text-white btn-glow disabled:opacity-50 transition-opacity"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Recording…
                </span>
              ) : "Record Deposit Intake"}
            </motion.button>
          </form>

          {/* Pending queue */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">
            {requests.length} pending request{requests.length !== 1 ? "s" : ""}
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-5 animate-pulse h-24" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-successDark/8">
                <Check size={28} className="text-successDark" />
              </div>
              <p className="font-semibold text-ink dark:text-inkDark mb-1">All clear!</p>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">No pending deposit requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r, i) => (
                <motion.div
                  key={r.request_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Requester</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{r.requester_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Source</p>
                        <p className="text-sm font-medium text-ink dark:text-inkDark">{r.source}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Amount</p>
                        <p className="text-sm font-mono font-bold text-ink dark:text-inkDark">${Number(r.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-muted dark:text-inkDark-muted uppercase tracking-wider">Requested</p>
                        <p className="text-xs text-ink-muted dark:text-inkDark-muted flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Account no. to credit"
                      value={accountInputs[r.request_id] || ""}
                      onChange={(e) => setAccountInputs((prev) => ({ ...prev, [r.request_id]: e.target.value }))}
                      className="flex-1 min-w-[180px] rounded-xl border border-black/10 dark:border-white/10 bg-surface-sunk dark:bg-surfaceDark-sunk px-3.5 py-2.5 text-sm font-mono text-ink dark:text-inkDark outline-none focus:border-brand-blue dark:focus:border-brand-bluelight focus:ring-4 focus:ring-brand-blue/8 dark:focus:ring-brand-bluelight/8 transition-all"
                    />
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      disabled={!!acting}
                      onClick={() => act(r.request_id, "approve")}
                      className="flex items-center gap-1.5 rounded-xl bg-successDark/10 px-4 py-2.5 text-sm font-semibold text-successDark hover:bg-successDark/20 disabled:opacity-50 transition-all"
                    >
                      {acting === r.request_id + "approve" ? <span className="h-3.5 w-3.5 rounded-full border-2 border-successDark/30 border-t-successDark animate-spin" /> : <Check size={15} />}
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      disabled={!!acting}
                      onClick={() => act(r.request_id, "deny")}
                      className="flex items-center gap-1.5 rounded-xl bg-dangerDark/8 px-4 py-2.5 text-sm font-semibold text-dangerDark hover:bg-dangerDark/15 disabled:opacity-50 transition-all"
                    >
                      {acting === r.request_id + "deny" ? <span className="h-3.5 w-3.5 rounded-full border-2 border-dangerDark/30 border-t-dangerDark animate-spin" /> : <X size={15} />}
                      Reject
                    </motion.button>
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