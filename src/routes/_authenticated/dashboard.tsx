import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import type { OilCode, OilCodeInput } from "@/lib/oil-types";
import { BRANDS } from "@/lib/oil-types";
import {
  exportToExcel,
  exportToPDF,
  exportBackupJSON,
  parseBackupJSON,
} from "@/lib/export";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  FileSpreadsheet,
  FileText,
  Database,
  Upload,
  Loader2,
  X,
  Filter,
  TrendingUp,
  Clock,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TS-AUTO" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});

const EMPTY: OilCodeInput = {
  oil_code: "",
  vehicle_brand: "",
  vehicle_model: "",
  year: "",
  engine: "",
  oil_type: "",
  viscosity: "",
  notes: "",
};

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("ALL");
  const [editing, setEditing] = useState<OilCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<OilCode | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["oil_codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oil_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OilCode[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (brandFilter !== "ALL" && r.vehicle_brand !== brandFilter) return false;
      if (!q) return true;
      return (
        r.oil_code.toLowerCase().includes(q) ||
        r.vehicle_brand.toLowerCase().includes(q) ||
        (r.vehicle_model ?? "").toLowerCase().includes(q) ||
        (r.engine ?? "").toLowerCase().includes(q) ||
        (r.oil_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, brandFilter]);

  useEffect(() => setPage(1), [search, brandFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => {
    const typeCount = new Map<string, number>();
    rows.forEach((r) => {
      const t = r.oil_type || "Other";
      typeCount.set(t, (typeCount.get(t) ?? 0) + 1);
    });
    const topTypes = [...typeCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const recent = [...rows]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 5);
    return { total: rows.length, topTypes, recent };
  }, [rows]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { input: OilCodeInput; id?: string }) => {
      if (payload.id) {
        const { error } = await supabase
          .from("oil_codes")
          .update(payload.input)
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("oil_codes").insert(payload.input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oil_codes"] });
      setEditing(null);
      setCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("oil_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oil_codes"] });
      setConfirmDelete(null);
    },
  });

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const items = await parseBackupJSON(file);
      const sanitized = items
        .filter((r) => r.oil_code && r.vehicle_brand)
        .map((r) => ({
          oil_code: r.oil_code!,
          vehicle_brand: r.vehicle_brand!,
          vehicle_model: r.vehicle_model ?? null,
          year: r.year ?? null,
          engine: r.engine ?? null,
          oil_type: r.oil_type ?? null,
          viscosity: r.viscosity ?? null,
          notes: r.notes ?? null,
        }));
      if (!sanitized.length) throw new Error("ცარიელი backup ფაილი");
      const { error } = await supabase.from("oil_codes").insert(sanitized);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["oil_codes"] });
      alert(`აღდგენილია ${sanitized.length} ჩანაწერი`);
    } catch (err: any) {
      alert("შეცდომა: " + err.message);
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Logo size="sm" showTagline={false} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">გასვლა</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Heading */}
        <div className="animate-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text-primary">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ზეთის კოდების მართვის ცენტრი
          </p>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up">
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="სულ ჩანაწერი"
            value={stats.total.toString()}
            accent="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="ყველაზე ხშირი ტიპი"
            value={stats.topTypes[0]?.[0] ?? "—"}
            sub={stats.topTypes[0] ? `${stats.topTypes[0][1]} ჩანაწერი` : ""}
            accent="gold"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="ბოლო დამატება"
            value={
              stats.recent[0]
                ? new Date(stats.recent[0].created_at).toLocaleDateString()
                : "—"
            }
            sub={stats.recent[0]?.oil_code}
            accent="blue"
          />
        </section>

        {/* Controls */}
        <section className="glass rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-up">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ძებნა: კოდი, ბრენდი, მოდელი, ძრავი..."
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCreating(true)}
                className="btn-gold px-4 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> დამატება
              </button>
              <button
                onClick={() => exportToExcel(filtered)}
                className="px-3 py-3 rounded-lg glass hover-lift flex items-center gap-2 text-sm font-medium"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel
              </button>
              <button
                onClick={() => exportToPDF(filtered)}
                className="px-3 py-3 rounded-lg glass hover-lift flex items-center gap-2 text-sm font-medium"
              >
                <FileText className="w-4 h-4 text-rose-400" /> PDF
              </button>
              <button
                onClick={() => exportBackupJSON(rows)}
                className="px-3 py-3 rounded-lg glass hover-lift flex items-center gap-2 text-sm font-medium"
              >
                <Database className="w-4 h-4 text-blue-400" /> Backup
              </button>
              <label className="px-3 py-3 rounded-lg glass hover-lift flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Upload className="w-4 h-4 text-gold" /> Restore
                <input type="file" accept="application/json" onChange={handleRestore} className="hidden" />
              </label>
            </div>
          </div>

          {/* Brand filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <FilterChip active={brandFilter === "ALL"} onClick={() => setBrandFilter("ALL")}>
              ყველა
            </FilterChip>
            {BRANDS.map((b) => (
              <FilterChip
                key={b}
                active={brandFilter === b}
                onClick={() => setBrandFilter(b)}
              >
                {b}
              </FilterChip>
            ))}
          </div>
        </section>

        {/* Table */}
        <section className="glass rounded-2xl overflow-hidden animate-fade-up">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Database className="w-10 h-10 mx-auto mb-3 opacity-40" />
              ჩანაწერი ვერ მოიძებნა
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr className="text-left">
                      <Th>Oil Code</Th>
                      <Th>Brand</Th>
                      <Th>Model</Th>
                      <Th>Year</Th>
                      <Th>Engine</Th>
                      <Th>Type</Th>
                      <Th>Viscosity</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/50 hover:bg-accent/30 transition"
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-gold">{r.oil_code}</td>
                        <td className="px-4 py-3">{r.vehicle_brand}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.vehicle_model}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.year}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.engine}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.oil_type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.viscosity}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <IconBtn onClick={() => setEditing(r)} title="რედაქტირება">
                              <Pencil className="w-4 h-4" />
                            </IconBtn>
                            <IconBtn
                              onClick={() => setConfirmDelete(r)}
                              title="წაშლა"
                              danger
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-border">
                {paged.map((r) => (
                  <li key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-gold text-lg">{r.oil_code}</div>
                        <div className="font-semibold mt-0.5">
                          {r.vehicle_brand} {r.vehicle_model}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {[r.year, r.engine, r.oil_type, r.viscosity].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <IconBtn onClick={() => setEditing(r)} title="რედაქტირება">
                          <Pencil className="w-4 h-4" />
                        </IconBtn>
                        <IconBtn onClick={() => setConfirmDelete(r)} title="წაშლა" danger>
                          <Trash2 className="w-4 h-4" />
                        </IconBtn>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  ნაჩვენებია {paged.length} / {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded text-sm disabled:opacity-30 hover:bg-accent transition"
                  >
                    ‹
                  </button>
                  <span className="text-sm px-2 text-muted-foreground">
                    {page} / {pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-3 py-1.5 rounded text-sm disabled:opacity-30 hover:bg-accent transition"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Edit / Create modal */}
      {(editing || creating) && (
        <EditModal
          initial={editing ?? EMPTY}
          isEdit={!!editing}
          loading={saveMutation.isPending}
          error={saveMutation.error as Error | null}
          onClose={() => {
            setEditing(null);
            setCreating(false);
            saveMutation.reset();
          }}
          onSave={(input) =>
            saveMutation.mutate({ input, id: editing?.id })
          }
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmModal
          title="წაშლა?"
          message={`დარწმუნებული ხართ რომ გსურთ წაშალოთ კოდი ${confirmDelete.oil_code}?`}
          loading={deleteMutation.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
        />
      )}
    </div>
  );
}

/* ---------- Small components ---------- */

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition ${
        danger
          ? "text-destructive hover:bg-destructive/15"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-glow-blue"
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: "blue" | "gold";
}) {
  return (
    <div className="glass rounded-2xl p-5 hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold mt-2 font-display">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div
          className={`p-2.5 rounded-xl ${
            accent === "gold"
              ? "bg-gold/15 text-gold shadow-glow-gold"
              : "bg-primary/15 text-primary shadow-glow-blue"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function EditModal({
  initial,
  isEdit,
  onClose,
  onSave,
  loading,
  error,
}: {
  initial: OilCodeInput;
  isEdit: boolean;
  onClose: () => void;
  onSave: (input: OilCodeInput) => void;
  loading: boolean;
  error: Error | null;
}) {
  const [form, setForm] = useState<OilCodeInput>(initial);

  function set<K extends keyof OilCodeInput>(k: K, v: OilCodeInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-up">
      <div className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elegant">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 glass-strong z-10">
          <h2 className="text-xl font-bold font-display">
            {isEdit ? "რედაქტირება" : "ახალი ჩანაწერი"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Field label="Oil Code *" value={form.oil_code} onChange={(v) => set("oil_code", v)} required />
          <Field
            label="Vehicle Brand *"
            value={form.vehicle_brand}
            onChange={(v) => set("vehicle_brand", v)}
            required
          />
          <Field label="Vehicle Model" value={form.vehicle_model ?? ""} onChange={(v) => set("vehicle_model", v)} />
          <Field label="Year" value={form.year ?? ""} onChange={(v) => set("year", v)} />
          <Field label="Engine" value={form.engine ?? ""} onChange={(v) => set("engine", v)} />
          <Field label="Oil Type" value={form.oil_type ?? ""} onChange={(v) => set("oil_type", v)} />
          <Field label="Viscosity" value={form.viscosity ?? ""} onChange={(v) => set("viscosity", v)} />
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full mt-1.5 px-3 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
            />
          </div>
          {error && (
            <div className="sm:col-span-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {error.message}
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border hover:bg-accent transition text-sm font-medium"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-premium px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              შენახვა
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1.5 px-3 py-2 rounded-lg bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring transition"
      />
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-sm p-6 shadow-elegant animate-fade-up">
        <h3 className="text-lg font-bold font-display">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition text-sm font-medium"
          >
            გაუქმება
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:brightness-110 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            წაშლა
          </button>
        </div>
      </div>
    </div>
  );
}
