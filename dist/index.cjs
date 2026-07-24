"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HeurixApiError: () => HeurixApiError,
  HeurixClient: () => HeurixClient
});
module.exports = __toCommonJS(index_exports);
var DEFAULT_BASE_URL = "https://api.heurix.fr";
var HeurixApiError = class extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HeurixApiError";
    this.status = status;
  }
};
var HeurixClient = class {
  constructor(options) {
    if (!options.apiKey) {
      throw new Error("HeurixClient : 'apiKey' est requis.");
    }
    this.apiKey = options.apiKey;
    this.defaultCatalog = options.catalog;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }
  resolveCatalog(catalog) {
    const resolved = catalog ?? this.defaultCatalog;
    if (!resolved) {
      throw new Error(
        "HeurixClient : aucun catalogue pr\xE9cis\xE9 \u2014 passez { catalog } \xE0 la construction du client, ou en option de cet appel."
      );
    }
    return resolved;
  }
  async request(method, path, opts = {}) {
    let url = `${this.baseUrl}${path}`;
    if (opts.params) {
      const qs = new URLSearchParams(opts.params).toString();
      if (qs) url += `?${qs}`;
    }
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...opts.body !== void 0 ? { "Content-Type": "application/json" } : {}
      },
      body: opts.body !== void 0 ? JSON.stringify(opts.body) : void 0
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const data = await res.json();
        if (data.detail) detail = data.detail;
      } catch {
      }
      throw new HeurixApiError(res.status, detail);
    }
    return res.json();
  }
  /** Recherche par mot-clé, tolérante aux fautes de frappe. */
  async search(query, options = {}) {
    const catalog = this.resolveCatalog(options.catalog);
    return this.request("POST", `/v1/index/${encodeURIComponent(catalog)}/search`, {
      body: {
        q: query,
        limit: options.limit ?? 10,
        offset: options.offset ?? 0,
        filters: options.filters ?? [],
        facets: options.facets ?? []
      }
    });
  }
  /** Liste les produits d'une catégorie sans recherche textuelle, avec tri configurable. */
  async browse(category, options = {}) {
    const catalog = this.resolveCatalog(options.catalog);
    const params = { sort: options.sort ?? "stock" };
    if (options.limit !== void 0) params.limit = String(options.limit);
    if (options.offset !== void 0) params.offset = String(options.offset);
    if (options.filters) {
      const pairs = Object.entries(options.filters).map(([field, value]) => `${field}:${value}`);
      if (pairs.length) params.filters = pairs.join(",");
    }
    if (options.facets?.length) params.facets = options.facets.join(",");
    return this.request(
      "GET",
      `/v1/browse/${encodeURIComponent(catalog)}/${encodeURIComponent(category)}`,
      { params }
    );
  }
  /** Indexe (ajoute ou met à jour) jusqu'à 5000 produits en un appel. */
  async indexItems(items, options = {}) {
    const catalog = this.resolveCatalog(options.catalog);
    return this.request("POST", `/v1/index/${encodeURIComponent(catalog)}/items`, {
      body: { items, rulepack: options.rulepack }
    });
  }
  /** Récupère les groupes de synonymes actuels du catalogue. */
  async getSynonyms(catalog) {
    const c = this.resolveCatalog(catalog);
    return this.request("GET", `/v1/index/${encodeURIComponent(c)}/synonyms`);
  }
  /** Remplace intégralement les groupes de synonymes du catalogue — effet immédiat, sans réindexation. */
  async setSynonyms(groups, catalog) {
    const c = this.resolveCatalog(catalog);
    return this.request("PUT", `/v1/index/${encodeURIComponent(c)}/synonyms`, {
      body: { groups }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HeurixApiError,
  HeurixClient
});
