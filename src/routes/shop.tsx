import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PRODUCTS, BRANDS, CATEGORIES } from "@/data/catalog";
import { addToCart, fmt } from "@/lib/cart";
import { Heart, Star, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Electronics — New & Refurbished | Gayatri" },
      { name: "description", content: "Buy AC, Refrigerator, Washing Machine, TV and more. New and certified refurbished electronics with EMI options and free installation." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [cats, setCats] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => PRODUCTS.filter(p =>
    (cats.length === 0 || cats.includes(p.category)) &&
    (brands.length === 0 || brands.includes(p.brand)) &&
    (conditions.length === 0 || conditions.includes(p.condition)) &&
    p.price >= price[0] && p.price <= price[1]
  ), [cats, brands, conditions, price]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2 text-sm">Category</h4>
        <div className="space-y-1.5">
          {CATEGORIES.map(c => (
            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={cats.includes(c.id)} onCheckedChange={()=>toggle(cats,setCats,c.id)} /> {c.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2 text-sm">Brand</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {BRANDS.map(b => (
            <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={brands.includes(b)} onCheckedChange={()=>toggle(brands,setBrands,b)} /> {b}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2 text-sm">Condition</h4>
        <div className="space-y-1.5">
          {["New","Refurbished","Certified Pre-owned"].map(c => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={conditions.includes(c)} onCheckedChange={()=>toggle(conditions,setConditions,c)} /> {c}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2 text-sm">Price range</h4>
        <Slider min={0} max={50000} step={500} value={price} onValueChange={(v)=>setPrice(v as [number,number])} />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{fmt(price[0])}</span><span>{fmt(price[1])}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <section className="bg-gradient-ink text-secondary-foreground py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Shop <span className="text-gradient-gold">Electronics</span></h1>
          <p className="mt-2 opacity-80">Curated new & refurbished. Free installation on most products.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="hidden lg:block">
          <Card className="p-5 sticky top-24"><Filters /></Card>
        </aside>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{filtered.length} products</div>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={()=>setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-1" />Filters
            </Button>
          </div>
          {showFilters && <Card className="p-5 mb-4 lg:hidden"><Filters /></Card>}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Card key={p.id} className="hover-lift overflow-hidden flex flex-col group">
                <div className="relative aspect-square bg-muted">
                  <Link to="/shop/$id" params={{id:p.id}}>
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                  <button className="absolute top-2 right-2 p-2 bg-card/90 rounded-full hover:bg-primary hover:text-primary-foreground transition" aria-label="Wishlist">
                    <Heart className="h-4 w-4" />
                  </button>
                  {p.mrp > p.price && (
                    <Badge className="absolute top-2 left-2 bg-success text-success-foreground">{Math.round((1-p.price/p.mrp)*100)}% OFF</Badge>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{p.brand}</span>
                    <Badge variant="secondary" className={p.condition==="New" ? "bg-success/10 text-success border-success/30" : "bg-accent text-accent-foreground"}>{p.condition}</Badge>
                  </div>
                  <Link to="/shop/$id" params={{id:p.id}} className="font-medium text-sm line-clamp-2 hover:text-primary">{p.name}</Link>
                  <div className="text-xs text-muted-foreground mt-1">{p.specs.slice(0,2).map(s=>s.value).join(" · ")}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-xs font-medium">{p.rating}</span>
                    <span className="text-xs text-muted-foreground">({p.reviews})</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold">{fmt(p.price)}</span>
                    <span className="text-xs text-muted-foreground line-through">{fmt(p.mrp)}</span>
                  </div>
                  <div className="text-xs text-primary mt-1">EMI from {fmt(Math.round(p.price/12))}/mo</div>
                  <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={()=>{ addToCart({id:p.id,name:p.name,brand:p.brand,price:p.price,mrp:p.mrp,image:p.image}); toast.success("Added to cart"); }}>Add</Button>
                    <Link to="/shop/$id" params={{id:p.id}}><Button size="sm" className="w-full bg-gradient-gold text-primary-foreground">Buy</Button></Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">No products match your filters.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
