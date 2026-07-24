import type {
  HeurixClientOptions,
  Product,
  SearchResult,
  SearchOptions,
  BrowseResult,
  BrowseOptions,
  IndexResult,
  IndexOptions,
  SynonymsResult,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.heurix.fr";

/** Erreur renvoyée par l'API Heurix (statut HTTP >= 400) — `status` et
 * `message` reflètent directement la réponse de l'API, pas une erreur
 * réseau générique. */
export class HeurixApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HeurixApiError";
    this.status = status;
  }
}

/**
 * Client officiel pour l'API Heurix.
 *
 * ```ts
 * const client = new HeurixClient({ apiKey: "hx_...", catalog: "monsite" });
 * const results = await client.search("vis m8 inox");
 * ```
 */
export class HeurixClient {
  private readonly apiKey: string;
  private readonly defaultCatalog: string | undefined;
  private readonly baseUrl: string;

  constructor(options: HeurixClientOptions) {
    if (!options.apiKey) {
      throw new Error("HeurixClient : 'apiKey' est requis.");
    }
    // Chantier securite C1 : une cle serveur (hx_) utilisee dans un
    // navigateur est lisible par tous les visiteurs et donne acces a
    // l'indexation, au merchandising et au portail de facturation.
    // Seule une cle publique (hxp_) a une portee limitee a la lecture.
    if (
      typeof window !== "undefined" &&
      options.apiKey.startsWith("hx_") &&
      !options.apiKey.startsWith("hxp_")
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        "[Heurix] Vous utilisez une clé SERVEUR (hx_) côté navigateur. " +
          "Elle est lisible par vos visiteurs et donne accès à votre facturation. " +
          "Générez une clé publique (hxp_) depuis votre console Heurix."
      );
    }
    this.apiKey = options.apiKey;
    this.defaultCatalog = options.catalog;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private resolveCatalog(catalog?: string): string {
    const resolved = catalog ?? this.defaultCatalog;
    if (!resolved) {
      throw new Error(
        "HeurixClient : aucun catalogue précisé — passez { catalog } à la construction du client, ou en option de cet appel."
      );
    }
    return resolved;
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; params?: Record<string, string> } = {}
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (opts.params) {
      const qs = new URLSearchParams(opts.params).toString();
      if (qs) url += `?${qs}`;
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const data = (await res.json()) as { detail?: string };
        if (data.detail) detail = data.detail;
      } catch {
        // corps non-JSON : on garde res.statusText
      }
      throw new HeurixApiError(res.status, detail);
    }

    return res.json() as Promise<T>;
  }

  /** Recherche par mot-clé, tolérante aux fautes de frappe. */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const catalog = this.resolveCatalog(options.catalog);
    return this.request<SearchResult>("POST", `/v1/index/${encodeURIComponent(catalog)}/search`, {
      body: {
        q: query,
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
        filters: options.filters ?? [],
        facets: options.facets ?? [],
      },
    });
  }

  /** Liste les produits d'une catégorie sans recherche textuelle, avec tri configurable. */
  async browse(category: string, options: BrowseOptions = {}): Promise<BrowseResult> {
    const catalog = this.resolveCatalog(options.catalog);
    const params: Record<string, string> = { sort: options.sort ?? "stock" };
    if (options.limit !== undefined) params.limit = String(options.limit);
    if (options.offset !== undefined) params.offset = String(options.offset);
    if (options.filters) {
      const pairs = Object.entries(options.filters).map(([field, value]) => `${field}:${value}`);
      if (pairs.length) params.filters = pairs.join(",");
    }
    if (options.facets?.length) params.facets = options.facets.join(",");

    return this.request<BrowseResult>(
      "GET",
      `/v1/browse/${encodeURIComponent(catalog)}/${encodeURIComponent(category)}`,
      { params }
    );
  }

  /** Indexe (ajoute ou met à jour) jusqu'à 5000 produits en un appel. */
  async indexItems(items: Product[], options: IndexOptions = {}): Promise<IndexResult> {
    const catalog = this.resolveCatalog(options.catalog);
    return this.request<IndexResult>("POST", `/v1/index/${encodeURIComponent(catalog)}/items`, {
      body: { items, rulepack: options.rulepack },
    });
  }

  /** Récupère les groupes de synonymes actuels du catalogue. */
  async getSynonyms(catalog?: string): Promise<SynonymsResult> {
    const c = this.resolveCatalog(catalog);
    return this.request<SynonymsResult>("GET", `/v1/index/${encodeURIComponent(c)}/synonyms`);
  }

  /** Remplace intégralement les groupes de synonymes du catalogue — effet immédiat, sans réindexation. */
  async setSynonyms(groups: string[][], catalog?: string): Promise<SynonymsResult> {
    const c = this.resolveCatalog(catalog);
    return this.request<SynonymsResult>("PUT", `/v1/index/${encodeURIComponent(c)}/synonyms`, {
      body: { groups },
    });
  }
}

export type {
  HeurixClientOptions,
  Product,
  SearchResult,
  SearchHit,
  SearchOptions,
  SuggestedCategory,
  BrowseResult,
  BrowseHit,
  BrowseOptions,
  BrowseSort,
  IndexResult,
  IndexCatalogStats,
  IndexOptions,
  SynonymsResult,
} from "./types.js";
