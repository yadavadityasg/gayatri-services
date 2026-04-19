import logo from "@/assets/logo.png";
import logoMark from "@/assets/logo-mark.png";
import { Link } from "@tanstack/react-router";

export function Logo({ variant = "full", className = "" }: { variant?: "full" | "mark"; className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`} aria-label="Gayatri Repair Service home">
      {variant === "full" ? (
        <img src={logo} alt="Gayatri Repair Service" className="h-9 w-auto" />
      ) : (
        <img src={logoMark} alt="Gayatri Repair Service" className="h-9 w-9 rounded-full" />
      )}
    </Link>
  );
}
