/**
 * Types pour @heurix/client.
 *
 * `Product` est volontairement large : Heurix accepte des champs libres
 * à l'indexation (voir la doc), donc un objet produit renvoyé par
 * l'API peut contenir n'importe quel champ additionnel que vous avez
 * fourni (marque, couleur, prix...), pas seulement `id`/`name`.
 */
interface HeurixClientOptions {
    /** Votre clé API Heurix (hx_...). */
    apiKey: string;
    /** Catalogue par défaut, utilisé si non précisé dans un appel individuel. */
    catalog?: string;
    /** URL de base de l'API. Défaut : https://api.heurix.fr */
    baseUrl?: string;
}
interface Product {
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
interface SearchHit {
    product: Product;
    score: number;
    in_stock: boolean;
    matched: string[];
}
interface SearchResult {
    query: string;
    tokens: string[];
    total: number;
    offset: number;
    limit: number;
    hits: SearchHit[];
    fallback: boolean;
    facets?: Record<string, Record<string, number>>;
}
interface SearchOptions {
    /** Remplace le catalogue par défaut pour cet appel précis. */
    catalog?: string;
    limit?: number;
    offset?: number;
    /** Filtres exacts sur des annotations connues (ET logique entre eux). */
    filters?: string[];
    /** Groupes d'annotations pour lesquels renvoyer un décompte par valeur. */
    facets?: string[];
}
interface BrowseHit {
    product: Product;
    in_stock: boolean;
    pinned: boolean;
    boosted: boolean;
    buried: boolean;
}
interface BrowseResult {
    category: string;
    sort: string;
    total: number;
    offset: number;
    limit: number;
    hits: BrowseHit[];
    facets?: Record<string, Record<string, number>>;
}
type BrowseSort = "stock" | "recent" | "alphabetical" | "price_asc" | "price_desc" | "margin" | "popular";
interface BrowseOptions {
    catalog?: string;
    sort?: BrowseSort;
    limit?: number;
    offset?: number;
    /** Filtres sur des attributs libres (ex. { brand: "Makita" }). */
    filters?: Record<string, string>;
    /** Champs pour lesquels renvoyer un décompte de valeurs. */
    facets?: string[];
}
interface IndexCatalogStats {
    catalog: string;
    products: number;
    terms: number;
    annotations: number;
    rulepack: string | null;
    synonym_groups: number;
}
interface IndexResult {
    indexed: number;
    catalog: IndexCatalogStats;
}
interface IndexOptions {
    catalog?: string;
    /** Pack de règles à appliquer (ex. "outillage"). Optionnel. */
    rulepack?: string;
}
interface SynonymsResult {
    groups: string[][];
}

/** Erreur renvoyée par l'API Heurix (statut HTTP >= 400) — `status` et
 * `message` reflètent directement la réponse de l'API, pas une erreur
 * réseau générique. */
declare class HeurixApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
/**
 * Client officiel pour l'API Heurix.
 *
 * ```ts
 * const client = new HeurixClient({ apiKey: "hx_...", catalog: "monsite" });
 * const results = await client.search("vis m8 inox");
 * ```
 */
declare class HeurixClient {
    private readonly apiKey;
    private readonly defaultCatalog;
    private readonly baseUrl;
    constructor(options: HeurixClientOptions);
    private resolveCatalog;
    private request;
    /** Recherche par mot-clé, tolérante aux fautes de frappe. */
    search(query: string, options?: SearchOptions): Promise<SearchResult>;
    /** Liste les produits d'une catégorie sans recherche textuelle, avec tri configurable. */
    browse(category: string, options?: BrowseOptions): Promise<BrowseResult>;
    /** Indexe (ajoute ou met à jour) jusqu'à 5000 produits en un appel. */
    indexItems(items: Product[], options?: IndexOptions): Promise<IndexResult>;
    /** Récupère les groupes de synonymes actuels du catalogue. */
    getSynonyms(catalog?: string): Promise<SynonymsResult>;
    /** Remplace intégralement les groupes de synonymes du catalogue — effet immédiat, sans réindexation. */
    setSynonyms(groups: string[][], catalog?: string): Promise<SynonymsResult>;
}

export { type BrowseHit, type BrowseOptions, type BrowseResult, type BrowseSort, HeurixApiError, HeurixClient, type HeurixClientOptions, type IndexCatalogStats, type IndexOptions, type IndexResult, type Product, type SearchHit, type SearchOptions, type SearchResult, type SynonymsResult };
