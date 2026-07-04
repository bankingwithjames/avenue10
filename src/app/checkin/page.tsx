"use client";

import { useState } from "react";
import { CheckInPortal } from "@/components/checkin/CheckInPortal";
import { Lock, ArrowRight } from "lucide-react";

export default function CheckInPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reservation, setReservation] = useState<any>(null);
  const [lastName, setLastName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastName, accessCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      setToken(data.token);
      setReservation(data.reservation);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (token && reservation) {
    return <CheckInPortal token={token} reservation={reservation} />;
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-[0.35em] uppercase text-warm-gray mb-2 font-medium">
            AVENUE10
          </p>
          <h1 className="text-3xl font-light text-charcoal mb-2">
            Guest Check-In
          </h1>
          <p className="text-sm text-warm-gray">
            Enter your booking details to access your stay information
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-light-gray p-8 space-y-6">
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
              Booking Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full border border-light-gray px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
              placeholder="Enter your last name"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
              Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              className="w-full border border-light-gray px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors font-mono tracking-wider"
              placeholder="e.g. AV10-XXXX"
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-charcoal text-white py-3.5 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Verifying..."
            ) : (
              <>
                <Lock size={14} /> Access Check-In <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-warm-gray mt-6">
          Your access code was provided with your booking confirmation.
          <br />
          Contact us if you need assistance.
        </p>
      </div>
    </div>
  );
}
