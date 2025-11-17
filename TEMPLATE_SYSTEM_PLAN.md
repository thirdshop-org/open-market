# 📋 Plan de Développement - Système de Templates de Produits

## 🎯 Objectif

Implémenter un système de templates de produits permettant aux vendeurs de créer des templates réutilisables avec des champs personnalisés (type string uniquement pour cette version).

## 🏗️ Architecture

### Concept

- **Template** : Un produit sans `parentId` qui sert de modèle
- **Produit** : Un produit avec un `parentId` créé à partir d'un template
- **Champs obligatoires** : Définis par le superadmin (images, titre, état, prix, devise, statut)
- **Champs personnalisés** : Définis par les vendeurs pour leurs templates

### Collections PocketBase

```
products (existante)
  ├── parentId (relation → products) // null = template, non-null = produit
  └── ... (champs existants)

fields (nouvelle)
  ├── label (string) // Ex: "Référence interne", "Compatibilité"
  ├── parentId (relation → fields) // Pour hiérarchie (optionnel)
  ├── isDefault (bool) // Champ obligatoire du système
  ├── createdByAdmin (bool) // Créé par superadmin
  ├── userId (relation → users) // Créateur du champ
  └── created, updated

productsFields (nouvelle)
  ├── productId (relation → products)
  ├── fieldId (relation → fields)
  ├── fieldValue (string) // UNIQUEMENT STRING
  ├── isVisibleByClients (bool)
  └── created, updated
```

---

## 📅 Phase 1 : Configuration Backend (PocketBase)

### 1.1 Créer la collection `fields`

**Via l'admin PocketBase** (`http://localhost:8080/_/`)

**Champs :**
- `id` (text, auto-généré)
- `label` (text, required, min: 2, max: 100) - Nom du champ
- `parentId` (relation → fields, optional) - Pour hiérarchie de champs
- `isDefault` (bool, default: false) - Champ obligatoire système
- `createdByAdmin` (bool, default: false) - Créé par admin
- `userId` (relation → users, optional) - Créateur si custom
- `created` (autodate)
- `updated` (autodate)

**Règles d'accès :**
```javascript
// List Rule
@request.auth.id != ""

// View Rule
@request.auth.id != ""

// Create Rule
@request.auth.id != "" && userId = @request.auth.id

// Update Rule
@request.auth.id != "" && userId = @request.auth.id && isDefault = false

// Delete Rule
@request.auth.id != "" && userId = @request.auth.id && isDefault = false
```

### 1.2 Créer la collection `productsFields`

**Champs :**
- `id` (text, auto-généré)
- `productId` (relation → products, required)
- `fieldId` (relation → fields, required)
- `fieldValue` (text, max: 500) - **UNIQUEMENT STRING**
- `isVisibleByClients` (bool, default: true)
- `created` (autodate)
- `updated` (autodate)

**Règles d'accès :**
```javascript
// List Rule
@request.auth.id != ""

// View Rule
@request.auth.id != ""

// Create Rule
@request.auth.id != "" && 
@request.data.productId.seller = @request.auth.id

// Update Rule
@request.auth.id != "" && 
productId.seller = @request.auth.id

// Delete Rule
@request.auth.id != "" && 
productId.seller = @request.auth.id
```

### 1.3 Créer les champs obligatoires par défaut

**Via l'admin PocketBase, créer manuellement dans `fields` :**

1. **   **
   - label: "Prix"
   - isDefault: true
   - createdByAdmin: true

2. **Devise**
   - label: "Devise"
   - isDefault: true
   - createdByAdmin: true

3. **État**
   - label: "État"
   - isDefault: true
   - createdByAdmin: true

4. **Statut**
   - label: "Statut"
   - isDefault: true
   - createdByAdmin: true

5. **Images**
   - label: "Images"
   - isDefault: true
   - createdByAdmin: true

6. **Titre**
   - label: "Titre"
   - isDefault: true
   - createdByAdmin: true

7. **Description**
   - label: "Description"
   - isDefault: true
   - createdByAdmin: true

8. **Localisation**
   - label: "Localisation"
   - isDefault: true
   - createdByAdmin: true

---

## 🎨 Phase 2 : Services API (Frontend)

### 2.1 Créer `frontend/src/lib/templates.ts`

**Fonctions à implémenter :**

```typescript
// Templates (produits sans parentId)
export async function fetchUserTemplates(userId: string)
export async function createTemplate(data: CreateTemplateData)
export async function updateTemplate(id: string, data: UpdateTemplateData)
export async function deleteTemplate(id: string)
export async function getTemplateById(id: string)

// Champs
export async function fetchDefaultFields()
export async function fetchUserFields(userId: string)
export async function createField(label: string, userId: string)
export async function deleteField(id: string)

// Association champs ↔ produits
export async function getProductFields(productId: string)
export async function attachFieldToProduct(productId: string, fieldId: string, value: string, isVisible: boolean)
export async function updateProductField(productFieldId: string, value: string)
export async function deleteProductField(productFieldId: string)
```

**Types à définir :**

```typescript
interface Field {
  id: string;
  label: string;
  parentId?: string;
  isDefault: boolean;
  createdByAdmin: boolean;
  userId?: string;
  created: string;
  updated: string;
}

interface ProductField {
  id: string;
  productId: string;
  fieldId: string;
  fieldValue: string; // STRING ONLY
  isVisibleByClients: boolean;
  expand?: {
    fieldId: Field;
  };
}

interface Template {
  // C'est un produit avec parentId = null
  id: string;
  title: string;
  description: string;
  // ... autres champs de products
  parentId: null; // Important !
}
```

---

## 🧩 Phase 3 : Composants React

### 3.1 `frontend/src/components/TemplateList.tsx`

**Fonctionnalités :**
- Afficher la liste des templates du vendeur
- Bouton "+ Créer un template"
- Carte par template avec :
  - Titre du template
  - Nombre de champs personnalisés
  - Actions : Éditer, Supprimer, Utiliser
- État vide si aucun template

**UI :**
- Utiliser `Card` de shadcn/ui
- Grille responsive
- Badges pour indiquer le nombre de champs

### 3.2 `frontend/src/components/TemplateForm.tsx`

**Fonctionnalités :**
- Formulaire de création/édition de template
- Section "Informations de base" :
  - Titre du template
  - Description
- Section "Champs obligatoires" (affichage info uniquement)
- Section "Champs personnalisés" :
  - Liste des champs ajoutés
  - Input pour ajouter un nouveau champ
  - Possibilité de supprimer un champ
  - Définir une valeur par défaut (optionnel)

**UI :**
- Formulaire en plusieurs sections
- Utiliser `Input`, `Button`, `Label` de shadcn/ui
- Icônes avec lucide-react (Plus, Trash, Info)

### 3.3 `frontend/src/components/CustomFieldManager.tsx`

**Fonctionnalités :**
- Gérer les champs personnalisés d'un template
- Input "Nom du champ" + bouton "Ajouter"
- Liste des champs avec possibilité de :
  - Supprimer
  - Définir valeur par défaut
  - Toggle visibilité client

**UI :**
- Liste interactive
- Badges pour les champs
- Boutons d'action discrets

### 3.4 Modifier `frontend/src/components/ProductForm.tsx`

**Ajouts :**
- En haut : Sélecteur "Utiliser un template" (dropdown)
- Si template sélectionné :
  - Charger les champs du template
  - Pré-remplir avec valeurs par défaut
- Section "Champs personnalisés" :
  - Afficher champs du template
  - Permettre d'ajouter des champs à la volée
- Lors de la sauvegarde :
  - Créer le produit avec `parentId = templateId`
  - Créer les entrées dans `productsFields`

### 3.5 Modifier `frontend/src/components/ProductDetail.tsx`

**Ajouts :**
- Section "Caractéristiques" ou "Informations supplémentaires"
- Charger les champs via `getProductFields(productId)`
- Afficher uniquement les champs où `isVisibleByClients = true`
- Organiser en grille ou liste :
  - Label du champ : Valeur

---

## 📄 Phase 4 : Pages

### 4.1 Créer `frontend/src/pages/dashboard/templates.astro`

```astro
---
import Seller from '@/layouts/dashboard/seller.astro';
import { TemplateList } from '@/components/TemplateList';

const template = {
  title: "Mes templates - Dashboard - Open Market",
};
---

<Seller title={template.title} pageTitle="Mes templates">
  <TemplateList client:load />
</Seller>
```

### 4.2 Créer `frontend/src/pages/dashboard/templates/new.astro`

```astro
---
import Seller from '@/layouts/dashboard/seller.astro';
import { TemplateForm } from '@/components/TemplateForm';

const template = {
  title: "Créer un template - Dashboard - Open Market",
};
---

<Seller title={template.title} pageTitle="Créer un template">
  <TemplateForm client:load />
</Seller>
```

### 4.3 Créer `frontend/src/pages/dashboard/templates/[id]/edit.astro`

```astro
---
import Seller from '@/layouts/dashboard/seller.astro';
import { TemplateForm } from '@/components/TemplateForm';

const { id } = Astro.params;

const template = {
  title: "Éditer le template - Dashboard - Open Market",
};
---

<Seller title={template.title} pageTitle="Éditer le template">
  <TemplateForm client:load templateId={id} />
</Seller>
```

---

## 🧭 Phase 5 : Navigation

### 5.1 Modifier `frontend/src/components/SideBar.tsx`

**Ajouter dans le menu seller :**

```tsx
{
  title: "Mes templates",
  href: "/dashboard/templates",
  icon: Package, // ou FileTemplate
}
```

**Position :** Entre "Articles en ligne" et "Commandes"

---

## 🧪 Phase 6 : Tests et Validation

### 6.1 Checklist fonctionnelle

**Templates :**
- [ ] Créer un template avec titre et description
- [ ] Ajouter des champs personnalisés au template
- [ ] Modifier un template existant
- [ ] Supprimer un template
- [ ] Voir la liste de mes templates

**Champs :**
- [ ] Ajouter un champ personnalisé (string)
- [ ] Supprimer un champ personnalisé
- [ ] Définir une valeur par défaut pour un champ
- [ ] Toggle visibilité client d'un champ

**Produits :**
- [ ] Créer un produit à partir d'un template
- [ ] Les champs du template sont pré-remplis
- [ ] Ajouter des champs supplémentaires à la volée
- [ ] Modifier les valeurs des champs
- [ ] Afficher les champs dans le détail produit (vue client)

### 6.2 Tests de permissions

- [ ] Seul le créateur peut modifier/supprimer son template
- [ ] Seul le créateur peut modifier/supprimer ses champs custom
- [ ] Les champs par défaut ne peuvent pas être modifiés
- [ ] Les champs par défaut ne peuvent pas être supprimés
- [ ] Un vendeur ne voit que ses propres templates

### 6.3 Tests d'edge cases

- [ ] Template sans champs personnalisés
- [ ] Produit sans template (création manuelle)
- [ ] Supprimer un champ utilisé dans des produits
- [ ] Valeur de champ vide
- [ ] Champs très longs (> 500 caractères)

---

## 📱 Phase 7 : UX et Polish

### 7.1 Interface utilisateur

**Design :**
- Cohérence avec le design system shadcn/ui existant
- Couleurs : Utiliser les variables CSS du thème
- Espacement : Classes Tailwind cohérentes
- Typographie : Respecter la hiérarchie existante

**Animations :**
- Transitions douces pour l'ajout/suppression de champs
- Loading states pour les requêtes API
- Feedback visuel sur les actions (toasts)

### 7.2 Messages et validation

**Validation :**
- Titre du template requis (min 5 caractères)
- Label de champ requis (min 2 caractères)
- Valeur de champ max 500 caractères
- Messages d'erreur clairs et en français

**Confirmations :**
- Confirmer avant de supprimer un template
- Confirmer avant de supprimer un champ utilisé
- Succès : "Template créé avec succès"
- Erreur : "Impossible de créer le template"

### 7.3 États vides

- **Aucun template** : Message + illustration + CTA "Créer mon premier template"
- **Aucun champ custom** : Message explicatif sur l'utilité des champs
- **Chargement** : Skeletons pour les cartes de templates

---

## 🚀 Phase 8 : Documentation

### 8.1 Documentation technique

**Fichiers à créer/mettre à jour :**
- `TEMPLATE_SYSTEM.md` : Guide complet du système
- `README.md` : Ajouter section "Gestion des templates"
- Commentaires dans le code (JSDoc)

**Contenu :**
- Architecture des collections
- Flow de création d'un produit avec template
- Exemples d'utilisation de l'API
- Diagrammes de relations

### 8.2 Documentation utilisateur

**Guide utilisateur (dans l'app) :**
- Tooltip explicatifs
- Page d'aide "Comment créer un template ?"
- Exemples de templates types
- FAQ

---

## 📋 Ordre d'exécution recommandé

### Sprint 1 : Backend et API (2-3 jours)
1. ✅ Créer collection `fields` dans PocketBase
2. ✅ Créer collection `productsFields` dans PocketBase
3. ✅ Créer les champs obligatoires par défaut
4. ✅ Implémenter `templates.ts` avec toutes les fonctions API
5. ✅ Tester les fonctions API avec des requêtes directes

### Sprint 2 : Gestion des templates (3-4 jours)
6. ✅ Créer `TemplateList.tsx`
7. ✅ Créer `TemplateForm.tsx`
8. ✅ Créer `CustomFieldManager.tsx`
9. ✅ Créer pages `/dashboard/templates/*`
10. ✅ Ajouter lien dans la navigation (`SideBar.tsx`)

### Sprint 3 : Intégration produits (2-3 jours)
11. ✅ Modifier `ProductForm.tsx` pour supporter les templates
12. ✅ Modifier `ProductDetail.tsx` pour afficher les champs
13. ✅ Tester le flow complet de création de produit

### Sprint 4 : Tests et polish (2 jours)
14. ✅ Tests fonctionnels complets
15. ✅ Tests de permissions
16. ✅ Amélioration UX et messages
17. ✅ États vides et loading states

### Sprint 5 : Documentation (1 jour)
18. ✅ Rédiger documentation technique
19. ✅ Créer guide utilisateur
20. ✅ Mise à jour du README

**Total estimé : 10-13 jours**

---

## 🎯 Critères de succès

### MVP (Minimum Viable Product)

✅ **Un vendeur peut :**
1. Créer un template avec des champs personnalisés (string)
2. Voir la liste de ses templates
3. Utiliser un template pour créer un produit
4. Les valeurs des champs sont sauvegardées
5. Les champs sont affichés dans le détail du produit

✅ **Contraintes respectées :**
- Champs obligatoires définis par le superadmin
- Seuls les champs string sont supportés
- Permissions correctement configurées
- Interface cohérente avec le reste de l'app

---

## 🔮 Améliorations futures (Post-MVP)

### Version 2.0
- [ ] Support de plusieurs types de champs (number, select, date, bool)
- [ ] Validation conditionnelle des champs
- [ ] Templates publics partagés entre vendeurs
- [ ] Import/Export de templates

### Version 3.0
- [ ] Champs calculés
- [ ] Templates avec variantes
- [ ] Analytics sur l'utilisation des templates
- [ ] Suggestions de champs basées sur la catégorie

---

## 📝 Notes importantes

### Contraintes techniques
- **PocketBase** : Version 0.32.0 minimum
- **React** : Version 19
- **Astro** : Version 5.x
- **Type safety** : Utiliser TypeScript pour tous les nouveaux fichiers

### Bonnes pratiques
- **Nommage** : Utiliser camelCase pour JS/TS, kebab-case pour les URLs
- **Composants** : Préfixe `client:load` pour les composants React interactifs
- **API** : Toujours gérer les erreurs avec try/catch
- **UX** : Toujours donner un feedback visuel (loading, success, error)

### Migration
- Les champs `condition`, `status`, `price`, `currency` restent dans `products`
- Pas de migration des données existantes nécessaire
- Compatibilité ascendante garantie

---

## 🤝 Contribution

Pour toute question ou suggestion sur ce plan :
1. Vérifier que PocketBase est bien configuré
2. Tester d'abord les endpoints API
3. Suivre l'ordre d'exécution recommandé
4. Documenter au fur et à mesure

---

**Dernière mise à jour :** Novembre 2025  
**Version du plan :** 1.0 - String fields only

