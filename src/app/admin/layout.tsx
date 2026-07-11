"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import {
  LayoutDashboard,
  Home,
  Calendar,
  LogOut,
  Image as ImageIcon,
  FileText,
  DoorOpen,
  BarChart3,
  Plug,
  ClipboardList,
  Users,
  Sparkles,
  Package,
  Wrench,
  FileBarChart,
  Settings,
  ChevronDown,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { useState } from "react";

interface NavSection {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}

const navSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin/listings", label: "Listings", icon: Home },
      { href: "/admin/reservations", label: "Reservations", icon: ClipboardList },
      { href: "/admin/sales", label: "Sales Management", icon: DollarSign },
      { href: "/admin/availability", label: "Calendar", icon: Calendar },
      { href: "/admin/guests", label: "Guests", icon: Users },
      { href: "/admin/tasks", label: "Tasks & Cleaning", icon: Sparkles },
    ],
  },
  {
    label: "Financials",
    items: [
      { href: "/admin/revenue", label: "Revenue & Analytics", icon: BarChart3 },
      { href: "/admin/inventory", label: "Inventory", icon: Package },
      { href: "/admin/maintenance", label: "Maintenance", icon: Wrench },
      { href: "/admin/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
      { href: "/admin/content", label: "Pages & Content", icon: FileText },
      { href: "/admin/checkin", label: "Check-In Portal", icon: DoorOpen },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/revenue?tab=integrations", label: "Integrations", icon: Plug },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-warm-gray text-sm">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  function isActive(href: string) {
    const [itemPath, itemQuery] = href.split("?");
    if (itemQuery) {
      return pathname === itemPath && searchParams.get("tab") === itemQuery.split("=")[1];
    }
    return pathname === itemPath && !searchParams.get("tab");
  }

  function toggleSection(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <header className="bg-white border-b border-light-gray">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-[12px] font-medium tracking-[0.3em] uppercase text-charcoal"
          >
            AVENUE10
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-xs text-warm-gray hidden sm:block">
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-warm-gray hover:text-charcoal transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-52 shrink-0">
            <div className="bg-white border border-light-gray p-3 space-y-1">
              {/* Dashboard link (always visible) */}
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition ${
                  isActive("/admin")
                    ? "bg-charcoal text-white"
                    : "text-charcoal/70 hover:bg-cream"
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              {/* Collapsible sections */}
              {navSections.map((section) => {
                const isCollapsed = collapsed[section.label] ?? false;
                const hasActiveChild = section.items.some((item) => isActive(item.href));
                return (
                  <div key={section.label}>
                    <button
                      onClick={() => toggleSection(section.label)}
                      className="flex items-center justify-between w-full px-3 py-2 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hover:text-charcoal transition"
                    >
                      <span>{section.label}</span>
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-0.5">
                        {section.items.map((item) => {
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center gap-3 px-3 py-2 text-xs font-medium transition ${
                                active
                                  ? "bg-charcoal text-white"
                                  : "text-charcoal/70 hover:bg-cream"
                              }`}
                            >
                              <item.icon size={15} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <p className="text-warm-gray text-sm">Loading...</p>
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
