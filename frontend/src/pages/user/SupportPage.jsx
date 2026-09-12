import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "../../components/layout/AppLayout";
import { userNavItems } from "../../router/navItems";
import { api } from "../../api/client";
import { LifeBuoy, Send, Plus, ArrowLeft, Clock } from "lucide-react";

const statusStyles = {
  OPEN: "bg-brand-blue/10 text-brand-blue",
  ANSWERED: "bg-success/10 text-success",
  CLOSED: "bg-black/5 dark:bg-white/8 text-ink-muted dark:text-inkDark-muted",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | new | thread
  const [activeTicket, setActiveTicket] = useState(null);
  const [thread, setThread] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = () =>
    api.get("/support/tickets").then((d) => setTickets(d.tickets || [])).finally(() => setLoading(false));

  useEffect(() => { loadTickets(); }, []);

  async function openTicket(ticketId) {
    setError("");
    const data = await api.get(`/support/tickets/${ticketId}`);
    setActiveTicket(data.ticket);
    setThread(data.messages || []);
    setView("thread");
  }

  async function submitNewTicket(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api.post("/support/tickets", { subject, message });
      setSubject("");
      setMessage("");
      await loadTickets();
      openTicket(data.ticketId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
      loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout navItems={userNavItems}>
      <div className="mx-auto max-w-3xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>

          {view === "list" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand">
                    <LifeBuoy size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark">Support</h1>
                    <p className="text-sm text-ink-muted dark:text-inkDark-muted">Get help with your account</p>
                  </div>
                </div>
                <button
                  onClick={() => setView("new")}
                  className="flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-white"
                >
                  <Plus size={16} /> New Ticket
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 p-5 h-20 animate-pulse" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-16 text-center">
                  <p className="font-semibold text-ink dark:text-inkDark mb-1">No tickets yet</p>
                  <p className="text-sm text-ink-muted dark:text-inkDark-muted">Open one if you need help with anything.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <button
                      key={t.ticket_id}
                      onClick={() => openTicket(t.ticket_id)}
                      className="w-full text-left rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-5 hover:border-brand-blue/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-ink dark:text-inkDark">{t.subject}</p>
                          <p className="text-xs text-ink-muted dark:text-inkDark-muted flex items-center gap-1 mt-1">
                            <Clock size={11} />
                            {new Date(t.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[t.status]}`}>
                          {t.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {view === "new" && (
            <>
              <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-ink-muted dark:text-inkDark-muted mb-6">
                <ArrowLeft size={16} /> Back
              </button>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-inkDark mb-6">New Support Ticket</h1>
              {error && <p className="mb-4 text-sm text-danger">{error}</p>}
              <form onSubmit={submitNewTicket} className="space-y-4 rounded-card bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8 shadow-card dark:shadow-cardDark p-6">
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-white outline-none focus:border-brand-blue"
                />
                <textarea
                  placeholder="Describe your issue…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-white outline-none focus:border-brand-blue resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-brand py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Ticket"}
                </button>
              </form>
            </>
          )}

          {view === "thread" && activeTicket && (
            <>
              <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-ink-muted dark:text-inkDark-muted mb-6">
                <ArrowLeft size={16} /> Back to tickets
              </button>
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-display text-xl font-bold text-ink dark:text-inkDark">{activeTicket.subject}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyles[activeTicket.status]}`}>
                  {activeTicket.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {thread.map((m) => (
                  <div
                    key={m.message_id}
                    className={`rounded-card p-4 max-w-[85%] ${
                      m.sender_type === "USER"
                        ? "ml-auto bg-gradient-brand text-white"
                        : "bg-white dark:bg-surfaceDark border border-black/5 dark:border-white/8"
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${m.sender_type === "USER" ? "text-white/80" : "text-ink-muted dark:text-inkDark-muted"}`}>
                      {m.sender_type === "USER" ? "You" : `${m.sender_type.charAt(0)}${m.sender_type.slice(1).toLowerCase()}`}
                    </p>
                    <p className={`text-sm ${m.sender_type === "USER" ? "text-white" : "text-ink dark:text-inkDark"}`}>{m.body}</p>
                  </div>
                ))}
              </div>

              {activeTicket.status !== "CLOSED" ? (
                <form onSubmit={submitReply} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a reply…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-4 py-3 text-ink dark:text-white outline-none focus:border-brand-blue"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center rounded-xl bg-gradient-brand px-4 disabled:opacity-60"
                  >
                    <Send size={18} className="text-white" />
                  </button>
                </form>
              ) : (
                <p className="text-center text-sm text-ink-muted dark:text-inkDark-muted">This ticket is closed.</p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
