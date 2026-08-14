import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormInput from "../../components/shared/FormInput";
import { api } from "../../api/client";
import { ArrowLeft, Landmark, Sun, Moon, AlertCircle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const config = {
  user:    { endpoint: "/login/user",    dest: "/user/dashboard",    title: "User Login",    idLabel: "Username" },
  officer: { endpoint: "/login/officer", dest: "/officer/dashboard", title: "Officer Login", idLabel: "Officer ID" },
  admin:   { endpoint: "/login/admin",   dest: "/admin/dashboard",   title: "Admin Login",   idLabel: "Admin ID" },
};

export default function LoginFormPage() {
  const [params] = useSearchParams();
  const role = ["user", "officer", "admin"].includes(params.get("role")) ? params.get("role") : "user";
  const { endpoint, dest, title, idLabel } = config[role];
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post(endpoint, { username, password });
      if (data.success) { window.location.href = dest; }
      else { setError(data.message || "Login failed"); }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-brand-navy" : "bg-white"} flex transition-colors duration-300`}>
      {/* Orbs */}
      <div className="fixed pointer-events-none inset-0 overflow-hidden">
        <div className={`orb hero-orb-1 ${isDark ? "" : "opacity-20"}`} />
        <div className={`orb hero-orb-2 ${isDark ? "" : "opacity-20"}`} />
      </div>

      {/* Left panel — decorative (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 relative overflow-hidden p-12"
           style={{ background: isDark ? "linear-gradient(135deg, #0a1628 0%, #111827 100%)" : "linear-gradient(135deg, #f0f4ff 0%, #e8edf5 100%)" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 to-brand-purple/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand shadow-glowSm">
              <Landmark size={20} className="text-white" />
            </div>
            <span className={`font-display font-bold text-xl ${isDark ? "text-white" : "text-ink"}`}>Dot Bank</span>
          </div>
          <h2 className={`font-display text-4xl font-bold ${isDark ? "text-white" : "text-ink"} leading-tight`}>
            Your finances,<br />
            <span className="bg-gradient-brand bg-clip-text text-transparent">beautifully managed</span>
          </h2>
          <p className={`mt-4 ${isDark ? "text-inkDark-muted" : "text-ink-muted"} text-base leading-relaxed max-w-xs`}>
            Access your accounts, make transfers, pay bills, and track your financial health, all in one place.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            "Bank-grade 256-bit encryption",
            "Atomic transaction guarantees",
            "Real-time account monitoring",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className={`h-1.5 w-1.5 rounded-full ${isDark ? "bg-brand-bluelight" : "bg-brand-blue"}`} />
              <span className={`text-sm ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex items-center justify-between px-8 py-6">
          <button
            onClick={() => navigate("/login")}
            className={`flex items-center gap-2 text-sm ${isDark ? "text-inkDark-muted hover:text-inkDark" : "text-ink-muted hover:text-ink"} transition-colors`}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={toggleTheme} className={`rounded-xl p-2 ${isDark ? "text-inkDark-muted hover:text-white" : "text-ink-muted hover:text-ink"} transition-colors`}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <h1 className={`font-display text-3xl font-bold ${isDark ? "text-white" : "text-ink"}`}>{title}</h1>
              <p className={`mt-2 ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>Sign in to continue to your dashboard</p>
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <FormInput
                  label={idLabel}
                  placeholder={`Enter your ${idLabel.toLowerCase()}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <FormInput
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
                    Signing in…
                  </span>
                ) : "Sign in"}
              </motion.button>
            </form>

            <p className={`mt-6 text-center text-sm ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>
              Need an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className={`font-semibold ${isDark ? "text-brand-bluelight hover:text-white" : "text-brand-blue hover:text-ink"} transition-colors`}
              >
                Register here
              </button>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}