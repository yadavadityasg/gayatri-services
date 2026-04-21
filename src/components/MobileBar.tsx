import { Link, useLocation } from "@tanstack/react-router";
import { Wrench, ShoppingBag, Calendar, User } from "lucide-react";

export function MobileBar() {
  const location = useLocation();
  const path = location.pathname;
  const hash = location.hash;

  const items = [
    { to: "/booking" as const, hash: "", label: "Book", icon: Wrench },
    { to: "/shop" as const, hash: "", label: "Shop", icon: ShoppingBag },
    { to: "/dashboard" as const, hash: "bookings", label: "Bookings", icon: Calendar },
    { to: "/dashboard" as const, hash: "profile", label: "Profile", icon: User },
  ];

  const isActive = (it: (typeof items)[number]) => {
    if (it.to !== "/dashboard") return path === it.to;
    if (path !== "/dashboard") return false;
    if (!hash) return it.hash === "bookings"; // default
    return hash === it.hash;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30 grid grid-cols-4">
      {items.map((it, i) => (
        <Link
          key={i}
          to={it.to}
          hash={it.hash || undefined}
          className={`flex flex-col items-center py-2 text-[11px] hover:text-primary ${isActive(it) ? "text-primary" : "text-muted-foreground"}`}
        >
          <it.icon className="h-5 w-5 mb-0.5" />
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
