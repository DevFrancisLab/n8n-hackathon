import { movies } from "@/lib/data/movies";
import { trackEvent } from "@/lib/events";
import { listEvents } from "@/lib/api/events";
import {
  getActiveCustomerId,
  getSessionUser,
  readJson,
  STORAGE_KEYS,
  writeJson,
} from "@/lib/storage";
import { createId } from "@/lib/utils";
import type { Checkout, CustomerDraft, Movie, PaymentMethod, Purchase } from "@/types";

/**
 * Checkout state for the demo.
 * Today this is localStorage.
 * Later:
 *   POST /api/checkouts
 *   PATCH /api/checkouts/:id
 *   POST /api/checkouts/:id/abandon
 *   POST /api/checkouts/:id/pay
 * Events still go through trackEvent -> Django /api/events -> n8n.
 * Do not emit a second copy from the checkout endpoint.
 */

function readCheckouts() {
  return readJson<Checkout[]>(STORAGE_KEYS.checkouts, []);
}

function writeCheckouts(checkouts: Checkout[]) {
  writeJson(STORAGE_KEYS.checkouts, checkouts);
}

export function getPurchases() {
  return readJson<Purchase[]>(STORAGE_KEYS.purchases, []);
}

function writePurchases(purchases: Purchase[]) {
  writeJson(STORAGE_KEYS.purchases, purchases);
}

export function getCartIds() {
  return readJson<string[]>(STORAGE_KEYS.cart, []);
}

export function addMovieToCart(movieId: string) {
  const cart = getCartIds();
  if (!cart.includes(movieId)) {
    writeJson(STORAGE_KEYS.cart, [...cart, movieId]);
  }
  trackEvent({ event: "ADD_TO_CART", movieId });
}

function movieTitle(movieId: string) {
  return movies.find((movie) => movie.id === movieId)?.title ?? movieId;
}

export function getLatestCheckout(movieId: string, customerId: string) {
  const matches = readCheckouts().filter(
    (checkout) => checkout.movieId === movieId && checkout.customerId === customerId,
  );
  return matches.at(-1) ?? null;
}

function saveCheckout(next: Checkout) {
  const all = readCheckouts();
  const index = all.findIndex((checkout) => checkout.id === next.id);
  if (index === -1) all.push(next);
  else all[index] = next;
  writeCheckouts(all);
  return next;
}

function createCheckout(movie: Movie, customer: CustomerDraft): Checkout {
  const now = new Date().toISOString();
  const checkout: Checkout = {
    id: createId("chk"),
    movieId: movie.id,
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    paymentMethod: "mpesa",
    status: "started",
    amount: movie.price,
    createdAt: now,
    updatedAt: now,
  };
  saveCheckout(checkout);
  trackEvent({
    event: "CHECKOUT_STARTED",
    customerId: customer.customerId,
    movieId: movie.id,
    checkoutId: checkout.id,
    metadata: { amount: movie.price, movie_title: movie.title, display_name: customer.name },
  });
  return checkout;
}

export async function getOrStartCheckout(movie: Movie, customer: CustomerDraft) {
  const existing = getLatestCheckout(movie.id, customer.customerId);
  if (existing && existing.status !== "abandoned") {
    return saveCheckout({
      ...existing,
      name: customer.name || existing.name,
      email: customer.email || existing.email,
      phone: customer.phone || existing.phone,
      updatedAt: new Date().toISOString(),
    });
  }
  if (existing?.status === "abandoned") {
    return saveCheckout({
      ...existing,
      status: "started",
      name: customer.name || existing.name,
      email: customer.email || existing.email,
      phone: customer.phone || existing.phone,
      updatedAt: new Date().toISOString(),
    });
  }
  return createCheckout(movie, customer);
}

export async function saveCheckoutDetails(
  checkoutId: string,
  details: { name: string; email: string; phone: string; paymentMethod: PaymentMethod },
) {
  const current = readCheckouts().find((checkout) => checkout.id === checkoutId);
  if (!current) throw new Error("Checkout not found.");
  return saveCheckout({
    ...current,
    ...details,
    status: current.status === "paid" ? "paid" : "payment_pending",
    updatedAt: new Date().toISOString(),
  });
}

export async function abandonCheckout(checkoutId: string) {
  const current = readCheckouts().find((checkout) => checkout.id === checkoutId);
  if (!current) throw new Error("Checkout not found.");
  if (current.status === "paid") throw new Error("This checkout is already paid.");
  if (current.status === "abandoned") return current;

  const next = saveCheckout({
    ...current,
    status: "abandoned",
    updatedAt: new Date().toISOString(),
  });
  trackEvent({
    event: "CHECKOUT_ABANDONED",
    customerId: current.customerId,
    movieId: current.movieId,
    checkoutId: current.id,
    metadata: {
      movie_title: movieTitle(current.movieId),
      display_name: current.name,
      amount: current.amount,
    },
  });
  return next;
}

export async function simulateCheckoutAbandonment(movieId = "the-last-harvest") {
  const movie = movies.find((item) => item.id === movieId) ?? movies[0];
  if (!movie) throw new Error("No demo movie is available.");
  const session = getSessionUser();
  const customer: CustomerDraft = {
    customerId: getActiveCustomerId(),
    name: session?.name ?? "Brian",
    email: session?.email ?? "brian@yakwetu.demo",
    phone: session?.phone ?? "0700 000 000",
  };
  const existing = getLatestCheckout(movie.id, customer.customerId);
  const checkout =
    existing && existing.status !== "paid" && existing.status !== "abandoned"
      ? existing
      : createCheckout(movie, customer);
  return abandonCheckout(checkout.id);
}

function wasAbandoned(checkout: Checkout) {
  return listEvents().some(
    (event) =>
      event.event === "CHECKOUT_ABANDONED" &&
      event.movie_id === checkout.movieId &&
      event.customer_id === checkout.customerId,
  );
}

export async function completePayment(checkoutId: string, method: PaymentMethod) {
  const current = readCheckouts().find((checkout) => checkout.id === checkoutId);
  if (!current) throw new Error("Checkout not found.");

  const existing = getPurchases().find((purchase) => purchase.checkoutId === checkoutId);
  if (current.status === "paid" && existing) return existing;

  const recovered = wasAbandoned(current);
  const paid = saveCheckout({
    ...current,
    paymentMethod: method,
    status: "paid",
    updatedAt: new Date().toISOString(),
  });

  trackEvent({
    event: "PAYMENT_COMPLETED",
    customerId: paid.customerId,
    movieId: paid.movieId,
    checkoutId: paid.id,
    metadata: {
      payment_method: method,
      amount: paid.amount,
      movie_title: movieTitle(paid.movieId),
      display_name: paid.name,
    },
  });
  trackEvent({
    event: "PURCHASE_COMPLETED",
    customerId: paid.customerId,
    movieId: paid.movieId,
    checkoutId: paid.id,
    metadata: {
      payment_method: method,
      amount: paid.amount,
      recovered,
      movie_title: movieTitle(paid.movieId),
      display_name: paid.name,
    },
  });

  const purchase: Purchase = {
    id: createId("pur"),
    movieId: paid.movieId,
    customerId: paid.customerId,
    checkoutId: paid.id,
    amount: paid.amount,
    paymentMethod: method,
    purchasedAt: new Date().toISOString(),
  };
  writePurchases([...getPurchases(), purchase]);
  return purchase;
}

export async function failPayment(checkoutId: string, method: PaymentMethod) {
  const current = readCheckouts().find((checkout) => checkout.id === checkoutId);
  if (!current) throw new Error("Checkout not found.");
  const next = saveCheckout({
    ...current,
    paymentMethod: method,
    status: "failed",
    updatedAt: new Date().toISOString(),
  });
  trackEvent({
    event: "PAYMENT_FAILED",
    customerId: next.customerId,
    movieId: next.movieId,
    checkoutId: next.id,
    metadata: {
      payment_method: method,
      failure_reason: "Demo decline. No charge was made.",
      checkout_id: next.id,
      customer_id: next.customerId,
      movie_id: next.movieId,
      movie_title: movieTitle(next.movieId),
      display_name: next.name,
    },
  });
  return next;
}
