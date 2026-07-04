"use client";

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";

interface Props {
  token: string;
  signed: boolean;
  onSigned: () => void;
}

export function TermsTab({ token, signed, onSigned }: Props) {
  const [terms, setTerms] = useState("");
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signedInfo, setSignedInfo] = useState<{ signedName: string; signedAt: string } | null>(null);

  useEffect(() => {
    fetch("/api/checkin/agreement", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setTerms(data.terms);
        if (data.signed) {
          setSignedInfo(data.agreement);
        }
        setLoading(false);
      });
  }, [token]);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/checkin/agreement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ signedName }),
    });

    if (res.ok) {
      onSigned();
    }
    setSubmitting(false);
  }

  if (loading) {
    return <p className="text-sm text-warm-gray">Loading terms...</p>;
  }

  if (signed || signedInfo) {
    return (
      <div className="bg-white border border-light-gray p-8">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle size={24} className="text-green-600" />
          <h2 className="text-lg font-medium text-charcoal">Agreement Signed</h2>
        </div>
        {signedInfo && (
          <div className="text-sm text-warm-gray space-y-1">
            <p>Signed by: <span className="text-charcoal font-medium">{signedInfo.signedName}</span></p>
            <p>Date: {new Date(signedInfo.signedAt).toLocaleString()}</p>
          </div>
        )}
        <div className="mt-6 pt-6 border-t border-light-gray">
          <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-4 font-medium">
            Terms & Conditions
          </p>
          <div className="prose prose-sm max-w-none text-charcoal/80 whitespace-pre-line max-h-[400px] overflow-y-auto text-sm leading-relaxed">
            {terms || "No terms have been set up yet."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-light-gray">
      <div className="p-6 border-b border-light-gray">
        <h2 className="text-lg font-medium text-charcoal">Terms, Rules & Conditions</h2>
        <p className="text-xs text-warm-gray mt-1">
          Please read and sign before accessing your stay details.
        </p>
      </div>

      <div className="p-6 max-h-[500px] overflow-y-auto border-b border-light-gray">
        <div className="prose prose-sm max-w-none text-charcoal/80 whitespace-pre-line text-sm leading-relaxed">
          {terms || "No terms have been configured. Please contact your host."}
        </div>
      </div>

      <form onSubmit={handleSign} className="p-6 space-y-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-charcoal"
          />
          <span className="text-sm text-charcoal">
            I have read, understand, and agree to the Terms, Rules & Conditions outlined above.
          </span>
        </label>

        <div>
          <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
            Full Legal Name (Electronic Signature)
          </label>
          <input
            type="text"
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            required
            className="w-full border border-light-gray px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal font-serif italic text-lg"
            placeholder="Type your full legal name"
          />
        </div>

        <button
          type="submit"
          disabled={!agreed || !signedName.trim() || submitting}
          className="w-full bg-charcoal text-white py-3.5 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? "Signing..." : "Sign Agreement & Continue"}
        </button>
      </form>
    </div>
  );
}
