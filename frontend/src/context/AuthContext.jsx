import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

const STORAGE_KEY = "dotbank_selected_account_no";

export function AuthProvider({ children }) {
  const [actor, setActor] = useState(null); // { role, id }
  const [accounts, setAccounts] = useState([]); // all of this user's accounts
  const [selectedAccountNo, setSelectedAccountNo] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  );
  const [loading, setLoading] = useState(true);

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await api.get("/accounts");
      const list = data.accounts || [];
      setAccounts(list);
      // keep the current selection if it still exists, otherwise fall back to the first account
      setSelectedAccountNo((prev) =>
        prev && list.some((a) => a.account_no === prev) ? prev : (list[0]?.account_no ?? null)
      );
    } catch {
      setAccounts([]);
      setSelectedAccountNo(null);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountNo) {
      localStorage.setItem(STORAGE_KEY, selectedAccountNo);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedAccountNo]);

  const refreshActor = useCallback(async () => {
    try {
      const me = await api.get("/me");
      setActor({ role: me.role, id: me.id, profilePictureUrl: me.profilePictureUrl ?? null });
      return me;
    } catch {
      setActor(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const me = await refreshActor();
      if (me?.role === "user") await refreshAccounts();
      setLoading(false);
    })();
  }, [refreshActor, refreshAccounts]);

  // The "active" account: whichever one is selected, used by Withdraw/Pay Bill/
  // Loan/Statement pages so they don't all need to be rewritten to handle a list.
  const account = useMemo(
    () => accounts.find((a) => a.account_no === selectedAccountNo) || accounts[0] || null,
    [accounts, selectedAccountNo]
  );

  const selectAccount = useCallback((accountNo) => setSelectedAccountNo(accountNo), []);

  // Kept as an alias so existing pages that call refreshAccount() after a
  // transaction still work — it just refreshes the whole list now.
  const refreshAccount = refreshAccounts;

  return (
    <AuthContext.Provider
      value={{ actor, account, accounts, selectAccount, loading, refreshAccount, refreshAccounts, refreshActor }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}