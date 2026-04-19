import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, SERVICES, type ServiceCategory } from "@/data/catalog";
import { fmt } from "@/lib/cart";
import { Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const search = z.object({ cat: z.string().optional() });

export const Route = createFileRoute("/services")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Repair Services — AC, Fridge, Washing Machine | Gayatri" },
      { name: "description", content: "Browse all home appliance repair services with upfront pricing. Same-day visits across Navi Mumbai." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const sp = Route.useSearch();
  const [active, setActive] = useState<ServiceCategory | "all">((sp.cat as ServiceCategory) || "all");
  const filtered = active === "all" ? SERVICES : SERVICES.filter(s => s.category === active);

  return (
    <Layout>
      <section className="bg-gradient-ink text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold">Repair <span className="text-gradient-gold">Services</span></h1>
          <p className="mt-3 opacity-80 max-w-2xl">Upfront pricing, certified technicians, 90-day warranty on every repair.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={()=>setActive("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition ${active==="all" ? "bg-gradient-gold text-primary-foreground shadow-gold" : "bg-muted hover:bg-accent"}`}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={()=>setActive(c.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition ${active===c.id ? "bg-gradient-gold text-primary-foreground shadow-gold" : "bg-muted hover:bg-accent"}`}>{c.label}</button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(s => (
            <Card key={s.slug} className="hover-lift p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge className="mb-2 bg-accent text-accent-foreground hover:bg-accent">{s.categoryLabel}</Badge>
                  <h3 className="font-semibold text-lg">{s.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.short}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Starting</div>
                  <div className="text-xl font-bold text-primary">{fmt(s.startingAt)}</div>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {s.includes.slice(0,3).map((inc, i) => (
                  <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />{inc}</li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />{s.duration}
              </div>
              <div className="mt-5 flex gap-2">
                <Link to="/services/$slug" params={{slug:s.slug}} className="flex-1">
                  <Button variant="outline" className="w-full">Details</Button>
                </Link>
                <Link to="/booking" search={{ service: s.slug }} className="flex-1">
                  <Button className="w-full bg-gradient-gold text-primary-foreground">Book Now <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
}
