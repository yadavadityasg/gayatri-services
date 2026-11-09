import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { catalogGet } from "@/lib/catalog-api";
import { addToCart, fmt } from "@/lib/cart";
import { Star, ShieldCheck, Truck, Wrench, ChevronRight, Heart, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$id")({
  loader: async ({ params }) => {
    const local = await catalogGet<{ product: any; related: any[] }>(`/products/${encodeURIComponent(params.id)}`);
    if (local?.product) return local;
    const { data: product, error } = await supabase.from("products").select("*").eq("id", params.id).maybeSingle();
    if (error || !product) throw notFound();
    const { data: related } = await supabase.from("products").select("*").eq("category", product.category).eq("active", true).neq("id", product.id).limit(4);
    return { product, related: related ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.brand} ${loaderData?.product.name} | Gayatri` },
      { name: "description", content: loaderData?.product.description },
      { property: "og:image", content: loaderData?.product.image },
    ],
  }),
  component: ProductDetailPage,
  notFoundComponent: () => <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-3xl font-bold">Product not found</h1></div></Layout>,
});

function ProductDetailPage() {
  const { product, related } = Route.useLoaderData() as { product: any; related: any[] };
  const navigate = useNavigate();
  const [emiMonths, setEmiMonths] = useState(12);
  const emi = Math.round(product.price / emiMonths);
  const specs: any[] = Array.isArray(product.specs) ? product.specs : [];
  const box: string[] = Array.isArray(product.box) ? product.box : [];

  const buyNow = () => {
    addToCart({id:product.id,name:product.name,brand:product.brand,price:product.price,mrp:product.mrp,image:product.image});
    navigate({ to: "/cart" });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <nav className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="h-3 w-3" />
          <Link to="/shop" className="hover:text-primary">Shop</Link><ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-2 gap-8">
        <div>
          <Card className="overflow-hidden bg-muted">
            <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" />
          </Card>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {Array.from({length: 4}).map((_, i) => (
              <Card key={i} className="overflow-hidden cursor-pointer aspect-square bg-muted">
                <img src={product.image} alt="" className="w-full h-full object-cover opacity-90" />
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">{product.brand}</span>
            <Badge className={product.condition==="New" ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}>{product.condition}</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-0.5">{Array.from({length:Math.round(product.rating)}).map((_,j)=><Star key={j} className="h-4 w-4 fill-primary text-primary" />)}</div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{fmt(product.price)}</span>
            <span className="text-lg text-muted-foreground line-through">{fmt(product.mrp)}</span>
            <Badge className="bg-success text-success-foreground">{Math.round((1-product.price/product.mrp)*100)}% off</Badge>
          </div>
          <div className="text-sm text-primary mt-1">EMI from {fmt(emi)}/month</div>

          <div className="mt-5 flex gap-3">
            <Button size="lg" variant="outline" className="flex-1" onClick={()=>{ addToCart({id:product.id,name:product.name,brand:product.brand,price:product.price,mrp:product.mrp,image:product.image}); toast.success("Added to cart"); }}>Add to Cart</Button>
            <Button size="lg" className="flex-1 bg-gradient-gold text-primary-foreground shadow-gold" onClick={buyNow}>Buy Now</Button>
            <Button size="lg" variant="outline" aria-label="Wishlist"><Heart className="h-5 w-5" /></Button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
            {[
              {icon: Truck, t: "Free delivery", s: "in 3-5 days"},
              {icon: Wrench, t: "Free install", s: "by certified tech"},
              {icon: ShieldCheck, t: (product.warranty || "").split("+")[0] || "Warranty", s: product.condition === "Refurbished" ? "Refurb warranty" : "Brand warranty"},
            ].map((b,i)=>(
              <Card key={i} className="p-3 text-center"><b.icon className="h-5 w-5 text-primary mx-auto mb-1" /><div className="font-medium">{b.t}</div><div className="text-muted-foreground">{b.s}</div></Card>
            ))}
          </div>

          <Card className="mt-6 p-5">
            <h3 className="font-semibold mb-3">Specifications</h3>
            <table className="w-full text-sm">
              <tbody>
                {specs.map((s,i)=>(
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground w-1/3">{s.label}</td>
                    <td className="py-2 font-medium">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="mt-4 p-5">
            <h3 className="font-semibold mb-2">EMI Calculator</h3>
            <div className="flex gap-2 flex-wrap">
              {[3,6,9,12,18,24].map(m => (
                <button key={m} onClick={()=>setEmiMonths(m)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border ${emiMonths===m ? "bg-gradient-gold text-primary-foreground border-transparent" : "bg-card hover:bg-muted"}`}>
                  {m} mo
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">{emiMonths} months × </span>
              <span className="text-xl font-bold text-primary">{fmt(emi)}</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="p-5">
          <h3 className="font-semibold text-lg mb-3">About this product</h3>
          <p className="text-sm text-muted-foreground">{product.description}</p>
          <h4 className="font-semibold mt-5 mb-2 text-sm">What's in the box</h4>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {box.map((b,i)=> <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />{b}</li>)}
          </ul>
        </Card>
      </div>

      {related.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h3 className="font-semibold text-xl mb-4">Related products</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <Link key={p.id} to="/shop/$id" params={{id:p.id}}>
                <Card className="hover-lift overflow-hidden">
                  <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
                  <div className="p-3">
                    <div className="text-xs text-muted-foreground">{p.brand}</div>
                    <div className="font-medium text-sm line-clamp-2">{p.name}</div>
                    <div className="font-bold mt-1 text-primary">{fmt(p.price)}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
