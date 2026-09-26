"use client";

import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoadingState } from "@/components/layout/page-status";
import { MovieArtwork } from "@/components/movies/movie-artwork";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { movies } from "@/lib/data/movies";
import { AuthError } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { safeNext } from "@/lib/return-to";

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.string().trim().email("Enter a valid email").max(120),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\s()-]{8,20}$/, "Enter a valid phone number"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof schema>;

export function SignupForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, ready, signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const backdrop = movies[0];
  const form = useForm<SignupValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignupValues) {
    try {
      await signup({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      navigate(next);
    } catch (error) {
      form.setError("root", {
        message: error instanceof AuthError ? error.message : "Could not create your account.",
      });
    }
  }

  if (!ready) return <LoadingState label="Checking your session..." />;
  if (user) return <Navigate to={next} replace />;

  return (
    <AuthSplit
      movie={backdrop}
      title="Create your YakWetu account"
      footer={
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link
            to={`/login?next=${encodeURIComponent(next)}`}
            className="text-foreground underline decoration-accent/80 underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Field id="name" label="Name" error={form.formState.errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(form.formState.errors.name)}
            aria-describedby={form.formState.errors.name ? "name-error" : undefined}
            {...form.register("name")}
          />
        </Field>
        <Field id="email" label="Email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={form.formState.errors.email ? "email-error" : undefined}
            {...form.register("email")}
          />
        </Field>
        <Field id="phone" label="Phone" error={form.formState.errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={Boolean(form.formState.errors.phone)}
            aria-describedby={form.formState.errors.phone ? "phone-error" : undefined}
            {...form.register("phone")}
          />
        </Field>
        <Field id="password" label="Password" error={form.formState.errors.password?.message}>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            aria-describedby={
              form.formState.errors.password ? "password-hint password-error" : "password-hint"
            }
            {...form.register("password")}
          />
          <p id="password-hint" className="text-sm text-muted">
            At least 8 characters.
          </p>
        </Field>
        <Field
          id="confirmPassword"
          label="Confirm password"
          error={form.formState.errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            aria-describedby={
              form.formState.errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            {...form.register("confirmPassword")}
          />
        </Field>
        <button
          type="button"
          className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? "Hide passwords" : "Show passwords"}
        </button>
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-danger">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
          aria-busy={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthSplit>
  );
}

export function AuthSplit({
  movie,
  title,
  footer,
  children,
}: {
  movie: (typeof movies)[number];
  title: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-2">
      <div className="relative hidden md:block">
        <MovieArtwork movie={movie} variant="backdrop" showTitle={false} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-background" />
        <div className="absolute right-10 bottom-12 left-10 max-w-md">
          <p className="font-serif text-4xl">African stories. Your next movie.</p>
        </div>
      </div>
      <div className="flex items-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-serif text-4xl">{title}</h1>
          <div className="mt-8">{children}</div>
          <div className="mt-6">{footer}</div>
        </div>
      </div>
    </div>
  );
}
