import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { api } from "../../api/client";

export default function LogoutButton() {
  const handleLogout = async () => {
    try { await api.post("/logout", {}); } finally {
      window.location.href = "/";
    }
  };

  return (
    <motion.button
      onClick={handleLogout}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium
                 text-ink-muted dark:text-inkDark-muted hover:bg-dangerDark/10 hover:text-dangerDark transition-all"
    >
      <LogOut size={15} />
      Sign out
    </motion.button>
  );
}
