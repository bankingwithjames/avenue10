"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = variant === "dark";
  const textClass = isDark ? "text-white" : "text-charcoal";
  const hoverClass = isDark ? "hover:text-white/70" : "hover:text-warm-gray";
  const bgClass = isDark ? "bg-transparent" : "bg-white border-b border-light-gray";

  return (
    <nav className={`${bgClass} absolute top-0 left-0 right-0 z-50`}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className={`text-[13px] font-medium tracking-[0.35em] uppercase ${textClass}`}
          >
            AVENUE10
          </Link>

          <div className={`hidden md:flex items-center gap-10 text-[11px] tracking-[0.2em] uppercase font-medium ${textClass}`}>
            <Link href="/listings" className={`${hoverClass} transition-colors`}>
              Rooms
            </Link>
            <a href="/#services" className={`${hoverClass} transition-colors`}>
              Amenities
            </a>
            <a href="/#contact" className={`${hoverClass} transition-colors`}>
              Contact
            </a>
            {session ? (
              <>
                <Link href="/admin" className={`${hoverClass} transition-colors`}>
                  Admin
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={`${hoverClass} transition-colors`}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className={`${hoverClass} transition-colors`}>
                Sign In
              </Link>
            )}
          </div>

          <button
            className={`md:hidden ${textClass}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-charcoal text-white px-6 pb-8 pt-4 space-y-4 text-[11px] tracking-[0.2em] uppercase font-medium">
          <Link href="/" className="block py-2" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href="/listings" className="block py-2" onClick={() => setMenuOpen(false)}>
            Rooms
          </Link>
          <a href="/#services" className="block py-2" onClick={() => setMenuOpen(false)}>
            Amenities
          </a>
          <a href="/#contact" className="block py-2" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
          {session ? (
            <>
              <Link href="/admin" className="block py-2" onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                className="block py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="block py-2" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
