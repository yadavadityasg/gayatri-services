import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-16">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="bg-card rounded-lg p-3 inline-block mb-4"><Logo /></div>
          <p className="text-sm opacity-80">Trusted home appliance repair & sales. Certified technicians, transparent pricing, 90-day warranty.</p>
          <div className="flex gap-3 mt-4">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground transition" aria-label="social"><Icon className="h-4 w-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-primary font-semibold mb-4">Repair Services</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/services/$slug" params={{slug:"ac-repair"}} className="hover:text-primary">AC Repair</Link></li>
            <li><Link to="/services/$slug" params={{slug:"fridge-repair"}} className="hover:text-primary">Refrigerator Repair</Link></li>
            <li><Link to="/services/$slug" params={{slug:"washing-repair"}} className="hover:text-primary">Washing Machine</Link></li>
            <li><Link to="/services/$slug" params={{slug:"ro-service"}} className="hover:text-primary">RO Service</Link></li>
            <li><Link to="/services/$slug" params={{slug:"microwave-repair"}} className="hover:text-primary">Microwave</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-primary font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/services" className="hover:text-primary">All Services</Link></li>
            <li><Link to="/shop" className="hover:text-primary">Shop Electronics</Link></li>
            <li><Link to="/amc" className="hover:text-primary">AMC Plans</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">My Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-primary font-semibold mb-4">Contact</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li className="flex gap-2"><MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />Sector 15, Vashi, Navi Mumbai - 400703</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />+91 98765 43210</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />info@gayatriservice.in</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} Gayatri Repair Service · ISO Certified · Background Verified Technicians
      </div>
    </footer>
  );
}
