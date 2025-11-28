# Système de Steps pour ProductForm

## Description

Le formulaire de création de produit a été mis à jour avec un système de steps (étapes) qui permet de :
1. Remplir les informations obligatoires du template (Step 1)
2. Ajouter des informations supplémentaires et des champs personnalisés (Step 2)
3. Configurer les stocks du produit (Step 3)

## Fonctionnalités

### Sauvegarde automatique
- **À chaque passage au step suivant**, les données sont automatiquement sauvegardées en base de données
- Le produit est créé dès le passage du Step 1 au Step 2
- Les modifications sont sauvegardées progressivement

### Récupération des paramètres d'URL
Le formulaire peut maintenant récupérer le `templateId` depuis l'URL :

```
/products/new?templateId=TEMPLATE_ID
/dashboard/products/new?templateId=TEMPLATE_ID
```

Si aucun templateId n'est fourni, le système utilise automatiquement le "Mother Template" par défaut.

## Steps en détail

### Step 1 : Informations obligatoires
- Affiche uniquement les **3 premiers champs** du template
- Ces champs sont marqués comme obligatoires
- Impossible de passer au Step 2 sans remplir tous ces champs
- **Sauvegarde** : création du produit et des champs obligatoires en BDD

### Step 2 : Informations supplémentaires
- Affiche les autres champs hérités du template
- Permet d'ajouter des champs personnalisés via un dialogue
- Les champs personnalisés peuvent être supprimés
- **Sauvegarde** : mise à jour des champs en BDD

### Step 3 : Configuration des stocks
- Permet de choisir entre :
  - **Stock global** : une seule quantité pour tout le produit
  - **Stocks par variants** : différentes quantités selon les combinaisons de valeurs (ex: Rouge-M, Rouge-L, etc.)
- **Sauvegarde finale** : création des entrées de stock et redirection vers la page produit

## Navigation

- **Bouton "Suivant"** : valide les champs obligatoires (Step 1), sauvegarde et passe à l'étape suivante
- **Bouton "Précédent"** : retour à l'étape précédente (sans perte de données)
- **Bouton "Annuler"** : retour à la page précédente
- **Bouton "Terminer et publier"** : sauvegarde finale et redirection (Step 3)

## Indicateur visuel

Un indicateur de progression vertical affiche :
- ✓ Les étapes complétées (avec checkmark vert)
- L'étape actuelle (numéro avec bordure colorée)
- Les étapes à venir (numéro grisé)

## Structure technique

### Props du composant
```typescript
ProductForm({ 
  productId?: string,      // Pour l'édition d'un produit existant
  templateId?: string      // ID du template à utiliser
})
```

### State principal
- `currentStep`: Step actuel (1, 2 ou 3)
- `productId`: ID du produit créé (généré au Step 1)
- `fields`: Liste des champs avec leurs valeurs
- `stockMode`: 'global' ou 'variants'
- `variants`: Liste des variants de stock

### Fonctions clés
- `saveCurrentStep()`: Sauvegarde les données du step actuel
- `handleNextStep()`: Valide, sauvegarde et passe au step suivant
- `handlePreviousStep()`: Retour au step précédent
- `handleSave()`: Sauvegarde finale avec les stocks

## Exemples d'utilisation

### Créer un produit depuis un template spécifique
```html
<a href="/products/new?templateId=ABC123">
  Créer un produit à partir de ce template
</a>
```

### Créer un produit avec le template par défaut
```html
<a href="/products/new">
  Créer un nouveau produit
</a>
```

### Dans une page Astro
```astro
---
export const prerender = false;
const templateId = Astro.url.searchParams.get('templateId');
---

<ProductForm client:load templateId={templateId || undefined} />
```

## Points d'attention

1. **Champs obligatoires** : Les 3 premiers champs du template sont automatiquement marqués comme obligatoires
2. **Images** : Le système gère les champs de type IMAGES mais l'upload réel reste à implémenter
3. **Variants** : Seuls les champs de type SELECT peuvent être utilisés pour les variants
4. **Navigation** : Les données sont conservées lors de la navigation entre steps

## Améliorations futures possibles

- [ ] Ajout d'un système de brouillon
- [ ] Validation personnalisée par type de champ
- [ ] Upload d'images fonctionnel
- [ ] Prévisualisation du produit avant publication
- [ ] Possibilité de définir quels champs sont obligatoires

