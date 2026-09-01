/**
 * Domain types for the Servora customer web frontend.
 *
 * These mirror the entities and enums documented in servora-docs
 * (booking states, roles, trust signals) so the mock data layer here
 * maps cleanly onto the real API Gateway / domain services later.
 * Nothing here talks to a network — see src/lib/api for that boundary.
 */

export type UserRole =
  | "CUSTOMER"
  | "BUSINESS_OWNER"
  | "BUSINESS_STAFF"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "SUPPORT";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REJECTED"
  | "REFUNDED";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** lucide-react icon name, resolved via the CategoryIcon component */
  icon: string;
  providerCount: number;
}

export type VerificationSignal =
  | "EMAIL_VERIFIED"
  | "PHONE_VERIFIED"
  | "IDENTITY_LINKED"
  | "BUSINESS_VERIFIED"
  | "BACKGROUND_CHECKED";

export interface Provider {
  id: string;
  name: string;
  tagline: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  priceMin: number;
  priceMax: number;
  nextAvailable: string;
  verificationSignals: VerificationSignal[];
  completedBookings: number;
  featured?: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  authorInitial: string;
  serviceCategory: string;
  rating: number;
  quote: string;
  date: string;
}

export type AIRole = "user" | "assistant";

export interface AIMessage {
  id: string;
  role: AIRole;
  text: string;
  /** optional structured provider match shown after this message */
  match?: {
    providerName: string;
    rating: number;
    distanceKm: number;
    availability: string;
    priceRange: string;
  };
}

export interface SearchSuggestion {
  id: string;
  label: string;
  categorySlug: string;
}

export interface TrustSignalCopy {
  id: VerificationSignal;
  label: string;
  description: string;
}
