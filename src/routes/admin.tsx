import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, LogOut, Pencil, Plus, Trash2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Gayatri" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPage,
});

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");

    if (mode === "signup") {
      const { data, error: signErr } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (signErr) {
        setError(signErr.message);
        setLoading(false); return;
      }
      // If session is returned, auto-confirm is on — proceed with role check
      if (data.session && data.user) {
        const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        if (!roleRow) {
          await supabase.auth.signOut();
          setError("Account created, but this email is not configured as admin.");
          setLoading(false); return;
        }
        toast.success("Admin account created!");
        onSuccess();
        return;
      }
      // Otherwise email confirmation required
      setInfo("Account created. Check your email to confirm, then sign in.");
      setMode("login");
      setLoading(false);
      return;
    }

    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signErr || !data.user) {
      const msg = signErr?.message || "Login failed";
      setError(msg.includes("Invalid login") ? "Invalid email or password. If you haven't created an admin account yet, switch to Sign up." : msg);
      setLoading(false); return;
    }
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      setLoading(false); return;
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
        <Tabs value={mode} onValueChange={v => { setMode(v as any); setError(""); setInfo(""); }}>
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-primary">{info}</p>}
          <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "signup" ? "Create admin account" : "Sign In")}
          </Button>
          {mode === "signup" && (
            <p className="text-xs text-center text-muted-foreground">
              Only the configured admin email will receive admin privileges.
            </p>
          )}
          <p className="text-xs text-center text-muted-foreground">
            <Link to="/" className="underline">← Back to site</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

function AdminPage() {
  const { isAdmin, loading, user } = useIsAdmin();
  const navigate = useNavigate();
  const [, force] = useState(0);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !isAdmin) return <AdminLogin onSuccess={() => force(x => x + 1)} />;

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-secondary text-secondary-foreground border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gradient-gold">Gayatri Admin</h1>
            <p className="text-xs opacity-70">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/">View Site</Link></Button>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-1" />Logout</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="products">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
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
function useTable<T extends Record<string, any>>(table: string, orderBy = "name") {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from(table).select("*").order(orderBy);
    if (error) toast.error(error.message); else setRows((data as T[]) || []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return { rows, loading, refresh };
}

async function saveRow(table: string, row: any, isNew: boolean, pk: string) {
  if (isNew) {
    const { error } = await (supabase as any).from(table).insert(row);
    if (error) { toast.error(error.message); return false; }
  } else {
    const { [pk]: id, ...rest } = row;
    const { error } = await (supabase as any).from(table).update(rest).eq(pk, id);
    if (error) { toast.error(error.message); return false; }
  }
  toast.success("Saved");
  return true;
}

async function deleteRow(table: string, pk: string, id: string) {
  if (!confirm("Delete this item?")) return false;
  const { error } = await (supabase as any).from(table).delete().eq(pk, id);
  if (error) { toast.error(error.message); return false; }
  toast.success("Deleted");
  return true;
}

function JsonField({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string }) {
  const [text, setText] = useState(JSON.stringify(value ?? [], null, 2));
  const [err, setErr] = useState("");
  return (
    <div>
      <Label>{label} <span className="text-xs text-muted-foreground">(JSON)</span></Label>
      <Textarea
        rows={5} value={text} placeholder={placeholder}
        onChange={e => {
          setText(e.target.value);
          try { onChange(JSON.parse(e.target.value)); setErr(""); }
          catch { setErr("Invalid JSON"); }
        }}
        className="font-mono text-xs"
      />
      {err && <p className="text-xs text-destructive mt-1">{err}</p>}
    </div>
  );
}

// ----------------- PRODUCTS -----------------
function ProductsAdmin() {
  const { rows, loading, refresh } = useTable<any>("products", "name");
  const [editing, setEditing] = useState<any | null>(null);

  const blank = () => ({ id: "", name: "", brand: "", category: "ac", condition: "New", price: 0, mrp: 0, rating: 4.5, reviews: 0, image: "", capacity: "", energy_rating: null, description: "", specs: [], box: [], warranty: "", active: true });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Products ({rows.length})</h2>
        <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New Product</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Brand</TableHead><TableHead>Price</TableHead><TableHead>MRP</TableHead><TableHead>Active</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell className="max-w-xs truncate">{r.name}</TableCell>
                <TableCell>{r.brand}</TableCell>
                <TableCell>₹{r.price}</TableCell>
                <TableCell className="text-muted-foreground line-through">₹{r.mrp}</TableCell>
                <TableCell>{r.active ? "✓" : "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => { if (await deleteRow("products", "id", r.id)) refresh(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id && rows.find(r => r.id === editing.id) ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ID *</Label><Input value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!rows.find(r => r.id === editing.id)} /></div>
              <div><Label>Brand</Label><Input value={editing.brand} onChange={e => setEditing({ ...editing, brand: e.target.value })} /></div>
              <div className="col-span-2"><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} /></div>
              <div><Label>Condition</Label><Input value={editing.condition} onChange={e => setEditing({ ...editing, condition: e.target.value })} /></div>
              <div><Label>Price (₹)</Label><Input type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })} /></div>
              <div><Label>MRP (₹)</Label><Input type="number" value={editing.mrp} onChange={e => setEditing({ ...editing, mrp: +e.target.value })} /></div>
              <div><Label>Rating</Label><Input type="number" step="0.1" value={editing.rating} onChange={e => setEditing({ ...editing, rating: +e.target.value })} /></div>
              <div><Label>Reviews</Label><Input type="number" value={editing.reviews} onChange={e => setEditing({ ...editing, reviews: +e.target.value })} /></div>
              <div><Label>Capacity</Label><Input value={editing.capacity || ""} onChange={e => setEditing({ ...editing, capacity: e.target.value || null })} /></div>
              <div><Label>Energy Rating</Label><Input type="number" value={editing.energy_rating ?? ""} onChange={e => setEditing({ ...editing, energy_rating: e.target.value ? +e.target.value : null })} /></div>
              <div className="col-span-2"><Label>Image URL</Label><Input value={editing.image} onChange={e => setEditing({ ...editing, image: e.target.value })} placeholder="https://..." /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="col-span-2"><Label>Warranty</Label><Input value={editing.warranty} onChange={e => setEditing({ ...editing, warranty: e.target.value })} /></div>
              <div className="col-span-2"><JsonField label="Specs" value={editing.specs} onChange={v => setEditing({ ...editing, specs: v })} placeholder='[{"label":"Capacity","value":"1.5 Ton"}]' /></div>
              <div className="col-span-2"><JsonField label="In the Box" value={editing.box} onChange={v => setEditing({ ...editing, box: v })} placeholder='["Indoor unit","Remote"]' /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Active (visible on shop)</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              const isNew = !rows.find(r => r.id === editing.id);
              if (await saveRow("products", editing, isNew, "id")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ----------------- SERVICES -----------------
function ServicesAdmin() {
  const { rows, loading, refresh } = useTable<any>("services", "name");
  const [editing, setEditing] = useState<any | null>(null);
  const blank = () => ({ slug: "", category: "ac", category_label: "AC", name: "", short: "", starting_at: 499, duration: "60 min", icon: "wrench", includes: [], problems: [], active: true });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Services ({rows.length})</h2>
        <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New Service</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>Slug</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>From</TableHead><TableHead>Active</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.slug}>
                <TableCell className="font-mono text-xs">{r.slug}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.category_label}</TableCell>
                <TableCell>₹{r.starting_at}</TableCell>
                <TableCell>{r.active ? "✓" : "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => { if (await deleteRow("services", "slug", r.slug)) refresh(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing && rows.find(r => r.slug === editing.slug) ? "Edit Service" : "New Service"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Slug *</Label><Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} disabled={!!rows.find(r => r.slug === editing.slug)} /></div>
              <div><Label>Icon</Label><Input value={editing.icon} onChange={e => setEditing({ ...editing, icon: e.target.value })} /></div>
              <div className="col-span-2"><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Short Description</Label><Input value={editing.short} onChange={e => setEditing({ ...editing, short: e.target.value })} /></div>
              <div><Label>Category (id)</Label><Input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} /></div>
              <div><Label>Category Label</Label><Input value={editing.category_label} onChange={e => setEditing({ ...editing, category_label: e.target.value })} /></div>
              <div><Label>Starting At (₹)</Label><Input type="number" value={editing.starting_at} onChange={e => setEditing({ ...editing, starting_at: +e.target.value })} /></div>
              <div><Label>Duration</Label><Input value={editing.duration} onChange={e => setEditing({ ...editing, duration: e.target.value })} /></div>
              <div className="col-span-2"><JsonField label="Includes" value={editing.includes} onChange={v => setEditing({ ...editing, includes: v })} placeholder='["Inspection","Test run"]' /></div>
              <div className="col-span-2"><JsonField label="Common Problems" value={editing.problems} onChange={v => setEditing({ ...editing, problems: v })} placeholder='["AC not cooling"]' /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Active</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              const isNew = !rows.find(r => r.slug === editing.slug);
              if (await saveRow("services", editing, isNew, "slug")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ----------------- AMC -----------------
function AmcAdmin() {
  const { rows, loading, refresh } = useTable<any>("amc_plans", "sort_order");
  const [editing, setEditing] = useState<any | null>(null);
  const blank = () => ({ id: "", name: "", price: 1499, period: "year", appliances: "", services: "", tagline: "", highlight: false, benefits: [], sort_order: 0, active: true });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">AMC Plans ({rows.length})</h2>
        <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New Plan</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Highlight</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>₹{r.price}/{r.period}</TableCell>
                <TableCell>{r.highlight ? "★" : "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => { if (await deleteRow("amc_plans", "id", r.id)) refresh(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing && rows.find(r => r.id === editing.id) ? "Edit AMC" : "New AMC"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ID *</Label><Input value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!rows.find(r => r.id === editing.id)} /></div>
              <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Price (₹)</Label><Input type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })} /></div>
              <div><Label>Period</Label><Input value={editing.period} onChange={e => setEditing({ ...editing, period: e.target.value })} /></div>
              <div><Label>Appliances</Label><Input value={editing.appliances} onChange={e => setEditing({ ...editing, appliances: e.target.value })} /></div>
              <div><Label>Services</Label><Input value={editing.services} onChange={e => setEditing({ ...editing, services: e.target.value })} /></div>
              <div className="col-span-2"><Label>Tagline</Label><Input value={editing.tagline} onChange={e => setEditing({ ...editing, tagline: e.target.value })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: +e.target.value })} /></div>
              <div className="flex items-center gap-2 mt-6"><Switch checked={editing.highlight} onCheckedChange={v => setEditing({ ...editing, highlight: v })} /><Label>Highlight</Label></div>
              <div className="col-span-2"><JsonField label="Benefits" value={editing.benefits} onChange={v => setEditing({ ...editing, benefits: v })} placeholder='["Priority booking"]' /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Active</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              const isNew = !rows.find(r => r.id === editing.id);
              if (await saveRow("amc_plans", editing, isNew, "id")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ----------------- TECHNICIANS -----------------
function TechniciansAdmin() {
  const { rows, loading, refresh } = useTable<any>("technicians", "name");
  const [editing, setEditing] = useState<any | null>(null);
  const blank = () => ({ id: "", name: "", specialization: "", experience: 0, rating: 4.5, jobs: 0, on_time: 95, photo: "", certifications: [], rating_breakdown: [0,0,0,0,0], reviews: [], active: true });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Technicians ({rows.length})</h2>
        <Button onClick={() => setEditing(blank())} className="bg-gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" />New Technician</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Specialization</TableHead><TableHead>Rating</TableHead><TableHead>Jobs</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.specialization}</TableCell>
                <TableCell>{r.rating} ★</TableCell>
                <TableCell>{r.jobs}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...r })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => { if (await deleteRow("technicians", "id", r.id)) refresh(); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing && rows.find(r => r.id === editing.id) ? "Edit Technician" : "New Technician"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ID *</Label><Input value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!rows.find(r => r.id === editing.id)} /></div>
              <div><Label>Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Specialization</Label><Input value={editing.specialization} onChange={e => setEditing({ ...editing, specialization: e.target.value })} /></div>
              <div><Label>Experience (yrs)</Label><Input type="number" value={editing.experience} onChange={e => setEditing({ ...editing, experience: +e.target.value })} /></div>
              <div><Label>Rating</Label><Input type="number" step="0.1" value={editing.rating} onChange={e => setEditing({ ...editing, rating: +e.target.value })} /></div>
              <div><Label>Jobs</Label><Input type="number" value={editing.jobs} onChange={e => setEditing({ ...editing, jobs: +e.target.value })} /></div>
              <div><Label>On-time %</Label><Input type="number" value={editing.on_time} onChange={e => setEditing({ ...editing, on_time: +e.target.value })} /></div>
              <div className="col-span-2"><Label>Photo URL</Label><Input value={editing.photo} onChange={e => setEditing({ ...editing, photo: e.target.value })} /></div>
              <div className="col-span-2"><JsonField label="Certifications" value={editing.certifications} onChange={v => setEditing({ ...editing, certifications: v })} /></div>
              <div className="col-span-2"><JsonField label="Rating Breakdown [5★,4★,3★,2★,1★]" value={editing.rating_breakdown} onChange={v => setEditing({ ...editing, rating_breakdown: v })} /></div>
              <div className="col-span-2"><JsonField label="Reviews" value={editing.reviews} onChange={v => setEditing({ ...editing, reviews: v })} placeholder='[{"name":"...","rating":5,"text":"..."}]' /></div>
              <div className="col-span-2 flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label>Active</Label></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="bg-gradient-gold text-primary-foreground" onClick={async () => {
              const isNew = !rows.find(r => r.id === editing.id);
              if (await saveRow("technicians", editing, isNew, "id")) { setEditing(null); refresh(); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
