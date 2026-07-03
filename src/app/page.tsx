import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteContent, getPageMedia } from "@/lib/content";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContactForm } from "@/components/ContactForm";

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

export default async function HomePage() {
  const [listings, content, pageMedia] = await Promise.all([
    prisma.listing.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } }),
    getSiteContent(),
    getPageMedia(),
  ]);

  const heroSrc = pageMedia["homepage-hero"] || "/media/exterior/frontview-light.mp4";
  const contactSrc = pageMedia["homepage-contact"] || "/media/exterior/sideview-right-2.mp4";
  const amenitiesBg = pageMedia["homepage-amenities-bg"] || "/media/main-home/home-theater.png";

  const amenities = Array.from({ length: 8 }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return {
      num,
      title: content[`amenity-${num}-title`] || `Amenity ${num}`,
      desc: content[`amenity-${num}-desc`] || "",
    };
  });

  const heroHeadlineParts = (content["hero-headline"] || "Where Comfort\nMeets Character").split("\n");

  return (
    <>
      <Navbar variant="dark" />

      {/* ── HERO ── */}
      <section className="relative h-screen w-full overflow-hidden bg-charcoal">
        <MediaElement
          src={heroSrc}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />

        <div className="relative z-10 flex flex-col justify-end h-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pb-24 md:pb-32">
          <p className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-white/70 mb-4 font-medium">
            {content["hero-subtitle"] || "Short-Term Residences · Est. 2025"}
          </p>
          <h1 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] text-white leading-[1.05] max-w-3xl font-light">
            {heroHeadlineParts.map((part, i) => (
              <span key={i}>{part}{i < heroHeadlineParts.length - 1 && <br />}</span>
            ))}
          </h1>
          <p className="mt-6 text-white/60 text-sm md:text-base max-w-lg leading-relaxed">
            {content["hero-description"] || "Avenue10 offers a curated main home and a private garage apartment — designed for travelers who value space, quiet, and thoughtful details."}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="border border-white/80 text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-white hover:text-charcoal transition-all duration-300 font-medium"
            >
              Reserve Your Stay
            </a>
            <Link
              href="/listings"
              className="text-white/70 text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:text-white transition-colors font-medium flex items-center gap-2"
            >
              Explore Rooms &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── ROOMS & RESIDENCES ── */}
      <section id="rooms" className="bg-white py-20 md:py-28">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex items-end justify-between mb-12">
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal font-light">
              {content["rooms-heading"] || "Rooms & Residences"}
            </h2>
            <span className="hidden md:block text-[10px] tracking-[0.2em] uppercase text-warm-gray font-medium">
              Featured Stays
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {listings.map((listing, idx) => {
              const thumbSrc = pageMedia[`${listing.slug}-thumbnail`] || "/media/exterior/frontview-light.mp4";
              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.slug}`}
                  className="group relative overflow-hidden bg-cream"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <MediaElement
                      src={thumbSrc}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6">
                    <p className="text-[9px] tracking-[0.2em] uppercase text-white/60 mb-1">
                      {String(idx + 1).padStart(2, "0")} &middot; {listing.type}
                    </p>
                    <div className="flex items-end justify-between">
                      <h3 className="text-white text-lg font-medium">{listing.title}</h3>
                      <span className="text-[10px] tracking-[0.15em] uppercase text-white/70 group-hover:text-white transition-colors flex items-center gap-1">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SERVICES / AMENITIES ── */}
      <section id="services" className="relative bg-charcoal text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={amenitiesBg}
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-20 md:py-28">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-4 font-medium">
            {content["amenities-subtitle"] || "What We Offer"}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light mb-4">
            {content["amenities-heading"] || "Property Amenities"}
          </h2>
          <p className="text-white/50 text-sm max-w-lg mb-14 leading-relaxed">
            {content["amenities-description"] || ""}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
            {amenities.map((item) => (
              <div
                key={item.num}
                className="bg-charcoal/80 backdrop-blur-sm p-6 md:p-8"
              >
                <span className="text-[10px] tracking-[0.15em] text-white/30 font-medium">
                  {item.num}
                </span>
                <h3 className="text-white text-sm font-semibold mt-3 mb-2">
                  {item.title}
                </h3>
                <p className="text-white/40 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT / RESERVE ── */}
      <section id="contact" className="bg-charcoal">
        <div className="grid md:grid-cols-2 min-h-[700px]">
          <div className="relative overflow-hidden min-h-[400px] md:min-h-0">
            <MediaElement
              src={contactSrc}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-12">
              <h3 className="font-serif text-3xl md:text-4xl text-white font-light leading-tight whitespace-pre-line">
                {content["contact-subheading"] || "Plan your\nnext stay"}
              </h3>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 mt-4">
                Avenue10 &middot; Short-Term Residences
              </p>
            </div>
          </div>

          <div className="bg-stone p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3 font-medium">
              Get in Touch
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-white font-light mb-10">
              {content["contact-heading"] || "Reserve a room or send us a note."}
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
