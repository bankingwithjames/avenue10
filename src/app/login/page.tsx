"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  const inputClass =
    "w-full bg-transparent border-b border-charcoal/15 text-charcoal text-sm py-3 outline-none focus:border-charcoal/50 transition-colors placeholder:text-warm-gray/50";
  const labelClass =
    "text-[9px] tracking-[0.2em] uppercase text-warm-gray font-medium mb-1 block";

  return (
    <div className="min-h-screen flex">
      {/* Left — video */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-charcoal">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <Link
            href="/"
            className="text-[13px] font-medium tracking-[0.35em] uppercase text-white"
          >
            AVENUE10
          </Link>
          <div>
            <h2 className="font-serif text-4xl text-white font-light leading-tight">
              Manage your<br />properties
            </h2>
            <p className="text-white/50 text-sm mt-4">
              Admin access to listings, reservations, and availability.
            </p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="lg:hidden text-[13px] font-medium tracking-[0.35em] uppercase text-charcoal block mb-12"
          >
            AVENUE10
          </Link>

          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-3 font-medium">
            Admin Portal
          </p>
          <h1 className="font-serif text-3xl text-charcoal font-light mb-10">
            Sign In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@avenue10.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full border border-charcoal text-charcoal text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-charcoal hover:text-white transition-all duration-300 font-medium disabled:opacity-40 mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
