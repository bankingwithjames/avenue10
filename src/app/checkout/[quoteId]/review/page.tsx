import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckoutReview } from "@/components/CheckoutReview";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  return (
    <>
      <Navbar variant="dark" />
      <section className="bg-cream min-h-screen pt-28 pb-24">
        <CheckoutReview quoteId={quoteId} />
      </section>
      <Footer />
    </>
  );
}
