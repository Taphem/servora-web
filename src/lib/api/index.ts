import { categories } from "@/data/categories";
import { providers, featuredProviders } from "@/data/providers";
import { reviews } from "@/data/reviews";
import type { Category, Provider, Review } from "@/types/domain";

/**
 * Mock service layer standing in for the future API Gateway
 * (`/api/v1/...`, see servora-docs/09-api/api-conventions.md). Every
 * export here is the frontend's only way to reach "backend" data —
 * swapping the body for a real `fetch` call is the entire migration
 * path once the gateway exists. Nothing outside this folder should
 * import from src/data directly.
 */

function resolveAfter<T>(value: T, delayMs = 0): Promise<T> {
  if (delayMs === 0) return Promise.resolve(value);
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

/** GET /api/v1/categories */
export async function getCategories(): Promise<Category[]> {
  return resolveAfter(categories);
}

/** GET /api/v1/businesses?featured=true */
export async function getFeaturedProviders(): Promise<Provider[]> {
  return resolveAfter(featuredProviders);
}

/** GET /api/v1/businesses */
export async function getProviders(): Promise<Provider[]> {
  return resolveAfter(providers);
}

/** GET /api/v1/reviews */
export async function getReviews(): Promise<Review[]> {
  return resolveAfter(reviews);
}
