# Fonctionnalité Panier

## Résumé

Cette documentation décrit l'implémentation complète de la fonctionnalité de panier d'achat avec différenciation visuelle par vendeur.

## Fichiers créés

### 1. Service de gestion du panier
**`frontend/src/lib/cart.ts`**

Ce service gère toutes les opérations liées au panier :
- `getOrCreateCart()` - Récupère ou crée le panier actif de l'utilisateur
- `addItem(productId, quantity)` - Ajoute un produit au panier
- `updateItemQuantity(itemId, quantity)` - Modifie la quantité d'un article
- `removeItem(itemId)` - Supprime un article du panier
- `getCartItems()` - Récupère tous les articles du panier
- `getCartItemCount()` - Compte le nombre total d'articles
- `getCartItemsByVendor()` - Groupe les articles par vendeur
- `clearCart()` - Vide complètement le panier
- `getFullCart()` - Récupère le panier complet avec tous ses détails

### 2. Composant principal du panier
**`frontend/src/components/Cart.tsx`**

Composant React qui affiche :
- **Groupement par vendeur** : Les produits sont visuellement séparés par vendeur avec :
  - Une carte distincte par vendeur avec bordure colorée
  - Avatar et nom du vendeur en en-tête
  - Sous-total par vendeur
- Contrôles de quantité (+/-)
- Suppression d'articles
- Récapitulatif du total
- Bouton de paiement
- États de chargement et d'erreur

### 3. Bouton panier dans la navbar
**`frontend/src/components/CartButton.tsx`**

Composant qui affiche :
- Icône de panier cliquable
- Badge avec le nombre d'articles
- Mise à jour en temps réel du compteur
- Visible uniquement pour les utilisateurs connectés

### 4. Page panier
**`frontend/src/pages/cart.astro`**

Page Astro qui :
- Vérifie l'authentification
- Redirige vers /login si non connecté
- Affiche le composant Cart

## Modifications apportées

### 1. Navbar mise à jour
**`frontend/src/components/Navbar.tsx`**
- Ajout du `CartButton` dans le menu desktop
- Ajout du lien "Mon panier" dans le menu mobile

### 2. Détail produit amélioré
**`frontend/src/components/ProductDetail.tsx`**
- Ajout du bouton "Ajouter au panier" (principal)
- États de chargement avec spinner
- Confirmation visuelle après ajout (icône check)
- Réorganisation des boutons d'action

### 3. Carte produit améliorée
**`frontend/src/components/ProductCard.tsx`**
- Ajout d'un bouton rapide "Ajouter au panier"
- Empêche la navigation quand on clique sur le bouton
- Visible uniquement si le produit est disponible
- Masqué pour le propriétaire du produit

## Structure de données

### Collection `orders` (Panier)
```json
{
  "id": "string",
  "userId": "relation_to_users",
  "totalAmount": "number",
  "currency": "EUR",
  "paymentStatus": "cart", // Statut spécial pour le panier actif
  "created": "datetime",
  "updated": "datetime"
}
```

### Collection `ordersProducts` (Articles du panier)
```json
{
  "id": "string",
  "orderId": "relation_to_orders",
  "productId": "relation_to_products",
  "quantity": "number",
  "productStatus": "in_preperation",
  "created": "datetime",
  "updated": "datetime"
}
```

## Différenciation visuelle par vendeur

La différenciation se fait via :

1. **Cartes séparées** : Chaque vendeur a sa propre carte avec :
   - Bordure colorée `border-2 border-primary/20`
   - Ombre portée `shadow-md`
   - En-tête avec fond coloré `bg-primary/5`

2. **Information vendeur** :
   - Avatar ou icône de boutique
   - Nom du vendeur en titre
   - Nombre d'articles et sous-total

3. **Récapitulatif détaillé** :
   - Liste des sous-totaux par vendeur
   - Total général mis en évidence

## Flux utilisateur

### Ajouter au panier
1. L'utilisateur clique sur "Ajouter au panier"
2. Le système crée un panier si nécessaire
3. Le produit est ajouté ou la quantité est incrémentée
4. Le compteur dans la navbar se met à jour
5. Confirmation visuelle (icône check pendant 2 secondes)

### Voir le panier
1. L'utilisateur clique sur l'icône panier
2. Redirection vers `/cart`
3. Affichage des produits groupés par vendeur
4. Possibilité de modifier les quantités ou supprimer

### Modifier le panier
1. **Augmenter/Diminuer** : Boutons +/- pour chaque produit
2. **Supprimer** : Icône poubelle avec confirmation
3. **Vider** : Bouton "Vider le panier" avec confirmation
4. Mise à jour automatique des totaux

## Sécurité et validation

- ✅ Vérification de l'authentification
- ✅ Validation des quantités (minimum 1)
- ✅ Vérification de la propriété (empêche d'ajouter ses propres produits)
- ✅ Vérification du statut (seulement produits "Disponible")
- ✅ Gestion des erreurs avec messages utilisateur

## Améliorations futures possibles

1. **Persistance locale** : Utiliser localStorage pour les non-connectés
2. **Stock management** : Vérifier la disponibilité en temps réel
3. **Favoris** : Pouvoir sauvegarder pour plus tard
4. **Partage** : Partager son panier par lien
5. **Promotions** : Codes promo et réductions
6. **Frais de port** : Calcul par vendeur
7. **Checkout multi-vendeur** : Paiement séparé par vendeur
8. **Notifications** : Alerter si prix ou stock change

## Tests recommandés

1. ✓ Ajouter un produit au panier
2. ✓ Ajouter plusieurs produits du même vendeur
3. ✓ Ajouter des produits de différents vendeurs
4. ✓ Modifier les quantités
5. ✓ Supprimer un article
6. ✓ Vider le panier
7. ✓ Vérifier les totaux
8. ✓ Vérifier le compteur navbar
9. ✓ Tester sans authentification
10. ✓ Tester avec produit indisponible

## Support

Pour toute question ou problème, référez-vous aux fichiers sources ou à la documentation PocketBase pour les collections `orders` et `ordersProducts`.

