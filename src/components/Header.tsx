import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, Menu, User as UserIcon, X, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAV = [
  { to: "/services", label: "Repair Services" },
  { to: "/shop", label: "Shop" },
  { to: "/amc", label: "AMC Plans" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q } });
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b">
      {/* Top info bar */}
      <div className="hidden md:block bg-secondary text-secondary-foreground text-xs">
        <div className="container mx-auto px-4 py-2 flex justify-between">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary" />info@gayatriservice.in</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-primary" />+91 98765 43210</span>
          </div>
          <span className="text-primary">Same-day service · 90-day warranty</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-6 ml-4">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className="text-sm font-medium hover:text-primary transition" activeProps={{ className: "text-primary" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="What do you need help with today?" className="pl-9" />
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <Link to="/cart" className="relative p-2 rounded-md hover:bg-muted" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hidden sm:inline-flex">
                <Button variant="outline" size="sm"><UserIcon className="h-4 w-4 mr-1" />Account</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={async () => { await supabase.auth.signOut(); toast.success("Logged out"); }}>Logout</Button>
            </>
          ) : (
            <Link to="/login"><Button size="sm" variant="outline"><UserIcon className="h-4 w-4 mr-1" />Login</Button></Link>
          )}
          <Link to="/booking" className="hidden sm:inline-flex">
            <Button size="sm" className="bg-gradient-gold text-primary-foreground shadow-gold">Book Repair</Button>
          </Link>
          <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t bg-card">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-3">
            <form onSubmit={onSearch} className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search services or products" className="pl-9" />
            </form>
            {NAV.map(n => (
              <Link key={n.to} to={n.to} onClick={()=>setOpen(false)} className="py-2 text-sm font-medium">{n.label}</Link>
            ))}
            <Link to="/booking" onClick={()=>setOpen(false)}>
              <Button className="w-full bg-gradient-gold text-primary-foreground">Book a Repair</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
