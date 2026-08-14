import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import FormInput from "../../components/shared/FormInput";
import { userNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Building2, Smartphone, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";

export default function WithdrawPage() {
  const { actor, accounts, account, refreshAccount } = useAuth();
  const [selectedNo, setSelectedNo] = useState(account?.account_no || "");
  const [method, setMethod] = useState("Bank-to-Bank");
  const [amount, setAmount] = useState("");
  const [receiverAccount, setReceiverAccount] = useState("");
  const [mobile, setMobile] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account?.account_no && !selectedNo) setSelectedNo(account.account_no);
  }, [account, selectedNo]);

  const selectedAccount = accounts.find((a) => a.account_no === selectedNo) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const data = await api.post("/withdraw", {
        accountNo: selectedNo, type: method,
        amount: Number(amount), receiverAccount, mobile,
      });
      setResult({ success: true, message: data.message });
      setAmount(""); setReceiverAccount(""); setMobile("");
      refreshAccount();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-lg px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-blue-400">
              <ArrowUpRight size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Transfer Funds</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">
                {selectedAccount
                  ? <>Balance: <span className="font-mono font-semibold">${Number(selectedAccount.balance).toFixed(2)}</span></>
                  : "Open an account first"}
              </p>
            </div>
          </div>

          {/* Account selector */}
          {accounts.length > 1 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-inkDark-muted">From Account</p>
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.account_no}
                    onClick={() => setSelectedNo(a.account_no)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-all ${
                      selectedNo === a.account_no
                        ? "border-brand-blue/40 bg-brand-blue/8 dark:border-brand-bluelight/30 dark:bg-brand-bluelight/8"
                        : "border-black/8 dark:border-white/8 bg-white dark:bg-surfaceDark"
                    }`}
                  >
                    <div className="font-semibold text-ink dark:text-inkDark">{a.account_type}</div>
                    <div className="font-mono text-ink-muted dark:text-inkDark-muted">{a.account_no}</div>
                    <div className="font-mono font-bold text-ink dark:text-inkDark">${Number(a.balance).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
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

          {/* Method selector */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { id: "Bank-to-Bank", icon: Building2, label: "Bank to Bank" },
              { id: "Bank-to-Mobile", icon: Smartphone, label: "Bank to Mobile" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold transition-all ${
                  method === id
                    ? "border-brand-blue/40 bg-brand-blue/8 text-brand-blue dark:border-brand-bluelight/30 dark:bg-brand-bluelight/8 dark:text-brand-bluelight"
                    : "border-black/8 dark:border-white/8 bg-white dark:bg-surfaceDark text-ink-muted dark:text-inkDark-muted hover:border-brand-blue/20"
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6 space-y-4">
            <FormInput label="Amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {method === "Bank-to-Bank" ? (
              <FormInput label="Receiver account number" placeholder="Account number" value={receiverAccount} onChange={(e) => setReceiverAccount(e.target.value)} />
            ) : (
              <FormInput label="Mobile number" placeholder="11-digit phone number" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            )}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={!selectedNo || loading}
              className="w-full rounded-xl bg-gradient-brand py-3.5 text-sm font-bold text-white btn-glow disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing…
                </span>
              ) : "Transfer Funds"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  );
}
