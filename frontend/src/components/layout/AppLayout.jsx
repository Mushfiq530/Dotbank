import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, LogOut, Landmark, Menu, X } from "lucide-react";
import { api } from "../../api/client";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function AppLayout({ children, navItems }) {
  const { actor } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try { await api.post("/logout", {}); } finally {
      window.location.href = "/";
    }
  };

  const roleLabel = { user: "Personal", officer: "Officer", admin: "Admin" };
  const roleColors = {
    user: "bg-brand-blue/15 text-brand-bluelight",
    officer: "bg-amber-500/15 text-amber-400",
    admin: "bg-purple-500/15 text-purple-400",
  };

  return (
    <div className="flex min-h-screen bg-surface-sunk dark:bg-surfaceDark-sunk">
      {/* Desktop Sidebar */}
      <Sidebar items={navItems} />

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 bottom-0 w-72 bg-surfaceDark border-r border-white/5 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
                  <Landmark size={18} className="text-white" />
                </div>
                <span className="font-display font-bold text-inkDark text-base">Dot Bank</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-inkDark-muted">
                <X size={20} />
              </button>
            </div>

            {actor && (
              <div className="mx-4 mb-3 rounded-xl bg-white/5 px-4 py-3">
                <p className="text-xs text-inkDark-muted">Signed in as</p>
                <p className="text-sm font-bold text-inkDark">{actor.id}</p>
                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleColors[actor.role] || ""}`}>
                  {roleLabel[actor.role] || actor.role}
                </span>
              </div>
            )}

            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}>
                  {({ isActive }) => (
                    <div className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                      isActive ? "bg-brand-blue text-white" : "text-inkDark-muted hover:bg-white/5 hover:text-inkDark"
                    }`}>
                      <Icon size={16} />
                      {label}
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="px-3 pb-6 pt-3 border-t border-white/5 space-y-1">
              <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-inkDark-muted hover:bg-white/5 hover:text-inkDark transition-all">
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-inkDark-muted hover:bg-dangerDark/10 hover:text-dangerDark transition-all">
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </motion.aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-surfaceDark border-b border-white/5 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-inkDark-muted p-1">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand">
              <Landmark size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-inkDark text-sm">Dot Bank</span>
          </div>
          <button onClick={toggleTheme} className="text-inkDark-muted p-1">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Page content */}
        <motion.main
          key={window.location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 overflow-y-auto pb-20 lg:pb-8"
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav items={navItems} />
    </div>
  );
}
