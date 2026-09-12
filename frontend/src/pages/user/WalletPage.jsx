import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { userNavItems } from "../../router/navItems";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Send, AlertCircle, CheckCircle2 } from "lucide-react";

const typeStyles = {
  TOPUP: "text-success",
  RECEIVE: "text-success",
  WITHDRAW: "text-danger",
  SEND: "text-danger",
};
const typeSign = { TOPUP: "+", RECEIVE: "+", WITHDRAW: "-", SEND: "-" };
const typeLabel = { TOPUP: "Top-up from account", WITHDRAW: "Withdraw to account", SEND: "Sent", RECEIVE: "Received" };

export default function WalletPage() {
  const { accounts } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("topup"); // topup | withdraw | send
  const [accountNo, setAccountNo] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const w = await api.get("/wallet");
      setWallet(w);
      const t = await api.get("/wallet/transactions");
      setTransactions(t.transactions || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (accounts?.length && !accountNo) setAccountNo(accounts[0].account_no);
  }, [accounts]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const amt = parseFloat(amount);
      if (tab === "topup") {
        await api.post("/wallet/topup", { accountNo, amount: amt });
        setSuccess(`Topped up ৳${amt.toFixed(2)} to your wallet.`);
      } else if (tab === "withdraw") {
        await api.post("/wallet/withdraw", { accountNo, amount: amt });
        setSuccess(`Withdrew ৳${amt.toFixed(2)} back to your account.`);
      } else {
        await api.post("/wallet/transfer", { toUserId, amount: amt });
        setSuccess(`Sent ৳${amt.toFixed(2)} to ${toUserId}.`);
        setToUserId("");
      }
      setAmount("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-2xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand">
              <WalletIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">DotBank Wallet</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Your internal e-wallet, linked to your bank account</p>
            </div>
          </div>

          {/* Balance card */}
          <div className="rounded-card bg-gradient-brand p-6 text-white shadow-card mb-6">
            <p className="text-sm text-white/75">Wallet Balance</p>
            <p className="mt-1 font-display text-3xl font-bold">
              {loading ? "…" : `৳${Number(wallet?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/8 px-4 py-3.5 text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-success/25 bg-success/8 px-4 py-3.5 text-success">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "topup", label: "Top Up", icon: ArrowDownToLine },
              { key: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
              { key: "send", label: "Send", icon: Send },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(""); setSuccess(""); }}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  tab === key ? "bg-gradient-brand text-white" : "bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4 rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 mb-6">
            {(tab === "topup" || tab === "withdraw") && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-muted dark:text-inkDark-muted">
                  {tab === "topup" ? "From account" : "To account"}
                </label>
                <select
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-white outline-none focus:border-brand-blue"
                >
                  {(accounts || []).map((a) => (
                    <option key={a.account_no} value={a.account_no}>{a.account_no}</option>
                  ))}
                </select>
              </div>
            )}
            {tab === "send" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-muted dark:text-inkDark-muted">Recipient username</label>
                <input
                  type="text"
                  placeholder="Enter their username"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-white outline-none focus:border-brand-blue"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted dark:text-inkDark-muted">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-white outline-none focus:border-brand-blue"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Processing…" : tab === "topup" ? "Top Up Wallet" : tab === "withdraw" ? "Withdraw to Account" : "Send Money"}
            </button>
          </form>

          {/* Recent activity */}
          <h2 className="mb-3 text-sm font-bold text-ink dark:text-inkDark">Recent Activity</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-ink-muted dark:text-inkDark-muted">No wallet activity yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.wallet_txn_id}
                  className="flex items-center justify-between rounded-xl bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-inkDark">{typeLabel[t.type]}</p>
                    <p className="text-xs text-ink-muted dark:text-inkDark-muted">
                      {new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${typeStyles[t.type]}`}>
                    {typeSign[t.type]}৳{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
