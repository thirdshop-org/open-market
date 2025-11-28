# Exemples d'utilisation du ProductForm avec Steps

## 1. Créer un lien vers le formulaire avec un template spécifique

### Dans un composant React/TSX

```tsx
import { Button } from '@/components/ui/button';

function TemplateCard({ template }: { template: { id: string, name: string } }) {
  return (
    <div className="p-4 border rounded">
      <h3>{template.name}</h3>
      <Button asChild>
        <a href={`/products/new?templateId=${template.id}`}>
          Créer un produit à partir de ce template
        </a>
      </Button>
    </div>
  );
}
```

### Dans une page Astro

```astro
---
// Liste de templates disponibles
const templates = await getTemplates(); // Votre fonction de récupération
---

<div class="grid grid-cols-3 gap-4">
  {templates.map(template => (
    <div class="p-4 border rounded">
      <h3>{template.name}</h3>
      <a 
        href={`/products/new?templateId=${template.id}`}
        class="inline-flex items-center justify-center rounded-md text-sm font-medium"
      >
        Utiliser ce template
      </a>
    </div>
  ))}
</div>
```

## 2. Navigation programmatique avec templateId

### Depuis un composant React

```tsx
import { useNavigate } from 'react-router-dom'; // ou votre router

function CreateProductButton({ templateId }: { templateId: string }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Avec le templateId
    navigate(`/products/new?templateId=${templateId}`);
    
    // Ou sans templateId (utilise le Mother Template par défaut)
    // navigate('/products/new');
  };
  
  return (
    <button onClick={handleClick}>
      Créer un produit
    </button>
  );
}
```

### Avec window.location (vanilla JS)

```tsx
function createProductFromTemplate(templateId: string) {
  window.location.href = `/products/new?templateId=${templateId}`;
}

// Utilisation
<button onClick={() => createProductFromTemplate('TEMPLATE_123')}>
  Créer un produit
</button>
```

## 3. Intégration dans une liste de templates

### Composant TemplateList complet

```tsx
import { useState, useEffect } from 'react';
import { testProductService } from '@/lib/test-product-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TemplateSelector() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        // Charger tous les templates (produits avec parentId)
        const allProducts = await testProductService.getProducts();
        // Filtrer pour ne garder que ceux qui ont un parentId (donc ce sont des templates)
        const templateList = allProducts.filter(p => p.parentId);
        setTemplates(templateList);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadTemplates();
  }, []);

  if (loading) {
    return <div>Chargement des templates...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map(template => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle>{template.name || 'Template'}</CardTitle>
            <CardDescription>
              Utilisez ce template pour créer rapidement un produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={`/products/new?templateId=${template.id}`}>
                Utiliser ce template
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
      
      {/* Option pour créer sans template spécifique */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Template par défaut</CardTitle>
          <CardDescription>
            Créer un produit avec le template par défaut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <a href="/products/new">
              Créer un produit
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 4. Page Astro pour sélectionner un template

### `/pages/products/select-template.astro`

```astro
---
import Layout from '@/layouts/main.astro';
import { TemplateSelector } from '@/components/TemplateSelector';

const template = {
  title: "Sélectionner un template - Open Market",
};
---

<Layout content={template}>
  <main class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">
        Choisissez un template
      </h1>
      <p class="text-muted-foreground mt-2">
        Sélectionnez un template pour créer votre produit plus rapidement
      </p>
    </div>
    
    <TemplateSelector client:load />
    
    <div class="mt-8 text-center">
      <p class="text-sm text-muted-foreground">
        Vous pouvez aussi 
        <a href="/products/new" class="text-primary hover:underline">
          créer un produit sans template
        </a>
      </p>
    </div>
  </main>
</Layout>
```

## 5. Édition d'un produit existant

Si vous voulez éditer un produit existant (avec les steps), vous pouvez utiliser :

```tsx
// Dans votre page d'édition
<ProductForm productId={productId} />
```

Le formulaire détectera automatiquement qu'il s'agit d'une édition et :
- Chargera les données existantes
- Commencera au step 2 (les informations obligatoires sont déjà remplies)

## 6. Workflow complet

### Scénario typique d'utilisation

1. **Page d'accueil des templates** (`/templates`)
   - L'utilisateur voit une liste de templates disponibles
   - Il clique sur "Utiliser ce template"

2. **Redirection vers le formulaire** (`/products/new?templateId=ABC123`)
   - Le formulaire charge automatiquement les champs du template
   - **Step 1** : L'utilisateur remplit les 3 champs obligatoires
   - Clic sur "Suivant" → Sauvegarde en BDD + passage au Step 2

3. **Step 2** : Informations supplémentaires
   - L'utilisateur complète les autres champs
   - Peut ajouter des champs personnalisés
   - Clic sur "Suivant" → Sauvegarde en BDD + passage au Step 3

4. **Step 3** : Configuration des stocks
   - L'utilisateur configure les stocks (global ou variants)
   - Clic sur "Terminer et publier" → Sauvegarde finale + redirection vers la page produit

## 7. Gestion des erreurs

```tsx
// Si le template n'existe pas
// Le système bascule automatiquement sur le "Mother Template"

// Si aucun Mother Template n'existe
// Une alerte est affichée à l'utilisateur

// Validation des champs obligatoires
// Au Step 1, impossible de passer au Step 2 sans remplir tous les champs
```

## 8. Personnalisation

### Modifier le nombre de champs obligatoires

Dans `ProductForm.tsx`, ligne ~87 :

```tsx
// Actuellement : les 3 premiers champs sont obligatoires
const isRequired = index < 3;

// Pour changer, modifiez la condition :
const isRequired = index < 5; // Les 5 premiers champs
```

### Changer le comportement de sauvegarde

Pour sauvegarder uniquement à la fin au lieu de chaque step, modifiez la fonction `handleNextStep` pour ne pas appeler `saveCurrentStep()`.

## Notes importantes

1. **URL Parameters** : Le templateId est récupéré via `URLSearchParams`, compatible avec tous les navigateurs modernes
2. **SSR** : Les pages Astro doivent avoir `export const prerender = false;` pour accéder aux paramètres d'URL
3. **État conservé** : Les données sont conservées lors de la navigation entre steps (pas de perte de données)
4. **Sauvegarde incrémentale** : Chaque step sauvegarde ses données, évitant la perte en cas de fermeture accidentelle

