import AnimatedBackground from "../../components/shared/AnimatedBackground";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  Shield, Zap, Globe, ArrowRight, ChevronRight,
  Sun, Moon, Landmark, TrendingUp, Lock, Smartphone,
} from "lucide-react";

const features = [
  { icon: Shield, title: "Bank-grade Security", desc: "256-bit encryption, brute-force protection, and session hardening on every request." },
  { icon: Zap, title: "Instant Transfers", desc: "Bank-to-bank and mobile transfers settled immediately with atomic guarantees." },
  { icon: Globe, title: "Multi-Account", desc: "Open savings and current accounts. Manage all from one unified dashboard." },
  { icon: TrendingUp, title: "Loan Management", desc: "Request loans reviewed by dedicated officers with real-time status updates." },
  { icon: Lock, title: "Freeze & Protect", desc: "Instantly freeze any account if you suspect unauthorized activity." },
  { icon: Smartphone, title: "Bill Payments", desc: "Pay gas, electricity, and WiFi bills directly from your balance in seconds." },
];

const cardTxns = [
  { label: "Netflix Subscription", amount: "-$15.99", time: "2m ago", color: "text-dangerDark" },
  { label: "Salary Deposit", amount: "+$3,200.00", time: "1h ago", color: "text-successDark" },
  { label: "Electric Bill", amount: "-$84.50", time: "3h ago", color: "text-dangerDark" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
  <div className={`min-h-screen ${isDark ? "bg-brand-navy text-inkDark" : "bg-white text-ink"} overflow-x-hidden transition-colors duration-300 relative`}>
    {/* Animated Background Icons */}
    <AnimatedBackground />

    {/* Orbs - visible in both themes, but lighter in light mode */}
    <div className="fixed pointer-events-none inset-0 overflow-hidden">
      <div className={`amb-motion orb hero-orb-1 ${isDark ? "" : "opacity-20"}`} />
      <div className={`amb-motion orb hero-orb-2 ${isDark ? "" : "opacity-20"}`} />
      <div className={`amb-motion orb hero-orb-3 ${isDark ? "" : "opacity-20"}`} />
    </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glowSm">
            <Landmark size={18} className="text-white" />
          </div>
          <span className={`font-display font-bold text-lg ${isDark ? "text-white" : "text-ink"}`}>Dot Bank</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`rounded-xl p-2 ${isDark ? "text-inkDark-muted hover:text-white hover:bg-white/8" : "text-ink-muted hover:text-ink hover:bg-black/5"} transition-all`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => navigate("/login")}
            className={`rounded-xl border ${isDark ? "border-white/10 text-inkDark hover:bg-white/5" : "border-black/10 text-ink hover:bg-black/5"} px-4 py-2 text-sm font-semibold transition-all`}
          >
            Log in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white btn-glow transition-all"
          >
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 flex flex-col lg:flex-row items-center gap-16">
        {/* Left: copy */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={`inline-flex items-center gap-2 rounded-full border ${isDark ? "border-brand-blue/30 bg-brand-blue/10 text-brand-bluelight" : "border-brand-blue/20 bg-brand-blue/5 text-brand-blue"} px-4 py-1.5 text-xs font-semibold mb-6`}>
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isDark ? "bg-brand-bluelight/60" : "bg-brand-blue/60"}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isDark ? "bg-brand-bluelight" : "bg-brand-blue"}`} />
              </span>
              Welcome to DotBank, the bank you need
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`font-display text-5xl lg:text-6xl font-bold leading-tight ${isDark ? "text-white" : "text-ink"}`}
          >
            Banking that{" "}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              moves with you
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`mt-6 text-lg ${isDark ? "text-inkDark-muted" : "text-ink-muted"} leading-relaxed max-w-xl mx-auto lg:mx-0`}
          >
            A modern banking platform built for speed, security, and simplicity. Manage accounts, transfers, loans, and bills from one elegant dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start"
          >
            <button
              onClick={() => navigate("/register")}
              className="group flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3.5 text-base font-semibold text-white btn-glow transition-all hover:gap-3"
            >
              Open an account
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`flex items-center gap-2 rounded-xl border ${isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-black/10 bg-black/5 text-ink hover:bg-black/10"} px-6 py-3.5 text-base font-semibold transition-all`}
            >
              Sign in
              <ChevronRight size={18} />
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex items-center gap-6 justify-center lg:justify-start"
          >
            {[
              { value: "100K+", label: "Accounts" },
              { value: "$50M+", label: "Transferred" },
              { value: "99.9%", label: "Uptime" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`font-display text-2xl font-bold ${isDark ? "text-white" : "text-ink"}`}>{s.value}</p>
                <p className={`text-xs ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: card mockup */}
        <motion.div
          initial={{ opacity: 0, x: 32, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="flex-1 w-full max-w-sm mx-auto lg:max-w-none flex flex-col items-center lg:items-end"
        >
          {/* Bank card */}
          <motion.div
            className="relative w-80 h-48 rounded-2xl p-6 text-white overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #1e1b4b 100%)",
              boxShadow: "0 24px 80px rgba(67,97,238,0.4), 0 1px 0 rgba(255,255,255,0.12) inset",
            }}
          >
            <div className="card-shine absolute inset-0" />
            {/* Removed decorative circles */}
            <div className="flex justify-between items-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
                <Landmark size={14} className="text-white" />
              </div>
              {/* No wifi icon */}
            </div>
            <div className="mt-4 font-mono text-sm tracking-[0.2em] text-white/60">
              •••• •••• •••• 4291
            </div>
            <div className="mt-3 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Balance</p>
                <p className="font-display text-2xl font-bold">$12,480.00</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Valid thru</p>
                <p className="text-sm font-mono">12/28</p>
              </div>
            </div>
            {/* "Dot Bank" at bottom-right */}
            <div className="absolute bottom-3 right-4 text-[10px] font-semibold uppercase tracking-widest text-white/20">
              Dot Bank
            </div>
          </motion.div>

          {/* Transaction feed */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={`mt-4 w-80 rounded-2xl border ${isDark ? "border-white/8 bg-white/5" : "border-black/8 bg-black/5"} backdrop-blur-xl p-4 space-y-3`}
          >
            <p className={`text-xs font-semibold ${isDark ? "text-inkDark-muted" : "text-ink-muted"} uppercase tracking-wider`}>Recent Activity</p>
            {cardTxns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl ${isDark ? "bg-white/8" : "bg-black/8"} flex items-center justify-center`}>
                    <Zap size={12} className={isDark ? "text-white/50" : "text-ink/50"} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-ink"}`}>{t.label}</p>
                    <p className={`text-[10px] ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>{t.time}</p>
                  </div>
                </div>
                <span className={`font-mono text-sm font-semibold ${t.color}`}>{t.amount}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features section (same changes for theme) */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className={`font-display text-4xl font-bold ${isDark ? "text-white" : "text-ink"}`}>
            Everything you need,{" "}
            <span className="bg-gradient-brand bg-clip-text text-transparent">nothing you don't</span>
          </h2>
          <p className={`mt-4 ${isDark ? "text-inkDark-muted" : "text-ink-muted"} max-w-xl mx-auto`}>
            A complete banking stack — designed for users, officers, and admins with purpose-built workflows for each role.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
              className={`rounded-2xl border ${isDark ? "border-white/8 bg-white/4" : "border-black/8 bg-black/4"} backdrop-blur-sm p-6 ${isDark ? "hover:border-brand-blue/30 hover:bg-brand-blue/5" : "hover:border-brand-blue/20 hover:bg-brand-blue/5"} transition-colors group`}
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? "bg-gradient-brand/15 group-hover:bg-gradient-brand/25" : "bg-gradient-brand/10 group-hover:bg-gradient-brand/20"} transition-colors`}>
                <f.icon size={20} className={isDark ? "text-brand-bluelight" : "text-brand-blue"} />
              </div>
              <h3 className={`font-display text-base font-bold ${isDark ? "text-white" : "text-ink"} mb-2`}>{f.title}</h3>
              <p className={`text-sm ${isDark ? "text-inkDark-muted" : "text-ink-muted"} leading-relaxed`}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`rounded-3xl border ${isDark ? "border-white/8 bg-gradient-to-br from-brand-blue/20 to-brand-purple/15" : "border-black/8 bg-gradient-to-br from-brand-blue/5 to-brand-purple/5"} p-12`}
        >
          <h2 className={`font-display text-4xl font-bold ${isDark ? "text-white" : "text-ink"} mb-4`}>
            Ready to get started?
          </h2>
          <p className={`${isDark ? "text-inkDark-muted" : "text-ink-muted"} mb-8 max-w-md mx-auto`}>
            Join Dot Bank today. Open your account in minutes and experience modern banking at its finest.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 rounded-xl bg-gradient-brand px-8 py-4 text-base font-bold text-white btn-glow hover:gap-3 transition-all group"
            >
              Open free account
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`rounded-xl border ${isDark ? "border-white/15 text-white hover:bg-white/8" : "border-black/15 text-ink hover:bg-black/8"} px-8 py-4 text-base font-semibold transition-all`}
            >
              Sign in
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t ${isDark ? "border-white/5" : "border-black/5"} px-6 py-8 text-center`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Landmark size={16} className={isDark ? "text-brand-bluelight" : "text-brand-blue"} />
          <span className={`font-display font-bold ${isDark ? "text-white" : "text-ink"}`}>Dot Bank</span>
        </div>
        <p className={`text-xs ${isDark ? "text-inkDark-muted" : "text-ink-muted"}`}>© 2026 Dot Bank. Secure. Modern. Reliable.</p>
      </footer>
    </div>
  );
}