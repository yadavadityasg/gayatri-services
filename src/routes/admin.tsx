import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { publicSiteUrl } from "@/lib/sites";
import { useEffect, useRef, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { useIsAdmin } from "@/lib/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/data/catalog";
import { toast } from "sonner";
import { Bell, Loader2, LogOut, MapPin, Mic, Pencil, Plus, Search, Square, Trash2, ShieldAlert } from "lucide-react";

type TableName = keyof Database["public"]["Tables"] | "technician_tasks";

async function adminQuery(body: Record<string, unknown>) {
  const response = await fetch("/api/admin/query", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: { message: payload.error || "Request failed" } };
  return { data: payload.data ?? null, error: null };
}

function dbFrom(table: TableName) {
  return {
    select() {
      return {
        order(orderBy: string) {
          return adminQuery({ op: "select", table, orderBy });
        },
      };
    },
    insert(row: Record<string, unknown>) {
      return adminQuery({ op: "insert", table, row });
    },
    update(row: Record<string, unknown>) {
      return {
        eq(pk: string, id: string) {
          return adminQuery({ op: "update", table, row, pk, id });
        },
      };
    },
    delete() {
      return {
        eq(pk: string, id: string) {
          return adminQuery({ op: "delete", table, pk, id });
        },
      };
    },
  };
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Gayatri" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPage,
});

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Invalid email or password.");
      setLoading(false);
      return;
    }
    onSuccess();
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-ink p-4">
      <Card className="w-full max-w-md p-8 bg-card">
        <div className="text-center mb-6">
          <ShieldAlert className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-sm text-muted-foreground">Restricted area — admins only</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            <a href={publicSiteUrl} className="underline">← Back to site</a>
          </p>
        </form>
      </Card>
    </div>
  );
}

function AdminPage() {
  const [tick, setTick] = useState(0);
  const { isAdmin, loading, user } = useIsAdmin(tick);
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !isAdmin) return <AdminLogin onSuccess={() => setTick((value) => value + 1)} />;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setTick((value) => value + 1);
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-secondary text-secondary-foreground border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gradient-gold">Gayatri Admin</h1>
            <p className="text-xs opacity-70">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><a href={publicSiteUrl}>View Site</a></Button>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-1" />Logout</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          Update products, repair services, AMC plans, and technicians. Assign a job with the problem, address, map link, and a voice note. When a technician marks a job complete, their comment or voice note appears on the task.
        </p>
        <Tabs defaultValue="technicians">
          <TabsList className="grid h-auto w-full max-w-2xl grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="amc">AMC Plans</TabsTrigger>
            <TabsTrigger value="technicians">Technicians</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6"><ProductsAdmin /></TabsContent>
          <TabsContent value="services" className="mt-6"><ServicesAdmin /></TabsContent>
          <TabsContent value="amc" className="mt-6"><AmcAdmin /></TabsContent>
          <TabsContent value="technicians" className="mt-6"><TechniciansAdmin /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ----------------- Generic helpers -----------------
function useTable<T extends Record<string, unknown>>(table: TableName, orderBy = "name") {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await dbFrom(table).select("*").order(orderBy as string);
    if (error) toast.error(error.message); else setRows((data as unknown as T[]) || []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return { rows, loading, refresh };
}

async function saveRow(table: TableName, row: Record<string, unknown>, isNew: boolean, pk: string) {
  if (isNew) {
    const { error } = await dbFrom(table).insert(row as never);
    if (error) { toast.error(error.message); return false; }
  } else {
    const { [pk]: id, ...rest } = row;
    const { error } = await dbFrom(table).update(rest as never).eq(pk, id as string);
    if (error) { toast.error(error.message); return false; }
  }
  toast.success("Saved");
  return true;
}

type DeleteDialogProps = { open: boolean; onConfirm: () => void; onCancel: () => void };
function DeleteDialog({ open, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this item?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

async function deleteRow(table: TableName, pk: string, id: string) {
  const { error } = await dbFrom(table).delete().eq(pk, id);
  if (error) { toast.error(error.message); return false; }
  toast.success("Deleted");
  return true;
}

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item ?? "")) : [];
}

function cleanList(value: unknown) {
  return asList(value).map((item) => item.trim()).filter(Boolean);
}

function cleanSpecs(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({ label: String(item?.label ?? "").trim(), value: String(item?.value ?? "").trim() }))
    .filter((item) => item.label || item.value);
}

function cleanReviews(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      name: String(item?.name ?? "").trim(),
      rating: Math.min(5, Math.max(1, Number(item?.rating) || 5)),
      text: String(item?.text ?? "").trim(),
    }))
    .filter((item) => item.name || item.text);
}

function cleanBreakdown(value: unknown) {
  const source = Array.isArray(value) ? value : [];
  return [0, 1, 2, 3, 4].map((index) => Math.max(0, Number(source[index]) || 0));
}

function inr(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "—";
}

function rowMatches(row: Record<string, unknown>, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle));
}

const CONDITIONS = ["New", "Refurbished", "Certified Pre-owned"];
const SERVICE_ICONS = [...new Set([...CATEGORIES.map((category) => category.icon), "wrench"])];

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative w-48 shrink-0 sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" placeholder="Search" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ChoiceField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const known = options.some((option) => option.value === value);
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
        <SelectContent>
          {!known && value ? <SelectItem value={value}>{value}</SelectItem> : null}
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: file.name, data }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(payload.error || "Upload failed.");
        return;
      }
      onChange(payload.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          <img src={value} alt="" className="h-20 w-20 rounded-md border bg-muted object-cover" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-md border bg-muted text-center text-[11px] text-muted-foreground">No photo</div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy} onChange={(event) => pick(event.target.files?.[0])} />
          <p className="text-xs text-muted-foreground">{busy ? "Uploading…" : "JPG, PNG, WebP, or GIF, up to 5 MB."}</p>
        </div>
      </div>
    </div>
  );
}

function StringListField({ label, hint, value, onChange, placeholder }: { label: string; hint?: string; value: unknown; onChange: (value: string[]) => void; placeholder?: string }) {
  const items = asList(value);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input value={item} placeholder={placeholder} onChange={(event) => onChange(items.map((entry, itemIndex) => itemIndex === index ? event.target.value : entry))} />
          <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${label}`} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}><Plus className="h-4 w-4 mr-1" />Add</Button>
    </div>
  );
}

function SpecListField({ value, onChange }: { value: unknown; onChange: (value: { label: string; value: string }[]) => void }) {
  const items = Array.isArray(value)
    ? value.map((item) => ({ label: String(item?.label ?? ""), value: String(item?.value ?? "") }))
    : [];
  const update = (next: { label: string; value: string }[]) => onChange(next);
  return (
    <div className="space-y-2">
      <Label>Specifications</Label>
      <p className="text-xs text-muted-foreground">Each row is one detail, such as Capacity and 1.5 Ton.</p>
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input placeholder="Label" value={item.label} onChange={(event) => update(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry))} />
          <Input placeholder="Value" value={item.value} onChange={(event) => update(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, value: event.target.value } : entry))} />
          <Button type="button" size="icon" variant="ghost" aria-label="Remove specification" onClick={() => update(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => update([...items, { label: "", value: "" }])}><Plus className="h-4 w-4 mr-1" />Add specification</Button>
    </div>
  );
}

function ReviewListField({ value, onChange }: { value: unknown; onChange: (value: { name: string; rating: number; text: string }[]) => void }) {
  const items = Array.isArray(value)
    ? value.map((item) => ({ name: String(item?.name ?? ""), rating: Number(item?.rating) || 5, text: String(item?.text ?? "") }))
    : [];
  const update = (next: { name: string; rating: number; text: string }[]) => onChange(next);
  return (
    <div className="space-y-3">
      <Label>Customer reviews</Label>
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-md border bg-background p-3">
          <div className="grid grid-cols-[1fr_120px_auto] gap-2">
            <Input placeholder="Customer name" value={item.name} onChange={(event) => update(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, name: event.target.value } : entry))} />
            <Select value={String(item.rating)} onValueChange={(rating) => update(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, rating: Number(rating) } : entry))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating} star{rating === 1 ? "" : "s"}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" size="icon" variant="ghost" aria-label="Remove review" onClick={() => update(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <Textarea rows={2} placeholder="What they said" value={item.text} onChange={(event) => update(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, text: event.target.value } : entry))} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => update([...items, { name: "", rating: 5, text: "" }])}><Plus className="h-4 w-4 mr-1" />Add review</Button>
    </div>
  );
}

function RatingBreakdownField({ value, onChange }: { value: unknown; onChange: (value: number[]) => void }) {
  const counts = cleanBreakdown(value);
  const labels = ["5 stars", "4 stars", "3 stars", "2 stars", "1 star"];
  return (
    <div className="space-y-2">
      <Label>How many reviews at each star rating</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {labels.map((label, index) => (
          <div key={label}>
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input type="number" min={0} value={counts[index]} onChange={(event) => onChange(counts.map((count, countIndex) => countIndex === index ? Math.max(0, Number(event.target.value) || 0) : count))} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveBadge({ active }: { active: unknown }) {
  return <Badge variant={active ? "secondary" : "outline"}>{active ? "Visible" : "Hidden"}</Badge>;
}

// ----------------- PRODUCTS -----------------
function ProductsAdmin() {
  const { rows, loading, refresh } = useTable<Record<string, unknown>>("products", "name");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const visible = rows.filter((row) => rowMatches(row, query));

  const blank = () => ({ id: "", name: "", brand: "", category: "ac", condition: "New", price: 0, mrp: 0, rating: 4.5, reviews: 0, image: "", capacity: "", energy_rating: null, description: "", specs: [], box: [], warranty: "", active: true });

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">{visible.length} of {rows.length}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SearchBox value={query} onChange={setQuery} />
          <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New product</Button>
        </div>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No products match this search.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead></TableHead><TableHead>Name</TableHead><TableHead>Brand</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {visible.map(r => (
              <TableRow key={String(r.id)}>
                <TableCell>{r.image ? <img src={String(r.image)} alt="" className="h-10 w-10 rounded object-cover border" /> : <div className="h-10 w-10 rounded bg-muted" />}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate font-medium">{String(r.name)}</div>
                  <div className="font-mono text-xs text-muted-foreground">{String(r.id)}</div>
                </TableCell>
                <TableCell>{String(r.brand || "")}</TableCell>
                <TableCell>{inr(r.price)} <span className="text-muted-foreground line-through">{inr(r.mrp)}</span></TableCell>
                <TableCell><ActiveBadge active={r.active} /></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Edit product" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete product" onClick={() => setDeleteTarget(String(r.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id && rows.find(r => r.id === editing.id) ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Product code</Label><Input value={String(editing.id ?? "")} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!rows.find(r => r.id === editing.id)} /></div>
              <div><Label>Brand</Label><Input value={String(editing.brand ?? "")} onChange={e => setEditing({ ...editing, brand: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Name</Label><Input value={String(editing.name ?? "")} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <ChoiceField label="Category" value={String(editing.category ?? "")} options={CATEGORIES.map((category) => ({ value: category.id, label: category.label }))} onChange={(category) => setEditing({ ...editing, category })} />
              <ChoiceField label="Condition" value={String(editing.condition ?? "")} options={CONDITIONS.map((condition) => ({ value: condition, label: condition }))} onChange={(condition) => setEditing({ ...editing, condition })} />
              <div><Label>Selling price (₹)</Label><Input type="number" value={Number(editing.price ?? 0)} onChange={e => setEditing({ ...editing, price: +e.target.value })} /></div>
              <div><Label>Original price (₹)</Label><Input type="number" value={Number(editing.mrp ?? 0)} onChange={e => setEditing({ ...editing, mrp: +e.target.value })} /></div>
              <div><Label>Rating</Label><Input type="number" step="0.1" min={0} max={5} value={Number(editing.rating ?? 0)} onChange={e => setEditing({ ...editing, rating: +e.target.value })} /></div>
              <div><Label>Review count</Label><Input type="number" value={Number(editing.reviews ?? 0)} onChange={e => setEditing({ ...editing, reviews: +e.target.value })} /></div>
              <div><Label>Capacity</Label><Input value={String(editing.capacity ?? "")} onChange={e => setEditing({ ...editing, capacity: e.target.value || null })} placeholder="1.5 Ton" /></div>
              <div><Label>Energy stars</Label><Input type="number" value={editing.energy_rating == null ? "" : Number(editing.energy_rating)} onChange={e => setEditing({ ...editing, energy_rating: e.target.value ? +e.target.value : null })} /></div>
              <div className="sm:col-span-2"><ImageField label="Product photo" value={String(editing.image ?? "")} onChange={(image) => setEditing({ ...editing, image })} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea value={String(editing.description ?? "")} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Warranty</Label><Input value={String(editing.warranty ?? "")} onChange={e => setEditing({ ...editing, warranty: e.target.value })} placeholder="1 year brand + 1 year extra" /></div>
              <div className="sm:col-span-2"><SpecListField value={editing.specs} onChange={(specs) => setEditing({ ...editing, specs })} /></div>
              <div className="sm:col-span-2"><StringListField label="What is in the box" hint="One item per line." value={editing.box} onChange={(box) => setEditing({ ...editing, box })} placeholder="Indoor unit" /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={Boolean(editing.active)} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Show this product in the shop</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              if (!editing) return;
              const isNew = !rows.find(r => r.id === editing.id);
              const row = { ...editing, specs: cleanSpecs(editing.specs), box: cleanList(editing.box) };
              if (await saveRow("products", row, isNew, "id")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget && await deleteRow("products", "id", deleteTarget)) { setDeleteTarget(null); refresh(); } else setDeleteTarget(null); }}
      />
    </Card>
  );
}

// ----------------- SERVICES -----------------
function ServicesAdmin() {
  const { rows, loading, refresh } = useTable<Record<string, unknown>>("services", "name");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const visible = rows.filter((row) => rowMatches(row, query));
  const blank = () => ({ slug: "", category: "ac", category_label: "AC", name: "", short: "", starting_at: 499, duration: "60 min", icon: "wrench", includes: [], problems: [], active: true });

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">{visible.length} of {rows.length}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SearchBox value={query} onChange={setQuery} />
          <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New service</Button>
        </div>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No services match this search.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Starts at</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {visible.map(r => (
              <TableRow key={String(r.slug)}>
                <TableCell>
                  <div className="font-medium">{String(r.name)}</div>
                  <div className="font-mono text-xs text-muted-foreground">{String(r.slug)}</div>
                </TableCell>
                <TableCell>{String(r.category_label || "")}</TableCell>
                <TableCell>{inr(r.starting_at)}</TableCell>
                <TableCell><ActiveBadge active={r.active} /></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Edit service" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete service" onClick={() => setDeleteTarget(String(r.slug))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing && rows.find(r => r.slug === editing.slug) ? "Edit service" : "New service"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Page address</Label><Input value={String(editing.slug ?? "")} onChange={e => setEditing({ ...editing, slug: e.target.value })} disabled={!!rows.find(r => r.slug === editing.slug)} placeholder="ac-repair" /></div>
              <ChoiceField label="Icon" value={String(editing.icon ?? "")} options={SERVICE_ICONS.map((icon) => ({ value: icon, label: icon }))} onChange={(icon) => setEditing({ ...editing, icon })} />
              <div className="sm:col-span-2"><Label>Name</Label><Input value={String(editing.name ?? "")} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Short description</Label><Input value={String(editing.short ?? "")} onChange={e => setEditing({ ...editing, short: e.target.value })} /></div>
              <ChoiceField
                label="Category"
                value={String(editing.category ?? "")}
                options={CATEGORIES.map((category) => ({ value: category.id, label: category.label }))}
                onChange={(category) => {
                  const match = CATEGORIES.find((item) => item.id === category);
                  setEditing({ ...editing, category, category_label: match?.label || editing.category_label });
                }}
              />
              <div><Label>Category name</Label><Input value={String(editing.category_label ?? "")} onChange={e => setEditing({ ...editing, category_label: e.target.value })} /></div>
              <div><Label>Starting price (₹)</Label><Input type="number" value={Number(editing.starting_at ?? 0)} onChange={e => setEditing({ ...editing, starting_at: +e.target.value })} /></div>
              <div><Label>Typical duration</Label><Input value={String(editing.duration ?? "")} onChange={e => setEditing({ ...editing, duration: e.target.value })} placeholder="60 min" /></div>
              <div className="sm:col-span-2"><StringListField label="What is included" hint="One item per line." value={editing.includes} onChange={(includes) => setEditing({ ...editing, includes })} placeholder="Inspection" /></div>
              <div className="sm:col-span-2"><StringListField label="Common problems" hint="One problem per line." value={editing.problems} onChange={(problems) => setEditing({ ...editing, problems })} placeholder="AC not cooling" /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={Boolean(editing.active)} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Show this service on the site</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              if (!editing) return;
              const isNew = !rows.find(r => r.slug === editing.slug);
              const row = { ...editing, includes: cleanList(editing.includes), problems: cleanList(editing.problems) };
              if (await saveRow("services", row, isNew, "slug")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget && await deleteRow("services", "slug", deleteTarget)) { setDeleteTarget(null); refresh(); } else setDeleteTarget(null); }}
      />
    </Card>
  );
}

// ----------------- AMC -----------------
function AmcAdmin() {
  const { rows, loading, refresh } = useTable<Record<string, unknown>>("amc_plans", "sort_order");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const visible = rows.filter((row) => rowMatches(row, query));
  const blank = () => ({ id: "", name: "", price: 1499, period: "year", appliances: "", services: "", tagline: "", highlight: false, benefits: [], sort_order: 0, active: true });

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">AMC plans</h2>
          <p className="text-sm text-muted-foreground">{visible.length} of {rows.length}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SearchBox value={query} onChange={setQuery} />
          <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New plan</Button>
        </div>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No plans match this search.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Featured</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {visible.map(r => (
              <TableRow key={String(r.id)}>
                <TableCell>
                  <div className="font-medium">{String(r.name)}</div>
                  <div className="font-mono text-xs text-muted-foreground">{String(r.id)}</div>
                </TableCell>
                <TableCell>{inr(r.price)} / {String(r.period || "")}</TableCell>
                <TableCell>{r.highlight ? "Featured" : "—"}</TableCell>
                <TableCell><ActiveBadge active={r.active} /></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Edit plan" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete plan" onClick={() => setDeleteTarget(String(r.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing && rows.find(r => r.id === editing.id) ? "Edit AMC plan" : "New AMC plan"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Plan code</Label><Input value={String(editing.id ?? "")} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!rows.find(r => r.id === editing.id)} /></div>
              <div><Label>Name</Label><Input value={String(editing.name ?? "")} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Price (₹)</Label><Input type="number" value={Number(editing.price ?? 0)} onChange={e => setEditing({ ...editing, price: +e.target.value })} /></div>
              <ChoiceField label="Billing period" value={String(editing.period ?? "year")} options={[{ value: "year", label: "Per year" }, { value: "month", label: "Per month" }]} onChange={(period) => setEditing({ ...editing, period })} />
              <div><Label>Appliances covered</Label><Input value={String(editing.appliances ?? "")} onChange={e => setEditing({ ...editing, appliances: e.target.value })} placeholder="Up to 3 ACs" /></div>
              <div><Label>Service visits</Label><Input value={String(editing.services ?? "")} onChange={e => setEditing({ ...editing, services: e.target.value })} placeholder="2 visits" /></div>
              <div className="sm:col-span-2"><Label>Tagline</Label><Input value={String(editing.tagline ?? "")} onChange={e => setEditing({ ...editing, tagline: e.target.value })} /></div>
              <div><Label>Display order</Label><Input type="number" value={Number(editing.sort_order ?? 0)} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} /></div>
              <div className="flex items-center gap-2 mt-6"><Switch checked={Boolean(editing.highlight)} onCheckedChange={v => setEditing({ ...editing, highlight: v })} /><Label>Feature this plan</Label></div>
              <div className="sm:col-span-2"><StringListField label="Benefits" hint="One benefit per line." value={editing.benefits} onChange={(benefits) => setEditing({ ...editing, benefits })} placeholder="Priority booking" /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={Boolean(editing.active)} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Show this plan on the site</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              if (!editing) return;
              const isNew = !rows.find(r => r.id === editing.id);
              const row = { ...editing, benefits: cleanList(editing.benefits) };
              if (await saveRow("amc_plans", row, isNew, "id")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget && await deleteRow("amc_plans", "id", deleteTarget)) { setDeleteTarget(null); refresh(); } else setDeleteTarget(null); }}
      />
    </Card>
  );
}

const TIME_PRESETS = [
  { label: "Anytime", note: "Anytime", time: "" },
  { label: "Morning", note: "Morning", time: "08:00" },
  { label: "Afternoon", note: "Afternoon", time: "12:00" },
  { label: "Evening", note: "Evening", time: "16:00" },
];

function clockLabel(value: unknown) {
  const text = String(value || "");
  const [hourText, minuteText] = text.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!text || Number.isNaN(hour) || Number.isNaN(minute)) return "";
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}
const TASK_STATUSES = [
  { value: "assigned", label: "Assigned" },
  { value: "accepted", label: "Accepted" },
  { value: "on_the_way", label: "On the way" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function mapLinkFor(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

function dayLabel(value: unknown) {
  if (!value) return "Date not set";
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return text.slice(0, 10);
}

async function uploadMedia(file: Blob, name: string) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
  const response = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, data }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Upload failed.");
  return String(payload.url || "");
}

function recordingMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function micErrorMessage(error: unknown) {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return "Open the admin page at http://127.0.0.1:3001 or http://localhost:3001. A different address cannot use the microphone.";
  }
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found. Connect one, or upload an audio file below.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Another app is using the microphone. Close that app, then press Record again.";
  }
  return "The browser blocked the microphone. Click the lock icon in the address bar, set Microphone to Allow, and reload. On a Mac, also open System Settings, Privacy & Security, Microphone, and turn on your browser.";
}

function VoiceNoteField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [micError, setMicError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const store = async (blob: Blob, name: string) => {
    if (!blob.size) return;
    if (blob.size > 8 * 1024 * 1024) {
      toast.error("Voice note must be under 8 MB.");
      return;
    }
    setBusy(true);
    try {
      onChange(await uploadMedia(blob, name));
      setMicError("");
      toast.success("Voice note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    setMicError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setMicError(micErrorMessage(new Error("insecure")));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (error) {
      setMicError(micErrorMessage(error));
      return;
    }
    streamRef.current = stream;
    try {
      const mimeType = recordingMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        void store(blob, mimeType.includes("mp4") ? "voice-note.m4a" : "voice-note.webm");
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMicError("This browser could not start a recording. Upload an audio file instead.");
    }
  };

  return (
    <div className="space-y-2">
      <Label>Voice note</Label>
      <p className="text-xs text-muted-foreground">When the browser asks, choose Allow. You can also upload an audio file.</p>
      {micError && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{micError}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <Button type="button" variant="destructive" onClick={() => recorderRef.current?.stop()}><Square className="mr-1 h-4 w-4" />Stop</Button>
        ) : (
          <Button type="button" variant="outline" disabled={busy} onClick={start}><Mic className="mr-1 h-4 w-4" />{busy ? "Saving…" : "Record"}</Button>
        )}
        <Input
          className="max-w-xs"
          type="file"
          accept="audio/webm,audio/mpeg,audio/mp4,audio/ogg,audio/wav"
          disabled={busy || recording}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void store(file, file.name || "voice-note");
          }}
        />
      </div>
      {value && (
        <div className="space-y-1">
          <audio controls src={value} className="w-full" />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Remove voice note</Button>
        </div>
      )}
    </div>
  );
}

type TaskDraft = {
  technician_id: string;
  customer_name: string;
  customer_phone: string;
  problem: string;
  details: string;
  address: string;
  map_url: string;
  voice_note_url: string;
  visit_date: string;
  visit_time: string;
  time_slot: string;
  priority: string;
};

function blankTask(technicianId = ""): TaskDraft {
  return {
    technician_id: technicianId,
    customer_name: "",
    customer_phone: "",
    problem: "",
    details: "",
    address: "",
    map_url: "",
    voice_note_url: "",
    visit_date: new Date().toISOString().slice(0, 10),
    visit_time: "",
    time_slot: "",
    priority: "normal",
  };
}

// ----------------- TECHNICIANS -----------------
function TechniciansAdmin() {
  const { rows, loading, refresh } = useTable<Record<string, unknown>>("technicians", "name");
  const { rows: tasks, loading: tasksLoading, refresh: refreshTasks } = useTable<Record<string, unknown>>("technician_tasks", "created_at");
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [task, setTask] = useState<TaskDraft | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [query, setQuery] = useState("");
  const visible = rows.filter((row) => rowMatches(row, query));
  const blank = () => ({ id: "", name: "", specialization: "", experience: 0, rating: 4.5, jobs: 0, on_time: 95, photo: "", certifications: [], rating_breakdown: [0, 0, 0, 0, 0], reviews: [], active: true });
  const openTasks = [...tasks].reverse();
  const technicianName = (id: unknown) => String(rows.find((row) => row.id === id)?.name || id || "");

  const saveTask = async () => {
    if (!task) return;
    if (!task.technician_id) { toast.error("Choose a technician."); return; }
    if (!task.customer_name.trim()) { toast.error("Customer name is required."); return; }
    if (!task.customer_phone.trim()) { toast.error("Phone number is required."); return; }
    if (!task.problem.trim()) { toast.error("Describe the problem."); return; }
    if (task.address.trim().length < 5) { toast.error("Enter the full address."); return; }
    setSavingTask(true);
    const row = {
      technician_id: task.technician_id,
      customer_name: task.customer_name.trim(),
      customer_phone: task.customer_phone.trim(),
      problem: task.problem.trim(),
      details: task.details.trim(),
      address: task.address.trim(),
      map_url: task.map_url.trim() || mapLinkFor(task.address),
      voice_note_url: task.voice_note_url,
      visit_date: task.visit_date || null,
      visit_time: task.visit_time,
      time_slot: task.time_slot.trim(),
      priority: task.priority,
    };
    const ok = await saveRow("technician_tasks", row, true, "id");
    setSavingTask(false);
    if (ok) {
      setTask(null);
      refreshTasks();
    }
  };

  const sendPush = async (id: string) => {
    const response = await fetch("/api/admin/notify", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) toast.error(payload.error || "Could not send the push.");
    else {
      toast.success("Push sent to the technician app.");
      refreshTasks();
    }
  };

  const setTaskStatus = async (id: string, status: string) => {
    const result = await adminQuery({ op: "update", table: "technician_tasks", pk: "id", id, row: { status } });
    if (result.error) toast.error(result.error.message);
    else {
      const data = result.data as { reassigned?: boolean } | null;
      if (data?.reassigned) toast.success("A new job was sent to the technician. The completed job stays completed.");
      refreshTasks();
    }
  };

  return (
    <div className="space-y-6">
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Technicians</h2>
          <p className="text-sm text-muted-foreground">{visible.length} of {rows.length}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SearchBox value={query} onChange={setQuery} />
          <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New technician</Button>
        </div>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No technicians match this search.</p>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead></TableHead><TableHead>Name</TableHead><TableHead>Specialization</TableHead><TableHead>Rating</TableHead><TableHead>Jobs</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {visible.map(r => (
              <TableRow key={String(r.id)}>
                <TableCell>{r.photo ? <img src={String(r.photo)} alt="" className="h-10 w-10 rounded-full object-cover border" /> : <div className="h-10 w-10 rounded-full bg-muted" />}</TableCell>
                <TableCell className="font-medium">{String(r.name)}</TableCell>
                <TableCell>{String(r.specialization || "")}</TableCell>
                <TableCell>{String(r.rating)} ★</TableCell>
                <TableCell>{String(r.jobs)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => setTask(blankTask(String(r.id)))}>Assign task</Button>
                    <Button size="icon" variant="ghost" aria-label="Edit technician" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete technician" onClick={() => setDeleteTarget(String(r.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  {openTasks.some((item) => item.technician_id === r.id && item.status !== "completed" && item.status !== "cancelled") && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {openTasks.filter((item) => item.technician_id === r.id && item.status !== "completed" && item.status !== "cancelled").length} open
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing && rows.find(r => r.id === editing.id) ? "Edit technician" : "New technician"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Technician code</Label><Input value={String(editing.id ?? "")} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!rows.find(r => r.id === editing.id)} /></div>
              <div><Label>Name</Label><Input value={String(editing.name ?? "")} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Specialization</Label><Input value={String(editing.specialization ?? "")} onChange={e => setEditing({ ...editing, specialization: e.target.value })} placeholder="AC and refrigerator" /></div>
              <div><Label>Experience (years)</Label><Input type="number" value={Number(editing.experience ?? 0)} onChange={e => setEditing({ ...editing, experience: +e.target.value })} /></div>
              <div><Label>Overall rating</Label><Input type="number" step="0.1" min={0} max={5} value={Number(editing.rating ?? 0)} onChange={e => setEditing({ ...editing, rating: +e.target.value })} /></div>
              <div><Label>Jobs completed</Label><Input type="number" value={Number(editing.jobs ?? 0)} onChange={e => setEditing({ ...editing, jobs: +e.target.value })} /></div>
              <div><Label>On-time (%)</Label><Input type="number" value={Number(editing.on_time ?? 0)} onChange={e => setEditing({ ...editing, on_time: +e.target.value })} /></div>
              <div className="sm:col-span-2"><ImageField label="Photo" value={String(editing.photo ?? "")} onChange={(photo) => setEditing({ ...editing, photo })} /></div>
              <div className="sm:col-span-2"><StringListField label="Certifications" hint="One certificate per line." value={editing.certifications} onChange={(certifications) => setEditing({ ...editing, certifications })} placeholder="NATE certified" /></div>
              <div className="sm:col-span-2"><RatingBreakdownField value={editing.rating_breakdown} onChange={(rating_breakdown) => setEditing({ ...editing, rating_breakdown })} /></div>
              <div className="sm:col-span-2"><ReviewListField value={editing.reviews} onChange={(reviews) => setEditing({ ...editing, reviews })} /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={Boolean(editing.active)} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Show this technician on the site</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              if (!editing) return;
              const isNew = !rows.find(r => r.id === editing.id);
              const row = {
                ...editing,
                certifications: cleanList(editing.certifications),
                rating_breakdown: cleanBreakdown(editing.rating_breakdown),
                reviews: cleanReviews(editing.reviews),
              };
              if (await saveRow("technicians", row, isNew, "id")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => { if (deleteTarget && await deleteRow("technicians", "id", deleteTarget)) { setDeleteTarget(null); refresh(); } else setDeleteTarget(null); }}
      />
    </Card>

    <Dialog modal={false} open={!!task} onOpenChange={(open) => !open && setTask(null)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign task</DialogTitle>
        </DialogHeader>
        {task && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ChoiceField
                label="Technician"
                value={task.technician_id}
                options={rows.map((row) => ({ value: String(row.id), label: String(row.name) }))}
                onChange={(technician_id) => setTask({ ...task, technician_id })}
              />
            </div>
            <div><Label>Customer name</Label><Input value={task.customer_name} onChange={(event) => setTask({ ...task, customer_name: event.target.value })} /></div>
            <div><Label>Phone</Label><Input value={task.customer_phone} onChange={(event) => setTask({ ...task, customer_phone: event.target.value })} placeholder="9876543210" /></div>
            <div className="sm:col-span-2"><Label>Problem</Label><Input value={task.problem} onChange={(event) => setTask({ ...task, problem: event.target.value })} placeholder="AC not cooling" /></div>
            <div className="sm:col-span-2"><Label>Extra details</Label><Textarea value={task.details} onChange={(event) => setTask({ ...task, details: event.target.value })} placeholder="Brand, model, what the customer already tried" /></div>
            <div className="sm:col-span-2"><Label>Address</Label><Textarea value={task.address} onChange={(event) => setTask({ ...task, address: event.target.value })} placeholder="Flat, street, area, city, pincode" /></div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Map link</Label>
              <Input value={task.map_url} onChange={(event) => setTask({ ...task, map_url: event.target.value })} placeholder="https://maps.google.com/..." />
              <Button type="button" variant="outline" size="sm" onClick={() => setTask({ ...task, map_url: mapLinkFor(task.address) })} disabled={task.address.trim().length < 5}><MapPin className="mr-1 h-4 w-4" />Create link from address</Button>
            </div>
            <div><Label>Visit date</Label><Input type="date" value={task.visit_date} onChange={(event) => setTask({ ...task, visit_date: event.target.value })} /></div>
            <div>
              <Label>Visit time</Label>
              <Input type="time" value={task.visit_time} onChange={(event) => setTask({ ...task, visit_time: event.target.value })} />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Time note</Label>
              <Input value={task.time_slot} onChange={(event) => setTask({ ...task, time_slot: event.target.value })} placeholder="10:30, or between 2 and 4" />
              <div className="flex flex-wrap gap-2">
                {TIME_PRESETS.map((preset) => (
                  <Button key={preset.label} type="button" size="sm" variant="outline" onClick={() => setTask({ ...task, time_slot: preset.note, visit_time: preset.time })}>{preset.label}</Button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <ChoiceField label="Priority" value={task.priority} options={[{ value: "normal", label: "Normal" }, { value: "urgent", label: "Urgent" }]} onChange={(priority) => setTask({ ...task, priority })} />
            </div>
            <div className="sm:col-span-2">
              <VoiceNoteField value={task.voice_note_url} onChange={(voice_note_url) => setTask({ ...task, voice_note_url })} />
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">Saving sends a push to the technician’s phone. You can send it again from the task list.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setTask(null)}>Cancel</Button>
          <Button className="bg-gradient-gold text-primary-foreground" disabled={savingTask} onClick={saveTask}>{savingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Assigned tasks</h2>
        <p className="text-sm text-muted-foreground">{openTasks.length} saved. Open jobs stay marked for a push notification.</p>
      </div>
      {tasksLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : openTasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet. Use Assign task on a technician.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Where</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Voice</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openTasks.map((item) => (
              <TableRow key={String(item.id)}>
                <TableCell>
                  <div className="font-medium">{String(item.problem)}</div>
                  <div className="text-xs text-muted-foreground">{technicianName(item.technician_id)} · {String(item.customer_name)} · {String(item.customer_phone)}</div>
                  {item.priority === "urgent" && <Badge className="mt-1" variant="destructive">Urgent</Badge>}
                  {item.details ? <p className="mt-1 max-w-xs text-xs text-muted-foreground">{String(item.details)}</p> : null}
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm">{String(item.address)}</p>
                  {String(item.map_url || "").startsWith("http") && (
                    <a className="text-xs underline" href={String(item.map_url)} target="_blank" rel="noreferrer">Open map</a>
                  )}
                </TableCell>
                <TableCell className="text-sm">{dayLabel(item.visit_date)}<div className="text-xs text-muted-foreground">{[clockLabel(item.visit_time), String(item.time_slot || "")].filter(Boolean).join(" · ") || "Time not set"}</div></TableCell>
                <TableCell>{item.voice_note_url ? <audio controls src={String(item.voice_note_url)} className="h-8 w-36" /> : <span className="text-xs text-muted-foreground">None</span>}</TableCell>
                <TableCell className="max-w-xs">
                  {item.completion_comment ? <p className="text-sm whitespace-pre-wrap">{String(item.completion_comment)}</p> : null}
                  {item.completion_voice_url ? <audio controls src={String(item.completion_voice_url)} className="mt-1 h-8 w-36" /> : null}
                  {!item.completion_comment && !item.completion_voice_url ? <span className="text-xs text-muted-foreground">None</span> : null}
                </TableCell>
                <TableCell className="min-w-36">
                  <Select value={String(item.status || "assigned")} onValueChange={(status) => setTaskStatus(String(item.id), status)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="mt-2" disabled={item.status === "completed"} onClick={() => sendPush(String(item.id))}><Bell className="mr-1 h-3.5 w-3.5" />Send push</Button>
                  <p className="mt-1 text-xs text-muted-foreground">{item.status === "completed" ? "Push off" : item.notification_status === "sent" ? "Push sent" : "Push pending"}</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
    </div>
  );
}
