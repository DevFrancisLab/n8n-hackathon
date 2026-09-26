"use client";

import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Container } from "@/components/layout/container";
import { MovieArtwork } from "@/components/movies/movie-artwork";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { CONCIERGE_CHOICES, requestConciergeRecommendation } from "@/lib/api/concierge";
import { trackEvent } from "@/lib/events";
import { cn, formatPrice } from "@/lib/utils";
import type { Recommendation } from "@/types";

const schema = z.object({
  prompt: z.string().trim().min(2, "Tell YakWetu what you want to watch."),
});

type ConciergeValues = z.infer<typeof schema>;

type Turn = {
  id: string;
  prompt: string;
  recommendation?: Recommendation;
  error?: string;
};

export function ConciergeView() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [activeChoice, setActiveChoice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const form = useForm<ConciergeValues>({
    resolver: zodResolver(schema),
    defaultValues: { prompt: "" },
  });

  async function ask(prompt: string, choiceId?: string) {
    setActiveChoice(choiceId ?? null);
    setPending(true);
    trackEvent({
      event: "CONCIERGE_REQUESTED",
      metadata: { prompt },
    });
    const id = `${Date.now()}`;
    try {
      const recommendation = await requestConciergeRecommendation(prompt);
      trackEvent({
        event: "RECOMMENDATION_VIEWED",
        movieId: recommendation.movie.id,
        metadata: { list: "concierge", prompt },
      });
      setTurns((current) => [...current, { id, prompt, recommendation }]);
      form.reset({ prompt: "" });
    } catch (error) {
      setTurns((current) => [
        ...current,
        {
          id,
          prompt,
          error: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">AI Concierge</p>
        <h1 className="mt-3 font-serif text-4xl sm:text-6xl">What are you in the mood for?</h1>
        <p className="mt-4 max-w-xl text-muted">Tell YakWetu what kind of story you&apos;re looking for.</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {CONCIERGE_CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={activeChoice === choice.id}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm",
                activeChoice === choice.id
                  ? "border-accent text-accent"
                  : "border-border text-foreground hover:border-accent/50",
              )}
              disabled={pending}
              onClick={() => {
                form.setValue("prompt", choice.prompt);
                void ask(choice.prompt, choice.id);
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit((values) => ask(values.prompt))}
          noValidate
        >
          <Field id="prompt" label="Your request" error={form.formState.errors.prompt?.message}>
            <Textarea
              id="prompt"
              placeholder="Tell me what you want to watch..."
              aria-invalid={Boolean(form.formState.errors.prompt)}
              aria-describedby={form.formState.errors.prompt ? "prompt-error" : undefined}
              {...form.register("prompt")}
            />
          </Field>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Finding a story..." : "Find a story"}
          </Button>
        </form>

        <div className="mt-10 space-y-8">
          {turns.map((turn) => (
            <article key={turn.id} className="space-y-4">
              <p className="text-sm text-muted">You</p>
              <p className="text-lg">{turn.prompt}</p>
              {turn.error ? (
                <p role="alert" className="text-danger">
                  {turn.error}
                </p>
              ) : null}
              {turn.recommendation ? (
                <div className="border border-border bg-surface p-4 sm:p-5">
                  <p className="text-sm text-muted">You might like:</p>
                  <div className="mt-4 flex flex-col gap-5 sm:flex-row">
                    <div className="aspect-[2/3] w-36 shrink-0 overflow-hidden">
                      <MovieArtwork movie={turn.recommendation.movie} />
                    </div>
                    <div>
                      <h2 className="font-serif text-3xl">{turn.recommendation.movie.title}</h2>
                      <p className="mt-3 text-sm uppercase tracking-[0.14em] text-muted">Why</p>
                      <p className="mt-2 max-w-md">{turn.recommendation.reason}</p>
                      <p className="mt-4 text-accent">{formatPrice(turn.recommendation.movie.price)}</p>
                      <Button asChild className="mt-5">
                        <Link
                          to={`/movies/${turn.recommendation.movie.id}`}
                          onClick={() =>
                            trackEvent({
                              event: "RECOMMENDATION_CLICKED",
                              movieId: turn.recommendation?.movie.id,
                              metadata: { list: "concierge" },
                            })
                          }
                        >
                          View Movie
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </Container>
  );
}
