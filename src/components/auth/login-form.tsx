"use client";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthSplit } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthError } from "@/lib/api/auth";
import { movies } from "@/lib/data/movies";
import { useAuth } from "@/lib/auth-context";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const [forgot, setForgot] = useState(false);
  const requested = params.get("next") ?? "/account";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      await login(values);
      navigate(next);
    } catch (error) {
      form.setError("root", {
        message: error instanceof AuthError ? error.message : "Email or password is incorrect.",
      });
    }
  }

  return (
    <AuthSplit
      movie={movies[1] ?? movies[0]}
      title="Sign in"
      footer={
        <p className="text-sm text-muted">
          {"Don't have an account? "}
          <Link to="/signup" className="text-foreground underline decoration-accent/80 underline-offset-4">
            Create one
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
        <Field id="password" label="Password" error={form.formState.errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            aria-describedby={form.formState.errors.password ? "password-error" : undefined}
            {...form.register("password")}
          />
        </Field>
        <button
          type="button"
          className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          aria-expanded={forgot}
          aria-controls="forgot-panel"
          onClick={() => setForgot((value) => !value)}
        >
          Forgot password?
        </button>
        {forgot ? (
          <div id="forgot-panel" className="border border-border bg-elevated p-4 text-sm text-muted">
            Password reset will be available when Django authentication is connected. For this demo,
            sign in with the email and password you used to create your account.
          </div>
        ) : null}
        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-danger">
            {form.formState.errors.root.message}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthSplit>
  );
}
