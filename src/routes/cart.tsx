import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart, removeFromCart, updateQty, fmt, clearCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Minus, ShoppingBag, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart & Checkout | Gayatri" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [pay, setPay] = useState("upi");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [addr, setAddr] = useState({ name: "", phone: "", line: "", city: "Navi Mumbai", pincode: "" });

  const delivery = subtotal > 0 && subtotal < 5000 ? 199 : 0;
  const gst = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + delivery + gst;

  const applyCoupon = () => {
    if (coupon.trim().toLowerCase() === "gayatri10") { setDiscount(Math.round(subtotal * 0.1)); toast.success("10% off applied"); }
    else { toast.error("Invalid coupon"); }
  };

  const placeOrder = async () => {
    if (!user) { navigate({ to: "/login", search: { redirect: "/cart" } }); return; }
    if (!addr.name || !addr.phone || !addr.line || !addr.pincode) { toast.error("Fill delivery address"); return; }
    const { data, error } = await supabase.from("orders").insert({
      user_id: user.id,
      items: items as any,
      subtotal, delivery_fee: delivery, discount, gst, total,
      payment_method: pay,
      address: addr as any,
      status: "placed",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setOrderId(data!.id.slice(0,8).toUpperCase());
    clearCart();
    toast.success("Order placed!");
  };

  if (orderId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-xl">
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Order Placed!</h1>
            <p className="text-muted-foreground mt-1">Order ID: <span className="font-mono font-semibold text-foreground">GS-O-{orderId}</span></p>
            <p className="text-sm text-muted-foreground mt-3">We'll send you tracking updates on WhatsApp.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link to="/shop"><Button variant="outline" className="w-full">Continue shopping</Button></Link>
              <Link to="/dashboard"><Button className="w-full bg-gradient-gold text-primary-foreground">My Orders</Button></Link>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <Link to="/shop"><Button className="mt-6 bg-gradient-gold text-primary-foreground">Shop electronics</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold">Your Cart ({items.length})</h1>
          <div className="space-y-3">
            {items.map(it => (
              <Card key={it.id} className="p-4 flex gap-4">
                <img src={it.image} alt={it.name} className="w-24 h-24 object-cover rounded bg-muted" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{it.brand}</div>
                  <div className="font-medium">{it.name}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-bold">{fmt(it.price)}</span>
                    <span className="text-xs text-muted-foreground line-through">{fmt(it.mrp)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center border rounded-md">
                      <button onClick={()=>updateQty(it.id, it.qty-1)} className="p-2"><Minus className="h-3 w-3" /></button>
                      <span className="px-3 text-sm font-medium">{it.qty}</span>
                      <button onClick={()=>updateQty(it.id, it.qty+1)} className="p-2"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={()=>removeFromCart(it.id)} className="text-destructive text-xs flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Remove</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Delivery address</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Full name</Label><Input value={addr.name} onChange={e=>setAddr({...addr, name:e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={addr.phone} onChange={e=>setAddr({...addr, phone:e.target.value})} /></div>
              <div className="sm:col-span-2"><Label>Address</Label><Input value={addr.line} onChange={e=>setAddr({...addr, line:e.target.value})} /></div>
              <div><Label>City</Label><Input value={addr.city} onChange={e=>setAddr({...addr, city:e.target.value})} /></div>
              <div><Label>Pincode</Label><Input value={addr.pincode} onChange={e=>setAddr({...addr, pincode:e.target.value})} maxLength={6} /></div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Payment method</h3>
            <Select value={pay} onValueChange={setPay}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI (GPay / PhonePe / Paytm)</SelectItem>
                <SelectItem value="card">Credit / Debit Card</SelectItem>
                <SelectItem value="netbanking">Net Banking</SelectItem>
                <SelectItem value="emi">EMI</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Order summary</h3>
            <div className="space-y-2 text-sm">
              <Row label="Items total" value={fmt(subtotal)} />
              <Row label="Delivery" value={delivery === 0 ? "FREE" : fmt(delivery)} />
              {discount > 0 && <Row label="Discount" value={"- "+fmt(discount)} />}
              <Row label="GST (18%)" value={fmt(gst)} />
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base">
                <span>Total</span><span className="text-primary">{fmt(total)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Input placeholder="Coupon (try GAYATRI10)" value={coupon} onChange={e=>setCoupon(e.target.value)} />
              <Button variant="outline" onClick={applyCoupon}>Apply</Button>
            </div>
            <Button className="w-full mt-4 bg-gradient-gold text-primary-foreground" size="lg" onClick={placeOrder}>Place Order</Button>
          </Card>
        </aside>
      </div>
    </Layout>
  );
}

function Row({label, value}: {label:string; value:string}) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
