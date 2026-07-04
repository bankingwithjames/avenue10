"use client";

import { useState, useEffect } from "react";
import { Package } from "lucide-react";

interface InventoryItem {
  id: string;
  room: string;
  itemName: string;
  quantity: number;
}

export function InventoryTab({ token }: { token: string }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/checkin/inventory", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p className="text-sm text-warm-gray">Loading inventory...</p>;

  const rooms = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    (acc[item.room] ||= []).push(item);
    return acc;
  }, {});

  if (Object.keys(rooms).length === 0) {
    return (
      <div className="bg-white border border-light-gray p-8 text-center">
        <Package size={32} className="mx-auto text-warm-gray/40 mb-3" />
        <p className="text-sm text-warm-gray">Inventory has not been set up yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-light-gray p-6">
        <h2 className="text-lg font-medium text-charcoal mb-1">Property Inventory</h2>
        <p className="text-xs text-warm-gray">
          Items provided for your stay, listed by room. Please report any discrepancies.
        </p>
      </div>

      {Object.entries(rooms).map(([room, roomItems]) => (
        <div key={room} className="bg-white border border-light-gray">
          <div className="px-6 py-4 border-b border-light-gray bg-cream/50">
            <h3 className="text-[11px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {room}
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {roomItems.map((item) => (
              <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-charcoal">{item.itemName}</span>
                <span className="text-xs text-warm-gray bg-cream px-3 py-1">
                  Qty: {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
