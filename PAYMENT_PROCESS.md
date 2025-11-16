# Processus de Paiement Simulé

## 🎯 Vue d'ensemble

Le système de paiement est entièrement fonctionnel avec simulation du paiement. Il gère tout le workflow d'achat, de la validation du panier jusqu'à la confirmation de commande, en passant par la collecte des adresses et la création des commandes par vendeur.

## 📁 Fichiers créés

### 1. Service de checkout
**`frontend/src/lib/checkout.ts`**

Service principal qui gère :
- ✅ Validation des adresses de livraison et facturation
- ✅ Simulation du paiement (2 secondes de délai, 99% de réussite)
- ✅ Création des commandes (une principale + sous-commandes par vendeur)
- ✅ Récupération des commandes et historique
- ✅ Mise à jour du statut des produits
- ✅ Formatage et affichage des données

### 2. Page de checkout
**`frontend/src/components/Checkout.tsx`**
**`frontend/src/pages/checkout.astro`**

Fonctionnalités :
- Formulaire d'adresse de livraison (nom, adresse, ville, code postal, pays, téléphone)
- Formulaire d'adresse de facturation (optionnel, peut être identique)
- Récapitulatif des articles par vendeur
- Validation des champs en temps réel
- Bouton de paiement avec état de traitement
- Redirection automatique vers la confirmation

### 3. Page de confirmation
**`frontend/src/components/OrderConfirmation.tsx`**
**`frontend/src/pages/order-confirmation.astro`**

Affichage :
- ✅ Message de succès avec numéro de commande
- ✅ Détails de la commande groupés par vendeur
- ✅ Produits avec images et quantités
- ✅ Adresse de livraison
- ✅ Récapitulatif des montants
- ✅ Liens vers l'historique et le catalogue

### 4. Historique des commandes
**`frontend/src/components/OrderHistory.tsx`**
**`frontend/src/pages/orders.astro`**

Fonctionnalités :
- Liste de toutes les commandes de l'utilisateur
- Pagination
- Affichage adaptatif (tableau desktop / cartes mobile)
- Filtres par statut
- Lien vers les détails de chaque commande

## 🔄 Workflow complet

```
1. Panier (/cart)
   ↓ [Procéder au paiement]
   
2. Checkout (/checkout)
   ├─ Formulaire adresse de livraison
   ├─ Formulaire adresse de facturation
   ├─ Récapitulatif articles par vendeur
   └─ Validation + [Bouton Payer]
   ↓
   
3. Traitement (2 secondes)
   ├─ Simulation paiement
   ├─ Création commande principale
   ├─ Création sous-commandes par vendeur
   ├─ Création des orderProducts
   ├─ Mise à jour statut produits → "Réservé"
   └─ Vidage du panier
   ↓
   
4. Confirmation (/order-confirmation?orderId=xxx)
   ├─ Message de succès
   ├─ Détails complets
   └─ Liens actions
   
5. Historique (/orders)
   └─ Liste de toutes les commandes
```

## 🗄️ Structure des données

### Commande principale (orders)
```json
{
  "id": "abc123def456789",
  "userId": "user_id",
  "totalAmount": 125.50,
  "currency": "EUR",
  "shippingAddress": "{\"fullName\":\"...\",\"addressLine1\":\"...\"}",
  "billingAddress": "{\"fullName\":\"...\",\"addressLine1\":\"...\"}",
  "paymentMethod": "simulated",
  "paymentStatus": "paid",
  "notes": "Paiement simulé - Transaction: TXN-1234567890-ABC123",
  "parentId": null,
  "created": "2025-01-01 10:00:00.000Z",
  "updated": "2025-01-01 10:00:00.000Z"
}
```

### Sous-commande par vendeur (orders)
```json
{
  "id": "sub123abc456def",
  "userId": "user_id",
  "totalAmount": 45.00,
  "currency": "EUR",
  "shippingAddress": "{...}",
  "billingAddress": "{...}",
  "paymentMethod": "simulated",
  "paymentStatus": "paid",
  "parentId": "abc123def456789",  // ← Lien vers commande principale
  "notes": "Commande pour le vendeur: Jean Dupont",
  "created": "2025-01-01 10:00:00.000Z"
}
```

### Articles de commande (ordersProducts)
```json
{
  "id": "item123",
  "orderId": "sub123abc456def",  // ← Lien vers sous-commande
  "productId": "prod789",
  "quantity": 2,
  "productStatus": "in_preperation",
  "created": "2025-01-01 10:00:00.000Z"
}
```

## 🎨 Architecture multi-vendeur

### Principe
Quand un panier contient des produits de plusieurs vendeurs, le système crée :
- **1 commande principale** : Contient le montant total et les informations client
- **N sous-commandes** : Une par vendeur, liées à la commande principale via `parentId`
- **M articles** : Chaque article est lié à la sous-commande de son vendeur

### Exemple avec 2 vendeurs

```
Commande Principale #MAIN001
├─ Total: 125,50 €
├─ Utilisateur: user_123
└─ Sous-commandes:
    │
    ├─ Sous-commande #SUB001 (Vendeur A)
    │  ├─ Total: 45,00 €
    │  ├─ parentId: MAIN001
    │  └─ Articles:
    │      ├─ Produit 1 × 1 = 20,00 €
    │      └─ Produit 2 × 1 = 25,00 €
    │
    └─ Sous-commande #SUB002 (Vendeur B)
       ├─ Total: 80,50 €
       ├─ parentId: MAIN001
       └─ Articles:
           ├─ Produit 3 × 2 = 50,00 €
           └─ Produit 4 × 1 = 30,50 €
```

## 🔒 Validation et sécurité

### Validation des adresses
```typescript
// Champs requis
- fullName: min 2 caractères
- addressLine1: min 5 caractères
- city: min 2 caractères
- postalCode: exactement 5 chiffres
- country: min 2 caractères
- phone: format international valide (8-20 caractères)

// Champs optionnels
- addressLine2: complément d'adresse
```

### Simulation du paiement
```typescript
async simulatePayment(amount: number) {
  // Délai réaliste de 2 secondes
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 99% de réussite (pour test des échecs)
  const success = Math.random() > 0.01;
  
  // Génération ID transaction unique
  const transactionId = `TXN-${Date.now()}-${randomString}`;
  
  return { success, transactionId };
}
```

### Sécurité
- ✅ Authentification obligatoire
- ✅ Vérification du panier non vide
- ✅ Validation côté client ET serveur
- ✅ Transactions atomiques (tout ou rien)
- ✅ Journalisation des transactions

## 📊 Statuts

### Statuts de paiement (paymentStatus)
| Statut | Français | Description |
|--------|----------|-------------|
| `cart` | Panier | En cours de création |
| `pending` | En attente | Paiement en attente |
| `paid` | Payée | Paiement validé |
| `failed` | Échouée | Paiement échoué |
| `refunded` | Remboursée | Commande remboursée |

### Statuts de produit (productStatus)
| Statut | Français | Description |
|--------|----------|-------------|
| `in_preperation` | En préparation | Produit en cours de préparation |
| `ready_to_be_sent` | Prêt à être envoyé | Prêt pour l'expédition |
| `sent` | Envoyé | Colis expédié |
| `delivered` | Livré | Livraison effectuée |
| `cancelled` | Annulé | Commande annulée |

## 💡 Fonctionnalités clés

### 1. Collecte des adresses
```tsx
// Adresse de livraison
<Input 
  value={shippingAddress.fullName}
  onChange={(e) => handleShippingChange('fullName', e.target.value)}
  required
/>

// Option "Identique à l'adresse de livraison"
<checkbox 
  checked={sameAsBilling}
  onChange={(e) => setSameAsBilling(e.target.checked)}
/>
```

### 2. Validation en temps réel
```typescript
const validation = checkoutService.validateAddress(shippingAddress);
if (!validation.valid) {
  setError(validation.errors.join(', '));
  return;
}
```

### 3. Création des commandes
```typescript
const result = await checkoutService.createOrdersFromCart(
  shippingAddress,
  billingAddress,
  'simulated'
);

if (result.success) {
  // Redirection vers confirmation
  window.location.href = `/order-confirmation?orderId=${result.mainOrderId}`;
}
```

### 4. Récupération des détails
```typescript
const { order, products, subOrders } = 
  await checkoutService.getFullOrderDetails(orderId);

// order: Commande principale
// subOrders: Sous-commandes par vendeur
// products: Tous les articles de toutes les sous-commandes
```

## 🎨 Interface utilisateur

### Page Checkout
```
┌────────────────────────────────────────────────┐
│ Finaliser la commande                          │
│ 3 articles • 125,50 €                          │
├────────────────────────────────────────────────┤
│                                                │
│ ┌─ Adresse de livraison ──────────────────┐   │
│ │ Nom complet:     [________________]     │   │
│ │ Adresse:         [________________]     │   │
│ │ Code postal:     [_____]  Ville: [____] │   │
│ │ Pays:            [________________]     │   │
│ │ Téléphone:       [________________]     │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌─ Adresse de facturation ─────────────────┐   │
│ │ ☑ Identique à l'adresse de livraison    │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌─ Récapitulatif ───────────────────────────┐  │
│ │ 📦 Vendeur A                              │  │
│ │   Produit 1 × 1            20,00 €       │  │
│ │   Produit 2 × 1            25,00 €       │  │
│ │   Sous-total               45,00 €       │  │
│ │                                           │  │
│ │ 📦 Vendeur B                              │  │
│ │   Produit 3 × 2            50,00 €       │  │
│ │   Produit 4 × 1            30,50 €       │  │
│ │   Sous-total               80,50 €       │  │
│ │                                           │  │
│ │ Total                    125,50 €        │  │
│ │                                           │  │
│ │ [    Payer 125,50 €    ]                 │  │
│ └───────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### Page Confirmation
```
┌────────────────────────────────────────────────┐
│              ✓                                 │
│     Commande confirmée !                       │
│                                                │
│  Merci pour votre achat.                       │
│  Numéro: abc123def456789                       │
├────────────────────────────────────────────────┤
│                                                │
│ ┌─ 🏪 Vendeur A ───────────────────────────┐   │
│ │ [IMG] Produit 1                          │   │
│ │       Quantité: 1                        │   │
│ │       Statut: En préparation             │   │
│ │                              20,00 €     │   │
│ │                                          │   │
│ │ [IMG] Produit 2                          │   │
│ │       Quantité: 1                        │   │
│ │                              25,00 €     │   │
│ │ ─────────────────────────────────────    │   │
│ │ Sous-total vendeur           45,00 €     │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌─ Récapitulatif ───────────────────────────┐  │
│ │ Date: 1 janv. 2025 10:00                 │  │
│ │ Statut: Payée                            │  │
│ │ Nombre de vendeurs: 2                    │  │
│ │ Articles: 3                              │  │
│ │                                          │  │
│ │ Total payé         125,50 €             │  │
│ │                                          │  │
│ │ [  Voir toutes mes commandes  ]         │  │
│ │ [   Continuer mes achats     ]          │  │
│ └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## 🔧 API du service

### checkoutService.validateAddress()
```typescript
validateAddress(address: Partial<ShippingAddress>): {
  valid: boolean;
  errors: string[];
}
```

### checkoutService.simulatePayment()
```typescript
async simulatePayment(amount: number): Promise<{
  success: boolean;
  transactionId: string;
}>
```

### checkoutService.createOrdersFromCart()
```typescript
async createOrdersFromCart(
  shippingAddress: ShippingAddress,
  billingAddress: BillingAddress,
  paymentMethod: string
): Promise<{
  success: boolean;
  mainOrderId?: string;
  subOrders?: Order[];
  error?: string;
}>
```

### checkoutService.getMyOrders()
```typescript
async getMyOrders(page = 1, perPage = 20): Promise<{
  items: Order[];
  totalPages: number;
}>
```

### checkoutService.getFullOrderDetails()
```typescript
async getFullOrderDetails(orderId: string): Promise<{
  order: Order | null;
  products: OrderProduct[];
  subOrders: Order[];
}>
```

## 🧪 Tests recommandés

### Scénarios de succès
1. ✅ Checkout avec 1 vendeur
2. ✅ Checkout avec plusieurs vendeurs
3. ✅ Adresse de facturation identique
4. ✅ Adresse de facturation différente
5. ✅ Validation des champs
6. ✅ Redirection après paiement
7. ✅ Affichage de la confirmation
8. ✅ Historique des commandes

### Scénarios d'erreur
1. ✅ Panier vide
2. ✅ Adresse invalide
3. ✅ Paiement échoué (1% des cas)
4. ✅ Session expirée
5. ✅ Commande introuvable

## 🚀 Améliorations futures

### Court terme
- [ ] Gestion des frais de port par vendeur
- [ ] Envoi d'emails de confirmation
- [ ] Notifications aux vendeurs
- [ ] Export PDF des commandes

### Moyen terme
- [ ] Suivi de livraison
- [ ] Système de notation/avis
- [ ] Gestion des retours
- [ ] Chat vendeur-acheteur

### Long terme
- [ ] Intégration paiement réel (Stripe, PayPal)
- [ ] Wallet utilisateur
- [ ] Abonnements vendeurs
- [ ] Facturation automatique

## 📖 Utilisation

### Pour l'acheteur
1. Ajouter des produits au panier
2. Cliquer sur "Procéder au paiement"
3. Remplir les adresses
4. Cliquer sur "Payer"
5. Attendre 2 secondes (simulation)
6. Voir la confirmation
7. Consulter l'historique dans "Mes commandes"

### Pour le vendeur
Les vendeurs recevront des sous-commandes dans leur interface (à implémenter).
Chaque sous-commande contient uniquement leurs produits.

## 💰 Exemple complet

```typescript
// 1. L'utilisateur clique sur "Payer"
const result = await checkoutService.createOrdersFromCart(
  shippingAddress,
  billingAddress,
  'simulated'
);

// 2. Le système crée:
// - 1 commande principale (MAIN001)
// - 2 sous-commandes (SUB001 pour VendeurA, SUB002 pour VendeurB)
// - 3 orderProducts liés aux sous-commandes

// 3. Les produits passent en "Réservé"
// 4. Le panier est vidé
// 5. Redirection vers /order-confirmation?orderId=MAIN001
```

---

**Note** : Le système est prêt pour l'intégration d'un vrai processus de paiement (Stripe, PayPal, etc.). Il suffira de remplacer `simulatePayment()` par l'appel API réel.

