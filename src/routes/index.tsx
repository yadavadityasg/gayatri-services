import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SERVICES, PRODUCTS } from "@/data/catalog";

const GOOGLE_REVIEWS_URL = "https://share.google/JVEQN94vOLOkgY9aZ";

const REAL_REVIEWS = [
  { name: "Rohit Nishad", source: "Google Review", rating: 5, text: "Good customer service, they give good service & work is done on time." },
  { name: "Sakha Gabhane", source: "Google Review", rating: 5, text: "Best experience about services — AC, washing machine, fridge." },
  { name: "Pravin Naikwadi", source: "Google Review", rating: 5, text: "Mithilesh did a fantastic job — identified and resolved my AC problem in 30 minutes." },
  { name: "Verified Customer", source: "JustDial", rating: 5, text: "Gayatri Services provided good quality service for AC, fridge and other appliances." },
];
import { fmt, addToCart } from "@/lib/cart";
import { Search, ShieldCheck, Clock, Award, Wrench, Users, Star, ArrowRight, CheckCircle2, Snowflake, Flame, Tv, Droplet, Wind, Microwave, Refrigerator, WashingMachine } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gayatri Repair Service — Book Repair or Shop Electronics" },
      { name: "description", content: "Same-day appliance repair and curated new + refurbished electronics. AC, Fridge, Washing Machine, RO, Geyser, TV. 90-day warranty." },
    ],
  }),
  component: HomePage,
});

const ICONS: Record<string, React.ComponentType<{className?: string}>> = {
  snowflake: Snowflake, fridge: Refrigerator, washing: WashingMachine, wind: Wind,
  flame: Flame, tv: Tv, droplet: Droplet, microwave: Microwave,
};

function HomePage() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const onSearch = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) navigate({ to: "/search", search: { q } }); };

  const quickServices = SERVICES.slice(0, 10);
  const featured = PRODUCTS.slice(0, 4);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-gradient-ink text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15 gap-1"><Star className="h-3 w-3 fill-primary" /> 4.9 · 947 Google reviews</Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Expert Repairs.<br /><span className="text-gradient-gold">Genuine Electronics.</span>
            </h1>
            <p className="mt-4 text-lg opacity-80 max-w-xl">
              From same-day appliance repair to certified new & refurbished electronics — Gayatri brings premium service to your doorstep.
            </p>
            <form onSubmit={onSearch} className="mt-8 max-w-xl flex gap-2 bg-card rounded-xl p-2 shadow-elevated">
              <div className="flex-1 flex items-center px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="What do you need help with today?" className="border-0 shadow-none text-foreground focus-visible:ring-0" />
              </div>
              <Button type="submit" className="bg-gradient-gold text-primary-foreground">Search</Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/booking"><Button size="lg" className="bg-gradient-gold text-primary-foreground shadow-gold">Book a Repair <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link to="/shop"><Button size="lg" variant="outline" className="border-primary/40 bg-transparent text-secondary-foreground hover:bg-primary/10 hover:text-secondary-foreground">Shop Electronics</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick services grid */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Our <span className="text-gradient-gold">Repair Services</span></h2>
          <p className="text-muted-foreground mt-2">Tap a service to book in 60 seconds</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickServices.map(s => {
            const Icon = ICONS[s.icon] ?? Wrench;
            return (
              <Link key={s.slug} to="/services/$slug" params={{slug: s.slug}}>
                <Card className="hover-lift p-5 text-center cursor-pointer h-full">
                  <div className="mx-auto h-14 w-14 rounded-full bg-gradient-gold flex items-center justify-center mb-3 shadow-gold">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">From {fmt(s.startingAt)}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-muted/40 py-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose <span className="text-gradient-gold">Gayatri</span></h2>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {icon: Award, label: "Certified Technicians"},
              {icon: Clock, label: "Same Day Service"},
              {icon: ShieldCheck, label: "90-Day Warranty"},
              {icon: Wrench, label: "Genuine Spares"},
              {icon: CheckCircle2, label: "Transparent Pricing"},
              {icon: Users, label: "10,000+ Happy Homes"},
            ].map((f, i) => (
              <Card key={i} className="p-4 text-center hover-lift">
                <f.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-sm font-medium">{f.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">How It <span className="text-gradient-gold">Works</span></h2>
          <p className="text-muted-foreground mt-2">Repair in 4 simple steps</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            "Book online or call",
            "Technician visits your home",
            "Diagnosis & transparent quote",
            "Repair done, warranty given",
          ].map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-gradient-gold text-primary-foreground font-bold text-xl flex items-center justify-center shadow-gold mb-3">{i+1}</div>
              <p className="font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-muted/40 py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Featured <span className="text-gradient-gold">Electronics</span></h2>
              <p className="text-muted-foreground mt-2">New & certified refurbished</p>
            </div>
            <Link to="/shop" className="text-primary text-sm font-medium hidden md:flex items-center">View all <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map(p => (
              <Card key={p.id} className="hover-lift overflow-hidden flex flex-col">
                <Link to="/shop/$id" params={{id: p.id}} className="block aspect-square bg-muted">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{p.brand}</span>
                    <Badge variant={p.condition === "New" ? "default" : "secondary"} className={p.condition === "New" ? "bg-success text-success-foreground" : ""}>{p.condition}</Badge>
                  </div>
                  <Link to="/shop/$id" params={{id: p.id}} className="font-medium text-sm line-clamp-2 hover:text-primary">{p.name}</Link>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold">{fmt(p.price)}</span>
                    <span className="text-xs text-muted-foreground line-through">{fmt(p.mrp)}</span>
                  </div>
                  <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => { addToCart({id:p.id,name:p.name,brand:p.brand,price:p.price,mrp:p.mrp,image:p.image}); toast.success("Added to cart"); }}>Add</Button>
                    <Link to="/shop/$id" params={{id: p.id}}><Button size="sm" className="w-full bg-gradient-gold text-primary-foreground">Buy</Button></Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Loved on <span className="text-gradient-gold">Google</span></h2>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" /> 4.9 average from 947 verified reviews
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {REAL_REVIEWS.map((t, i) => (
            <Card key={i} className="p-5 flex flex-col">
              <div className="flex gap-1 mb-2">
                {Array.from({length: t.rating}).map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
              </div>
              <p className="text-sm flex-1">"{t.text}"</p>
              <div className="mt-4 text-xs">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.source}</div>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-primary/40">Read all reviews on Google <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </a>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-secondary text-secondary-foreground py-10">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {["4.9 ★ Google Rated","947+ Google Reviews","Background-Verified Technicians","Genuine Spare Parts"].map((b, i) => (
            <div key={i} className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{b}</span>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
