import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteContent, getPageMedia } from "@/lib/content";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BedDouble, Bath, Users, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

function MediaElement({ src, className }: { src: string; className?: string }) {
  const isVideo = src.endsWith(".mp4") || src.endsWith(".webm");
  if (isVideo) {
    return (
      <video autoPlay muted loop playsInline className={className}>
        <source src={src} type="video/mp4" />
      </video>
    );
  }
  return <img src={src} alt="" className={className} />;
}

export default async function AvailabilityPage() {
  const [listings, content, pageMedia] = await Promise.all([
    prisma.listing.findMany({
      where: { active: true },
      include: { closedDates: true },
      orderBy: { createdAt: "asc" },
    }),
    getSiteContent(),
    getPageMedia(),
  ]);

  return (
    <>
      <Navbar variant="light" />

      <div className="pt-20 bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24">
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-3 font-medium">
            {content["availability-subtitle"] || "Plan Your Stay"}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal font-light mb-4">
            {content["availability-heading"] || "Check Availability"}
          </h1>
          {(content["availability-description"] || "Select your preferred property to view available dates and book your stay.") && (
            <p className="text-warm-gray text-sm leading-relaxed max-w-2xl mb-16">
              {content["availability-description"] || "Select your preferred property to view available dates and book your stay."}
            </p>
          )}

          {content["availability-note"] && (
            <div className="bg-cream border border-light-gray px-5 py-4 mb-12">
              <p className="text-xs text-charcoal/70 leading-relaxed">
                {content["availability-note"]}
              </p>
            </div>
          )}

          {listings.length === 0 ? (
            <p className="text-warm-gray text-center py-20">
              No properties available at this time.
            </p>
          ) : (
            <div className="space-y-12">
              {listings.map((listing: typeof listings[number]) => {
                const thumbSrc = pageMedia[`${listing.slug}-thumbnail`] || "/media/exterior/frontview-light.mp4";
                return (
                  <div
                    key={listing.id}
                    className="border border-light-gray bg-white"
                  >
                    <div className="grid md:grid-cols-3 gap-0">
                      <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                        <MediaElement
                          src={thumbSrc}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] tracking-[0.2em] uppercase text-warm-gray mb-2 font-medium">
                            {listing.type}
                          </p>
                          <h2 className="font-serif text-2xl md:text-3xl text-charcoal font-light mb-3">
                            {listing.title}
                          </h2>
                          <p className="text-warm-gray text-sm leading-relaxed max-w-lg mb-4">
                            {listing.description}
                          </p>

                          <div className="flex items-center gap-6 text-xs text-warm-gray mb-6">
                            <span className="flex items-center gap-1.5">
                              <BedDouble size={14} /> {listing.bedrooms} Bed{listing.bedrooms > 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Bath size={14} /> {listing.bathrooms} Bath
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users size={14} /> Up to {listing.maxGuests}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <span className="font-serif text-2xl text-charcoal">
                            ${listing.pricePerNight}
                            <span className="text-sm text-warm-gray font-sans"> / night</span>
                          </span>
                          <Link
                            href={`/listings/${listing.slug}`}
                            className="inline-flex items-center gap-2 bg-charcoal text-white px-6 py-3 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition"
                          >
                            <CalendarDays size={14} />
                            {content["availability-cta-text"] || "Check Dates"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {content["availability-contact-text"] && (
            <div className="mt-16 text-center">
              <p className="text-warm-gray text-sm">
                {content["availability-contact-text"]}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
