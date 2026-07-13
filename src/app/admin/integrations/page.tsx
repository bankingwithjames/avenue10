"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Shield } from "lucide-react";

interface IntegrationRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  connectionUrl: string | null;
  notes: string | null;
  connectedAt: string | null;
}

interface IntegrationDef {
  name: string;
  color: string;
  category: string;
  desc: string;
  builtIn?: boolean;
}

function Badge({ children, variant }: { children: React.ReactNode; variant: "green" | "gray" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gray: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase font-medium border ${colors[variant]}`}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">{children}</h3>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-light-gray p-5">{children}</div>;
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/integrations")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setIntegrations(data); })
      .catch(() => {});
  }, []);

  const getStatus = (name: string) => {
    const rec = integrations.find(i => i.name === name);
    return rec?.status === "connected" ? "connected" : "not_connected";
  };

  const getUrl = (name: string) => {
    return integrations.find(i => i.name === name)?.connectionUrl || "";
  };

  async function handleConnect(name: string, category: string) {
    if (!connectUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, connectionUrl: connectUrl.trim() }),
      });
      const data = await res.json();
      setIntegrations(prev => {
        const filtered = prev.filter(i => i.name !== name);
        return [...filtered, data];
      });
      setConnecting(null);
      setConnectUrl("");
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleDisconnect(name: string) {
    try {
      await fetch(`/api/admin/integrations?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setIntegrations(prev => prev.map(i => i.name === name ? { ...i, status: "not_connected", connectionUrl: null, connectedAt: null } : i));
    } catch { /* ignore */ }
  }

  const bookingPlatforms: IntegrationDef[] = [
    { name: "Airbnb", color: "#FF5A5F", category: "booking", desc: "Sync reservations, revenue, guest data, and reviews from Airbnb" },
    { name: "VRBO", color: "#3B5FC0", category: "booking", desc: "Sync bookings, payouts, and calendar from VRBO" },
    { name: "Booking.com", color: "#003580", category: "booking", desc: "Connect via Booking.com Connectivity API or channel manager" },
    { name: "Direct Website", color: "#2D6A4F", category: "booking", desc: "Revenue from avenue10.net direct bookings", builtIn: true },
  ];

  const pmsTools: IntegrationDef[] = [
    { name: "Hostaway", color: "#4F46E5", category: "pms", desc: "All-in-one PMS with channel management, automation, and accounting" },
    { name: "Guesty", color: "#1E3A5F", category: "pms", desc: "Enterprise property management and distribution platform" },
    { name: "OwnerRez", color: "#D97706", category: "pms", desc: "Direct booking management with channel distribution" },
    { name: "Hospitable", color: "#059669", category: "pms", desc: "Automated guest messaging and operations platform" },
  ];

  const pricingTools: IntegrationDef[] = [
    { name: "PriceLabs", color: "#7C3AED", category: "pricing", desc: "AI-powered dynamic pricing and market analytics" },
    { name: "Beyond (formerly Beyond Pricing)", color: "#2563EB", category: "pricing", desc: "Revenue management and dynamic pricing" },
    { name: "Wheelhouse", color: "#0891B2", category: "pricing", desc: "Data-driven pricing recommendations and market insights" },
    { name: "AirDNA", color: "#DC2626", category: "pricing", desc: "Short-term rental market data and analytics" },
  ];

  const financialTools: IntegrationDef[] = [
    { name: "Stripe", color: "#635BFF", category: "financial", desc: "Payment processing for direct bookings" },
    { name: "QuickBooks", color: "#2CA01C", category: "financial", desc: "Accounting software integration for expense tracking" },
    { name: "Xero", color: "#13B5EA", category: "financial", desc: "Cloud accounting and bookkeeping integration" },
  ];

  const hardwareTools: IntegrationDef[] = [
    { name: "Smart Locks", color: "#1F2937", category: "hardware", desc: "Automate guest access with smart lock integrations" },
    { name: "Noise Monitors", color: "#6366F1", category: "hardware", desc: "Monitor noise levels for compliance and neighbor relations" },
  ];

  function renderCard(item: IntegrationDef) {
    const status = item.builtIn ? "connected" : getStatus(item.name);
    const isConnected = status === "connected";
    const isExpanded = connecting === item.name;
    const savedUrl = getUrl(item.name);

    return (
      <Card key={item.name}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-charcoal font-medium">{item.name}</span>
        </div>
        <p className="text-[10px] text-warm-gray mb-3 leading-relaxed">{item.desc}</p>

        {isExpanded && (
          <div className="mb-3 space-y-2">
            <input
              value={connectUrl}
              onChange={e => setConnectUrl(e.target.value)}
              placeholder={`Paste your ${item.name} dashboard or listing URL`}
              className="w-full text-xs bg-transparent border border-light-gray text-charcoal px-3 py-2 outline-none focus:border-charcoal/40 transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleConnect(item.name, item.category)}
                disabled={saving || !connectUrl.trim()}
                className="flex-1 px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Connection"}
              </button>
              <button
                onClick={() => { setConnecting(null); setConnectUrl(""); }}
                className="px-3 py-1.5 bg-white text-charcoal border border-light-gray text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-cream transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isConnected && savedUrl && !isExpanded && (
          <div className="mb-3 flex items-center gap-1.5">
            <a href={savedUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent hover:underline truncate max-w-[180px]">
              {savedUrl.replace(/^https?:\/\//, "").substring(0, 40)}
            </a>
            <ExternalLink size={10} className="text-accent shrink-0" />
          </div>
        )}

        <div className="flex items-center justify-between">
          {isConnected ? (
            <Badge variant="green">Connected</Badge>
          ) : (
            <Badge variant="gray">Not Connected</Badge>
          )}
          {item.builtIn ? (
            <button
              onClick={() => alert("Direct website integration is managed through your site settings.")}
              className="px-3 py-1.5 bg-white text-charcoal border border-light-gray text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-cream transition"
            >
              Manage
            </button>
          ) : isConnected && !isExpanded ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => { setConnecting(item.name); setConnectUrl(savedUrl); }}
                className="px-3 py-1.5 bg-white text-charcoal border border-light-gray text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-cream transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDisconnect(item.name)}
                className="px-3 py-1.5 bg-white text-red-600 border border-red-200 text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-red-50 transition"
              >
                Disconnect
              </button>
            </div>
          ) : !isExpanded ? (
            <button
              onClick={() => { setConnecting(item.name); setConnectUrl(""); }}
              className="px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition"
            >
              Connect
            </button>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Integrations</h1>
      </div>

      <div className="space-y-8">
        <div>
          <SectionLabel>Booking Platforms</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {bookingPlatforms.map(renderCard)}
          </div>
        </div>

        <div>
          <SectionLabel>PMS / Channel Manager</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pmsTools.map(renderCard)}
          </div>
        </div>

        <div>
          <SectionLabel>Pricing Tools</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pricingTools.map(renderCard)}
          </div>
        </div>

        <div>
          <SectionLabel>Financial Tools</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {financialTools.map(renderCard)}
          </div>
        </div>

        <div>
          <SectionLabel>Hardware &amp; IoT</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hardwareTools.map(renderCard)}
          </div>
        </div>

        <div>
          <SectionLabel>API Keys</SectionLabel>
          <Card>
            <div className="flex items-start gap-2 bg-cream border border-light-gray px-4 py-3">
              <Shield size={14} className="text-warm-gray mt-0.5 shrink-0" />
              <p className="text-[10px] text-warm-gray leading-relaxed">
                API keys will be stored securely in environment variables when API integrations become available. Use manual URL connections above to link your accounts now.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
