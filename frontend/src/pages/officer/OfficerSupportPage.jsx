import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { officerNavItems, adminNavItems } from "../../router/navItems";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { LifeBuoy, Send, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";

const statusStyles = {
  OPEN: "bg-brand-blue/10 text-brand-blue",
  ANSWERED: "bg-success/10 text-success",
  CLOSED: "bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted",
};

const filters = ["ALL", "OPEN", "ANSWERED", "CLOSED"];

export default function OfficerSupportPage() {
  const { actor } = useAuth();
  const navItems = actor?.role === "admin" ? adminNavItems : officerNavItems;

  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  const [thread, setThread] = useState([]);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    const query = filter === "ALL" ? "" : `?status=${filter}`;
    api.get(`/support/tickets${query}`).then((d) => setTickets(d.tickets || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  async function openTicket(ticketId) {
    const data = await api.get(`/support/tickets/${ticketId}`);
    setActiveTicket(data.ticket);
    setThread(data.messages || []);
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/support/tickets/${activeTicket.ticket_id}/reply`, { message: reply });
      setReply("");
      const data = await api.get(`/support/tickets/${activeTicket.ticket_id}`);
      setActiveTicket(data.ticket);
      setThread(data.messages || []);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function closeTicket() {
    await api.post(`/support/tickets/${activeTicket.ticket_id}/close`, {});
    setActiveTicket(null);
    load();
  }

  return (
    <AppLayout navItems={navItems}>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand">
              <LifeBuoy size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Support Tickets</h1>
              <p className="text-sm text-ink-muted dark:text-inkDark-muted">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5">
            {/* Ticket list */}
            <div>
              <div className="flex gap-2 mb-4">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                      filter === f
                        ? "bg-gradient-brand text-white"
                        : "bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-4 h-16 animate-pulse" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-10 text-center">
                  <p className="text-sm text-ink-muted dark:text-inkDark-muted">No tickets here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <button
                      key={t.ticket_id}
                      onClick={() => openTicket(t.ticket_id)}
                      className={`w-full text-left rounded-xl border p-4 transition-colors ${
                        activeTicket?.ticket_id === t.ticket_id
                          ? "border-brand-blue bg-brand-blue/5"
                          : "border-black/5 dark:border-white/8 bg-white dark:bg-surfaceDark hover:border-brand-blue/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink dark:text-inkDark truncate">{t.subject}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusStyles[t.status]}`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted mt-1">{t.user_name} · {t.user_id}</p>
                      <p className="text-[11px] text-ink-muted dark:text-inkDark-muted flex items-center gap-1 mt-1">
                        <Clock size={10} />
                        {new Date(t.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thread panel */}
            <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5 min-h-[300px] flex flex-col">
              {!activeTicket ? (
                <div className="flex-1 flex items-center justify-center text-sm text-ink-muted dark:text-inkDark-muted">
                  Select a ticket to view the conversation
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-ink dark:text-inkDark">{activeTicket.subject}</p>
                      <p className="text-xs text-ink-muted dark:text-inkDark-muted">{activeTicket.user_id}</p>
                    </div>
                    {activeTicket.status !== "CLOSED" && (
                      <button
                        onClick={closeTicket}
                        className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted dark:text-inkDark-muted hover:text-danger transition-colors"
                      >
                        <CheckCircle2 size={14} /> Close ticket
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-96">
                    {thread.map((m) => (
                      <div
                        key={m.message_id}
                        className={`rounded-xl p-3 max-w-[85%] ${
                          m.sender_type === "USER"
                            ? "bg-black/5 dark:bg-white/8"
                            : "ml-auto bg-gradient-brand text-white"
                        }`}
                      >
                        <p className={`text-[11px] font-semibold mb-1 ${m.sender_type === "USER" ? "text-ink-muted dark:text-inkDark-muted" : "text-white/80"}`}>
                          {m.sender_type === "USER" ? "Customer" : `${m.sender_type.charAt(0)}${m.sender_type.slice(1).toLowerCase()} · ${m.sender_id}`}
                        </p>
                        <p className={`text-sm ${m.sender_type === "USER" ? "text-ink dark:text-inkDark" : "text-white"}`}>{m.body}</p>
                      </div>
                    ))}
                  </div>

                  {activeTicket.status !== "CLOSED" && (
                    <form onSubmit={submitReply} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Reply to customer…"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 text-sm text-ink dark:text-white outline-none focus:border-brand-blue"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center justify-center rounded-xl bg-gradient-brand px-3 disabled:opacity-60"
                      >
                        <Send size={16} className="text-white" />
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
