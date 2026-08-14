import AnimatedBackground from "../../components/shared/AnimatedBackground";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Briefcase, ShieldCheck, ArrowLeft, Landmark } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const roles = [
  {
    role: "user",
    icon: User,
    title: "Bank User",
    desc: "Access your personal accounts, transfers, and statements",
    gradient: "from-brand-blue to-blue-400",
    glow: "shadow-[0_0_30px_rgba(67,97,238,0.3)]",
  },
  {
    role: "officer",
    icon: Briefcase,
    title: "Officer",
    desc: "Review account and loan requests, manage customer accounts",
    gradient: "from-amber-500 to-orange-400",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
  },
  {
    role: "admin",
    icon: ShieldCheck,
    title: "Admin",
    desc: "Full system access, officer management, and platform oversight",
    gradient: "from-purple-600 to-violet-400",
    glow: "shadow-[0_0_30px_rgba(124,58,237,0.3)]",
  },
];

export default function LoginRoleSelect() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

 return (
  <div className={`min-h-screen ${isDark ? "bg-brand-navy" : "bg-white"} flex flex-col transition-colors duration-300 relative`}>
    {/* Animated Background Icons */}
    <AnimatedBackground />

    {/* Orbs */}
    <div className="fixed pointer-events-none inset-0 overflow-hidden">
      <div className={`amb-motion orb hero-orb-1 ${isDark ? "" : "opacity-20"}`} />
      <div className={`amb-motion orb hero-orb-2 ${isDark ? "" : "opacity-20"}`} />
    </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <button
          onClick={() => navigate("/")}
          className={`flex items-center gap-2 text-sm ${isDark ? "text-inkDark-muted hover:text-inkDark" : "text-ink-muted hover:text-ink"} transition-colors`}
        >
          <ArrowLeft size={16} />
          Back
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

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className={`font-display text-3xl font-bold ${isDark ? "text-white" : "text-ink"}`}>Welcome back</h1>
          <p className={`mt-2 ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>Choose your role to continue</p>
        </motion.div>

        <div className="grid gap-4 w-full max-w-2xl sm:grid-cols-3">
          {roles.map(({ role, icon: Icon, title, desc, gradient, glow }, i) => (
            <motion.button
              key={role}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/login/form?role=${role}`)}
              className={`group flex flex-col items-center gap-4 rounded-2xl border ${isDark ? "border-white/8 bg-white/4 hover:border-white/20 hover:bg-white/8" : "border-black/8 bg-black/4 hover:border-black/20 hover:bg-black/8"} backdrop-blur-sm p-6 text-center transition-all ${glow} hover:shadow-none`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}>
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <p className={`font-display font-bold ${isDark ? "text-white" : "text-ink"} text-base`}>{title}</p>
                <p className={`mt-1.5 text-xs ${isDark ? "text-inkDark-muted" : "text-ink-muted"} leading-relaxed`}>{desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`mt-8 text-sm ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}
        >
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className={`font-semibold ${isDark ? "text-brand-bluelight hover:text-white" : "text-brand-blue hover:text-ink"} transition-colors`}
          >
            Register here
          </button>
        </motion.p>
      </div>
    </div>
  );
}