import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { fmt } from "@/lib/cart";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/amc")({
  head: () => ({ meta: [{ title: "AMC Plans — Annual Maintenance Contracts | Gayatri" }, { name: "description", content: "Priority booking, free spare parts, unlimited services. Pick from Silver, Gold or Platinum AMC plans." }] }),
  loader: async () => {
    const { data, error } = await supabase.from("amc_plans").select("*").eq("active", true).order("sort_order");
    if (error) throw error;
    return { plans: data ?? [] };
  },
  component: AmcPage,
});

const FAQ = [
  { q: "What is AMC?", a: "An Annual Maintenance Contract gives you scheduled services, priority booking, free minor parts and discounts on major repairs for one year." },
  { q: "Can I cover multiple appliances?", a: "Yes — Gold covers 2 appliances and Platinum covers unlimited appliances." },
  { q: "Are spare parts included?", a: "Minor parts (filters, fuses, wires) are free. Major parts get up to 30% off depending on plan." },
  { q: "How do I book a service under AMC?", a: "Just call us or book through the dashboard — AMC customers get priority slots within 24 hours." },
];

function AmcPage() {
  const { plans } = Route.useLoaderData();
  return (
    <Layout>
      <section className="bg-gradient-ink text-secondary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15 mb-3">Annual Maintenance Contracts</Badge>
          <h1 className="text-3xl md:text-5xl font-bold">Care for your appliances<br /><span className="text-gradient-gold">all year round</span></h1>
          <p className="mt-4 opacity-80 max-w-2xl mx-auto">Priority booking, free spare parts, scheduled services and discounts on major repairs.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan: any) => {
            const benefits: string[] = Array.isArray(plan.benefits) ? plan.benefits : [];
            return (
            <Card key={plan.id} className={`p-6 flex flex-col relative ${plan.highlight ? "border-2 border-primary shadow-elevated" : ""}`}>
              {plan.highlight && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-primary-foreground">Most Popular</Badge>}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gradient-gold">{fmt(plan.price)}</span>
                <span className="text-sm text-muted-foreground">/{plan.period}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted rounded p-2 text-center"><div className="font-semibold">{plan.appliances}</div></div>
                <div className="bg-muted rounded p-2 text-center"><div className="font-semibold">{plan.services}</div></div>
              </div>
              <ul className="mt-5 space-y-2 text-sm flex-1">
                {benefits.map((b, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />{b}</li>)}
              </ul>
              <Button className="mt-6 w-full bg-gradient-gold text-primary-foreground" onClick={() => toast.success(`${plan.name} plan added — proceed to checkout`)}>Buy {plan.name}</Button>
            </Card>
          );})}
        </div>

        <div className="mt-16 grid md:grid-cols-4 gap-4">
          {[
            "Priority booking within 24h",
            "Free filter cleaning",
            "Free minor spare parts",
            "Discounted major repairs",
          ].map((b, i) => (
            <Card key={i} className="p-5 text-center"><ShieldCheck className="h-7 w-7 text-primary mx-auto mb-2" /><div className="text-sm font-medium">{b}</div></Card>
          ))}
        </div>

        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">AMC FAQ</h2>
          <Accordion type="single" collapsible>
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
