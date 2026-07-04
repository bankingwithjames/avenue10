"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Home,
  Calendar,
  ClipboardList,
  LogOut,
  Image as ImageIcon,
  FileText,
  DoorOpen,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: Home },
  { href: "/admin/availability", label: "Calendar", icon: Calendar },
  { href: "/admin/revenue", label: "Revenue & Analytics", icon: BarChart3 },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/content", label: "Pages & Content", icon: FileText },
  { href: "/admin/checkin", label: "Check-In Portal", icon: DoorOpen },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

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
            <div className="bg-white border border-light-gray p-3 space-y-0.5">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition ${
                      active
                        ? "bg-charcoal text-white"
                        : "text-charcoal/70 hover:bg-cream"
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
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
