# Guide Vendeur - Gestion des Commandes

## 🎯 Vue d'ensemble

Le dashboard vendeur permet de gérer toutes les commandes reçues, avec une section dédiée aux **commandes en attente d'envoi**. Cette fonctionnalité permet aux vendeurs de suivre et traiter efficacement leurs ventes.

## 📦 Fonctionnalités

### 1. Dashboard Vendeur (/dashboard)

Le dashboard affiche :
- **4 statistiques clés** en temps réel
- **Liste complète** des commandes en attente d'envoi
- **Actions rapides** pour gérer les statuts

### 2. Statistiques en temps réel

```
┌─────────────────────────────────────────────────────────┐
│  📦 En préparation  |  🚚 Prêt à envoyer  |  ✓ Envoyé  |  💰 Revenus  │
│         3           |         2          |     15     |  1 250,00 €  │
└─────────────────────────────────────────────────────────┘
```

| Stat | Description |
|------|-------------|
| **En préparation** | Nombre de commandes avec statut `in_preperation` |
| **Prêt à envoyer** | Nombre de commandes avec statut `ready_to_be_sent` |
| **Envoyé** | Nombre de commandes avec statut `sent` |
| **Revenus** | Total des ventes (commandes payées uniquement) |

### 3. Section Commandes en Attente

Affiche toutes les commandes qui nécessitent une action du vendeur :
- Commandes en **préparation** (`in_preperation`)
- Commandes **prêtes à envoyer** (`ready_to_be_sent`)

**Exclut automatiquement :**
- Commandes déjà **envoyées**
- Commandes **livrées**
- Commandes **annulées**

## 🔄 Workflow Vendeur

### Flux complet d'une commande

```
1. Client passe commande
   ↓
2. [VENDEUR] Reçoit la commande
   Statut: "En préparation" (in_preperation)
   Actions: Préparer les articles
   ↓
3. [VENDEUR] Articles prêts
   Clic: "Prêt" sur chaque article
   OU
   Clic: "Tout marquer comme prêt"
   Statut: "Prêt à envoyer" (ready_to_be_sent)
   ↓
4. [VENDEUR] Expédition du colis
   Clic: "Marquer comme envoyé"
   Confirmation demandée
   Statut: "Envoyé" (sent)
   ↓
5. [AUTO] Livraison
   Statut: "Livré" (delivered)
   (mise à jour manuelle ou automatique selon système de suivi)
```

## 💼 Interface Dashboard

### Vue globale

```
╔════════════════════════════════════════════════════════╗
║ Dashboard                                              ║
╠════════════════════════════════════════════════════════╣
║ [📦 3] [🚚 2] [✓ 15] [💰 1 250,00 €]                 ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║ Commandes en attente d'envoi                          ║
║ 5 commandes à traiter                                 ║
║                                                        ║
║ ┌────────────────────────────────────────────────────┐ ║
║ │ 📦 Commande #abc12345                              │ ║
║ │ 📅 16 nov. 2025 10:30  |  👤 Jean Dupont           │ ║
║ │                                      125,50 €      │ ║
║ │                                      2 articles    │ ║
║ ├────────────────────────────────────────────────────┤ ║
║ │ [IMG] iPhone 14                                    │ ║
║ │       Quantité: 1                                  │ ║
║ │       🟡 En préparation              [✓ Prêt]     │ ║
║ │                                                    │ ║
║ │ [IMG] AirPods                                      │ ║
║ │       Quantité: 1                                  │ ║
║ │       🔵 Prêt à envoyer     [⏰ En préparation]   │ ║
║ │                                                    │ ║
║ │ 📍 Adresse de livraison:                          │ ║
║ │    Jean Dupont                                     │ ║
║ │    123 Rue de la République                        │ ║
║ │    75001 Paris, France                             │ ║
║ │    Tél: +33 6 12 34 56 78                         │ ║
║ │                                                    │ ║
║ │ [ ✓ Tout marquer comme prêt ]                     │ ║
║ └────────────────────────────────────────────────────┘ ║
║                                                        ║
║ ┌────────────────────────────────────────────────────┐ ║
║ │ 📦 Commande #def67890                              │ ║
║ │ 📅 16 nov. 2025 09:15  |  👤 Marie Martin          │ ║
║ │                                       89,99 €      │ ║
║ │                                       1 article    │ ║
║ ├────────────────────────────────────────────────────┤ ║
║ │ [IMG] Casque Bluetooth                             │ ║
║ │       Quantité: 1                                  │ ║
║ │       🔵 Prêt à envoyer                            │ ║
║ │                                                    │ ║
║ │ 📍 Adresse de livraison:                          │ ║
║ │    Marie Martin                                    │ ║
║ │    45 Avenue des Champs                            │ ║
║ │    69000 Lyon, France                              │ ║
║ │                                                    │ ║
║ │ [ 🚚 Marquer comme envoyé ]                       │ ║
║ └────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════╝
```

## 🎮 Actions disponibles

### Actions par article

| Action | Quand | Effet |
|--------|-------|-------|
| **[✓ Prêt]** | Article en préparation | Passe à "Prêt à envoyer" |
| **[⏰ En préparation]** | Article prêt | Repasse à "En préparation" |

### Actions par commande

| Action | Quand | Effet |
|--------|-------|-------|
| **Tout marquer comme prêt** | Au moins 1 article en préparation | Tous les articles → "Prêt à envoyer" |
| **Marquer comme envoyé** | Tous les articles prêts | Tous les articles → "Envoyé" + Confirmation |

## 📊 Statuts des produits

| Statut | Badge | Description | Actions possibles |
|--------|-------|-------------|-------------------|
| `in_preperation` | 🟡 En préparation | Article commandé, à préparer | → Prêt |
| `ready_to_be_sent` | 🔵 Prêt à envoyer | Article prêt, en attente d'expédition | → En préparation, → Envoyé |
| `sent` | 🟣 Envoyé | Colis expédié, en transit | - |
| `delivered` | 🟢 Livré | Livraison effectuée | - |
| `cancelled` | 🔴 Annulé | Commande annulée | - |

## 🛠️ API Service

### sellerOrderService

**Méthodes principales :**

```typescript
// Récupérer les commandes en attente
await sellerOrderService.getPendingOrders()
→ SellerOrder[]

// Récupérer les commandes prêtes à envoyer
await sellerOrderService.getReadyToSendOrders()
→ SellerOrder[]

// Mettre à jour un article
await sellerOrderService.updateProductStatus(itemId, 'ready_to_be_sent')

// Marquer toute la commande comme prête
await sellerOrderService.markOrderAsReadyToSend(orderProducts)

// Marquer toute la commande comme envoyée
await sellerOrderService.markOrderAsSent(orderProducts)

// Obtenir les statistiques
await sellerOrderService.getSellerStats()
→ { pendingOrders, readyToSend, sent, delivered, totalRevenue }
```

## 💡 Exemples d'utilisation

### Exemple 1 : Préparer une commande

```
Situation: Vous recevez une nouvelle commande de 2 articles

1. La commande apparaît dans "En attente d'envoi"
2. Statut: 🟡 En préparation (les 2 articles)
3. Vous préparez le premier article → Clic [✓ Prêt]
4. Statut article 1: 🔵 Prêt à envoyer
5. Vous préparez le second article → Clic [✓ Prêt]
6. Statut article 2: 🔵 Prêt à envoyer
7. Le bouton "Marquer comme envoyé" apparaît
8. Vous expédiez le colis → Clic [🚚 Marquer comme envoyé]
9. Confirmation → La commande disparaît de la liste
```

### Exemple 2 : Traiter rapidement plusieurs commandes

```
Situation: Vous avez préparé 5 commandes d'un coup

Pour chaque commande:
1. Clic sur [✓ Tout marquer comme prêt]
2. Tous les articles → 🔵 Prêt à envoyer
3. Clic sur [🚚 Marquer comme envoyé]
4. Confirmer
5. Commande suivante

Résultat: 5 commandes traitées en ~30 secondes
```

### Exemple 3 : Corriger une erreur

```
Situation: Vous avez marqué un article "Prêt" par erreur

1. L'article affiche 🔵 Prêt à envoyer
2. Vous remarquez l'erreur
3. Clic sur [⏰ En préparation]
4. L'article repasse à 🟡 En préparation
5. Vous pouvez continuer la préparation
```

## 🔔 Notifications (à venir)

Dans une version future :
- Email quand nouvelle commande
- Notification dans l'interface
- Rappel pour commandes en attente > 48h
- Alerte si client envoie un message

## 📱 Responsive

L'interface s'adapte automatiquement :
- **Desktop** : Vue complète avec toutes les infos
- **Tablet** : Vue optimisée, colonnes réorganisées
- **Mobile** : Vue empilée, boutons pleine largeur

## 🚀 Conseils pratiques

### Pour une gestion efficace :

1. **Consultez le dashboard régulièrement** (au moins 2x/jour)
2. **Traitez les commandes dans l'ordre** (plus anciennes en premier)
3. **Communiquez avec les clients** via la messagerie intégrée
4. **Marquez "Prêt" au fur et à mesure** de la préparation
5. **Expédiez quotidiennement** si possible (meilleure satisfaction client)

### Bonnes pratiques :

- ✅ Marquer "Envoyé" **le jour même** de l'expédition
- ✅ Noter le numéro de suivi (fonctionnalité à venir)
- ✅ Emballer soigneusement les articles
- ✅ Vérifier l'adresse de livraison avant envoi
- ✅ Répondre rapidement aux questions clients

### À éviter :

- ❌ Marquer "Envoyé" avant expédition réelle
- ❌ Oublier des commandes en préparation
- ❌ Négliger la communication client
- ❌ Expédier sans vérifier l'adresse

## 🐛 Dépannage

### Les statistiques ne se mettent pas à jour
- Actualisez la page (F5)
- Vérifiez votre connexion internet
- Déconnectez-vous et reconnectez-vous

### Une commande n'apparaît pas
- Vérifiez que la commande est **payée**
- Vérifiez que le statut n'est pas déjà "Envoyé"
- Vérifiez que vous êtes bien le vendeur des produits

### Impossible de changer le statut
- Vérifiez votre connexion
- Actualisez la page
- Vérifiez les permissions (vous devez être le vendeur)

## 📊 Métriques de performance

### Temps de traitement recommandés

| Métrique | Objectif | Excellent |
|----------|----------|-----------|
| **Temps de préparation** | < 24h | < 12h |
| **Délai avant expédition** | < 48h | < 24h |
| **Taux de réponse** | > 80% | > 95% |
| **Satisfaction client** | > 4/5 | 4.5+/5 |

## 🔄 Mise à jour automatique

Les données se rafraîchissent automatiquement :
- **Statistiques** : Au chargement de la page
- **Liste des commandes** : Après chaque action
- **Compteurs** : En temps réel

## 📖 Accès rapide

- **Dashboard** : `/dashboard`
- **Mes produits** : `/my-products`
- **Produits en ligne** : `/dashboard/products-online`
- **Messages** : `/messages`

---

**Besoin d'aide ?** Consultez la documentation technique : `SELLER_ORDERS_TECHNICAL.md`

