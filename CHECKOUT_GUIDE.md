# Guide Utilisateur - Processus de Paiement

## 🛒 De l'ajout au panier jusqu'à la commande

Ce guide explique tout le processus d'achat sur Open Market, depuis l'ajout d'un produit au panier jusqu'à la réception de la confirmation de commande.

## 📋 Étapes du processus

### 1️⃣ Ajouter des produits au panier

**Depuis la liste des produits :**
- Cliquez sur le bouton "Ajouter au panier" sur n'importe quelle carte produit
- Le bouton affiche "Ajouté ✓" pendant 2 secondes
- Le compteur dans la navbar se met à jour

**Depuis une page produit :**
- Ouvrez la page de détail d'un produit
- Cliquez sur le bouton principal "Ajouter au panier"
- Vous pouvez rester sur la page ou continuer vos achats

**Note :** Vous ne pouvez pas ajouter vos propres produits au panier.

### 2️⃣ Consulter le panier

**Accès au panier :**
- Cliquez sur l'icône panier 🛒 dans la navbar
- Ou allez directement sur `/cart`

**Dans le panier, vous pouvez :**
- Voir tous vos articles groupés par vendeur
- Modifier les quantités avec les boutons +/-
- Supprimer des articles individuellement
- Vider complètement le panier
- Voir les sous-totaux par vendeur et le total général

### 3️⃣ Procéder au paiement

**Cliquez sur "Procéder au paiement"**

Vous êtes redirigé vers la page de checkout `/checkout`

### 4️⃣ Remplir les informations

**Adresse de livraison (obligatoire) :**
- Nom complet
- Adresse complète (ligne 1 et 2 optionnelle)
- Code postal (5 chiffres)
- Ville
- Pays
- Téléphone

**Adresse de facturation :**
- Par défaut, identique à l'adresse de livraison
- Décochez la case pour saisir une adresse différente

**Récapitulatif :**
- Vérifiez vos articles
- Vérifiez les montants par vendeur
- Vérifiez le total

### 5️⃣ Valider le paiement

**Cliquez sur "Payer [montant]"**

Le système :
1. Valide vos informations (2 secondes)
2. Simule le paiement
3. Crée votre commande
4. Crée les sous-commandes par vendeur
5. Réserve les produits
6. Vide votre panier

### 6️⃣ Confirmation

**Page de confirmation automatique**

Vous voyez :
- ✅ Message de succès
- Numéro de commande unique
- Détails complets par vendeur
- Adresse de livraison
- Récapitulatif des montants

**Actions disponibles :**
- Voir toutes mes commandes
- Continuer mes achats

### 7️⃣ Historique des commandes

**Accès à l'historique :**
- Menu "Mes commandes" dans la navbar
- Ou directement sur `/orders`

**Dans l'historique :**
- Liste de toutes vos commandes
- Numéro, date, statut, montant
- Cliquez sur "Voir" pour les détails
- Pagination si beaucoup de commandes

## 🎨 Exemples visuels

### Panier avec un seul vendeur

```
┌─────────────────────────────────────┐
│ Mon panier                          │
│ 2 articles de 1 vendeur             │
├─────────────────────────────────────┤
│ 🏪 Tech Store                       │
│ 2 articles • 45,00 €                │
│ ───────────────────────────────────│
│ [IMG] iPhone 14    [-] 1 [+]   [🗑]│
│       Neuf • Smartphones            │
│       800,00 €                      │
│                                     │
│ [IMG] AirPods      [-] 1 [+]   [🗑]│
│       Neuf • Audio                  │
│       150,00 €                      │
└─────────────────────────────────────┘

┌─ Récapitulatif ─────────────────────┐
│ Total            950,00 €           │
│                                     │
│ [  Procéder au paiement  ]         │
└─────────────────────────────────────┘
```

### Panier avec plusieurs vendeurs

```
┌─────────────────────────────────────┐
│ Mon panier                          │
│ 3 articles de 2 vendeurs            │
├─────────────────────────────────────┤
│ 🏪 Tech Store          ← Bordure 1  │
│ 1 article • 800,00 €                │
│ ───────────────────────────────────│
│ [IMG] iPhone 14    [-] 1 [+]   [🗑]│
│       800,00 €                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏪 Audio Shop          ← Bordure 2  │
│ 2 articles • 300,00 €               │
│ ───────────────────────────────────│
│ [IMG] AirPods      [-] 1 [+]   [🗑]│
│       150,00 €                      │
│ [IMG] Casque       [-] 1 [+]   [🗑]│
│       150,00 €                      │
└─────────────────────────────────────┘

┌─ Récapitulatif ─────────────────────┐
│ Tech Store          800,00 €        │
│ Audio Shop          300,00 €        │
│ ─────────────────────────────       │
│ Total            1 100,00 €         │
│                                     │
│ [  Procéder au paiement  ]         │
└─────────────────────────────────────┘
```

### Page Checkout

```
┌─────────────────────────────────────┐
│ Finaliser la commande               │
│ 3 articles • 1 100,00 €             │
├─────────────────────────────────────┤
│                                     │
│ 📍 Adresse de livraison             │
│ ┌───────────────────────────────┐   │
│ │ Jean Dupont                   │   │
│ │ 123 Rue de la République      │   │
│ │ Appartement 4B                │   │
│ │ 75001 Paris                   │   │
│ │ France                        │   │
│ │ +33 6 12 34 56 78            │   │
│ └───────────────────────────────┘   │
│                                     │
│ 💳 Adresse de facturation           │
│ ☑ Identique à l'adresse de livraison│
│                                     │
│ 📦 Récapitulatif                    │
│ ┌───────────────────────────────┐   │
│ │ Tech Store                    │   │
│ │   iPhone 14 × 1    800,00 €  │   │
│ │   Sous-total       800,00 €  │   │
│ │                               │   │
│ │ Audio Shop                    │   │
│ │   AirPods × 1      150,00 €  │   │
│ │   Casque × 1       150,00 €  │   │
│ │   Sous-total       300,00 €  │   │
│ │                               │   │
│ │ Total           1 100,00 €   │   │
│ │                               │   │
│ │ [   Payer 1 100,00 €   ]     │   │
│ │                               │   │
│ │ Paiement sécurisé simulé     │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Page Confirmation

```
┌─────────────────────────────────────┐
│              ✅                      │
│     Commande confirmée !            │
│                                     │
│ Merci pour votre achat.             │
│ Votre commande a été enregistrée.   │
│                                     │
│ Numéro: abc123def456789             │
├─────────────────────────────────────┤
│                                     │
│ 🏪 Tech Store                       │
│ 1 article                           │
│ ───────────────────────────────────│
│ [IMG] iPhone 14                     │
│       Quantité: 1                   │
│       Statut: En préparation        │
│       800,00 €                      │
│ ───────────────────────────────────│
│ Sous-total vendeur   800,00 €      │
│                                     │
│ 🏪 Audio Shop                       │
│ 2 articles                          │
│ ───────────────────────────────────│
│ [IMG] AirPods                       │
│       Quantité: 1                   │
│       150,00 €                      │
│ [IMG] Casque                        │
│       Quantité: 1                   │
│       150,00 €                      │
│ ───────────────────────────────────│
│ Sous-total vendeur   300,00 €      │
└─────────────────────────────────────┘

┌─ Récapitulatif ─────────────────────┐
│ Date: 16 nov. 2025 10:30           │
│ Statut: Payée                      │
│ Nombre de vendeurs: 2              │
│ Articles: 3                        │
│                                    │
│ Total payé      1 100,00 €        │
│                                    │
│ [  Voir toutes mes commandes  ]   │
│ [   Continuer mes achats     ]    │
└─────────────────────────────────────┘
```

## ❓ Questions fréquentes

### Puis-je modifier ma commande après validation ?
Non, une fois la commande validée, elle ne peut plus être modifiée. Contactez le vendeur directement via la messagerie.

### Que se passe-t-il si le paiement échoue ?
Le système vous informe immédiatement et vous pouvez réessayer. Votre panier est conservé.

### Puis-je commander des produits de plusieurs vendeurs ?
Oui ! Le système crée automatiquement une commande distincte pour chaque vendeur. Vous aurez plusieurs suivis de livraison.

### Comment suivre ma commande ?
Allez dans "Mes commandes" et cliquez sur la commande pour voir les détails et le statut.

### Où sont stockées mes adresses ?
Les adresses sont sauvegardées avec chaque commande. Vous devrez les ressaisir pour la prochaine commande (fonctionnalité de sauvegarde à venir).

### Le paiement est-il sécurisé ?
Actuellement, c'est un paiement simulé pour les tests. En production, l'intégration avec Stripe/PayPal garantira la sécurité.

### Puis-je annuler une commande ?
Contactez directement le vendeur via la messagerie. L'annulation dépend de l'état de préparation.

### Combien coûte la livraison ?
Les frais de livraison seront calculés par vendeur (fonctionnalité à venir). Actuellement inclus dans le prix.

## 🎯 Conseils

### Pour une expérience optimale :

1. **Vérifiez votre panier** avant de procéder au paiement
2. **Vérifiez les adresses** - elles doivent être complètes et exactes
3. **Sauvegardez votre numéro de commande** pour référence future
4. **Consultez vos emails** (fonctionnalité future) pour les confirmations
5. **Contactez les vendeurs** via la messagerie pour toute question

### Statuts de commande :

| Statut | Signification |
|--------|---------------|
| **En préparation** | Le vendeur prépare votre colis |
| **Prêt à être envoyé** | Le colis est prêt pour l'expédition |
| **Envoyé** | Le colis est en transit |
| **Livré** | Vous avez reçu le colis |
| **Annulé** | La commande a été annulée |

## 🚀 Navigation rapide

- **Panier** : `/cart`
- **Checkout** : `/checkout`
- **Confirmation** : `/order-confirmation?orderId=xxx`
- **Historique** : `/orders`

## 📞 Besoin d'aide ?

- Consultez la documentation technique : `PAYMENT_PROCESS.md`
- Contactez le support (fonctionnalité à venir)
- Utilisez la messagerie pour contacter les vendeurs

---

**Bon shopping sur Open Market ! 🛍️**

