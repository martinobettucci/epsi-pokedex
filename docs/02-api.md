# API de génération d’image Pokémon

Cette spécification décrit un point d’entrée HTTP public permettant de générer un Pokémon de manière entièrement prédéterminée. L’API ne reçoit aucun paramètre et retourne une image encodée en **base64**, accompagnée de trois propriétés de métadonnées : un identifiant unique, un nom et une rareté.

---

## Endpoint

* **Méthode** : `GET`
* **URL complète** : `https://epsi.journeesdecouverte.fr:22222/v1/generate`
* **Auth** : optionnelle selon le déploiement (ex. `Authorization: Bearer <token>`)

Aucune donnée n’est transmise en entrée. Chaque appel produit un Pokémon aléatoire selon les modèles internes du service.

---

## Réponse (Response)

* **Code succès** : `200 OK`
* **Content-Type** : `application/json`

| Champ             | Type              | Description                                                                 |
| ----------------- | ----------------- | --------------------------------------------------------------------------- |
| `imageBase64`     | string            | Image encodée en base64, sans préfixe de data URL. Format par défaut : PNG. |
| `metadata`        | object            | Métadonnées associées à la génération.                                      |
| `metadata.id`     | string            | Identifiant unique du Pokémon généré.                                       |
| `metadata.name`   | string            | Nom attribué automatiquement au Pokémon.                                    |
| `metadata.rarity` | string (enum)     | Niveau de rareté parmi `F`, `E`, `D`, `C`, `B`, `A`, `S`, `S+`.             |
| `generatedAt`     | string (ISO 8601) | Horodatage de génération côté serveur.                                      |

**Exemple de réponse**

```json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "metadata": {
    "id": "pkm_01HYQWQ6V1E3P9QM3G7F1QX3B3",
    "name": "Voltadraco",
    "rarity": "A"
  },
  "generatedAt": "2025-11-12T09:15:27Z"
}
```

**Codes d’erreur**

* `401 Unauthorized` : authentification requise.
* `429 Too Many Requests` : quota ou rate limit atteint.
* `500 Internal Server Error` : erreur interne non spécifiée.

**Format d’erreur**

```json
{
  "error": {
    "code": "GENERATION_FAILED",
    "message": "Une erreur est survenue lors de la génération du Pokémon.",
    "timestamp": "2025-11-12T09:15:27Z"
  }
}
```

---

## Exemple d’exécution en JavaScript

```js
async function generatePokemon() {
  const res = await fetch("https://epsi.journeesdecouverte.fr:22222/v1/generate", {
    method: "GET",
    headers: {
      // Ajouter un token d’accès si nécessaire
      // "Authorization": "Bearer <token>"
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const dataUrl = `data:image/png;base64,${data.imageBase64}`;

  return {
    url: dataUrl,
    id: data.metadata.id,
    name: data.metadata.name,
    rarity: data.metadata.rarity,
    generatedAt: data.generatedAt
  };
}

// Exemple d’usage
generatePokemon().then(result => {
  console.log("ID:", result.id);
  console.log("Nom:", result.name);
  console.log("Rareté:", result.rarity);
  const img = document.createElement("img");
  img.src = result.url;
  img.alt = `${result.name} [${result.rarity}]`;
  document.body.appendChild(img);
}).catch(console.error);
```

---

## Notes complémentaires

* Le service génère un Pokémon entièrement aléatoire sans paramètre d’entrée.
* Le champ `rarity` est borné à la liste `F` → `S+`.
* Les images sont encodées en base64, format PNG par défaut.
* Le service peut être soumis à des limites de fréquence pour éviter la surcharge.
