import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="relative flex h-9 w-16 items-center rounded-full bg-surface-sunk dark:bg-surfaceDark-sunk
                 border border-black/5 dark:border-white/10 px-1 shadow-inner"
      aria-label="Toggle dark mode"
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-brand-navy shadow-card"
        style={{ marginLeft: isDark ? "28px" : "0px" }}
      >
        {isDark ? (
          <Moon size={14} className="text-brand-bluelight" />
        ) : (
          <Sun size={14} className="text-brand-blue" />
        )}
      </motion.div>
    </motion.button>
  );
}
