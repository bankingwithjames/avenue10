"use client";

import { useState, useEffect } from "react";
import { Star, Send, MessageSquare } from "lucide-react";

interface GuestReview {
  id: string;
  overallRating: number;
  cleanlinessRating: number | null;
  accuracyRating: number | null;
  communicationRating: number | null;
  locationRating: number | null;
  valueRating: number | null;
  comments: string | null;
  adminResponse: string | null;
  createdAt: string;
}

const RATING_CATEGORIES = [
  { key: "overallRating", label: "Overall" },
  { key: "cleanlinessRating", label: "Cleanliness" },
  { key: "accuracyRating", label: "Accuracy" },
  { key: "communicationRating", label: "Communication" },
  { key: "locationRating", label: "Location" },
  { key: "valueRating", label: "Value" },
] as const;

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
        >
          <Star
            size={readonly ? 14 : 18}
            className={
              star <= (hover || value)
                ? "text-amber-500 fill-amber-500"
                : "text-light-gray"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsTab({ token }: { token: string }) {
  const [existingReview, setExistingReview] = useState<GuestReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [ratings, setRatings] = useState<Record<string, number>>({
    overallRating: 0,
    cleanlinessRating: 0,
    accuracyRating: 0,
    communicationRating: 0,
    locationRating: 0,
    valueRating: 0,
  });
  const [comments, setComments] = useState("");

  useEffect(() => {
    fetch("/api/checkin/reviews", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setExistingReview(data);
        }
        setLoading(false);
      });
  }, [token]);

  function setRating(key: string, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ratings.overallRating === 0) return;
    setSubmitting(true);

    const res = await fetch("/api/checkin/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...ratings, comments: comments.trim() || null }),
    });

    if (res.ok) {
      const data = await res.json();
      setExistingReview(data);
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (loading) return <p className="text-sm text-warm-gray">Loading...</p>;

  // Read-only view of existing review
  if (existingReview) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-light-gray p-6">
          <h2 className="text-lg font-medium text-charcoal mb-1">Your Review</h2>
          <p className="text-xs text-warm-gray">
            {submitted
              ? "Thank you for your review! Your feedback helps us improve."
              : "You have already submitted a review for this stay."}
          </p>
        </div>

        <div className="bg-white border border-light-gray p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {RATING_CATEGORIES.map((cat) => {
              const val = existingReview[cat.key] as number | null;
              if (val == null || val === 0) return null;
              return (
                <div key={cat.key}>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">
                    {cat.label}
                  </p>
                  <StarRating value={val} readonly />
                </div>
              );
            })}
          </div>

          {existingReview.comments && (
            <div className="pt-3 border-t border-light-gray">
              <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">
                Comments
              </p>
              <p className="text-sm text-charcoal">{existingReview.comments}</p>
            </div>
          )}

          {existingReview.adminResponse && (
            <div className="bg-cream p-3 border-l-2 border-charcoal">
              <p className="text-[10px] tracking-[0.1em] uppercase text-warm-gray mb-1 font-medium">
                Host Response
              </p>
              <p className="text-sm text-charcoal">{existingReview.adminResponse}</p>
            </div>
          )}

          <p className="text-[10px] text-warm-gray/60">
            Submitted {new Date(existingReview.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  // Submit form
  return (
    <div className="space-y-6">
      <div className="bg-white border border-light-gray p-6">
        <h2 className="text-lg font-medium text-charcoal mb-1">Leave a Review</h2>
        <p className="text-xs text-warm-gray">
          Your feedback helps us maintain and improve the quality of our properties.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-light-gray p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {RATING_CATEGORIES.map((cat) => (
            <div key={cat.key} className={cat.key === "overallRating" ? "sm:col-span-2" : ""}>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
                {cat.label} {cat.key === "overallRating" && <span className="text-red-400">*</span>}
              </label>
              <StarRating
                value={ratings[cat.key]}
                onChange={(v) => setRating(cat.key, v)}
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
            Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="w-full border border-light-gray px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
            placeholder="Share your experience..."
          />
        </div>

        <button
          type="submit"
          disabled={ratings.overallRating === 0 || submitting}
          className="flex items-center gap-2 bg-charcoal text-white px-6 py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
