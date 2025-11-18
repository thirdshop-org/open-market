import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categoryService, type Category } from '@/lib/products';
import { 
  createTemplate, 
  updateTemplate, 
  getTemplateById,
  createField,
  attachFieldToProduct,
  type CreateTemplateData 
} from '@/lib/templates';
import { pb } from '@/lib/pocketbase';
import { AlertCircle, Loader2, CheckCircle, Upload, X, Image as ImageIcon, Info, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { CustomFieldManager } from '@/components/CustomFieldManager';

interface Props {
  templateId?: string;
}

export function TemplateForm({ templateId }: Props) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    currency: 'EUR',
    category: '',
    condition: 'Occasion',
    location: '',
    reference: '',
    compatibility: '',
    quantity: 1,
  });
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!templateId);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Gestion des champs en mode création
  const [pendingFields, setPendingFields] = useState<Array<{ label: string; value: string; isVisible: boolean }>>([]);

  useEffect(() => {
    loadCategories();
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

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

  const loadTemplate = async () => {
    if (!templateId) return;
    
    try {
      const template = await getTemplateById(templateId);
      setFormData({
        title: template.title,
        description: template.description,
        price: template.price,
        currency: template.currency,
        category: template.category,
        condition: template.condition,
        location: template.location,
        reference: template.reference || '',
        compatibility: template.compatibility || '',
        quantity: template.quantity || 1,
      });
      
      // Charger les images existantes
      if (template.images && template.images.length > 0) {
        setExistingImages(template.images);
        const previews = template.images.map(img => 
          pb.files.getUrl(template, img, { thumb: '200x200' })
        );
        setImagePreviews(previews);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement du template' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || 0 : value 
    }));
    setMessage({ type: '', text: '' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const totalImages = imagePreviews.length + files.length;
    if (totalImages > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 images autorisées' });
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setMessage({ type: '', text: '' });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || formData.title.length < 5) {
      setMessage({ type: 'error', text: 'Le titre doit contenir au moins 5 caractères' });
      return;
    }
    
    if (!formData.description || formData.description.length < 20) {
      setMessage({ type: 'error', text: 'La description doit contenir au moins 20 caractères' });
      return;
    }
    
    if (formData.price <= 0) {
      setMessage({ type: 'error', text: 'Le prix doit être supérieur à 0' });
      return;
    }
    
    if (!templateId && images.length === 0) {
      setMessage({ type: 'error', text: 'Au moins une image est requise' });
      return;
    }

    if (!formData.category) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une catégorie' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) {
        setMessage({ type: 'error', text: 'Vous devez être connecté' });
        setLoading(false);
        return;
      }

      if (templateId) {
        // Mode édition
        const updateData: any = {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          category: formData.category,
          condition: formData.condition,
          location: formData.location,
          reference: formData.reference,
          compatibility: formData.compatibility,
          quantity: formData.quantity,
        };

        if (images.length > 0) {
          updateData.images = images;
        }

        await updateTemplate(templateId, updateData);
        setMessage({ type: 'success', text: 'Template mis à jour avec succès !' });
        
        setTimeout(() => {
          window.location.href = '/dashboard/templates';
        }, 1500);
      } else {
        // Mode création
        const templateData: CreateTemplateData = {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          currency: formData.currency,
          images: images,
          category: formData.category,
          condition: formData.condition,
          location: formData.location,
          status: 'Brouillon',
          reference: formData.reference,
          compatibility: formData.compatibility,
          quantity: formData.quantity,
        };

        const newTemplate = await createTemplate(templateData, currentUser.id);
        
        // Sauvegarder les champs pendants si présents
        if (pendingFields.length > 0) {
          for (const field of pendingFields) {
            try {
              // Créer le champ
              const newField = await createField(field.label, currentUser.id);
              // Attacher au template
              await attachFieldToProduct(newTemplate.id, newField.id, field.value, field.isVisible);
            } catch (err) {
              console.error('Erreur lors de la sauvegarde d\'un champ:', err);
              // Continue avec les autres champs même si un échoue
            }
          }
        }
        
        setMessage({ type: 'success', text: 'Template créé avec succès !' });
        
        setTimeout(() => {
          window.location.href = `/dashboard/templates/${newTemplate.id}/edit`;
        }, 1500);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error?.message || 'Erreur lors de la sauvegarde du template' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de notification */}
      {message.text && (
        <div 
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
            <CardDescription>
              Définissez les informations principales de votre template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre du template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: MacBook Pro 2021"
                required
                minLength={5}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 5 caractères, maximum 200
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez votre template..."
                required
                minLength={20}
                rows={5}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 20 caractères
              </p>
            </div>

            {/* Prix et Devise */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Prix <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Catégorie et Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Catégorie <span className="text-red-500">*</span>
                </Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sélectionner</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">
                  État <span className="text-red-500">*</span>
                </Label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Neuf">Neuf</option>
                  <option value="Occasion">Occasion</option>
                  <option value="Reconditionné">Reconditionné</option>
                </select>
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Localisation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Paris, France"
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Champs optionnels */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Référence</Label>
                <Input
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Référence interne"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compatibility">Compatibilité</Label>
              <Input
                id="compatibility"
                name="compatibility"
                value={formData.compatibility}
                onChange={handleChange}
                placeholder="Ex: Compatible avec MacBook Pro 2020-2023"
                maxLength={200}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Ajoutez jusqu'à 5 images pour votre template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview des images */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            {imagePreviews.length < 5 && (
              <div className="border-2 border-dashed border-muted rounded-lg p-6">
                <label htmlFor="images" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour ajouter des images
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({imagePreviews.length}/5 images)
                  </span>
                </label>
                <input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Champs personnalisés */}
        {templateId && (
          <CustomFieldManager templateId={templateId} />
        )}

        {/* Gestionnaire de champs en mode création */}
        {!templateId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Champs personnalisés (optionnel)</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingFields([...pendingFields, { label: '', value: '', isVisible: true }])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un champ
                </Button>
              </CardTitle>
              <CardDescription>
                Ajoutez des champs spécifiques à ce template. Ils seront sauvegardés avec le template.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun champ personnalisé.</p>
                  <p className="text-xs mt-1">Les champs obligatoires (titre, prix, images...) sont inclus automatiquement.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingFields.map((field, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const updated = [...pendingFields];
                            updated[index].label = e.target.value;
                            setPendingFields(updated);
                          }}
                          placeholder="Nom du champ (ex: Référence interne)"
                          maxLength={100}
                        />
                        <Input
                          value={field.value}
                          onChange={(e) => {
                            const updated = [...pendingFields];
                            updated[index].value = e.target.value;
                            setPendingFields(updated);
                          }}
                          placeholder="Valeur par défaut (optionnel)"
                          maxLength={500}
                        />
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.isVisible}
                            onChange={(e) => {
                              const updated = [...pendingFields];
                              updated[index].isVisible = e.target.checked;
                              setPendingFields(updated);
                            }}
                            className="w-4 h-4"
                          />
                          {field.isVisible ? (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Visible aux clients
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="h-3 w-3" />
                              Caché aux clients
                            </span>
                          )}
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingFields(pendingFields.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.href = '/dashboard/templates'}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>{templateId ? 'Mettre à jour' : 'Créer le template'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

