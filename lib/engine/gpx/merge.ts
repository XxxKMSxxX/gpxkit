import type { ParsedGPX } from "@we-gold/gpxjs";

/**
 * Placeholder for the "merge multiple GPX files into one" feature (next
 * iteration after the v1 viewer). Typed now so callers can be written
 * against a stable shape before the implementation lands.
 */
export type MergeInput = {
  files: ParsedGPX[];
};

export function mergeTracks(_input: MergeInput): never {
  throw new Error("mergeTracks is not implemented yet (planned for the next iteration).");
}
