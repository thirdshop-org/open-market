## Plan de Développement MVP : Marketplace de Pièces Détachées

L'objectif est de créer un MVP fiable et utilisable, en priorisant la qualité sur la quantité de fonctionnalités, étant donné l'absence de contraintes budgétaires ou de temps serrées.

### Étape 1 : Définition du MVP Core

Un MVP de marketplace doit permettre à un acheteur de trouver un produit et à un vendeur de le proposer.

**Fonctionnalités Clés du MVP :**

1.  **Gestion des Utilisateurs :**
    *   Inscription et connexion (email/mot de passe).
    *   Profil utilisateur basique (nom d'utilisateur, avatar, localisation, contact simple).
    *   Réinitialisation de mot de passe.
2.  **Gestion des Produits :**
    *   Création, modification et suppression d'une annonce par un vendeur (titre, description, prix, catégorie, état, localisation, multiples images).
    *   Visualisation des annonces (page de détail produit).
    *   Recherche et filtrage basique des annonces (par mots-clés, catégorie, état).
3.  **Communication :**
    *   Système de messagerie basique entre acheteur et vendeur pour discuter d'une annonce spécifique.
4.  **Navigation & Ergonomie :**
    *   Page d'accueil avec une sélection d'annonces ou de catégories.
    *   Navigation claire et responsive.
    *   Tableau de bord utilisateur simple (mes annonces, mes messages, mon profil).

---

### Étape 2 : Stratégie Backend avec Pocketbase

Pocketbase sera le cœur de votre application, gérant l'authentification, la base de données et l'API.

**1. Modèle de Données (Collections Pocketbase) :**

*   **`users` (Utilisateurs) :** Collection par défaut de Pocketbase.
    *   Champs additionnels : `username` (texte, unique), `avatar` (fichier), `location` (texte libre, ex: "Paris, France"), `phone` (texte, optionnel), `isSeller` (booléen, par défaut `false`).
*   **`categories` (Catégories de Pièces) :**
    *   `name` (texte, unique, ex: "Moteur", "Carrosserie", "Électronique").
    *   `slug` (texte, unique, généré à partir du nom pour les URLs).
    *   `icon` (fichier, optionnel, pour un affichage visuel).
*   **`products` (Produits/Annonces) :**
    *   `title` (texte)
    *   `description` (richtext, permet de formater la description)
    *   `price` (nombre, float)
    *   `currency` (select, ex: EUR, USD)
    *   `images` (fichier, multi-fichiers, min:1, max:5, par exemple)
    *   `category` (relation `one-to-many` vers `categories`)
    *   `condition` (select, ex: Neuf, Occasion, Reconditionné)
    *   `seller` (relation `one-to-many` vers `users`)
    *   `status` (select, ex: Disponible, Vendu, Réservé, Brouillon)
    *   `location` (texte, hérite potentiellement de la localisation du vendeur mais modifiable pour l'annonce).
    *   `views` (nombre, int, par défaut 0, pour statistiques simples).
*   **`messages` (Messagerie) :**
    *   `sender` (relation `one-to-many` vers `users`)
    *   `receiver` (relation `one-to-many` vers `users`)
    *   `product` (relation `one-to-many` vers `products`, pour lier le message à une annonce)
    *   `content` (texte)
    *   `isRead` (booléen, par défaut `false`)
    *   `createdAt`, `updatedAt` (par défaut Pocketbase).

**2. Règles d'Accès (Pocketbase) :**

*   **`users` :**
    *   Read : `id = @request.auth.id` (un utilisateur ne peut voir que son profil, ou `isPublic = true` si vous exposez des profils).
    *   Write : `id = @request.auth.id` (modifier son propre profil).
    *   Create : `allow` (pour l'inscription).
*   **`categories` :**
    *   Read : `allow` (tout le monde peut voir les catégories).
*   **`products` :**
    *   Read : `allow` (tout le monde peut voir les produits listés).
    *   Write : `seller.id = @request.auth.id` (un vendeur peut modifier ses propres annonces).
    *   Create : `@request.auth.id != ""` (seulement les utilisateurs authentifiés peuvent créer).
    *   Delete : `seller.id = @request.auth.id` (un vendeur peut supprimer ses propres annonces).
*   **`messages` :**
    *   Read : `sender.id = @request.auth.id || receiver.id = @request.auth.id` (l'expéditeur ou le destinataire peut lire le message).
    *   Write : `sender.id = @request.auth.id` (seul l'expéditeur peut modifier son message - potentiellement restreindre).
    *   Create : `@request.auth.id != "" && receiver.id != @request.auth.id` (un utilisateur authentifié peut envoyer un message à un autre).

**3. Authentification :**

*   Utiliser l'authentification par email/mot de passe intégrée à Pocketbase.
*   Mettre en place la récupération de mot de passe.
*   Exploiter le SDK JavaScript de Pocketbase pour gérer l'état d'authentification côté client.

**4. Temps Réel (avec Pocketbase) :**

*   Mettre en place des abonnements en temps réel pour les `messages` pour une expérience de chat fluide. Pocketbase gère cela nativement via WebSockets.
*   Potentiellement pour les changements de statut de produit si un acheteur réserve, le vendeur voit la mise à jour instantanément.

---

### Étape 3 : Stratégie Frontend avec Astro, Tailwind CSS, Shadcn/ui

Le frontend sera construit avec Astro pour la performance, stylisé avec Tailwind CSS et utilisant Shadcn/ui pour des composants accessibles et personnalisables.

**1. Initialisation du Projet :**

*   Créer un projet Astro : `npm create astro@latest`
*   Ajouter Tailwind CSS : `npx astro add tailwind`
*   Ajouter React (nécessaire pour Shadcn/ui) : `npx astro add react`
*   Initialiser Shadcn/ui (suivre la documentation Astro de Shadcn/ui, qui implique l'ajout de composants React dans le dossier `components`).

**2. Structure des Pages (Routes Astro) :**

*   `src/pages/index.astro` : Page d'accueil (produits en vedette, catégories).
*   `src/pages/products/index.astro` : Liste de tous les produits, avec recherche et filtres.
*   `src/pages/products/[id].astro` : Page de détail d'un produit.
*   `src/pages/login.astro`, `src/pages/register.astro` : Pages d'authentification.
*   `src/pages/dashboard/index.astro` : Tableau de bord utilisateur.
*   `src/pages/dashboard/listings.astro` : Mes annonces (créer/éditer/supprimer).
*   `src/pages/dashboard/messages.astro` : Messagerie.
*   `src/pages/dashboard/profile.astro` : Mon profil.

**3. Composants UI (Shadcn/ui & Astro) :**

*   **Global :** `Header.astro` (navigation, logo, liens auth/dashboard), `Footer.astro`.
*   **Authentification :** `AuthForm.tsx` (pour login/register, utilisant les `Input`, `Label`, `Button` de Shadcn/ui).
*   **Produits :**
    *   `ProductCard.astro` : Affiche un produit (image, titre, prix, bref description).
    *   `ProductDetail.astro` : Affiche tous les détails du produit, carrousel d'images (utiliser le `Carousel` de Shadcn/ui).
    *   `ProductForm.tsx` : Formulaire de création/édition d'annonce (avec `Input`, `Textarea`, `Select`, `FileInput`).
*   **Recherche & Filtres :** `SearchBar.astro`, `FilterDropdown.astro` (utilisant `DropdownMenu` ou `Select` de Shadcn/ui).
*   **Messagerie :** `MessageList.tsx`, `MessageThread.tsx` (utilisant `ScrollArea`, `Avatar` de Shadcn/ui).
*   **Génériques :** `Dialog` (pour confirmer des actions), `Toast` (pour les notifications), `Spinner` (pour les chargements).

**4. Gestion des Données et de l'État :**

*   **Fetching des données :** Utiliser le SDK JavaScript de Pocketbase directement dans les composants Astro (en hydratant des îles React si nécessaire) ou via des `server-side` `endpoints` Astro pour des données statiques/pré-rendues.
*   **État d'authentification :** Utiliser le SDK de Pocketbase pour gérer le token d'authentification et les informations utilisateur. Stocker l'utilisateur courant dans un store global (par exemple, un `Context` React si la majorité de l'application est interactive, ou un `localStorage` simple et revalidation au chargement).
*   **Formulaires :** Utiliser unhook form pour une gestion robuste des formulaires côté client avec validation, en combinaison avec les composants Shadcn/ui.

**5. Performance et Accessibilité :**

*   **Astro Islands :** Hydrater uniquement les parties interactives (formulaires, messagerie en temps réel, filtres complexes). Les pages de lecture (listes de produits, détails) peuvent être majoritairement statiques pour une performance maximale.
*   **Accessibilité :** Shadcn/ui est construit sur Radix UI, qui offre une excellente accessibilité par défaut. S'assurer de l'implémenter correctement.
*   **Responsive Design :** Tailwind CSS rend facile la création d'interfaces adaptatives pour toutes les tailles d'écran.

---

### Étape 4 : Déploiement du MVP

**1. Backend (Pocketbase) :**

*   **Hébergement :** Un VPS (Virtual Private Server) est idéal (DigitalOcean, OVH, Scaleway, Contabo). Pocketbase est un seul binaire Go, très léger.
*   **Mise en place :**
    *   Télécharger le binaire Pocketbase.
    *   Configurer un service `systemd` pour que Pocketbase s'exécute en continu et redémarre automatiquement.
    *   Utiliser un proxy inverse (Nginx ou Caddy) pour gérer le SSL (HTTPS) et le nom de domaine personnalisé. Caddy est particulièrement simple avec Let's Encrypt.
*   **Sauvegardes :** Mettre en place des sauvegardes régulières du dossier `pb_data` (qui contient la base de données SQLite et les fichiers uploadés) vers un stockage externe (S3 compatible, autre VPS).

**2. Frontend (Astro) :**

*   **Hébergement :** Des plateformes comme Vercel, Netlify, Cloudflare Pages sont parfaites pour Astro. Elles offrent une intégration continue (CI/CD) simple et gratuite pour la plupart des usages.
*   **Configuration :** Connecter votre dépôt Git (GitHub, GitLab) au service d'hébergement. Chaque push sur la branche principale déclenchera un nouveau déploiement.

---

### Étape 5 : Critique du Plan Proposé

**Points Forts de cette Approche :**

*   **Vitesse de Développement de l'MVP :** Pocketbase est un game-changer pour les backends d'MVP. Il réduit considérablement le temps de mise en place de l'API, de l'authentification et de la base de données.
*   **Performance Frontend :** Astro garantit un frontend rapide et léger grâce à son architecture "islands", améliorant l'expérience utilisateur et le SEO.
*   **Développement UI Efficace :** Tailwind CSS permet une création d'interface rapide et cohérente. Shadcn/ui fournit des composants de haute qualité, accessibles et stylisables.
*   **Coût d'Opération Faible pour l'MVP :** Pocketbase étant basé sur SQLite, les besoins en ressources serveur sont faibles au début. L'hébergement frontend statique est souvent gratuit ou très abordable.
*   **Flexibilité pour l'Avenir :** Bien que Pocketbase utilise SQLite, il est écrit en Go et est extensible. Si à long terme un besoin d'une base de données relationnelle plus robuste (PostgreSQL) se fait sentir, une migration est envisageable. Astro permet d'intégrer des technologies diverses, garantissant une bonne évolutivité technique du frontend.
*   **Autonomie :** Vous avez le contrôle total de votre stack, sans dépendre d'un SaaS pour le backend qui pourrait devenir coûteux.

**Points Faibles / Défis Potentiels :**

*   **Montée en Charge de Pocketbase (Très Long Terme) :** Pour des millions d'utilisateurs actifs simultanément avec des écritures très intenses, SQLite peut atteindre ses limites. Cependant, pour un MVP et même une phase de croissance significative, Pocketbase peut gérer des volumes surprenants. Le fait que vous n'ayez pas de contrainte de temps signifie que cette éventuelle refonte n'est pas un problème immédiat.
*   **Complexité des Requêtes avec Pocketbase :** Bien que l'API générée soit puissante, pour des requêtes très complexes et optimisées impliquant de nombreuses jointures et agrégations, un ORM traditionnel avec une base de données relationnelle pourrait offrir plus de flexibilité. Pour les besoins d'un MVP, cela sera largement suffisant.
*   **Courbe d'Apprentissage (Astro & Shadcn/ui) :** L'architecture "islands" d'Astro, bien que bénéfique pour la performance, peut être une nouvelle approche pour des développeurs habitués aux SPAs monolithiques. L'intégration de Shadcn/ui implique de copier/coller le code des composants, ce qui donne un contrôle total mais demande une gestion manuelle des mises à jour des composants si vous les modifiez fortement.
*   **Gestion des Fichiers (Images) :** Pocketbase gère très bien l'upload de fichiers. S'assurer d'avoir une stratégie de sauvegarde robuste pour ces fichiers est crucial, surtout en cas de défaillance du disque du VPS.
*   **Gestion des Erreurs et Loggings :** Pour un système fiable, il sera important de mettre en place une gestion des erreurs côté frontend et un système de logging côté backend (Pocketbase peut intégrer des outils de logging si nécessaire) pour identifier et résoudre rapidement les problèmes.

---

### Étape 6 : Développement Phased (au-delà du MVP)

Étant donné que le temps n'est pas une contrainte, vous pouvez envisager les phases suivantes pour enrichir votre marketplace :

*   **Phase 2 : Améliorations de l'Expérience Utilisateur et de la Recherche**
    *   **Filtres Avancés :** Par marque, modèle de voiture, année, numéro de pièce, compatibilité.
    *   **Localisation :** Recherche par rayon kilométrique, affichage d'une carte.
    *   **Notifications :** Alertes email pour les nouveaux messages, les changements de statut d'annonce.
    *   **Favoris / Liste d'Envies.**
    *   **Avis et Notations des Vendeurs :** Un système de feedback simple.
*   **Phase 3 : Fonctionnalités Avancées et Monétisation (si souhaité)**
    *   **Intégration de Paiements :** Un système de paiement sécurisé pour les transactions (ex: Stripe Connect pour un modèle de marketplace).
    *   **Système de Litiges :** Pour résoudre les problèmes entre acheteurs et vendeurs.
    *   **Promotions d'Annonces :** Options payantes pour mettre en avant une annonce.
    *   **Analytics Avancées :** Pour suivre l'engagement utilisateur, les ventes.
    *   **Tableau de Bord Admin :** Pour la modération des annonces et des utilisateurs.
*   **Phase 4 : Expansion**
    *   **Internationalisation (i18n) :** Prise en charge de plusieurs langues et devises.
    *   **Applications Mobiles Natives :** Si le besoin se fait sentir pour une expérience dédiée.

---
