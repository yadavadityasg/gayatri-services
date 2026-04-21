import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fmt } from "@/lib/cart";
import { toast } from "sonner";
import { Calendar, Package, Wrench, ShieldCheck, MapPin, Wallet, Gift, Star, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Booking { id: string; service_name: string; brand: string | null; problem: string | null; preferred_date: string; time_slot: string; address_line: string; status: string; technician_name: string | null; visit_charge: number; created_at: string; }
interface Order { id: string; items: any; total: number; status: string; created_at: string; }
interface Profile { id: string; full_name: string | null; phone: string | null; }

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Account | Gayatri" }] }),
  component: DashboardPage,
});

const STATUS_STEPS = ["booked", "assigned", "on_the_way", "arrived", "in_progress", "completed"];
const STATUS_LABELS: Record<string,string> = { booked:"Booked", assigned:"Tech Assigned", on_the_way:"On the Way", arrived:"Arrived", in_progress:"In Progress", completed:"Completed" };
const VALID_TABS = ["bookings", "orders", "appliances", "amc", "profile"] as const;
type TabValue = typeof VALID_TABS[number];

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab: TabValue = useMemo(() => {
    const h = location.hash?.replace(/^#/, "") as TabValue;
    return VALID_TABS.includes(h) ? h : "bookings";
  }, [location.hash]);

  const handleTabChange = (value: string) => {
    navigate({ to: "/dashboard", hash: value, replace: true });
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([b, o]) => {
      setBookings((b.data ?? []) as Booking[]);
      setOrders((o.data ?? []) as Order[]);
      setLoading(false);
    });
  }, [user]);

  if (authLoading) return <Layout><div className="container mx-auto px-4 py-12 text-center">Loading…</div></Layout>;
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Please login</h1>
          <Link to="/login"><Button className="mt-4 bg-gradient-gold text-primary-foreground">Login</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-ink text-secondary-foreground py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">My Account</h1>
          <p className="opacity-80 text-sm mt-1">{user.email}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Wallet} label="Wallet balance" value="₹0" subtitle="Coming soon" />
          <StatCard icon={Gift} label="Cashback earned" value="₹0" subtitle="Coming soon" />
          <StatCard icon={Calendar} label="Bookings" value={String(bookings.length)} />
          <StatCard icon={Package} label="Orders" value={String(orders.length)} />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="bookings">Repair Bookings</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="appliances">My Appliances</TabsTrigger>
            <TabsTrigger value="amc">AMC Plans</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {loading ? <Skeletons /> : bookings.length === 0 ? (
              <Empty title="No bookings yet" cta="Book a repair" to="/booking" />
            ) : (
              <div className="space-y-4">
                {bookings.map(b => <BookingCard key={b.id} b={b} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            {loading ? <Skeletons /> : orders.length === 0 ? (
              <Empty title="No orders yet" cta="Shop electronics" to="/shop" />
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <Card key={o.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">GS-O-{o.id.slice(0,8).toUpperCase()}</div>
                      <div className="font-semibold mt-1">{(o.items as any[]).length} item(s) · {fmt(o.total)}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                    </div>
                    <Badge className="bg-success text-success-foreground">{o.status}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Track</Button>
                      <Button size="sm" variant="outline">Invoice</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="appliances">
            <Card className="p-6 text-center">
              <Wrench className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Register your appliances</h3>
              <p className="text-sm text-muted-foreground mt-1">Get service reminders and warranty tracking.</p>
              <Button className="mt-4 bg-gradient-gold text-primary-foreground">Add appliance</Button>
            </Card>
          </TabsContent>

          <TabsContent value="amc">
            <Card className="p-6 text-center">
              <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">No active AMC plan</h3>
              <p className="text-sm text-muted-foreground mt-1">Get unlimited services & priority care.</p>
              <Link to="/amc"><Button className="mt-4 bg-gradient-gold text-primary-foreground">View plans</Button></Link>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <ProfilePanel userId={user.id} email={user.email ?? ""} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function ProfilePanel({ userId, email }: { userId: string; email: string }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle().then(({ data }) => {
      const p = (data as Profile | null) ?? { id: userId, full_name: null, phone: null };
      setProfile(p);
      setFullName(p.full_name ?? "");
      setPhone(p.phone ?? "");
      setLoading(false);
    });
  }, [userId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
    });
    setSaving(false);
    if (error) toast.error("Could not save profile");
    else toast.success("Profile updated");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Personal information</h3>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-muted/40 rounded" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} readOnly disabled />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
            </div>
            <div className="md:col-span-2">
              <Button onClick={save} disabled={saving} className="bg-gradient-gold text-primary-foreground">
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center"><Wallet className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <div className="text-xs text-muted-foreground">Wallet balance</div>
            <div className="font-bold text-lg">₹0</div>
            <div className="text-[10px] text-muted-foreground">Coming soon</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center"><Gift className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <div className="text-xs text-muted-foreground">Cashback earned</div>
            <div className="font-bold text-lg">₹0</div>
            <div className="text-[10px] text-muted-foreground">Coming soon</div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Saved addresses</h3>
        </div>
        <p className="text-sm text-muted-foreground">Your delivery addresses appear here when you place orders.</p>
      </Card>

      <Card className="p-6 text-center">
        <Gift className="h-10 w-10 text-primary mx-auto mb-2" />
        <h3 className="font-semibold">Refer & earn ₹200</h3>
        <p className="text-sm text-muted-foreground mt-1">Share your code with friends.</p>
        <div className="mt-4 inline-block bg-muted px-4 py-2 rounded font-mono font-bold">GAYATRI{userId.slice(0,4).toUpperCase()}</div>
      </Card>

      <Card className="p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold">Sign out</h3>
          <p className="text-sm text-muted-foreground">You'll need to log in again to access your account.</p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle }: { icon: React.ElementType; label: string; value: string; subtitle?: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center"><Icon className="h-5 w-5 text-primary-foreground" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-bold text-lg">{value}</div>
        {subtitle && <div className="text-[10px] text-muted-foreground">{subtitle}</div>}
      </div>
    </Card>
  );
}

function BookingCard({ b }: { b: Booking }) {
  const stepIdx = Math.max(0, STATUS_STEPS.indexOf(b.status));
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-xs text-muted-foreground">GS-{b.id.slice(0,8).toUpperCase()}</div>
          <h3 className="font-semibold mt-1">{b.service_name}</h3>
          <div className="text-sm text-muted-foreground">{b.brand} · {b.problem}</div>
          <div className="text-xs text-muted-foreground mt-1">📅 {b.preferred_date} · {b.time_slot}</div>
          <div className="text-xs text-muted-foreground">📍 {b.address_line}</div>
        </div>
        {b.technician_name && (
          <Card className="p-3 bg-muted/40 min-w-[200px]">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-gold text-primary-foreground font-bold text-xs flex items-center justify-center">
                {b.technician_name.split(" ").map(p=>p[0]).join("")}
              </div>
              <div>
                <div className="text-xs font-semibold">{b.technician_name}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Star className="h-2.5 w-2.5 fill-primary text-primary" />4.9</div>
              </div>
            </div>
          </Card>
        )}
      </div>
      <div className="mt-5 flex items-center gap-1">
        {STATUS_STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i<=stepIdx ? "bg-gradient-gold" : "bg-muted"}`} />
            <div className={`text-[10px] mt-1 text-center ${i<=stepIdx ? "text-foreground" : "text-muted-foreground"}`}>{STATUS_LABELS[s]}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2 flex-wrap">
        <Button size="sm" variant="outline">View Invoice</Button>
        <Button size="sm" variant="outline">Rate Technician</Button>
        <Button size="sm" variant="outline">Warranty Claim</Button>
      </div>
    </Card>
  );
}

function Skeletons() {
  return <div className="space-y-3">{Array.from({length:3}).map((_,i)=><Card key={i} className="p-5 h-32 animate-pulse bg-muted/40" />)}</div>;
}
function Empty({title, cta, to}: {title:string; cta:string; to:string}) {
  return <Card className="p-10 text-center"><h3 className="font-semibold">{title}</h3><Link to={to}><Button className="mt-4 bg-gradient-gold text-primary-foreground">{cta}</Button></Link></Card>;
}
