import AnimatedBackground from "../../components/shared/AnimatedBackground";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, ArrowLeft, Landmark, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function RegisterRoleSelect() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
  <div className={`min-h-screen ${isDark ? "bg-brand-navy" : "bg-white"} flex flex-col transition-colors duration-300 relative`}>
    {/* Animated Background Icons */}
    <AnimatedBackground />

    <div className="fixed pointer-events-none inset-0 overflow-hidden">
      <div className={`amb-motion orb hero-orb-1 ${isDark ? "" : "opacity-20"}`} />
      <div className={`amb-motion orb hero-orb-2 ${isDark ? "" : "opacity-20"}`} />
    </div>

      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <button onClick={() => navigate("/")} className={`flex items-center gap-2 text-sm ${isDark ? "text-inkDark-muted hover:text-inkDark" : "text-ink-muted hover:text-ink"} transition-colors`}>
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

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
          <h1 className={`font-display text-3xl font-bold ${isDark ? "text-white" : "text-ink"}`}>Create your account</h1>
          <p className={`mt-2 ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>Join Dot Bank and start banking smarter</p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/register/form")}
          className={`group flex flex-col items-center gap-5 rounded-2xl border ${isDark ? "border-white/8 bg-white/4 hover:border-brand-blue/40 hover:bg-brand-blue/8" : "border-black/8 bg-black/4 hover:border-brand-blue/30 hover:bg-brand-blue/8"} backdrop-blur-sm p-10 text-center transition-all shadow-[0_0_30px_rgba(67,97,238,0.2)] hover:shadow-[0_0_40px_rgba(67,97,238,0.35)] w-full max-w-xs`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-blue-400">
            <User size={28} className="text-white" />
          </div>
          <div>
            <p className={`font-display font-bold ${isDark ? "text-white" : "text-ink"} text-xl`}>Bank User</p>
            <p className={`mt-2 text-sm ${isDark ? "text-inkDark-muted" : "text-ink-muted"} leading-relaxed`}>Open personal savings or current accounts, make transfers, and manage your finances</p>
          </div>
          <span className="rounded-xl bg-gradient-brand px-5 py-2 text-sm font-semibold text-white group-hover:opacity-90 transition-opacity">
            Register now →
          </span>
        </motion.button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 text-center">
          <p className={`text-xs ${isDark ? "text-inkDark-muted" : "text-ink-muted"} mb-3`}>Officer accounts are created by an administrator</p>
          <button onClick={() => navigate("/login")} className={`text-sm font-semibold ${isDark ? "text-brand-bluelight hover:text-white" : "text-brand-blue hover:text-ink"} transition-colors`}>
            Already have an account? Sign in
          </button>
        </motion.div>
      </div>
    </div>
  );
}