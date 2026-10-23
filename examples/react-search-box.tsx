import { useState, useEffect } from "react";
import { HeurixClient, HeurixApiError, type SearchHit } from "heurix-client";

// RIEN NE GARDE CE FICHIER : ce dépôt n'a aucune suite de tests, aucune CI
// (balayage du 23 octobre 2026). Les trois états et le garde de fraîcheur
// ci-dessous n'ont jamais été vérifiés que par lecture humaine. Un garde
// minimal — un test simulant une requête réussie suivie d'un échec (pas de
// résultats périmés affichés), un autre simulant une réponse tardive après
// une réponse plus récente déjà résolue (la plus récente gagne) — coûterait
// environ 30-40 lignes de test, PLUS l'amorçage complet de l'outillage
// (vitest ou jest, @testing-library/react, premier script `test` du
// `package.json`) : ce serait le premier test du dépôt, pas un ajout à une
// suite existante. C'est l'item (2) du balayage du 23 octobre, à trancher
// séparément — pas corrigé dans ce lot.

// À sortir de votre composant en pratique — une seule instance pour toute
// l'application, pas une par rendu.
const client = new HeurixClient({
  apiKey: import.meta.env.VITE_HEURIX_API_KEY,
  catalog: "monsite",
});

type Reponse =
  | { etat: "resultats"; hits: SearchHit[] }
  | { etat: "aucun_resultat" }
  | { etat: "echec"; status: number; message: string };

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [reponse, setReponse] = useState<Reponse>({ etat: "aucun_resultat" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setReponse({ etat: "aucun_resultat" });
      return;
    }
    let courante = true; // ignore une reponse qui arrive apres une frappe plus recente
    setLoading(true);
    // Anti-rebond simple : évite un appel réseau à chaque frappe.
    const timeout = setTimeout(() => {
      client
        .search(query, { limit: 8 })
        .then((result) => {
          if (!courante) return;
          setReponse(
            result.hits.length ? { etat: "resultats", hits: result.hits } : { etat: "aucun_resultat" }
          );
        })
        .catch((err) => {
          if (!courante) return;
          setReponse(
            err instanceof HeurixApiError
              ? { etat: "echec", status: err.status, message: err.message }
              : { etat: "echec", status: 0, message: "Erreur réseau" }
          );
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      courante = false;
      clearTimeout(timeout);
    };
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
      {reponse.etat === "echec" && (
        <p role="alert" className="heurix-error">
          Recherche indisponible ({reponse.status}) : {reponse.message}
        </p>
      )}
      {reponse.etat === "aucun_resultat" && query.trim() && !loading && <p>Aucun résultat.</p>}
      {reponse.etat === "resultats" && (
        <ul>
          {reponse.hits.map((hit) => (
            <li key={hit.product.id}>
              {hit.product.name}
              {!hit.in_stock && <span className="out-of-stock"> — rupture de stock</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
