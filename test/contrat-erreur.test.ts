// Premiers tests de ce depot (balayage du 23 octobre 2026 : zero test, zero
// CI dans toute son histoire). Visent src/, pas dist/ : c'est le contrat qui
// se relit et se modifie, il echoue sans attendre un build, et il n'ajoute
// aucune etape a la CI.
//
// CE QUE CHAQUE TEMOIN GARDE, ET CE QUE SON TEMOIN NEGATIF EMPECHE DE
// REVENIR. `request()` (src/index.ts:76-108) leve HeurixApiError sur tout
// statut >= 400 et rend le corps JSON sinon. Le defaut que ces temoins
// existent pour empecher : une reponse LEGITIME (un 200, un detail en
// simple chaine, un fetch qui reussit) emprunterait le chemin d'un refus --
// exactement la famille de defaut que l'exemple react-search-box.tsx
// portait avant sa correction du 23 octobre (3e3cd4b), ou tout .catch
// rendait un refus indiscernable d'un rayon vide.
import { describe, it, expect, vi, afterEach } from "vitest";
import { HeurixClient, HeurixApiError } from "../src/index.js";

function reponseJson(status: number, ok: boolean, corps: unknown): Response {
  return { ok, status, statusText: "Erreur", json: async () => corps } as unknown as Response;
}

const client = new HeurixClient({ apiKey: "hxp_test", catalog: "test" });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HeurixClient — contrat d'erreur de request()", () => {
  it("un statut >= 400 lève HeurixApiError, avec le detail et le statut", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reponseJson(403, false, { detail: "Origine non autorisée" }))));
    await expect(client.search("vis")).rejects.toMatchObject({
      name: "HeurixApiError", status: 403, message: "Origine non autorisée",
    });
  });

  it("TÉMOIN NÉGATIF : un 200 ne lève JAMAIS HeurixApiError, même avec zéro résultat", async () => {
    // Le défaut exact que l'exemple portait, transposé à la librairie : sans
    // ce témoin, « tout refus lève » pourrait masquer un chemin où un succès
    // vide lève aussi — indiscernable d'un vrai refus pour l'appelant.
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reponseJson(200, true, { hits: [], total: 0 }))));
    await expect(client.search("inexistant")).resolves.toEqual({ hits: [], total: 0 });
  });

  it("un corps d'erreur non-JSON retombe sur statusText, sans faire planter l'appel", async () => {
    const reponse = {
      ok: false, status: 500, statusText: "Internal Server Error",
      json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reponse)));
    await expect(client.search("vis")).rejects.toMatchObject({ status: 500, message: "Internal Server Error" });
  });

  it("TÉMOIN NÉGATIF : un corps d'erreur JSON avec detail est bien utilisé, pas écrasé par le repli", async () => {
    // Sans ce témoin, le repli sur statusText du cas précédent pourrait
    // s'appliquer à TOUT, y compris un detail parfaitement lisible.
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reponseJson(400, false, { detail: "q est requis" }))));
    await expect(client.search("")).rejects.toMatchObject({ status: 400, message: "q est requis" });
  });

  it("un detail en liste (erreur de validation) ne fait pas planter l'appel", async () => {
    const detailListe = [{ loc: ["body", "limit"], msg: "ensure this value is <= 100" }];
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reponseJson(422, false, { detail: detailListe }))));
    const erreur = await client.search("vis").catch((e) => e);
    expect(erreur).toBeInstanceOf(HeurixApiError);
    expect(erreur.status).toBe(422);
  });

  it("TÉMOIN NÉGATIF : un detail en simple chaîne est toujours utilisé tel quel", async () => {
    // Sans ce témoin, une manipulation ajoutée pour tolérer une liste
    // pourrait altérer le cas, bien plus fréquent, d'une chaîne simple.
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reponseJson(422, false, { detail: "limit doit être <= 100" }))));
    await expect(client.search("vis")).rejects.toMatchObject({ status: 422, message: "limit doit être <= 100" });
  });

  it("une panne réseau (fetch rejette) se propage, sans se transformer en réponse vide", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("fetch failed"))));
    await expect(client.search("vis")).rejects.toThrow("fetch failed");
  });

  it("TÉMOIN NÉGATIF : un fetch qui réussit normalement résout avec les données, pas une erreur", async () => {
    // Sans ce témoin, une gestion ajoutée pour la panne réseau pourrait
    // transformer un succès ordinaire en rejet.
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reponseJson(200, true, { hits: [{ product: { id: "1" } }], total: 1 }))));
    await expect(client.search("vis")).resolves.toEqual({ hits: [{ product: { id: "1" } }], total: 1 });
  });
});
