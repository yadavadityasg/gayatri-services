import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { z } from "zod";

const PHONE_DISPLAY = "+91 98765 43210";
const PHONE_TEL = "+919876543210";

const search = z.object({
  service: z.string().optional(),
  brand: z.string().optional(),
  problem: z.string().optional(),
});

export const Route = createFileRoute("/booking")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Book a Repair | Gayatri" }] }),
  component: BookingPage,
});

function BookingPage() {
  return (
    <Layout>
      <div className="container mx-auto max-w-xl px-4 py-16">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Self booking is not started yet</h1>
          <p className="mt-3 text-muted-foreground">
            Call Gayatri Service at{" "}
            <a href={`tel:${PHONE_TEL}`} className="font-semibold text-foreground">{PHONE_DISPLAY}</a>
            {" "}and the team will book the visit for you.
          </p>
          <a href={`tel:${PHONE_TEL}`} className="mt-6 inline-flex">
            <Button className="bg-gradient-gold text-primary-foreground">Call {PHONE_DISPLAY}</Button>
          </a>
          <div className="mt-4">
            <Link to="/" className="text-sm text-muted-foreground underline">Back to home</Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
