import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SERVICES, BRANDS } from "@/data/catalog";
import { fmt } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Calendar, MapPin, Wallet, ShieldCheck, User as UserIcon, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const search = z.object({
  service: z.string().optional(),
  brand: z.string().optional(),
  problem: z.string().optional(),
});

export const Route = createFileRoute("/booking")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Book a Repair | Gayatri" }] }),
  component: BookingPage,
});

const SLOTS = ["Morning (8 AM – 12 PM)", "Afternoon (12 PM – 4 PM)", "Evening (4 PM – 8 PM)"];

function BookingPage() {
  const sp = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [data, setData] = useState({
    service: sp.service ?? SERVICES[0].slug,
    brand: sp.brand ?? "",
    problem: sp.problem ?? "",
    description: "",
    date: new Date(Date.now() + 86400000).toISOString().slice(0,10),
    slot: SLOTS[0],
    address: "",
    floor: "",
    city: "Navi Mumbai",
    pincode: "",
    pay: "after",
  });
  const set = <K extends keyof typeof data>(k: K, v: typeof data[K]) => setData(d => ({ ...d, [k]: v }));
  const service = SERVICES.find(s => s.slug === data.service)!;

  const submit = async () => {
    if (!user) { toast.error("Please login to confirm booking"); navigate({ to: "/login", search: { redirect: "/booking" } }); return; }
    if (!data.brand || !data.problem || !data.address || !data.pincode) { toast.error("Please fill all required fields"); return; }
    setSubmitting(true);
    const { data: row, error } = await supabase.from("bookings").insert({
      user_id: user.id,
      service_slug: service.slug,
      service_name: service.name,
      brand: data.brand,
      problem: data.problem,
      description: data.description,
      preferred_date: data.date,
      time_slot: data.slot,
      address_line: data.address,
      floor_landmark: data.floor,
      city: data.city,
      pincode: data.pincode,
      visit_charge: 299,
      status: "booked",
      technician_name: "Rajesh Kumar",
    }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking confirmed!");
    setConfirmedId(row!.id.slice(0,8).toUpperCase());
    setStep(6);
  };

  if (step === 6 && confirmedId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-xl">
          <Card className="p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-9 w-9 text-success" />
            </div>
            <h1 className="text-2xl font-bold">Booking Confirmed</h1>
            <p className="text-muted-foreground mt-1">Booking ID: <span className="font-mono font-semibold text-foreground">GS-{confirmedId}</span></p>
            <Card className="mt-6 p-4 text-left bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">RK</div>
                <div>
                  <div className="font-semibold">Rajesh Kumar</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />4.9 · AC Specialist</div>
                </div>
                <Link to="/technician/$id" params={{id:"TECH-001"}} className="ml-auto text-xs text-primary">View profile</Link>
              </div>
              <div className="mt-3 text-sm">
                <div>📅 {data.date} · {data.slot}</div>
                <div className="mt-1">📍 {data.address}, {data.city}</div>
              </div>
            </Card>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link to="/dashboard"><Button variant="outline" className="w-full">My Bookings</Button></Link>
              <a href="tel:+919876543210"><Button className="w-full bg-gradient-gold text-primary-foreground">Contact</Button></a>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Book a Repair</h1>
        <p className="text-sm text-muted-foreground mb-6">Step {step} of 5</p>

        <div className="flex gap-1 mb-8">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n<=step ? "bg-gradient-gold" : "bg-muted"}`} />
          ))}
        </div>

        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary" />Appliance & Problem</h2>
              <div>
                <Label>Service</Label>
                <Select value={data.service} onValueChange={v=>set("service", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICES.map(s => <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand *</Label>
                <Select value={data.brand} onValueChange={v=>set("brand", v)}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>{BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Problem *</Label>
                <Select value={data.problem} onValueChange={v=>set("problem", v)}>
                  <SelectTrigger><SelectValue placeholder="What's wrong?" /></SelectTrigger>
                  <SelectContent>{service.problems.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Describe issue (optional)</Label>
                <Textarea value={data.description} onChange={e=>set("description", e.target.value)} placeholder="Any details that will help the technician" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Date & Time</h2>
              <div>
                <Label>Preferred date</Label>
                <Input type="date" value={data.date} onChange={e=>set("date", e.target.value)} min={new Date().toISOString().slice(0,10)} />
              </div>
              <div>
                <Label>Time slot</Label>
                <div className="grid sm:grid-cols-3 gap-2 mt-1">
                  {SLOTS.map(s => (
                    <button key={s} onClick={()=>set("slot", s)}
                            className={`p-3 rounded-lg border text-sm text-left ${data.slot===s ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Address</h2>
              <div><Label>Address *</Label><Input value={data.address} onChange={e=>set("address", e.target.value)} placeholder="House / building / street" /></div>
              <div><Label>Floor & landmark</Label><Input value={data.floor} onChange={e=>set("floor", e.target.value)} placeholder="e.g. 3rd floor, near park" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input value={data.city} onChange={e=>set("city", e.target.value)} /></div>
                <div><Label>Pincode *</Label><Input value={data.pincode} onChange={e=>set("pincode", e.target.value)} maxLength={6} /></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Review</h2>
              <Card className="p-4 bg-muted/40 text-sm space-y-1">
                <div><span className="text-muted-foreground">Service:</span> {service.name}</div>
                <div><span className="text-muted-foreground">Brand:</span> {data.brand} · {data.problem}</div>
                <div><span className="text-muted-foreground">When:</span> {data.date} · {data.slot}</div>
                <div><span className="text-muted-foreground">Where:</span> {data.address}, {data.city} - {data.pincode}</div>
              </Card>
              <Card className="p-4 border-primary border-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Visit charge</div>
                    <div className="text-xs text-muted-foreground">Adjustable against repair cost</div>
                  </div>
                  <div className="text-2xl font-bold text-primary">{fmt(299)}</div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-success" />Final price after diagnosis · 90-day warranty</div>
              </Card>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Payment</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {id:"after", t:"Pay after repair", s:"Cash / UPI to technician", badge:"Most popular"},
                  {id:"online", t:"Pay visit charge online", s:"Card · UPI · Wallet", badge:"Save time"},
                ].map(o => (
                  <button key={o.id} onClick={()=>set("pay", o.id)}
                          className={`p-4 rounded-lg border text-left ${data.pay===o.id ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
                    <Badge className="mb-2 bg-gradient-gold text-primary-foreground">{o.badge}</Badge>
                    <div className="font-medium">{o.t}</div>
                    <div className="text-xs text-muted-foreground">{o.s}</div>
                  </button>
                ))}
              </div>
              {!user && <p className="text-xs text-destructive">You'll be asked to login when you confirm.</p>}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={()=>setStep(s=>Math.max(1, s-1))} disabled={step===1}>Back</Button>
            {step < 5 ? (
              <Button className="bg-gradient-gold text-primary-foreground" onClick={()=>setStep(s=>s+1)}>Continue</Button>
            ) : (
              <Button className="bg-gradient-gold text-primary-foreground" disabled={submitting} onClick={submit}>
                {submitting ? "Confirming..." : "Confirm Booking"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
