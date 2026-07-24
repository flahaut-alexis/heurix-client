/**
 * Types pour @heurix/client.
 *
 * `Product` est volontairement large : Heurix accepte des champs libres
 * à l'indexation (voir la doc), donc un objet produit renvoyé par
 * l'API peut contenir n'importe quel champ additionnel que vous avez
 * fourni (marque, couleur, prix...), pas seulement `id`/`name`.
 */

export interface HeurixClientOptions {
  /**
   * Votre clé API Heurix.
   *
   * - `hx_...` — **clé serveur** : accès complet (indexation, merchandising,
   *   facturation). À n'utiliser que côté serveur, jamais dans du code
   *   exécuté par un navigateur.
   * - `hxp_...` — **clé publique** : lecture seule (recherche, browse,
   *   événements de conversion). La seule à pouvoir être exposée côté
   *   navigateur sans risque.
   */
  apiKey: string;
  /** Catalogue par défaut, utilisé si non précisé dans un appel individuel. */
  catalog?: string;
  /** URL de base de l'API. Défaut : https://api.heurix.fr */
  baseUrl?: string;
}

export interface Product {
  id: string;
  name?: string;
  stock?: number | boolean | string;
  price?: number;
  margin?: number;
  categories?: string[];
  category?: string;
  ref?: string;
  description?: string;
  [key: string]: unknown;
}

export interface SearchHit {
  product: Product;
  score: number;
  in_stock: boolean;
  matched: string[];
}

export interface SuggestedCategory {
  category: string;
  products: number;
}

export interface SearchResult {
  query: string;
  tokens: string[];
  total: number;
  offset: number;
  limit: number;
  hits: SearchHit[];
  fallback: boolean;
  facets?: Record<string, Record<string, number>>;
  /** Piste de catégorie Browse correspondant à la requête, si trouvée — une suggestion, ne modifie jamais `hits` ni son ordre. */
  suggested_category?: SuggestedCategory;
}

export interface SearchOptions {
  /** Remplace le catalogue par défaut pour cet appel précis. */
  catalog?: string;
  limit?: number;
  offset?: number;
  /** Filtres exacts sur des annotations connues (ET logique entre eux). */
  filters?: string[];
  /** Groupes d'annotations pour lesquels renvoyer un décompte par valeur. */
  facets?: string[];
}

export interface BrowseHit {
  product: Product;
  in_stock: boolean;
  pinned: boolean;
  boosted: boolean;
  buried: boolean;
}

export interface BrowseResult {
  category: string;
  sort: string;
  total: number;
  offset: number;
  limit: number;
  hits: BrowseHit[];
  facets?: Record<string, Record<string, number>>;
}

export type BrowseSort =
  | "stock"
  | "recent"
  | "alphabetical"
  | "price_asc"
  | "price_desc"
  | "margin"
  | "popular";

export interface BrowseOptions {
  catalog?: string;
  sort?: BrowseSort;
  limit?: number;
  offset?: number;
  /** Filtres sur des attributs libres (ex. { brand: "Makita" }). */
  filters?: Record<string, string>;
  /** Champs pour lesquels renvoyer un décompte de valeurs. */
  facets?: string[];
}

export interface IndexCatalogStats {
  catalog: string;
  products: number;
  terms: number;
  annotations: number;
  rulepack: string | null;
  synonym_groups: number;
}

export interface IndexResult {
  indexed: number;
  catalog: IndexCatalogStats;
}

export interface IndexOptions {
  catalog?: string;
  /** Pack de règles à appliquer (ex. "outillage"). Optionnel. */
  rulepack?: string;
}

export interface SynonymsResult {
  groups: string[][];
}
