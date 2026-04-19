// Lightweight cart store using localStorage + custom event for cross-component sync.
import { useEffect, useState } from "react";

export interface CartItem { id: string; name: string; brand: string; price: number; mrp: number; image: string; qty: number; }
const KEY = "gs_cart_v1";
const EVT = "gs:cart";

const isBrowser = () => typeof window !== "undefined";

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(items: CartItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT));
}
export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const items = getCart();
  const existing = items.find(i => i.id === item.id);
  if (existing) existing.qty += qty;
  else items.push({ ...item, qty });
  save(items);
}
export function updateQty(id: string, qty: number) {
  const items = getCart().map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i);
  save(items);
}
export function removeFromCart(id: string) { save(getCart().filter(i => i.id !== id)); }
export function clearCart() { save([]); }

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(getCart());
    const refresh = () => setItems(getCart());
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  return { items, count, subtotal };
}

export function fmt(n: number) { return "₹" + n.toLocaleString("en-IN"); }
