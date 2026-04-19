import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES, PRODUCTS } from "@/data/catalog";
import { fmt } from "@/lib/cart";
import { Search } from "lucide-react";
import { z } from "zod";

const search = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Search | Gayatri" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const term = q.toLowerCase();
  const services = term ? SERVICES.filter(s => s.name.toLowerCase().includes(term) || s.categoryLabel.toLowerCase().includes(term) || s.problems.some(p=>p.toLowerCase().includes(term))) : [];
  const products = term ? PRODUCTS.filter(p => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)) : [];

  return (
    <Layout>
      <section className="bg-gradient-ink text-secondary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm opacity-70"><Search className="h-4 w-4" />Search results for</div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">"{q}"</h1>
          <p className="mt-2 opacity-80 text-sm">{services.length} services · {products.length} products</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({services.length + products.length})</TabsTrigger>
            <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {services.length > 0 && <Section title="Repair Services">{services.map(s => <ServiceRow key={s.slug} s={s} />)}</Section>}
            {products.length > 0 && <Section title="Products"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{products.map(p => <ProductCard key={p.id} p={p} />)}</div></Section>}
            {services.length + products.length === 0 && <Card className="p-10 text-center text-muted-foreground">No matches. Try AC, fridge, washing machine, RO, or a brand name.</Card>}
          </TabsContent>
          <TabsContent value="services" className="space-y-3">{services.map(s => <ServiceRow key={s.slug} s={s} />)}</TabsContent>
          <TabsContent value="products"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{products.map(p => <ProductCard key={p.id} p={p} />)}</div></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Section({title, children}: any) { return <div><h2 className="font-semibold text-lg mb-3">{title}</h2><div className="space-y-3">{children}</div></div>; }
function ServiceRow({s}: any) {
  return (
    <Card className="p-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <Badge variant="outline" className="mb-1">{s.categoryLabel}</Badge>
        <div className="font-semibold">{s.name}</div>
        <div className="text-xs text-muted-foreground">From {fmt(s.startingAt)} · {s.duration}</div>
      </div>
      <Link to="/services/$slug" params={{slug:s.slug}}><Button size="sm" className="bg-gradient-gold text-primary-foreground">View</Button></Link>
    </Card>
  );
}
function ProductCard({p}: any) {
  return (
    <Link to="/shop/$id" params={{id:p.id}}>
      <Card className="hover-lift overflow-hidden">
        <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
        <div className="p-3">
          <div className="text-xs text-muted-foreground">{p.brand}</div>
          <div className="font-medium text-sm line-clamp-2">{p.name}</div>
          <div className="font-bold mt-1 text-primary">{fmt(p.price)}</div>
        </div>
      </Card>
    </Link>
  );
}
