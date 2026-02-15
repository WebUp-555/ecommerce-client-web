import { useEffect, useMemo, useState } from "react";
import { getAllContacts, deleteContact } from "../utils/api";

const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleString();
};

const isRecent = (iso) => {
  if (!iso) return false;
  const created = new Date(iso).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return Date.now() - created < dayMs;
};

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());

  const loadContacts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllContacts();
      setContacts(res?.contacts || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.email, c.subject, c.message]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [contacts, search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contact message?")) return;
    setDeleting(id);
    try {
      await deleteContact(id);
      await loadContacts();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete contact");
    } finally {
      setDeleting(null);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      alert("Email copied");
    } catch (_) {
      alert("Failed to copy email");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-300">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-900 min-h-screen">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Contact Messages</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Total: <span className="text-zinc-200 font-semibold">{contacts.length}</span> · Showing:{" "}
              <span className="text-zinc-200 font-semibold">{filtered.length}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search name, email, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:border-red-600 transition"
              />
            </div>
            <button
              type="button"
              onClick={loadContacts}
              className="px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:border-red-600 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/40 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No contact messages found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="bg-zinc-800 rounded-xl p-5 border border-zinc-700 shadow-lg hover:border-red-600/50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{c.subject}</h3>
                    {isRecent(c.createdAt) && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    {c.name} · {c.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${c.email}?subject=${encodeURIComponent(c.subject || "")}`}
                    className="px-3 py-2 text-sm bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition"
                  >
                    Reply
                  </a>
                  <button
                    onClick={() => handleCopyEmail(c.email)}
                    className="px-3 py-2 text-sm bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    disabled={deleting === c._id}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deleting === c._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              <p className={`text-zinc-300 mt-4 whitespace-pre-wrap ${expanded.has(c._id) ? "" : "line-clamp-3"}`}>
                {c.message}
              </p>
              {c.message && c.message.length > 160 && (
                <button
                  type="button"
                  onClick={() => toggleExpand(c._id)}
                  className="mt-2 text-sm text-red-400 hover:text-red-300"
                >
                  {expanded.has(c._id) ? "Show less" : "Show more"}
                </button>
              )}

              <p className="text-xs text-zinc-500 mt-4">
                Submitted: {formatDate(c.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
