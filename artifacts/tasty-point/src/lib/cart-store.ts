import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  isVeg: boolean;
  notes?: string;
}

const CART_KEY = "tasty-point-cart";
const TABLE_KEY = "tasty-point-table";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function loadTableId(): number | null {
  try {
    const raw = localStorage.getItem(TABLE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function saveTableId(id: number) {
  localStorage.setItem(TABLE_KEY, String(id));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

// Simple pub/sub for cart updates across components
const listeners = new Set<() => void>();
export function subscribeCart(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notifyCartChange() {
  listeners.forEach(fn => fn());
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    const unsub = subscribeCart(() => setItems(loadCart()));
    return () => { unsub(); };
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    const current = loadCart();
    const idx = current.findIndex(i => i.menuItemId === item.menuItemId);
    if (idx >= 0) {
      current[idx].quantity += 1;
    } else {
      current.push({ ...item, quantity: 1 });
    }
    saveCart(current);
    notifyCartChange();
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    const current = loadCart().filter(i => i.menuItemId !== menuItemId);
    saveCart(current);
    notifyCartChange();
  }, []);

  const updateQuantity = useCallback((menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    const current = loadCart();
    const idx = current.findIndex(i => i.menuItemId === menuItemId);
    if (idx >= 0) current[idx].quantity = quantity;
    saveCart(current);
    notifyCartChange();
  }, [removeItem]);

  const updateNotes = useCallback((menuItemId: number, notes: string) => {
    const current = loadCart();
    const idx = current.findIndex(i => i.menuItemId === menuItemId);
    if (idx >= 0) current[idx].notes = notes;
    saveCart(current);
    notifyCartChange();
  }, []);

  const clear = useCallback(() => {
    saveCart([]);
    notifyCartChange();
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, addItem, removeItem, updateQuantity, updateNotes, clear, total, count };
}
