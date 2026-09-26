export const GENRES = [
  "Drama",
  "Comedy",
  "Thriller",
  "Romance",
  "Documentary",
  "Family",
  "Action",
] as const;

export type Genre = (typeof GENRES)[number];

export const EVENT_NAMES = [
  "SIGNUP_COMPLETED",
  "MOVIE_VIEWED",
  "SEARCH_PERFORMED",
  "ADD_TO_CART",
  "CHECKOUT_STARTED",
  "CHECKOUT_ABANDONED",
  "PAYMENT_FAILED",
  "PAYMENT_COMPLETED",
  "PURCHASE_COMPLETED",
  "WATCH_COMPLETED",
  "CONCIERGE_REQUESTED",
  "RECOMMENDATION_VIEWED",
  "RECOMMENDATION_CLICKED",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export const PAYMENT_METHODS = [
  { id: "mpesa", label: "M-Pesa" },
  { id: "card", label: "Card" },
  { id: "other", label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export type CheckoutStatus =
  | "started"
  | "abandoned"
  | "payment_pending"
  | "paid"
  | "failed";

export interface MoviePalette {
  from: string;
  to: string;
  accent: string;
}

export interface Movie {
  id: string;
  title: string;
  overview: string;
  genre: Genre;
  country: string;
  language: string;
  year: number;
  duration: number;
  price: number;
  poster: string;
  backdrop: string;
  palette: MoviePalette;
  motif: 0 | 1 | 2 | 3;
  tags: string[];
  featured?: boolean;
  trendingRank?: number;
  /** Fictional placeholder. Never present these records as real releases. */
  demo: true;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface StoredUser extends SessionUser {
  password: string;
}

export interface CustomerDraft {
  customerId: string;
  name: string;
  email: string;
  phone: string;
}

export interface Checkout {
  id: string;
  movieId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  paymentMethod: PaymentMethod;
  status: CheckoutStatus;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  movieId: string;
  customerId: string;
  checkoutId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  purchasedAt: string;
}

export type EventMetadata = Record<string, string | number | boolean | null>;

export interface AppEvent {
  id: string;
  event: EventName;
  customer_id?: string;
  movie_id?: string;
  checkout_id?: string;
  timestamp: string;
  metadata?: EventMetadata;
}

export interface TrackEventInput {
  event: EventName;
  customerId?: string;
  movieId?: string;
  checkoutId?: string;
  metadata?: EventMetadata;
}

export interface Recommendation {
  movie: Movie;
  reason: string;
}

export interface MovieFilters {
  q: string;
  genre: string;
  country: string;
  language: string;
  year: string;
  sort: "featured" | "newest" | "popular";
}

export interface SignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
