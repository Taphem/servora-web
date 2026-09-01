/** Deterministic small hash so a seed string always maps to the same visual. */
export function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Curated duotone gradients, all drawn from the Servora palette, used to
 * generate provider/category imagery without depending on external photo
 * assets. Each entry stays within brand/ink/accent tones so results feel
 * like one cohesive art system rather than random color noise.
 */
export const mediaGradients = [
  "linear-gradient(135deg, #0e4f41 0%, #1c9c82 100%)",
  "linear-gradient(135deg, #12151a 0%, #126352 100%)",
  "linear-gradient(140deg, #0a3a30 0%, #7ecfbb 100%)",
  "linear-gradient(135deg, #1c2128 0%, #3fb69c 100%)",
  "linear-gradient(150deg, #06261f 0%, #cf8c22 120%)",
  "linear-gradient(135deg, #0e4f41 0%, #e2a83b 130%)",
];

export function gradientForSeed(seed: string): string {
  const index = hashSeed(seed) % mediaGradients.length;
  return mediaGradients[index];
}
