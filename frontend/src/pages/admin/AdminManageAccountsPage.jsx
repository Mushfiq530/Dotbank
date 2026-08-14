import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import AccountsManager from "../../components/shared/AccountsManager";
import { adminNavItems } from "../../router/navItems";
import { useAuth } from "../../context/AuthContext";
import { Wallet } from "lucide-react";

export default function AdminManageAccountsPage() {
  const { actor } = useAuth();
  return (
    <AppLayout navItems={adminNavItems}>
      <div className="mx-auto max-w-4xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Manage Accounts</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">Freeze or unfreeze any account</p>
            </div>
          </div>
          <AccountsManager />
        </motion.div>
      </div>
    </AppLayout>
  );
}
