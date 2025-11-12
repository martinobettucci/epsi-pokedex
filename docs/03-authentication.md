# Spécification d’authentification

Cette API utilise une authentification simple basée sur un jeton Bearer fixe. Aucune gestion d’utilisateur ni d’émission de jetons dynamiques n’est prévue : le jeton est **statiquement défini** côté serveur.

---

## Principe général

Chaque requête adressée à l’API doit inclure l’en-tête HTTP `Authorization` avec un jeton prédéfini. Le serveur vérifie que le jeton correspond à la valeur attendue. Si ce n’est pas le cas, la requête est refusée avec un code HTTP **401 Unauthorized**.

---

## Détails de mise en œuvre

* **Type** : Bearer Token (authentification par en-tête HTTP)
* **Valeur du jeton** : `EPSI`
* **En-tête requis** :

  ```http
  Authorization: Bearer EPSI
  ```
* **Requête sans en-tête** :

  * Réponse HTTP : `401 Unauthorized`
  * Corps JSON :

    ```json
    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authorization bearer token requis.",
        "timestamp": "2025-11-12T09:15:27Z"
      }
    }
    ```
* **Jeton incorrect** :

  * Réponse HTTP : `401 Unauthorized`
  * Corps JSON :

    ```json
    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Jeton d'accès invalide.",
        "timestamp": "2025-11-12T09:15:27Z"
      }
    }
    ```

---

## Exemple d’appel avec authentification

```js
async function generatePokemon() {
  const res = await fetch("http://epsi.journeesdecouverte.fr:22222/v1/generate", {
    method: "GET",
    headers: {
      "Authorization": "Bearer EPSI"
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  console.log("Nom:", data.metadata.name, "Rareté:", data.metadata.rarity);
}
```

---

## Points de vigilance

* Le jeton **EPSI** doit être conservé côté client dans une configuration sécurisée (variable d’environnement, configuration build).
* Ne jamais inclure le jeton dans le corps de la requête ou dans l’URL.
* Le serveur peut désactiver l’authentification si `BEARER_TOKEN` est vide.
* Cette méthode ne fournit pas de contrôle d’accès granulaire : elle sert uniquement à restreindre l’accès à un usage autorisé.

---

## Codes d’erreur associés

| Code HTTP | error.code        | Description                                           |
| --------- | ----------------- | ----------------------------------------------------- |
| 401       | UNAUTHORIZED      | Jeton manquant ou invalide                            |
| 429       | RATE_LIMITED      | Trop de requêtes dans la fenêtre temporelle autorisée |
| 500       | GENERATION_FAILED | Erreur interne du service                             |

---

## Résumé

* Authentification : **Bearer EPSI**
* Validation côté serveur : comparaison stricte du jeton
* Aucune création, révocation ni expiration automatique du jeton
* Destiné à un usage simple, démo ou environnement local
