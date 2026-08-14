import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

/**
 * items: [{ to, label, icon: LucideIcon, badge?: boolean }]
 * greeting: string shown next to the logo (e.g. "Hi, Tanzim")
 */
export default function TopNav({ items, greeting }) {
  return (
    <header className="border-b border-black/5 dark:border-white/10 bg-white dark:bg-surfaceDark">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Dot Bank" className="h-7 w-7 rounded" />
          <span className="font-display text-base font-semibold text-ink dark:text-inkDark hidden sm:inline">
            Dot Bank
          </span>
          {greeting && (
            <span className="ml-2 text-xs text-ink-muted dark:text-inkDark-muted hidden md:inline">
              {greeting}
            </span>
          )}
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} className="relative">
              {({ isActive }) => (
                <motion.div
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors
                    ${
                      isActive
                        ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-bluelight/10 dark:text-brand-bluelight"
                        : "text-ink-muted dark:text-inkDark-muted hover:bg-surface-sunk dark:hover:bg-surfaceDark-sunk"
                    }`}
                >
                  <Icon size={15} />
                  <span className="hidden lg:inline">{label}</span>
                  {badge && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger dark:bg-dangerDark" />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
