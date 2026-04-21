import { Link, useLocation } from "@tanstack/react-router";
import { Wrench, ShoppingBag, Calendar, User } from "lucide-react";

export function MobileBar() {
  const location = useLocation();
  const path = location.pathname;
  const tab = new URLSearchParams(location.search).get("tab");

  const items = [
    { to: "/booking", search: {}, label: "Book", icon: Wrench },
    { to: "/shop", search: {}, label: "Shop", icon: ShoppingBag },
    { to: "/dashboard", search: { tab: "bookings" }, label: "Bookings", icon: Calendar },
    { to: "/dashboard", search: { tab: "profile" }, label: "Profile", icon: User },
  ];

  const isActive = (it: (typeof items)[0]) => {
    if (it.to !== "/dashboard") return path === it.to;
    const itemTab = (it.search as any).tab;
    if (!tab || tab === "") return itemTab === "bookings"; // default tab
    return tab === itemTab;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30 grid grid-cols-4">
      {items.map((it, i) => (
        <Link
          key={i}
          to={it.to}
          search={it.search}
          className={`flex flex-col items-center py-2 text-[11px] hover:text-primary ${isActive(it) ? "text-primary" : "text-muted-foreground"}`}
        >
          <it.icon className="h-5 w-5 mb-0.5" />
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
