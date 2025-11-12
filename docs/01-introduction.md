# Introduction

Cette application propose une expérience ludique autour de la génération et de la collection de Pokémon uniques créés via un service de **text-to-image**. L’utilisateur peut interagir avec l’application de manière fluide, conserver ses créations localement et gérer son solde de jetons de façon autonome.

## Concept général

L’application permet à chaque utilisateur de générer, posséder et revendre des Pokémon virtuels. Chaque session est centrée sur l’expérience de création et la gestion d’un portefeuille de jetons qui reflète ses actions dans l’application.

## Fonctionnement du système de jetons

* Lors de la première connexion, l’utilisateur reçoit **100 jetons**.
* Chaque génération de Pokémon coûte **10 jetons**.
* Lorsqu’un Pokémon est revendu, l’utilisateur récupère **5 jetons**.
* Le solde de jetons ne peut jamais être négatif.

Le solde et les actifs sont sauvegardés localement pour permettre une expérience **offline**.

## Parcours utilisateur

1. **Accueil et onboarding**
   L’utilisateur découvre son solde initial et accède à une interface simple pour générer des Pokémon prédéterminés par l'API.

2. **Génération d’un Pokémon**
   Une génération démarre et dix (10) jetons sont alors débités immédiatement à la pression du bouton pour invoquer un Pokemon, puis envoyée au service de génération. Après validation, le Pokémon est créé et ajouté à la collection locale de l’utilisateur.
3. **Gestion de la collection**
   Les Pokémon générés peuvent être visualisés, triés et filtrés selon différents critères (date, rareté, thème, etc.). Chaque Pokémon possède un état indiquant s’il est encore possédé ou déjà revendu.

4. **Revente d’un Pokémon**
   En revendant un Pokémon, l’utilisateur en abandonne la propriété et récupère cinq jetons sur son solde.

## Objectifs et principes

* Offrir une **expérience immersive** autour de la génération d’images à partir de texte.
* Garantir une **autonomie utilisateur complète** grâce à la sauvegarde locale et à la résilience offline.
* Proposer une **économie interne équilibrée** et transparente.
* Favoriser une interaction continue entre créativité et gestion des ressources.

## Intégration API

Les spécifications détaillées des appels réseau, des structures de données et des formats de réponse sont décrites dans le document **api.md**.

## Perspectives d’évolution

* Ajout d’un classement ou d’un système de rareté des Pokémon.
* Introduction de collections à thème ou d’événements saisonniers.
* Mise en place d’un marché secondaire entre utilisateurs.
* Intégration d’un mode collaboratif pour la génération de Pokémon partagés.
