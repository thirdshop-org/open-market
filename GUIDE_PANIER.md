# Guide d'utilisation du Panier

## 🎯 Fonctionnalités implémentées

### ✅ Ajouter des articles au panier
Trois façons d'ajouter un produit :
1. **Liste de produits** : Bouton "Ajouter au panier" sur chaque carte produit
2. **Page détail** : Bouton principal "Ajouter au panier" en haut de page
3. **Ajout multiple** : Cliquer plusieurs fois augmente la quantité

### ✅ Visualiser le panier
- **Icône panier** dans la navbar avec badge indiquant le nombre d'articles
- **Page panier** accessible via `/cart` ou en cliquant sur l'icône

### ✅ Différenciation visuelle par vendeur
Quand votre panier contient des produits de plusieurs vendeurs :
- **Cartes séparées** pour chaque vendeur
- **Bordure colorée** et fond d'en-tête distinct
- **Avatar du vendeur** et nom affiché
- **Sous-total par vendeur** clairement visible
- **Total général** calculé automatiquement

### ✅ Gestion du panier
- **Modifier la quantité** : Boutons +/- pour chaque produit
- **Supprimer un article** : Icône poubelle avec confirmation
- **Vider le panier** : Bouton en haut de page
- **Mise à jour automatique** des totaux

## 📱 Interface utilisateur

### Navbar
```
[Logo] [Accueil] [Produits] [Mon profil] [Mes annonces] [Messages] [🛒3] [Profil] [Déconnexion]
                                                                       ↑
                                                              Badge avec nombre
```

### Page Panier - Un vendeur
```
┌─────────────────────────────────────────┐
│ 🏪 Nom du Vendeur                       │
│ 2 articles • 45,00 €                    │
├─────────────────────────────────────────┤
│ [Image] Produit 1        [-] 1 [+]  [🗑] │
│         20,00 €                         │
│                                         │
│ [Image] Produit 2        [-] 1 [+]  [🗑] │
│         25,00 €                         │
└─────────────────────────────────────────┘
```

### Page Panier - Plusieurs vendeurs
```
┌─────────────────────────────────────────┐
│ 🏪 Vendeur 1                            │
│ 1 article • 20,00 €                     │  ← Bordure colorée
├─────────────────────────────────────────┤
│ [Image] Produit A        [-] 1 [+]  [🗑] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🏪 Vendeur 2                            │
│ 1 article • 25,00 €                     │  ← Autre bordure colorée
├─────────────────────────────────────────┤
│ [Image] Produit B        [-] 1 [+]  [🗑] │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Récapitulatif                           │
│ Vendeur 1              20,00 €          │
│ Vendeur 2              25,00 €          │
│ ────────────────────────────            │
│ Total                  45,00 €          │
│                                         │
│ [    Procéder au paiement    ]          │
└─────────────────────────────────────────┘
```

## 🔒 Sécurité

- ✅ Authentification requise pour ajouter au panier
- ✅ Impossible d'ajouter ses propres produits
- ✅ Seulement les produits "Disponibles" peuvent être ajoutés
- ✅ Validation des quantités (minimum 1)

## 🎨 Feedback visuel

### Ajouter au panier
1. **En attente** : `[🛒 Ajouter au panier]`
2. **Chargement** : `[⏳ Ajout en cours...]`
3. **Succès** : `[✓ Ajouté au panier]` (2 secondes)
4. **Retour** : `[🛒 Ajouter au panier]`

### États des boutons
- **Normal** : Bleu primary
- **Disabled** : Grisé avec opacité réduite
- **Hover** : Assombrissement

## 🚀 Utilisation

### Pour l'acheteur
1. Parcourir les produits sur `/products`
2. Cliquer sur "Ajouter au panier" sur les produits souhaités
3. Vérifier l'icône panier (badge s'actualise)
4. Accéder au panier via l'icône ou `/cart`
5. Ajuster les quantités si nécessaire
6. Procéder au paiement (à implémenter)

### Pour le vendeur
- Les vendeurs ne peuvent pas ajouter leurs propres produits au panier
- Le bouton n'apparaît pas sur leurs produits
- Ils peuvent toujours les modifier via "Mes annonces"

## 💡 Astuces

1. **Badge interactif** : Cliquer sur l'icône panier ouvre directement la page
2. **Navigation fluide** : Le bouton dans ProductCard n'ouvre pas le détail
3. **Totaux en temps réel** : Les montants se mettent à jour immédiatement
4. **Groupement intelligent** : Les produits sont automatiquement groupés par vendeur

## 🐛 Dépannage

### Le panier ne s'affiche pas
- Vérifiez que vous êtes connecté
- Vérifiez que PocketBase est en cours d'exécution
- Consultez la console du navigateur pour les erreurs

### Impossible d'ajouter au panier
- Vérifiez que le produit est "Disponible"
- Vérifiez que vous n'êtes pas le propriétaire du produit
- Vérifiez votre connexion

### Le badge ne se met pas à jour
- Actualisez la page
- Déconnectez-vous et reconnectez-vous
- Vérifiez les cookies du navigateur

## 📊 Collections PocketBase utilisées

- **orders** : Stockage du panier (paymentStatus = "cart")
- **ordersProducts** : Articles individuels du panier
- **products** : Informations produits (expand)
- **users** : Informations vendeurs (expand)

## 🔄 Workflow technique

```
User Action → cartService → PocketBase API → Database
                ↓
         State Update
                ↓
         UI Refresh
```

## 📝 Exemple de code

### Ajouter un produit
```typescript
import { cartService } from '@/lib/cart';

// Ajouter 1 unité
await cartService.addItem(productId, 1);

// Le service gère automatiquement :
// - Création du panier si nécessaire
// - Incrémentation si déjà présent
// - Mise à jour du total
```

### Récupérer le panier groupé
```typescript
import { cartService } from '@/lib/cart';

// Récupérer les articles groupés par vendeur
const itemsByVendor = await cartService.getCartItemsByVendor();

// Structure :
// [
//   {
//     vendorId: "xxx",
//     vendorName: "Vendeur A",
//     items: [...],
//     totalAmount: 45.00
//   },
//   ...
// ]
```

---

**Note** : Cette fonctionnalité est complète pour la gestion du panier. 
Le processus de paiement devra être implémenté séparément.

