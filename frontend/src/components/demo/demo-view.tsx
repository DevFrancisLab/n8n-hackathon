"use client";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Mail, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clearEvents, listEvents } from "@/lib/api/events";
import { simulateCheckoutAbandonment } from "@/lib/api/checkout";
import { trackEvent } from "@/lib/events";
import { formatTime, wait } from "@/lib/utils";
import type { AppEvent, EventName, TrackEventInput } from "@/types";

const PIPELINE = [
  "Customer action",
  "Event",
  "Automation",
  "AI",
  "Personalization",
  "Re-engagement",
  "Checkout",
];

const STORY = [
  { icon: "check", label: "Signed Up", note: "Frontend event" },
  { icon: "check", label: "Viewed Movie", note: "The Last Harvest" },
  { icon: "check", label: "Added to Cart", note: "Frontend event" },
  { icon: "check", label: "Started Checkout", note: "Frontend event" },
  { icon: "warn", label: "Checkout Abandoned", note: "Frontend event" },
  { icon: "ai", label: "AI Intent Detected", note: "n8n preview" },
  { icon: "ai", label: "Movie Recommendation Generated", note: "n8n preview" },
  { icon: "mail", label: "Personalized Email Sent", note: "n8n preview" },
  { icon: "link", label: "Continue Checkout", note: "Working link", href: "/checkout/the-last-harvest" },
  { icon: "check", label: "Purchase Recovered", note: "After payment" },
] as const;

const FLOW = ["Browsed", "High Intent", "Checkout", "Abandoned", "AI Re-engagement", "Recovered"];

type Preview = { id: string; at: string; label: string; detail: string };

export function DemoView() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [busy, setBusy] = useState<"sample" | "abandon" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = () => setEvents(listEvents());
    refresh();
    setReady(true);
    window.addEventListener("yakwetu:event", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("yakwetu:event", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const stats = {
    highIntent: uniqueCustomers(events, ["ADD_TO_CART", "CHECKOUT_STARTED", "CONCIERGE_REQUESTED"]),
    abandoned: events.filter((event) => event.event === "CHECKOUT_ABANDONED").length,
    failed: events.filter((event) => event.event === "PAYMENT_FAILED").length,
    recovered: events.filter(
      (event) => event.event === "PURCHASE_COMPLETED" && event.metadata?.recovered === true,
    ).length,
  };

  const log = [
    ...events.map((event) => ({ kind: "event" as const, at: event.timestamp, event })),
    ...previews.map((preview) => ({ kind: "preview" as const, at: preview.at, preview })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  async function playSample() {
    setBusy("sample");
    setMessage("");
    setPreviews([]);
    const customerId = "demo_brian";
    const steps: TrackEventInput[] = [
      { event: "SIGNUP_COMPLETED", customerId, metadata: { display_name: "Brian" } },
      { event: "MOVIE_VIEWED", customerId, movieId: "the-last-harvest", metadata: { display_name: "Brian" } },
      { event: "ADD_TO_CART", customerId, movieId: "the-last-harvest", metadata: { display_name: "Brian" } },
      {
        event: "CHECKOUT_STARTED",
        customerId,
        movieId: "the-last-harvest",
        checkoutId: "chk_demo_brian",
        metadata: { display_name: "Brian" },
      },
      {
        event: "CHECKOUT_ABANDONED",
        customerId,
        movieId: "the-last-harvest",
        checkoutId: "chk_demo_brian",
        metadata: { display_name: "Brian" },
      },
    ];
    for (const step of steps) {
      trackEvent(step);
      await wait(650);
    }
    setPreviews(automationPreview());
    setBusy(null);
    setMessage("Sample journey recorded locally. Automation rows are a preview only.");
  }

  async function abandon() {
    setBusy("abandon");
    setMessage("");
    try {
      const checkout = await simulateCheckoutAbandonment("the-last-harvest");
      setPreviews(automationPreview());
      setMessage(`Checkout ${checkout.id} abandoned for ${checkout.name}. The event is in the local log.`);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Container className="space-y-14 py-10 md:py-14">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Demo</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-6xl">Customer journey</h1>
        <p className="mt-4 text-muted">
          YakWetu is a movie shop with a conversion engine underneath. Frontend events are stored in this browser
          until Django is connected. Steps marked n8n preview are not sent anywhere — no email leaves this page.
        </p>
      </header>

      <ol className="flex gap-2 overflow-x-auto pb-2" aria-label="Conversion engine">
        {PIPELINE.map((step, index) => (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <span className="border border-border bg-surface px-3 py-2 text-sm">{step}</span>
            {index < PIPELINE.length - 1 ? (
              <span aria-hidden="true" className="text-muted">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button size="lg" disabled={busy !== null} onClick={() => void playSample()}>
          {busy === "sample" ? "Playing sample..." : "Play sample journey"}
        </Button>
        <Button size="lg" variant="secondary" disabled={busy !== null} onClick={() => void abandon()}>
          {busy === "abandon" ? "Recording..." : "Simulate Checkout Abandonment"}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={() => {
            clearEvents();
            setPreviews([]);
            setMessage("Local events cleared.");
          }}
        >
          Clear local events
        </Button>
      </div>
      {message ? (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      ) : null}

      <section>
        <h2 className="font-serif text-3xl">Customer Journey</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Sample path for Brian and The Last Harvest. Continue Checkout opens the real checkout page.
        </p>
        <ol className="mt-6 max-w-xl border-l border-border pl-6">
          {STORY.map((step) => (
            <li key={step.label} className="relative pb-6">
              <span className="absolute -left-[2.15rem] grid h-7 w-7 place-items-center rounded-full border border-border bg-background">
                <StepIcon name={step.icon} />
              </span>
              {"href" in step ? (
                <Link to={step.href} className="font-medium underline decoration-accent/80 underline-offset-4">
                  {step.label}
                </Link>
              ) : (
                <p className="font-medium">{step.label}</p>
              )}
              <p className="text-sm text-muted">{step.note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Conversion Journey</h2>
        <ol className="mt-6 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center" aria-label="Conversion journey">
          {FLOW.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="border border-border bg-elevated px-3 py-2 text-sm">{step}</span>
              {index < FLOW.length - 1 ? (
                <>
                  <span className="text-muted md:hidden" aria-hidden="true">
                    ↓
                  </span>
                  <span className="hidden text-muted md:inline" aria-hidden="true">
                    →
                  </span>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Demo data</h2>
        <p className="mt-2 text-sm text-muted">Counted from local events in this browser. Not production statistics.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="High Intent Users" value={stats.highIntent} detail="Cart, checkout, or concierge." />
          <Stat label="Abandoned Checkouts" value={stats.abandoned} detail="CHECKOUT_ABANDONED events." />
          <Stat label="Payment Failures" value={stats.failed} detail="PAYMENT_FAILED events." />
          <Stat label="Recovered Checkouts" value={stats.recovered} detail="Purchases after an abandonment." />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Live Events</h2>
        <p className="mt-2 text-sm text-muted">
          Demo/local events until Django POST /api/events is connected. Preview rows are not customer events.
        </p>
        {!ready ? <p className="mt-6 text-muted">Reading local events...</p> : null}
        {ready && log.length === 0 ? (
          <p className="mt-6 text-muted">No events yet. Browse a movie or play the sample journey.</p>
        ) : null}
        {log.length > 0 ? (
          <ol className="mt-4 divide-y divide-border border-y border-border">
            {log.slice(0, 40).map((row) =>
              row.kind === "event" ? (
                <li key={row.event.id} className="grid gap-1 py-3 sm:grid-cols-[6rem_1fr] sm:gap-4">
                  <time className="text-xs text-muted tabular-nums" dateTime={row.event.timestamp}>
                    {formatTime(row.event.timestamp)}
                  </time>
                  <div>
                    <p className="text-sm font-medium">{row.event.event}</p>
                    <p className="text-sm text-muted">{describeEvent(row.event)}</p>
                  </div>
                </li>
              ) : (
                <li key={row.preview.id} className="grid gap-1 py-3 sm:grid-cols-[6rem_1fr] sm:gap-4">
                  <time className="text-xs text-muted tabular-nums" dateTime={row.preview.at}>
                    {formatTime(row.preview.at)}
                  </time>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {row.preview.label}
                      <Badge>n8n preview</Badge>
                    </p>
                    <p className="text-sm text-muted">{row.preview.detail}</p>
                  </div>
                </li>
              ),
            )}
          </ol>
        ) : null}
      </section>
    </Container>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm text-muted">{label}</h3>
        <Badge>Demo data</Badge>
      </div>
      <p className="mt-4 font-serif text-4xl">{value}</p>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </article>
  );
}

function StepIcon({ name }: { name: "check" | "warn" | "ai" | "mail" | "link" }) {
  if (name === "warn") return <AlertTriangle className="size-3.5 text-accent" aria-hidden="true" />;
  if (name === "ai") return <Sparkles className="size-3.5 text-accent" aria-hidden="true" />;
  if (name === "mail") return <Mail className="size-3.5 text-muted" aria-hidden="true" />;
  if (name === "link") return <span className="text-xs text-accent">→</span>;
  return <Check className="size-3.5 text-success" aria-hidden="true" />;
}

function uniqueCustomers(events: AppEvent[], names: EventName[]) {
  return new Set(
    events
      .filter((event) => names.includes(event.event) && event.customer_id)
      .map((event) => event.customer_id),
  ).size;
}

function describeEvent(event: AppEvent) {
  const name = String(event.metadata?.display_name || "Guest");
  const title = event.metadata?.movie_title;
  if (title) return `${name} → Movie: ${title}`;
  if (event.metadata?.query) return `${name} searched “${event.metadata.query}”`;
  if (event.metadata?.prompt) return `${name}: ${event.metadata.prompt}`;
  return name;
}

function automationPreview(): Preview[] {
  const now = Date.now();
  return [
    {
      id: "ai",
      at: new Date(now).toISOString(),
      label: "AI_INTENT_ANALYSIS",
      detail: "High intent to buy. Checkout left unfinished.",
    },
    {
      id: "rec",
      at: new Date(now + 1000).toISOString(),
      label: "RECOMMENDATION_GENERATED",
      detail: "The Last Harvest — Kenyan thriller with a strong story.",
    },
    {
      id: "email",
      at: new Date(now + 2000).toISOString(),
      label: "EMAIL_SENT",
      detail: "Preview only. Resend is not called from the browser.",
    },
  ];
}
