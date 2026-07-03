import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPageMedia } from "@/lib/content";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BedDouble, Bath, Users } from "lucide-react";

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

export default async function ListingsPage() {
  const [listings, pageMedia] = await Promise.all([
    prisma.listing.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
    getPageMedia(),
  ]);

  return (
    <>
      <Navbar variant="light" />

      <div className="pt-20 bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24">
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-3 font-medium">
            Our Properties
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-charcoal font-light mb-16">
            Rooms & Residences
          </h1>

          {listings.length === 0 ? (
            <p className="text-warm-gray text-center py-20">
              No listings available at this time.
            </p>
          ) : (
            <div className="space-y-20">
              {listings.map((listing: typeof listings[number], idx: number) => {
                const thumbSrc = pageMedia[`${listing.slug}-thumbnail`] || "/media/exterior/frontview-light.mp4";
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.slug}`}
                    className="group grid md:grid-cols-2 gap-8 md:gap-12 items-center"
                  >
                    <div className={`aspect-[4/3] overflow-hidden ${idx % 2 === 1 ? "md:order-2" : ""}`}>
                      <MediaElement
                        src={thumbSrc}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    <div className={idx % 2 === 1 ? "md:order-1" : ""}>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-warm-gray mb-3 font-medium">
                        {listing.type}
                      </p>
                      <h2 className="font-serif text-3xl md:text-4xl text-charcoal font-light group-hover:text-warm-gray transition-colors">
                        {listing.title}
                      </h2>
                      <p className="text-warm-gray mt-4 leading-relaxed text-sm max-w-md">
                        {listing.description}
                      </p>

                      <div className="flex items-center gap-6 mt-6 text-xs text-warm-gray">
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

                      <div className="mt-8 flex items-center gap-6">
                        <span className="font-serif text-2xl text-charcoal">
                          ${listing.pricePerNight}
                          <span className="text-sm text-warm-gray font-sans"> / night</span>
                        </span>
                        <span className="text-[10px] tracking-[0.15em] uppercase text-warm-gray group-hover:text-charcoal transition-colors">
                          View Details &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
