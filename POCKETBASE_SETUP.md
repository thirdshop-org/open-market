# ⚙️ Configuration PocketBase - Collections

Ce guide explique comment configurer les collections PocketBase pour le système de gestion des produits.

## 🚀 Accès à l'administration

1. Démarrez PocketBase : `docker-compose up -d`
2. Ouvrez http://localhost:8080/_/
3. Connectez-vous avec votre compte admin

## 📦 Collections à créer

### 1. Collection `categories` (Catégories)

**Type:** Base collection

**Champs:**

| Nom | Type | Options |
|-----|------|---------|
| `name` | Text | Required, Unique, Min: 2, Max: 100 |
| `slug` | Text | Required, Unique, Pattern: `^[a-z0-9-]+$` |
| `icon` | File | Optional, Max size: 2MB, Types: image/* |

**Règles d'accès:**
```javascript
// List/View
allow

// Create
@request.auth.id != ""

// Update
@request.auth.id != ""

// Delete
@request.auth.id != ""
```

**Données initiales à créer:**
```json
[
  { "name": "Moteur", "slug": "moteur" },
  { "name": "Carrosserie", "slug": "carrosserie" },
  { "name": "Électronique", "slug": "electronique" },
  { "name": "Transmission", "slug": "transmission" },
  { "name": "Freinage", "slug": "freinage" },
  { "name": "Suspension", "slug": "suspension" },
  { "name": "Intérieur", "slug": "interieur" },
  { "name": "Éclairage", "slug": "eclairage" },
  { "name": "Accessoires", "slug": "accessoires" }
]
```

---

### 2. Collection `products` (Produits/Annonces)

**Type:** Base collection

**Champs:**

| Nom | Type | Options |
|-----|------|---------|
| `title` | Text | Required, Min: 5, Max: 200 |
| `description` | Editor | Required, Min: 20 |
| `price` | Number | Required, Min: 0 |
| `currency` | Select | Required, Values: `EUR`, `USD` |
| `images` | File | Required, Multiple, Max: 5, Max size: 5MB each, Types: image/* |
| `category` | Relation | Required, Collection: `categories`, Max select: 1 |
| `condition` | Select | Required, Values: `Neuf`, `Occasion`, `Reconditionné` |
| `seller` | Relation | Required, Collection: `users`, Max select: 1 |
| `status` | Select | Required, Values: `Disponible`, `Vendu`, `Réservé`, `Brouillon`, Default: `Disponible` |
| `location` | Text | Required, Min: 2, Max: 100 |
| `views` | Number | Required, Min: 0, Default: 0 |
| `reference` | Text | Optional, Max: 50 |
| `compatibility` | Text | Optional, Max: 200 |

**Règles d'accès:**
```javascript
// List/View
status = "Disponible" || seller.id = @request.auth.id

// Create
@request.auth.id != "" && 
@request.data.seller = @request.auth.id

// Update
seller.id = @request.auth.id

// Delete
seller.id = @request.auth.id
```

**Index recommandés:**
- `category` (ascending)
- `seller` (ascending)
- `status` (ascending)
- `created` (descending)

---

### 3. Collection `users` (Extensions)

**Champs additionnels à ajouter:**

| Nom | Type | Options |
|-----|------|---------|
| `name` | Text | Optional, Max: 100 |
| `location` | Text | Optional, Max: 100 |
| `phone` | Text | Optional, Pattern: `^[+]?[0-9\\s-]{8,20}$` |

Ces champs s'ajoutent aux champs par défaut de PocketBase (username, email, password, avatar, etc.)

---

### 3. Collection `messages` (Messagerie)

**Type:** Base collection

**Champs:**

| Nom | Type | Options |
|-----|------|---------|
| `sender` | Relation | Required, Collection: `users`, Max select: 1 |
| `receiver` | Relation | Required, Collection: `users`, Max select: 1 |
| `product` | Relation | Required, Collection: `products`, Max select: 1 |
| `content` | Text | Required, Min: 1, Max: 2000 |
| `isRead` | Bool | Required, Default: false |

**Règles d'accès:**
```javascript
// List/View
sender.id = @request.auth.id || receiver.id = @request.auth.id

// Create
@request.auth.id != "" && 
@request.data.sender = @request.auth.id && 
@request.data.receiver != @request.auth.id

// Update
sender.id = @request.auth.id

// Delete
sender.id = @request.auth.id
```

**Index recommandés:**
- `sender` (ascending)
- `receiver` (ascending)
- `product` (ascending)
- `created` (descending)

---

## 🔧 Configuration pas à pas

### Créer la collection `categories`

1. Cliquez sur **"New collection"**
2. Name: `categories`
3. Type: **Base collection**
4. Cliquez sur **"New field"** et ajoutez :
   
   **Champ `name`:**
   - Type: **Text**
   - Name: `name`
   - Required: ✅
   - Unique: ✅
   - Min: 2, Max: 100

   **Champ `slug`:**
   - Type: **Text**
   - Name: `slug`
   - Required: ✅
   - Unique: ✅
   - Pattern: `^[a-z0-9-]+$`

   **Champ `icon`:**
   - Type: **File**
   - Name: `icon`
   - Max size: 2MB
   - Allowed types: `image/*`

5. Onglet **"API Rules"** :
   - List/View rule: `allow` (ou laissez vide)
   - Create/Update/Delete: `@request.auth.id != ""`

6. Cliquez sur **"Create"**

7. Ajoutez les catégories initiales :
   - Cliquez sur **"New record"**
   - Remplissez name et slug pour chaque catégorie

---

### Créer la collection `products`

1. Cliquez sur **"New collection"**
2. Name: `products`
3. Type: **Base collection**
4. Ajoutez tous les champs listés ci-dessus
   
   **Points importants:**
   - `images` : Multiple files, Max 5
   - `category` : Relation to `categories`, Single
   - `seller` : Relation to `users`, Single
   - `views` : Default value = 0
   - `description` : Type **Editor** (richtext)

5. Onglet **"API Rules"** :
   ```javascript
   // List/View
   status = "Disponible" || seller.id = @request.auth.id
   
   // Create
   @request.auth.id != "" && @request.data.seller = @request.auth.id
   
   // Update
   seller.id = @request.auth.id
   
   // Delete
   seller.id = @request.auth.id
   ```

6. Onglet **"Indexes"** :
   - Ajoutez un index sur `category`
   - Ajoutez un index sur `seller`
   - Ajoutez un index sur `status`

7. Cliquez sur **"Create"**

---

### Étendre la collection `users`

1. Ouvrez la collection **"users"**
2. Cliquez sur **"New field"** et ajoutez :

   **Champ `name`:**
   - Type: **Text**
   - Name: `name`
   - Max: 100

   **Champ `location`:**
   - Type: **Text**
   - Name: `location`
   - Max: 100

   **Champ `phone`:**
   - Type: **Text**
   - Name: `phone`
   - Pattern: `^[+]?[0-9\\s-]{8,20}$`

3. Cliquez sur **"Save changes"**

---

### Créer la collection `messages`

1. Cliquez sur **"New collection"**
2. Name: `messages`
3. Type: **Base collection**
4. Ajoutez tous les champs listés ci-dessus

   **Points importants:**
   - `sender` : Relation to `users`, Single
   - `receiver` : Relation to `users`, Single
   - `product` : Relation to `products`, Single
   - `content` : Text, Max 2000 characters
   - `isRead` : Boolean, Default = false

5. Onglet **"API Rules"** :
   ```javascript
   // List/View
   sender.id = @request.auth.id || receiver.id = @request.auth.id
   
   // Create
   @request.auth.id != "" && @request.data.sender = @request.auth.id && @request.data.receiver != @request.auth.id
   
   // Update
   sender.id = @request.auth.id
   
   // Delete
   sender.id = @request.auth.id
   ```

6. Onglet **"Indexes"** :
   - Ajoutez un index sur `sender`
   - Ajoutez un index sur `receiver`
   - Ajoutez un index sur `product`

7. Cliquez sur **"Create"**

---

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Test des catégories:**
   ```bash
   curl http://localhost:8080/api/collections/categories/records
   ```

2. **Test de création de produit:**
   - Connectez-vous sur le frontend
   - Allez sur `/products/new`
   - Créez une annonce
   - Vérifiez dans PocketBase Admin

3. **Test de la liste:**
   - Allez sur `/products`
   - Les annonces doivent s'afficher

---

## 🔒 Sécurité des règles

### Pourquoi ces règles ?

**`categories` - allow:**
- Tout le monde peut voir les catégories (public)
- Seuls les authentifiés peuvent les créer/modifier (admin)

**`products` - Lecture conditionnelle:**
- Les produits "Disponibles" sont publics
- Les produits en brouillon ne sont visibles que par le vendeur
- Important pour ne pas exposer les brouillons

**`products` - Écriture protégée:**
- Seul le propriétaire peut modifier/supprimer
- Empêche la modification croisée entre utilisateurs
- Le vendeur est automatiquement défini lors de la création

---

## 📊 Statistiques

Champs utiles pour les statistiques futures:
- `views` : Nombre de vues (incrémenté automatiquement)
- `created` : Date de création
- `updated` : Date de dernière modification

---

## 🚨 Troubleshooting

### Erreur "Failed to create record"
- Vérifiez que tous les champs requis sont présents
- Vérifiez les règles d'accès
- Vérifiez que l'utilisateur est authentifié

### Images ne s'affichent pas
- Vérifiez que le champ `images` accepte les types `image/*`
- Vérifiez la taille max des fichiers
- Vérifiez les URLs générées par `getImageUrl()`

### Impossible de modifier un produit
- Vérifiez que vous êtes le propriétaire (`seller.id = @request.auth.id`)
- Vérifiez que vous êtes connecté

---

## 📚 Ressources

- [PocketBase Collections](https://pocketbase.io/docs/collections/)
- [PocketBase API Rules](https://pocketbase.io/docs/api-rules-and-filters/)
- [PocketBase Relations](https://pocketbase.io/docs/expand/)

---

**Configuration terminée ! Vous pouvez maintenant utiliser le système de gestion des produits ! 🎉**

