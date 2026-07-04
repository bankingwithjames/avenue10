import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReservationsCalendar } from "@/components/ReservationsCalendar";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const listings = await prisma.listing.findMany({
    where: { active: true },
    select: {
      id: true,
      title: true,
      slug: true,
      pricePerNight: true,
      cleaningFee: true,
      bedrooms: true,
      bathrooms: true,
      maxGuests: true,
      type: true,
      closedDates: { select: { date: true } },
      reservations: {
        where: { status: { in: ["confirmed", "pending"] } },
        select: { checkIn: true, checkOut: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = listings.map((l) => ({
    ...l,
    closedDates: l.closedDates.map((d) => d.date.toISOString().split("T")[0]),
    bookedRanges: l.reservations.map((r) => ({
      checkIn: r.checkIn.toISOString().split("T")[0],
      checkOut: r.checkOut.toISOString().split("T")[0],
    })),
  }));

  return (
    <>
      <Navbar variant="light" />

      <div className="pt-20 min-h-screen bg-cream">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-12">
          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray font-medium mb-2">
              Availability & Pricing
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-charcoal font-light">
              Plan Your Stay
            </h1>
            <p className="text-sm text-warm-gray mt-3 max-w-xl leading-relaxed">
              Browse available dates and nightly rates across our properties. Select your dates to view pricing details.
            </p>
          </div>

          <ReservationsCalendar listings={serialized} />
        </div>
      </div>

      <Footer />
    </>
  );
}
