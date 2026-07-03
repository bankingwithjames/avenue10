import { getSiteContent } from "@/lib/content";

export async function Footer() {
  const content = await getSiteContent();

  const locationLabel = content["footer-location-label"] || "Location";
  const locationText = content["footer-location-text"] || "Avenue10 Property\nYour City, State ZIP";
  const contactLabel = content["footer-contact-label"] || "Contact";
  const contactText = content["footer-contact-text"] || "reservations@avenue10.com\n+1 (555) 000-0000";
  const socialLabel = content["footer-social-label"] || "Follow";
  const socialText = content["footer-social-text"] || "Instagram: @avenue10stays";
  const brand = content["footer-brand"] || "AVENUE10";
  const copyright = content["footer-copyright"] || "All rights reserved";

  return (
    <footer className="bg-white border-t border-light-gray">
      {/* Contact row */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-warm-gray mb-3 font-medium">
              {locationLabel}
            </p>
            <p className="text-charcoal leading-relaxed whitespace-pre-line">
              {locationText}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-warm-gray mb-3 font-medium">
              {contactLabel}
            </p>
            <p className="text-charcoal leading-relaxed whitespace-pre-line">
              {contactText}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-warm-gray mb-3 font-medium">
              {socialLabel}
            </p>
            <p className="text-charcoal leading-relaxed whitespace-pre-line">
              {socialText}
            </p>
          </div>
        </div>
      </div>

      {/* Giant brand name */}
      <div className="border-t border-light-gray overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-8 flex items-end justify-between">
          <span className="text-[clamp(3rem,12vw,10rem)] font-bold tracking-tight leading-none text-charcoal select-none">
            {brand}
          </span>
          <span className="text-[10px] tracking-[0.15em] uppercase text-warm-gray pb-4 hidden md:block">
            &copy; {new Date().getFullYear()} {copyright}
          </span>
        </div>
      </div>
    </footer>
  );
}
