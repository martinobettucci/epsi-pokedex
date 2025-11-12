# API de génération d’image Minimon

Cette spécification décrit un point d’entrée HTTP public permettant de générer un Minimon de manière entièrement prédéterminée. L’API ne reçoit aucun paramètre et retourne une image encodée en **base64**, accompagnée de trois propriétés de métadonnées : un identifiant unique, un nom et une rareté.

---

## Endpoint

* **Méthode** : `GET`
* **URL complète** : `https://epsi.journeesdecouverte.fr:22222/v1/generate`
* **Auth** : optionnelle selon le déploiement (ex. `Authorization: Bearer <token>`)
* **Base configurable** : l’application cliente lit une variable d’environnement publique `VITE_API_BASE_URL`, qui vaut par défaut `https://epsi.journeesdecouverte.fr:22222/v1`.

Aucune donnée n’est transmise en entrée. Chaque appel produit un Minimon aléatoire selon les modèles internes du service.

---

## Réponse (Response)

* **Code succès** : `200 OK`
* **Content-Type** : `application/json`

| Champ             | Type              | Description                                                                 |
| ----------------- | ----------------- | --------------------------------------------------------------------------- |
| `imageBase64`     | string            | Image encodée en base64, sans préfixe de data URL. Format par défaut : PNG. |
| `metadata`        | object            | Métadonnées associées à la génération.                                      |
| `metadata.id`     | string            | Identifiant unique du Minimon généré.                                       |
| `metadata.name`   | string            | Nom attribué automatiquement au Minimon.                                    |
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
    "message": "Une erreur est survenue lors de la génération du Minimon.",
    "timestamp": "2025-11-12T09:15:27Z"
  }
}
```

---

## Exemple d’exécution en JavaScript

```js
async function generateMinimon() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://epsi.journeesdecouverte.fr:22222/v1';
  const res = await fetch(`${apiBaseUrl}/generate`, {
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
generateMinimon().then(result => {
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

* Le service génère un Minimon entièrement aléatoire sans paramètre d’entrée.
* Le champ `rarity` est borné à la liste `F` → `S+`.
* Les images sont encodées en base64, format PNG par défaut.
* Le service peut être soumis à des limites de fréquence pour éviter la surcharge.

---

# Endpoint de certification de score signé

Ce point d’entrée reçoit un JSON, calcule une représentation canonique, signe la charge utile avec la clé privée du certificat serveur, puis renvoie la signature et les éléments nécessaires à la vérification côté client.

* **Méthode** : `POST`
* **URL complète** : `https://epsi.journeesdecouverte.fr:22222/v1/certify-score`
* **Auth** : optionnelle selon le déploiement (ex. `Authorization: Bearer <token>`)
* **Content-Type (Request)** : `application/json`
* **Content-Type (Response)** : `application/json`
* **Base configurable** : `VITE_API_BASE_URL` par défaut `https://epsi.journeesdecouverte.fr:22222/v1`.

## Corps (Request)

| Champ     | Type            | Requis | Description                                                               |
| --------- | --------------- | :----: | ------------------------------------------------------------------------- |
| `score`   | number | string |    ✅   | Valeur du score à certifier, sera normalisée en nombre côté serveur.      |
| `subject` | string          |    ❌   | Identifiant applicatif pour contextualiser le score.                      |
| `nonce`   | string          |    ❌   | Valeur anti-rejeu fournie par le client. Si absent, le serveur la génère. |

## Réponse (Response)

* **Code succès** : `200 OK`

| Champ                                 | Type              | Description                                                                  |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `signed.payload`                      | object            | Charge utile signée après normalisation et enrichissement serveur.           |
| `signed.payload.id`                   | string            | Identifiant unique d’opération.                                              |
| `signed.payload.score`                | number            | Score normalisé en nombre.                                                   |
| `signed.payload.subject`              | string            | Sujet si fourni en entrée.                                                   |
| `signed.payload.nonce`                | string            | Nonce fourni ou généré.                                                      |
| `signed.payload.issuedAt`             | string (ISO 8601) | Horodatage serveur d’émission.                                               |
| `signed.canonicalB64`                 | string (base64)   | Représentation canonique JSON de `payload` encodée en UTF-8 puis en base64.  |
| `signed.signatureB64`                 | string (base64)   | Signature binaire encodée en base64.                                         |
| `signed.algorithm`                    | string            | Algorithme de signature détecté, par exemple `RS256`, `ES256`, `Ed25519`.    |
| `signed.signatureFormat`              | string            | Format de la signature, `RAW` ou `DER` selon le type de clé.                 |
| `signed.certificateFingerprintSHA256` | string            | Empreinte SHA-256 du certificat X.509 si disponible.                         |
| `signed.certificatePem`               | string            | Certificat X.509 PEM, utile pour extraire la clé publique pour vérification. |
| `generatedAt`                         | string (ISO 8601) | Alias d’horodatage de génération, identique à `payload.issuedAt`.            |

**Notes de canonicalisation**

* Le serveur trie les clés du `payload` et utilise une sérialisation compacte `separators=(",", ":")`.
* `canonicalB64` correspond à `base64(utf8(JSON_canonique(payload)))`.
* La signature est calculée sur les octets canoniques.

## Exemples

**Exemple de requête**

```http
POST /v1/certify-score HTTP/1.1
Host: epsi.journeesdecouverte.fr:22222
Content-Type: application/json
Authorization: Bearer <token>

{
  "score": 87.4,
  "subject": "user_42",
  "nonce": "2a9c3f3f-6d1b-4b6a-9f2f-0db2b6f9b5dd"
}
```

**Exemple de réponse**

```json
{
  "signed": {
    "payload": {
      "id": "mnm_F4Q7H5J2K9M1N3P6",
      "score": 87.4,
      "subject": "user_42",
      "nonce": "2a9c3f3f-6d1b-4b6a-9f2f-0db2b6f9b5dd",
      "issuedAt": "2025-11-12T09:22:31Z"
    },
    "canonicalB64": "eyJpZCI6Im1ubV9G...snip...IsInNjb3JlIjo4Ny40fQ==",
    "signatureB64": "m2zq8Vq6K...snip.../aQ==",
    "algorithm": "RS256",
    "signatureFormat": "RAW",
    "certificateFingerprintSHA256": "3c9b2f4b7d0a8e1e6f3a9c7d2b0fa1c4b6e8d9f0c2a1b3d4e5f6a7b8c9d0e1f2",
    "certificatePem": "-----BEGIN CERTIFICATE-----\nMIIC...snip...\n-----END CERTIFICATE-----\n"
  },
  "generatedAt": "2025-11-12T09:22:31Z"
}
```

## Codes d’erreur

* `400 Bad Request` : JSON invalide, champ manquant, score non numérique.
* `401 Unauthorized` : authentification requise.
* `429 Too Many Requests` : quota atteint.
* `500 Internal Server Error` : échec du chargement de la clé, signature impossible, dépendances cryptographiques manquantes.

**Format d’erreur**

```json
{
  "error": {
    "code": "SIGNING_FAILED",
    "message": "Échec de la signature: <détail>",
    "timestamp": "2025-11-12T09:22:31Z"
  }
}
```

## Intégration rapide côté client

**Appel en JavaScript**

```js
async function certifyScore({ score, subject, nonce }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://epsi.journeesdecouverte.fr:22222/v1';
  const res = await fetch(`${apiBaseUrl}/certify-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer <token>'
    },
    body: JSON.stringify({ score, subject, nonce })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}
```

**Vérification de signature en Node.js (RSA, ECDSA, Ed25519)**

```js
import crypto from 'node:crypto';

function verifySignedScore(signed) {
  const certPem = signed.certificatePem; // ou clé publique connue
  const publicKey = crypto.createPublicKey(certPem);
  const data = Buffer.from(signed.canonicalB64, 'base64');
  const sig = Buffer.from(signed.signatureB64, 'base64');

  if (signed.algorithm === 'RS256') {
    return crypto.verify('RSA-SHA256', data, publicKey, sig);
  }
  if (signed.algorithm.startsWith('ES')) {
    // ECDSA attend une signature DER ici
    return crypto.verify('sha256', data, publicKey, sig);
  }
  if (signed.algorithm === 'Ed25519') {
    // Ed25519, pas de hash explicitement paramétré
    return crypto.verify(null, data, publicKey, sig);
  }
  throw new Error(`Algorithme non supporté: ${signed.algorithm}`);
}
```

## Paramètres d’infrastructure

* Chemins par défaut: `certs/key.pem` pour la clé privée, `certs/cert.pem` pour le certificat.
* Variables d’environnement optionnelles: `MINIMON_SSL_KEY_PATH` et `MINIMON_SSL_CERT_PATH` pour surcharger les chemins par défaut.

## Sécurité et anti-rejeu

* Utiliser `nonce` côté client afin de lier la réponse à une intention unique.
* Exploiter `issuedAt` pour définir une fenêtre de validité de la preuve côté client.

---

## Journal des changements

* 2025-11-12: ajout de l’endpoint `POST /v1/certify-score` pour la certification de score signée.
