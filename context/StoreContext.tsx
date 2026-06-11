'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface BasketItem {
  id: string;
  qty: string;
  note: string;
}

interface StoreContextType {
  basket: BasketItem[];
  inBasket: (id: string) => boolean;
  addToBasket: (id: string) => void;
  removeFromBasket: (id: string) => void;
  updateBasket: (id: string, patch: Partial<BasketItem>) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState<BasketItem[]>([
    { id: 'bianco-carrara', qty: '200–500 sqm', note: '' },
    { id: 'dark-emperador', qty: 'Under 50 sqm', note: '' },
  ]);

  const inBasket = (id: string) => basket.some(b => b.id === id);

  const addToBasket = (id: string) =>
    setBasket(b => b.some(x => x.id === id) ? b : [...b, { id, qty: '50–200 sqm', note: '' }]);

  const removeFromBasket = (id: string) =>
    setBasket(b => b.filter(x => x.id !== id));

  const updateBasket = (id: string, patch: Partial<BasketItem>) =>
    setBasket(b => b.map(x => x.id === id ? { ...x, ...patch } : x));

  return (
    <StoreContext.Provider value={{ basket, inBasket, addToBasket, removeFromBasket, updateBasket }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export const QTY_OPTS = [
  'Under 50 sqm',
  '50–200 sqm',
  '200–500 sqm',
  '500–1,000 sqm',
  'Over 1,000 sqm',
];
