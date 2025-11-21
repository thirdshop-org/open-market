import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { productService, categoryService, type ProductFormData, type Category } from '@/lib/products';
import { authService, pb } from '@/lib/pocketbase';
import { AlertCircle, Loader2, CheckCircle, Upload, X, Image as ImageIcon, FileText, Plus, Trash2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  fetchUserTemplates,
  getTemplateFields,
  copyTemplateFieldsToProduct,
  attachFieldToProduct,
  getProductFields,
  fetchAllFieldsForUser,
  type Template,
  type ProductField,
  type Field,
} from '@/lib/templates';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './ui/input-group';

interface Props {
  productId?: string;
}

export function ProductForm({ productId }: Props) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: 0,
    currency: 'EUR',
    category: '',
    condition: 'Occasion',
    status: 'Disponible',
    location: '',
    reference: '',
    compatibility: '',
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!productId);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // États pour les templates et champs personnalisés
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customFields, setCustomFields] = useState<Array<{ fieldId: string; label: string; value: string; isVisible: boolean }>>([]);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTemplatesAndFields();
    if (productId) {
      loadProduct();
    } else {
      // Vérifier si un template est passé en paramètre d'URL
      const urlParams = new URLSearchParams(window.location.search);
      const templateParam = urlParams.get('template');
      if (templateParam) {
        setSelectedTemplateId(templateParam);
      }
    }
  }, [productId]);

  useEffect(() => {
    if (selectedTemplateId && !productId) {
      loadTemplateData(selectedTemplateId);
    }
  }, [selectedTemplateId, productId]);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAll();
      setCategories(cats);
      if (cats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cats[0].id }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTemplatesAndFields = async () => {
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) return;

      const [userTemplates, fields] = await Promise.all([
        fetchUserTemplates(currentUser.id),
        fetchAllFieldsForUser(currentUser.id),
      ]);

      setTemplates(userTemplates);
      setAvailableFields(fields);
    } catch (error) {
      console.error('Error loading templates and fields:', error);
    }
  };

  const loadTemplateData = async (templateId: string) => {
    setLoadingTemplate(true);
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Pré-remplir le formulaire avec les données du template
      setFormData({
        title: template.title,
        description: template.description,
        price: template.price,
        currency: template.currency,
        category: template.category,
        condition: template.condition,
        status: 'Disponible',
        location: template.location,
        reference: template.reference || '',
        compatibility: template.compatibility || '',
      });

      // Charger les champs du template
      const templateFields = await getTemplateFields(templateId);
      const fieldsWithLabels = templateFields.map(tf => ({
        fieldId: tf.fieldId,
        label: tf.expand?.fieldId?.label || '',
        value: tf.fieldValue,
        isVisible: tf.isVisibleByClients,
      }));
      setCustomFields(fieldsWithLabels);

      // Charger les images du template (preview uniquement)
      if (template.images && template.images.length > 0) {
        const previews = template.images.map(img =>
          pb.files.getUrl(template, img, { thumb: '200x200' })
        );
        setImagePreviews(previews);
      }
    } catch (error) {
      console.error('Error loading template data:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement du template' });
    } finally {
      setLoadingTemplate(false);
    }
  };

  const loadProduct = async () => {
    if (!productId) return;
    
    try {
      const product = await productService.getById(productId);
      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        condition: product.condition,
        status: product.status,
        location: product.location,
        reference: product.reference || '',
        compatibility: product.compatibility || '',
      });
      
      // Charger les previews des images existantes
      if (product.images && product.images.length > 0) {
        const previews = product.images.map(img => 
          productService.getImageUrl(product, img)
        );
        setImagePreviews(previews);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement du produit' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 images autorisées' });
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Générer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      setMessage({ type: 'error', text: 'Vous devez être connecté pour créer une annonce' });
      return;
    }

    if (images.length === 0 && !productId) {
      setMessage({ type: 'error', text: 'Au moins une image est requise' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (productId) {
        // Mise à jour
        await productService.update(productId, formData, images.length > 0 ? images : undefined);
        setMessage({ type: 'success', text: 'Produit mis à jour avec succès !' });
      } else {
        // Création
        const newProduct = await productService.create(formData, images);
        
        // Sauvegarder les champs personnalisés si présents
        if (customFields.length > 0) {
          const fieldsToAttach = customFields.map(cf => ({
            fieldId: cf.fieldId,
            value: cf.value,
            isVisible: cf.isVisible,
          }));
          
          for (const field of fieldsToAttach) {
            await attachFieldToProduct(
              newProduct.id,
              field.fieldId,
              field.value,
              field.isVisible
            );
          }
        }
        
        setMessage({ type: 'success', text: 'Produit créé avec succès !' });
        
        // Réinitialiser le formulaire
        setTimeout(() => {
          window.location.href = '/dashboard/products-online';
        }, 1500);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddCustomField = () => {
    if (availableFields.length === 0) return;
    
    const firstAvailableField = availableFields.find(
      f => !customFields.some(cf => cf.fieldId === f.id)
    );
    
    if (firstAvailableField) {
      setCustomFields([...customFields, {
        fieldId: firstAvailableField.id,
        label: firstAvailableField.label,
        value: '',
        isVisible: true,
      }]);
    }
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleUpdateCustomFieldValue = (index: number, value: string) => {
    const updated = [...customFields];
    updated[index].value = value;
    setCustomFields(updated);
  };

  const handleUpdateCustomFieldVisibility = (index: number, isVisible: boolean) => {
    const updated = [...customFields];
    updated[index].isVisible = isVisible;
    setCustomFields(updated);
  };

  const handleChangeCustomFieldId = (index: number, newFieldId: string) => {
    const field = availableFields.find(f => f.id === newFieldId);
    if (!field) return;
    
    const updated = [...customFields];
    updated[index] = {
      ...updated[index],
      fieldId: newFieldId,
      label: field.label,
    };
    setCustomFields(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 container mx-auto">
      {/* Message de retour */}
      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

{/* Images */}
<Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            Ajoutez jusqu'à 5 images de votre produit (requis)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Preview des images */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            {imagePreviews.length < 5 && (
              <div>
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour ajouter des images
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG jusqu'à 5MB
                    </p>
                  </div>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
          <CardDescription>Décrivez votre produit en détail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={loading}
              rows={6}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Décrivez en détail l'état, les caractéristiques et tout autre information importante..."
            />
          </div>

        </CardContent>
      </Card>

      {/* Catégorie et état */}
      <Card>
        <CardHeader>
          <CardTitle>Catégorie et état</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">État *</Label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Neuf">Neuf</option>
                <option value="Occasion">Occasion</option>
                <option value="Reconditionné">Reconditionné</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prix */}
      <Card>
        <CardHeader>
          <CardTitle>Prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="price">Prix *</Label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>€</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput placeholder="0.00" name="price" value={formData.price} onChange={handleChange} required disabled={loading} />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>EUR</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {productId ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            productId ? 'Mettre à jour' : 'Créer l\'annonce'
          )}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/dashboard/products-online">Annuler</a>
        </Button>
      </div>
    </form>
  );
}