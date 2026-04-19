import { Link } from "@tanstack/react-router";
import { Wrench, ShoppingBag, Calendar, User } from "lucide-react";

export function MobileBar() {
  const items = [
    { to: "/booking", label: "Book", icon: Wrench },
    { to: "/shop", label: "Shop", icon: ShoppingBag },
    { to: "/dashboard", label: "Bookings", icon: Calendar },
    { to: "/dashboard", label: "Profile", icon: User },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30 grid grid-cols-4">
      {items.map((it, i) => (
        <Link key={i} to={it.to} className="flex flex-col items-center py-2 text-[11px] text-muted-foreground hover:text-primary"
              activeProps={{ className: "text-primary" }}>
          <it.icon className="h-5 w-5 mb-0.5" />
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
