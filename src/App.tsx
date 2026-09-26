import { Component, useEffect, type ReactNode } from "react";
import { Route, Routes, useLocation, useParams } from "react-router-dom";
import { AccountView } from "@/components/account/account-view";
import { LoginForm } from "@/components/auth/login-form";
import { RequireAuth } from "@/components/auth/require-auth";
import { SignupForm } from "@/components/auth/signup-form";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { ConciergeView } from "@/components/concierge/concierge-view";
import { DemoView } from "@/components/demo/demo-view";
import { MovieDetail } from "@/components/movies/movie-detail";
import { MoviesBrowser } from "@/components/movies/movies-browser";
import { PaymentView } from "@/components/payment/payment-view";
import { Button } from "@/components/ui/button";
import { WatchView } from "@/components/watch/watch-view";
import { useRemoteApi } from "@/lib/api/client";
import { HomePage } from "@/pages/home-page";
import { NotFoundPage } from "@/pages/not-found";

function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MovieRoute() {
  const { id = "" } = useParams();
  return <MovieDetail id={id} />;
}

function CheckoutRoute() {
  const { id = "" } = useParams();
  return <CheckoutView movieId={id} />;
}

function PaymentRoute() {
  const { id = "" } = useParams();
  return <PaymentView movieId={id} />;
}

function WatchRoute() {
  const { id = "" } = useParams();
  return <WatchView movieId={id} />;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center px-4 py-20">
          <h1 className="font-serif text-4xl">Something went wrong. Please try again.</h1>
          <Button className="mt-8 w-fit" onClick={() => this.setState({ failed: false })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <AppErrorBoundary>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <DocumentTitle title="YakWetu — African stories. Your next movie." />
              <HomePage />
            </>
          }
        />
        <Route
          path="/movies"
          element={
            <>
              <DocumentTitle title="Explore Movies · YakWetu" />
              <MoviesBrowser />
            </>
          }
        />
        <Route path="/movies/:id" element={<MovieRoute />} />
        <Route
          path="/checkout/:id"
          element={
            <>
              <DocumentTitle title="Checkout · YakWetu" />
              <RequireAuth when={useRemoteApi()}>
                <CheckoutRoute />
              </RequireAuth>
            </>
          }
        />
        <Route
          path="/payment/:id"
          element={
            <>
              <DocumentTitle title="Payment · YakWetu" />
              <RequireAuth when={useRemoteApi()}>
                <PaymentRoute />
              </RequireAuth>
            </>
          }
        />
        <Route
          path="/watch/:id"
          element={
            <RequireAuth when={useRemoteApi()}>
              <WatchRoute />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <DocumentTitle title="Sign in · YakWetu" />
              <LoginForm />
            </>
          }
        />
        <Route
          path="/signup"
          element={
            <>
              <DocumentTitle title="Create account · YakWetu" />
              <SignupForm />
            </>
          }
        />
        <Route
          path="/account"
          element={
            <>
              <DocumentTitle title="Account · YakWetu" />
              <RequireAuth>
                <AccountView />
              </RequireAuth>
            </>
          }
        />
        <Route
          path="/concierge"
          element={
            <>
              <DocumentTitle title="AI Concierge · YakWetu" />
              <ConciergeView />
            </>
          }
        />
        <Route
          path="/demo"
          element={
            <>
              <DocumentTitle title="Conversion engine · YakWetu" />
              <DemoView />
            </>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppErrorBoundary>
  );
}
