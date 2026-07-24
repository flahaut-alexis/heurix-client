import { useState, useEffect } from "react";
import { HeurixClient, type SearchHit } from "heurix-client";

// À sortir de votre composant en pratique — une seule instance pour toute
// l'application, pas une par rendu.
const client = new HeurixClient({
  apiKey: import.meta.env.VITE_HEURIX_API_KEY,
  catalog: "monsite",
});

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    setLoading(true);
    // Anti-rebond simple : évite un appel réseau à chaque frappe.
    const timeout = setTimeout(() => {
      client
        .search(query, { limit: 8 })
        .then((result) => setHits(result.hits))
        .catch((err) => console.error("Recherche Heurix :", err))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="heurix-search-box">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un produit…"
        aria-label="Recherche produit"
      />
      {loading && <p>Recherche…</p>}
      <ul>
        {hits.map((hit) => (
          <li key={hit.product.id}>
            {hit.product.name}
            {!hit.in_stock && <span className="out-of-stock"> — rupture de stock</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
