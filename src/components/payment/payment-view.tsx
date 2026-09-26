"use client";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Container } from "@/components/layout/container";
import { BrowseLink, LoadingState, PageStatus } from "@/components/layout/page-status";
import { Button } from "@/components/ui/button";
import {
  completePayment,
  failPayment,
  getOrStartCheckout,
  loadLatestCheckout,
} from "@/lib/api/checkout";
import { getMovie } from "@/lib/api/movies";
import { useAuth } from "@/lib/auth-context";
import { getActiveCustomerId } from "@/lib/storage";
import { cn, formatPrice, wait } from "@/lib/utils";
import { PAYMENT_METHODS, type Checkout, type Movie, type PaymentMethod } from "@/types";

export function PaymentView({ movieId }: { movieId: string }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const statusParam = params.get("status");
  const [movie, setMovie] = useState<Movie | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [error, setError] = useState("");

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
        const customerId = getActiveCustomerId();
        const existing = await loadLatestCheckout(found.id, customerId);
        const next =
          existing ??
          (await getOrStartCheckout(found, {
            customerId,
            name: user?.name ?? "Guest",
            email: user?.email ?? "guest@yakwetu.demo",
            phone: user?.phone ?? "0700 000 000",
          }));
        if (!active) return;
        setMovie(found);
        setCheckout(next);
        setMethod(next.paymentMethod === "other" ? "mpesa" : next.paymentMethod);
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
  if (!movie || !checkout) {
    return <PageStatus title="This story is not in the demo library." action={<BrowseLink />} />;
  }

  const succeeded = statusParam === "success" || checkout.status === "paid";
  const failed = statusParam === "failed" && !succeeded;

  async function simulate(outcome: "success" | "failed") {
    if (!checkout) return;
    setError("");
    setProcessing(true);
    try {
      await wait(900);
      if (outcome === "success") {
        await completePayment(checkout.id, method);
        navigate(`/payment/${movieId}?status=success`, { replace: true });
      } else {
        await failPayment(checkout.id, method);
        navigate(`/payment/${movieId}?status=failed`, { replace: true });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Container className="py-8 md:py-12">
      {processing ? (
        <p role="status" className="mb-6 text-muted">
          Processing payment...
        </p>
      ) : null}

      {succeeded ? (
        <section className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.18em] text-success">Demo payment</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Payment successful</h1>
          <p className="mt-4 text-muted">
            {movie.title} is ready. This payment was simulated in the browser. No M-Pesa or card charge was made.
          </p>
          <p className="mt-2 text-sm text-muted">{formatPrice(movie.price)} · {labelFor(method)}</p>
          <Button asChild size="lg" className="mt-8">
            <Link to={`/watch/${movie.id}`}>Start Watching</Link>
          </Button>
        </section>
      ) : null}

      {failed ? (
        <section className="max-w-xl">
          <h1 className="font-serif text-4xl sm:text-5xl">We couldn&apos;t complete your payment.</h1>
          <p className="mt-4 text-muted">Check your payment details or try another payment method.</p>
          <p className="mt-3 text-foreground/90">
            Your payment didn&apos;t go through. You can retry with M-Pesa or choose another payment method.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate(`/payment/${movie.id}`, { replace: true })}>
              Try Again
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to={`/checkout/${movie.id}`}>Choose Another Payment Method</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {!succeeded && !failed ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="order-2 lg:order-1">
            <p className="text-xs uppercase tracking-[0.18em] text-accent">Demo payment</p>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Complete your payment</h1>
            <p className="mt-4 max-w-xl text-muted">
              Simulated payment for the hackathon. These controls do not charge M-Pesa or a card.
            </p>
            <fieldset className="mt-8">
              <legend className="text-sm text-muted">Payment method</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.filter((option) => option.id !== "other").map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-3 border px-4",
                      method === option.id ? "border-accent bg-elevated" : "border-border bg-surface",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={option.id}
                      checked={method === option.id}
                      onChange={() => setMethod(option.id)}
                      className="size-4 accent-[#F5B942]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {checkout.paymentMethod === "other" ? (
                <p className="mt-3 text-sm text-muted">Checkout selected Other. Pick M-Pesa or Card to continue the demo.</p>
              ) : null}
            </fieldset>
            <div className="mt-8 border border-dashed border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Demo controls</p>
              <div className="mt-4 flex flex-col gap-3">
                <Button size="lg" disabled={processing} onClick={() => void simulate("success")}>
                  Simulate Successful Payment
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  disabled={processing}
                  onClick={() => void simulate("failed")}
                >
                  Simulate Payment Failure
                </Button>
              </div>
            </div>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </section>
          <div className="order-1 lg:order-2">
            <OrderSummary movie={movie} />
          </div>
        </div>
      ) : null}
    </Container>
  );
}

function labelFor(method: PaymentMethod) {
  return PAYMENT_METHODS.find((option) => option.id === method)?.label ?? method;
}
