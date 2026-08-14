import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FormInput from "../../components/shared/FormInput";
import SuccessModal from "../../components/shared/SuccessModal";
import { api } from "../../api/client";
import { ArrowLeft, Landmark, Sun, Moon, AlertCircle, User } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function RegisterFormPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", userId: "", nid: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      await api.post("/register", form);
      setShowSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-brand-navy" : "bg-white"} flex flex-col transition-colors duration-300`}>
      <div className="fixed pointer-events-none inset-0 overflow-hidden">
        <div className={`orb hero-orb-1 ${isDark ? "" : "opacity-20"}`} />
        <div className={`orb hero-orb-2 ${isDark ? "" : "opacity-20"}`} />
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <button onClick={() => navigate("/register")} className={`flex items-center gap-2 text-sm ${isDark ? "text-inkDark-muted hover:text-inkDark" : "text-ink-muted hover:text-ink"} transition-colors`}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand">
            <Landmark size={14} className="text-white" />
          </div>
          <span className={`font-display font-bold ${isDark ? "text-white" : "text-ink"}`}>Dot Bank</span>
        </div>
        <button onClick={toggleTheme} className={`rounded-xl p-2 ${isDark ? "text-inkDark-muted hover:text-white" : "text-ink-muted hover:text-ink"} transition-colors`}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-glowSm">
              <User size={22} className="text-white" />
            </div>
            <div>
              <h1 className={`font-display text-3xl font-bold ${isDark ? "text-white" : "text-ink"}`}>Create account</h1>
              <p className={`${isDark ? "text-inkDark-muted" : "text-ink-muted"} text-sm mt-0.5`}>Fill in your details to get started</p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 flex items-start gap-3 rounded-xl border ${isDark ? "border-dangerDark/25 bg-dangerDark/8 text-dangerDark" : "border-danger/25 bg-danger/8 text-danger"} px-4 py-3.5`}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Full name" placeholder="Your full name" value={form.fullName} onChange={update("fullName")} />
              <FormInput label="Username" placeholder="Choose a username" value={form.userId} onChange={update("userId")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="NID" placeholder="National ID number" value={form.nid} onChange={update("nid")} />
              <FormInput label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} />
            </div>
            <FormInput label="Phone number" placeholder="01XXXXXXXXX" value={form.phone} onChange={update("phone")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={update("password")} />
              <FormInput label="Confirm password" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={update("confirmPassword")} />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-brand py-3.5 text-base font-bold text-white btn-glow transition-opacity disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : "Create account"}
            </motion.button>
          </form>

          <p className={`mt-6 text-center text-sm ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className={`font-semibold ${isDark ? "text-brand-bluelight hover:text-white" : "text-brand-blue hover:text-ink"} transition-colors`}>
              Sign in
            </button>
          </p>
        </motion.div>
      </div>

      <SuccessModal
        open={showSuccess}
        title="Account created!"
        message="Your account has been created successfully. You can now sign in."
        onClose={() => { setShowSuccess(false); navigate("/login"); }}
      />
    </div>
  );
}