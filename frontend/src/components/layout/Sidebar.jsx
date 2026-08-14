import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, LogOut, Landmark } from "lucide-react";
import { api } from "../../api/client";

export default function Sidebar({ items }) {
  const { actor } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try { await api.post("/logout", {}); } finally {
      window.location.href = "/";
    }
  };

  const roleLabel = { user: "Personal", officer: "Officer", admin: "Admin" };
  const roleColors = {
    user: "bg-brand-blue/15 text-brand-bluelight",
    officer: "bg-amber-500/15 text-amber-400",
    admin: "bg-brand-purple/15 text-purple-400",
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen bg-surfaceDark border-r border-white/5 shadow-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glowSm">
          <Landmark size={18} className="text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-inkDark text-base leading-none">Dot Bank</span>
          {actor && (
            <span className={`mt-1 flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${roleColors[actor.role] || "bg-white/10 text-inkDark-muted"}`}>
              {roleLabel[actor.role] || actor.role}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-brand-blue text-white shadow-glowSm"
                    : "text-inkDark-muted hover:bg-white/5 hover:text-inkDark"
                }`}
              >
                <Icon size={16} className={isActive ? "text-white" : "text-inkDark-muted"} />
                {label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom area */}
      <div className="px-3 pb-5 space-y-1 border-t border-white/5 pt-3">
        {/* User info */}
        {actor && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-inkDark-muted">Signed in as</p>
            <p className="text-sm font-semibold text-inkDark font-mono">{actor.id}</p>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-inkDark-muted hover:bg-white/5 hover:text-inkDark transition-all"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-inkDark-muted hover:bg-dangerDark/10 hover:text-dangerDark transition-all"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
