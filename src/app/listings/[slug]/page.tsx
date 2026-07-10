import { prisma } from "@/lib/prisma";
import { getPageMedia, getSiteContent } from "@/lib/content";
import { notFound } from "next/navigation";
import { BedDouble, Bath, Users, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingForm } from "@/components/BookingForm";
import { MediaGallery } from "@/components/MediaGallery";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [listing, pageMedia, content] = await Promise.all([
    prisma.listing.findUnique({
      where: { slug },
      include: { closedDates: true },
    }),
    getPageMedia(),
    getSiteContent(),
  ]);

  if (!listing) notFound();

  const closedDates = listing.closedDates.map((d: { date: Date }) => d.date.toISOString());
  const heroSrc = pageMedia[`${listing.slug}-hero`] || "/media/exterior/frontview-light.mp4";
  const isVideo = heroSrc.endsWith(".mp4") || heroSrc.endsWith(".webm");

  return (
    <>
      <Navbar variant="dark" />

      {/* Hero banner */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-charcoal">
        {isVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          >
            <source src={heroSrc} type="video/mp4" />
          </video>
        ) : (
          <img
            src={heroSrc}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end h-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pb-12 md:pb-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 mb-3 font-medium">
            {listing.type}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-white font-light">
            {listing.title}
          </h1>
          <div className="flex items-center gap-6 mt-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} /> {listing.bedrooms} Bedroom{listing.bedrooms > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath size={14} /> {listing.bathrooms} Bathroom{listing.bathrooms > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} /> Up to {listing.maxGuests} Guests
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24">
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {/* Details */}
            <div className="md:col-span-2 space-y-12">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-4 font-medium">
                  {content["listing-about-label"] || "About This Space"}
                </p>
                <p className="text-charcoal/80 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              {listing.amenities.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-6 font-medium">
                    {content["listing-amenities-label"] || "Amenities"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {listing.amenities.map((amenity: string) => (
                      <span
                        key={amenity}
                        className="flex items-center gap-2.5 text-sm text-charcoal/70"
                      >
                        <Check size={14} className="text-accent shrink-0" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <MediaGallery slug={listing.slug} />
            </div>

            {/* Booking sidebar */}
            <div className="md:col-span-1">
              <div className="bg-cream p-8 sticky top-24">
                <div className="mb-8">
                  <span className="font-serif text-3xl text-charcoal">
                    ${listing.pricePerNight}
                  </span>
                  <span className="text-warm-gray text-sm"> / night</span>
                  {listing.cleaningFee > 0 && (
                    <p className="text-xs text-warm-gray mt-1">
                      + ${listing.cleaningFee} cleaning fee
                    </p>
                  )}
                </div>
                <BookingForm
                  listingId={listing.id}
                  pricePerNight={listing.pricePerNight}
                  cleaningFee={listing.cleaningFee}
                  maxGuests={listing.maxGuests}
                  closedDates={closedDates}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
