// Shapes returned by our /api functions (already normalized server-side).

export interface SearchResult {
  id: number;
  type: string;
  title: string;
  year: string | null;
  country: string | null;
  catno: string | null;
  thumb: string | null;
  coverImage: string | null;
  formats: string[];
  formatText: string | null;
  labels: string[];
  genres: string[];
  styles: string[];
  barcodes: string[];
  masterId: number | null;
  discogsUrl: string | null;
}

export interface SearchResponse {
  barcode: string;
  count: number;
  results: SearchResult[];
}

export interface ReleaseFormat {
  name: string;
  qty: string;
  text: string | null;
  descriptions: string[];
}

export interface ReleaseImage {
  uri: string;
  uri150: string;
  type: string;
}

export interface Track {
  position: string;
  title: string;
  duration: string;
}

export interface ReleaseLabel {
  name: string;
  catno: string;
}

export interface Company {
  role: string; // Discogs entity_type_name, e.g. "Pressed By"
  name: string; // company name, often includes the plant town
}

export interface Release {
  id: number;
  title: string;
  artists: string[];
  year: string | null;
  released: string | null;
  country: string | null;
  genres: string[];
  styles: string[];
  labels: ReleaseLabel[];
  companies: Company[];
  formats: ReleaseFormat[];
  images: ReleaseImage[];
  tracklist: Track[];
  notes: string | null;
  lowestPrice: number | null;
  numForSale: number | null;
  community: { have: number | null; want: number | null } | null;
  discogsUrl: string | null;
}

export interface PriceSuggestion {
  currency: string;
  value: number;
}

// Keyed by Discogs condition label, e.g. "Near Mint (NM or M-)".
export type PriceSuggestions = Record<string, PriceSuggestion>;

export interface MarketplaceStats {
  numForSale: number;
  lowestPrice: { value: number; currency: string } | null;
  blockedFromSale: boolean;
}

export interface ReleaseResponse {
  release: Release;
  currency: string;
  priceSuggestions: PriceSuggestions | null;
  marketplace: MarketplaceStats | null;
}

// The eight Discogs media-condition grades, best to worst.
export const CONDITIONS = [
  "Mint (M)",
  "Near Mint (NM or M-)",
  "Very Good Plus (VG+)",
  "Very Good (VG)",
  "Good Plus (G+)",
  "Good (G)",
  "Fair (F)",
  "Poor (P)",
] as const;

export type Condition = (typeof CONDITIONS)[number];
