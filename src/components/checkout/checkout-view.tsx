"use client";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Container } from "@/components/layout/container";
import { BrowseLink, LoadingState, PageStatus } from "@/components/layout/page-status";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { abandonCheckout, getOrStartCheckout, saveCheckoutDetails } from "@/lib/api/checkout";
import { getMovie } from "@/lib/api/movies";
import { useAuth } from "@/lib/auth-context";
import { getActiveCustomerId } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { PAYMENT_METHODS, type Checkout, type Movie, type PaymentMethod } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[0-9+\s()-]{8,20}$/, "Enter a valid phone number"),
  paymentMethod: z.enum(["mpesa", "card", "other"]),
});

type CheckoutValues = z.infer<typeof schema>;

export function CheckoutView({ movieId }: { movieId: string }) {
  const { user, ready } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [abandoned, setAbandoned] = useState(false);
  const [abandonError, setAbandonError] = useState("");

  useEffect(() => {
    if (!ready) return;
    let active = true;
    getMovie(movieId)
      .then(async (found) => {
        if (!active) return;
        if (!found) {
          setStatus("missing");
          return;
        }
        const next = await getOrStartCheckout(found, {
          customerId: getActiveCustomerId(),
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
        });
        if (!active) return;
        setMovie(found);
        setCheckout(next);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [movieId, ready, user]);

  if (!ready || status === "loading") return <LoadingState label="Preparing your checkout..." />;
  if (status === "error") {
    return (
      <PageStatus
        title="Something went wrong. Please try again."
        action={<Button onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }
  if (status === "missing" || !movie || !checkout) {
    return (
      <PageStatus
        title="This story is not in the demo library."
        action={<BrowseLink />}
      />
    );
  }

  if (checkout.status === "paid") {
    return (
      <PageStatus
        title="You already own this movie."
        body={`${movie.title} is ready to watch.`}
        action={
          <Button asChild>
            <Link to={`/watch/${movie.id}`}>Start Watching</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Container className="py-8 md:py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">Checkout</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{movie.title}</h1>
      {abandoned ? (
        <div role="status" className="mt-6 border border-accent/40 bg-surface p-4">
          <p className="font-medium">Checkout abandoned.</p>
          <p className="mt-2 text-sm text-muted">
            CHECKOUT_ABANDONED is stored locally and ready for Django to forward to n8n.
          </p>
          <Link to="/demo" className="mt-3 inline-block text-sm underline decoration-accent/80 underline-offset-4">
            View the journey
          </Link>
        </div>
      ) : null}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 lg:order-1">
          <CheckoutForm movie={movie} checkout={checkout} />
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <OrderSummary movie={movie} />
          <div className="mt-4 border border-dashed border-border p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Demo tools</p>
            <p className="mt-2 text-sm text-muted">
              Leave checkout without waiting. This records the event n8n will listen for.
            </p>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              disabled={abandoned}
              onClick={() => {
                setAbandonError("");
                abandonCheckout(checkout.id)
                  .then((next) => {
                    setCheckout(next);
                    setAbandoned(true);
                  })
                  .catch(() => setAbandonError("Could not record abandonment. Please try again."));
              }}
            >
              Simulate Checkout Abandonment
            </Button>
            {abandonError ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {abandonError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Container>
  );
}

function CheckoutForm({ movie, checkout }: { movie: Movie; checkout: Checkout }) {
  const navigate = useNavigate();
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: checkout.name,
      email: checkout.email,
      phone: checkout.phone,
      paymentMethod: checkout.paymentMethod,
    },
  });
  const method = form.watch("paymentMethod");

  async function onSubmit(values: CheckoutValues) {
    try {
      await saveCheckoutDetails(checkout.id, values);
      navigate(`/payment/${movie.id}`);
    } catch {
      form.setError("root", { message: "Something went wrong. Please try again." });
    }
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl">Customer information</legend>
        <Field id="name" label="Name" error={form.formState.errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
        </Field>
        <Field id="email" label="Email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} {...form.register("email")} />
        </Field>
        <Field id="phone" label="Phone" error={form.formState.errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={Boolean(form.formState.errors.phone)} {...form.register("phone")} />
        </Field>
      </fieldset>
      <fieldset>
        <legend className="font-serif text-2xl">Payment options</legend>
        <div className="mt-4 grid gap-3">
          {PAYMENT_METHODS.map((option) => (
            <label
              key={option.id}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-3 border px-4",
                method === option.id ? "border-accent bg-elevated" : "border-border bg-surface",
              )}
            >
              <input
                type="radio"
                value={option.id}
                className="size-4 accent-[#F5B942]"
                {...form.register("paymentMethod")}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {form.formState.errors.root ? (
        <p role="alert" className="text-sm text-danger">
          {form.formState.errors.root.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Continuing..." : "Continue to Payment"}
      </Button>
      <p className="text-xs text-muted">
        Selected method: {labelFor(method)}
      </p>
    </form>
  );
}

function labelFor(method: PaymentMethod) {
  return PAYMENT_METHODS.find((option) => option.id === method)?.label ?? method;
}
