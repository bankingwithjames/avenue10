import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;

  return (
    <>
      <Navbar variant="dark" />
      <section className="bg-cream min-h-screen pt-28 pb-24">
        <CheckoutForm quoteId={quoteId} />
      </section>
      <Footer />
    </>
  );
}
