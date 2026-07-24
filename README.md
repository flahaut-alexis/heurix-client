# @heurix-site/client

Client officiel TypeScript/JavaScript pour l'API Heurix — recherche, Browse & Discovery, indexation, synonymes. Zéro dépendance runtime (utilise `fetch` natif), types TypeScript complets.

## Installation

```bash
npm install @heurix-site/client
```

## Démarrage rapide

```ts
import { HeurixClient } from "@heurix-site/client";

const client = new HeurixClient({
  apiKey: "hx_votre_cle_api",
  catalog: "monsite", // catalogue par défaut, peut être surchargé par appel
});

const results = await client.search("vis m8 inox");
console.log(results.hits);
```

Trois lignes suffisent pour un premier appel — pas de configuration supplémentaire, pas de dépendance à installer à côté.

## Recherche

```ts
const results = await client.search("perceuse makita", {
  limit: 20,
  filters: ["DIAM_M8"], // annotations exactes, ET logique entre elles
  facets: ["MAT"],       // décompte de valeurs par groupe
});

results.hits.forEach((hit) => {
  console.log(hit.product.name, hit.score, hit.in_stock);
});
```

## Browse & Discovery (pages de catégorie, sans recherche)

```ts
const browsed = await client.browse("perceuses-visseuses", {
  sort: "price_asc", // stock | recent | alphabetical | price_asc | price_desc | margin | popular
  filters: { brand: "Makita" }, // filtres sur des attributs libres
});

browsed.hits.forEach((hit) => console.log(hit.product.name, hit.product.price));
```

## Indexation

```ts
await client.indexItems(
  [
    { id: "sku-1", name: "Perceuse GDX 18V-285 BOSCH", price: 139.9, stock: 8, categories: ["perceuses"] },
    { id: "sku-2", name: "Perceuse HP457D MAKITA", price: 99.9, stock: 3, categories: ["perceuses"] },
  ],
  { rulepack: "outillage" } // optionnel
);
```

Jusqu'à 5000 produits par appel. Champs libres acceptés — `id` est le seul champ obligatoire, tout le reste dépend de votre catalogue.

## Synonymes

```ts
await client.setSynonyms([
  ["vis", "boulon", "screw"],
  ["cheville", "molly", "placo"],
]);

const current = await client.getSynonyms();
```

Effet immédiat, aucune réindexation nécessaire.

## Gestion des erreurs

Toute erreur renvoyée par l'API (catalogue introuvable, quota dépassé, accès Browse non inclus dans le plan…) lève une `HeurixApiError`, avec `status` et `message` reflétant directement la réponse de l'API :

```ts
import { HeurixClient, HeurixApiError } from "@heurix-site/client";

try {
  await client.search("test", { catalog: "catalogue-inexistant" });
} catch (err) {
  if (err instanceof HeurixApiError) {
    console.error(`Erreur Heurix (${err.status}) :`, err.message);
  } else {
    throw err; // erreur réseau ou autre, pas une erreur API
  }
}
```

## Plusieurs catalogues avec un seul client

Le catalogue passé à la construction sert de valeur par défaut — surchargez-le au cas par cas sans recréer de client :

```ts
const client = new HeurixClient({ apiKey: "hx_...", catalog: "boutique-fr" });

await client.search("pull rouge");                                   // boutique-fr
await client.search("red sweater", { catalog: "boutique-en" });      // boutique-en, pour cet appel seulement
```

## Exemple React

Un composant de recherche minimal, avec anti-rebond, dans [`examples/react-search-box.tsx`](./examples/react-search-box.tsx).

## Référence API complète

Chaque méthode correspond à un endpoint documenté sur [heurix.fr/docs.html](https://heurix.fr/docs.html) :

| Méthode | Endpoint |
|---|---|
| `client.search(query, options?)` | `POST /v1/index/{catalog}/search` |
| `client.browse(category, options?)` | `GET /v1/browse/{catalog}/{category}` |
| `client.indexItems(items, options?)` | `POST /v1/index/{catalog}/items` |
| `client.getSynonyms(catalog?)` | `GET /v1/index/{catalog}/synonyms` |
| `client.setSynonyms(groups, catalog?)` | `PUT /v1/index/{catalog}/synonyms` |

Types TypeScript complets exportés pour chaque forme de réponse (`SearchResult`, `BrowseResult`, `IndexResult`, `SynonymsResult`) et d'options (`SearchOptions`, `BrowseOptions`, `IndexOptions`) — l'autocomplétion de votre éditeur couvre l'intégralité de l'API sans avoir besoin de consulter la doc en parallèle.

## Compatibilité

- Node.js 18+ (nécessite `fetch` natif) ou tout navigateur moderne
- ESM et CommonJS tous les deux fournis — `import` ou `require` fonctionnent
- Zéro dépendance runtime

## Licence

MIT
