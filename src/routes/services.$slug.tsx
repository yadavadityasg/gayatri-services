import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRANDS } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import { fmt } from "@/lib/cart";
import { CheckCircle2, ShieldCheck, Clock, Wrench, ChevronRight, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase.from("services").select("*").eq("slug", params.slug).maybeSingle();
    if (error || !data) throw notFound();
    return { service: data };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.service.name} — From ${loaderData?.service.starting_at ? "₹"+loaderData.service.starting_at : ""} | Gayatri` },
      { name: "description", content: loaderData?.service.short ?? "Home appliance repair service" },
    ],
  }),
  component: ServiceDetailPage,
  notFoundComponent: () => (
    <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-3xl font-bold">Service not found</h1><Link to="/services" className="text-primary mt-4 inline-block">Back to services</Link></div></Layout>
  ),
});

function ServiceDetailPage() {
  const { service } = Route.useLoaderData() as { service: any };
  const navigate = useNavigate();
  const [brand, setBrand] = useState("");
  const [problem, setProblem] = useState("");
  const includes: string[] = Array.isArray(service.includes) ? service.includes : [];
  const problems: string[] = Array.isArray(service.problems) ? service.problems : [];

  const onQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !problem) { toast.error("Please select brand and problem"); return; }
    navigate({ to: "/booking", search: { service: service.slug, brand, problem } });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <nav className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="h-3 w-3" />
          <Link to="/services" className="hover:text-primary">Services</Link><ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{service.name}</span>
        </nav>
      </div>

      <section className="bg-gradient-ink text-secondary-foreground py-10">
        <div className="container mx-auto px-4">
          <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15 mb-3">{service.category_label}</Badge>
          <h1 className="text-3xl md:text-5xl font-bold">{service.name}</h1>
          <p className="mt-3 opacity-80 max-w-2xl">{service.short}</p>
          <div className="flex gap-3 mt-5 flex-wrap">
            <Badge className="bg-card text-foreground hover:bg-card"><ShieldCheck className="h-3.5 w-3.5 mr-1 text-success" />90-day warranty</Badge>
            <Badge className="bg-card text-foreground hover:bg-card"><Wrench className="h-3.5 w-3.5 mr-1 text-primary" />Genuine spares</Badge>
            <Badge className="bg-card text-foreground hover:bg-card"><Clock className="h-3.5 w-3.5 mr-1 text-primary" />{service.duration}</Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-6">
            <h2 className="font-semibold text-xl mb-4">What's included</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {includes.map((inc, i) => (
                <li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />{inc}</li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-xl mb-4">Pricing packages</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Basic Inspection", price: 299, note: "Visit charge, adjustable against repair", features: ["On-site visit","Diagnosis","Written quote"] },
                { name: "Standard Repair", price: service.starting_at, note: "Most common repairs", features: ["All Basic features","Labour included","Genuine spares (extra)"], highlight: true },
                { name: "AMC Package", price: 2499, note: "Per year, 2 services included", features: ["2 free services","Priority booking","20% off spares"] },
              ].map((pkg, i) => (
                <Card key={i} className={`p-5 ${pkg.highlight ? "border-primary border-2 shadow-gold" : ""}`}>
                  {pkg.highlight && <Badge className="mb-2 bg-gradient-gold text-primary-foreground">Recommended</Badge>}
                  <div className="font-semibold">{pkg.name}</div>
                  <div className="text-2xl font-bold mt-1 text-primary">{fmt(pkg.price)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{pkg.note}</div>
                  <ul className="mt-3 space-y-1 text-xs">
                    {pkg.features.map((f, j) => <li key={j} className="flex gap-1.5"><CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />{f}</li>)}
                  </ul>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-xl mb-4">Common problems we fix</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {problems.map((p, i) => (
                <div key={i} className="flex gap-2 text-sm p-3 bg-muted rounded-lg"><Wrench className="h-4 w-4 text-primary shrink-0 mt-0.5" />{p}</div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-xl mb-4">Customer reviews</h2>
            <div className="space-y-4">
              {[
                { name: "Priya S.", rating: 5, text: "Booked at 9am, technician arrived by 11. Fixed in 40 minutes. Very polite." },
                { name: "Rohan M.", rating: 5, text: "Honest pricing, no upselling. Will definitely use again." },
              ].map((r, i) => (
                <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between"><span className="font-medium text-sm">{r.name}</span>
                    <div className="flex gap-0.5">{Array.from({length:r.rating}).map((_,j)=><Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />)}</div>
                  </div>
                  <p className="text-sm mt-1 text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6 shadow-elevated">
            <h3 className="font-semibold text-lg mb-1">Book this service</h3>
            <p className="text-xs text-muted-foreground mb-4">Visit charge ₹299 (adjustable against repair)</p>
            <form onSubmit={onQuickBook} className="space-y-3">
              <div>
                <Label className="text-xs">Brand</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>{BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Problem</Label>
                <Select value={problem} onValueChange={setProblem}>
                  <SelectTrigger><SelectValue placeholder="Select issue" /></SelectTrigger>
                  <SelectContent>{problems.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-primary-foreground">Continue to Booking</Button>
            </form>
          </Card>
        </aside>
      </div>
    </Layout>
  );
}
