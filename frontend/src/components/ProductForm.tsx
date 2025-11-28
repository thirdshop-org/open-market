import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import ImagesField from './form/ImagesField';
import SelectField from './form/SelectField';
import TextField from './form/TextField';
import NumberField from './form/NumberField';
import {
  testProductService,
  type TestProduct,
  type TestField,
  type TestProductField,
  FieldType
} from '../lib/test-product-service';

// Helper type for form state
type FieldWithValues = TestField & {
  productFieldId?: string; // ID of the testProductsFields record if it exists
  value?: string;
  images?: string[];
  isInherited: boolean;
  isRequired?: boolean; // Pour identifier les champs obligatoires
}

type Step = 1 | 2 | 3;

export function ProductForm({ productId: initialProductId, templateId: propTemplateId }: { productId?: string, templateId?: string }) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [productId, setProductId] = useState<string | undefined>(initialProductId);
  const [templateId, setTemplateId] = useState<string | undefined>(propTemplateId);
  const [fields, setFields] = useState<FieldWithValues[]>([]);
  const [stockMode, setStockMode] = useState<'global' | 'variants'>('global');
  const [variants, setVariants] = useState<{ id: string, quantity: number, fieldValues: Record<string, string> }[]>([]);
  const [globalStock, setGlobalStock] = useState<number>(0);

  // Récupérer le templateId depuis l'URL au montage
  useEffect(() => {
    if (!propTemplateId) {
      const urlParams = new URLSearchParams(window.location.search);
      const templateIdFromUrl = urlParams.get('templateId');
      if (templateIdFromUrl) {
        setTemplateId(templateIdFromUrl);
      }
    }
  }, [propTemplateId]);

  // Helper to get fields suitable for variants (e.g. Select fields)
  const variantFields = useMemo(() => fields.filter(f => f.type === FieldType.SELECT), [fields]);

  // Filtrer les champs par step
  const requiredFields = useMemo(() => fields.filter(f => f.isInherited && f.isRequired), [fields]);
  const inheritedFields = useMemo(() => fields.filter(f => f.isInherited), [fields]);
  const customFields = useMemo(() => fields.filter(f => !f.isInherited), [fields]);

  // State for new variant creation
  const [newVariantValues, setNewVariantValues] = useState<Record<string, string>>({});
  const [newVariantQuantity, setNewVariantQuantity] = useState<number>(0);

  // Dialog state for new field
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>(FieldType.TEXT);
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]); // For select type

  async function init() {
    setLoading(true);
    try {

      console.log("init", productId, templateId);
      let effectiveTemplateId = templateId;

      // Si on a un productId, charger les données existantes
      if (productId) {
        await loadExistingProduct(productId);
        return;
      }

      // 1. Determine Template ID
      if (templateId) {
        // Verify it exists
        try {
          await testProductService.getProduct(templateId);
        } catch (error) {
          console.error("Template not found:", error);
          alert("Template not found. Falling back to default.");
          effectiveTemplateId = ""; // Trigger fallback
        }
      }

      if (!effectiveTemplateId) {
        // Fallback to Mother Template
        try {
          const motherTemplate = await testProductService.getMotherTemplate();
          effectiveTemplateId = motherTemplate.id;
          console.log("Using Mother Template:", effectiveTemplateId);
        } catch (error) {
          console.error("No mother template found:", error);
          alert("No default template found. Please contact admin.");
          return; // Cannot proceed without a template structure
        }
      }

      // 2. Load Template Fields (Inherited)
      // Get all product fields for the template
      const templateProductFields = await testProductService.getProductFields(effectiveTemplateId);

      // Map them to our state format
      const inheritedFields: FieldWithValues[] = templateProductFields.map((tpf, index) => {
        const fieldDef = tpf.expand?.fieldId;
        if (!fieldDef) return null;

        // Marquer les 3 premiers champs comme obligatoires
        const isRequired = index < 3;

        return {
          ...fieldDef,
          productFieldId: undefined, // New product, so no ID yet
          value: '', // Empty value for the new product
          images: [],
          isInherited: true,
          isRequired
        };
      }).filter(Boolean) as FieldWithValues[];

      setFields(inheritedFields);

    } catch (error) {
      console.error('Error initializing form:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingProduct(id: string) {
    try {
      const product = await testProductService.getProduct(id);
      const productFields = await testProductService.getProductFields(id);
      const productStocks = await testProductService.getProductStocks(id);

      // Charger les champs avec leurs valeurs
      const loadedFields: FieldWithValues[] = productFields.map((pf, index) => {
        const fieldDef = pf.expand?.fieldId;
        if (!fieldDef) return null;

        return {
          ...fieldDef,
          productFieldId: pf.id,
          value: pf.value || '',
          images: pf.images || [],
          isInherited: true, // TODO: déterminer si c'est hérité ou custom
          isRequired: index < 3
        };
      }).filter(Boolean) as FieldWithValues[];

      setFields(loadedFields);

      // Charger les stocks
      if (productStocks.length > 0) {
        if (productStocks[0].productFieldIds.length === 0) {
          setStockMode('global');
          setGlobalStock(productStocks[0].quantity);
        } else {
          setStockMode('variants');
          // TODO: Charger les variants
        }
      }

      // Si on a des données, on peut passer au step 2 ou 3
      setCurrentStep(2);
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  useEffect(() => {
    // Always run init, even if templateId is undefined (to trigger fallback)
    if (templateId !== undefined) {
      init();
    }
  }, [templateId]);

  const handleFieldChange = (fieldId: string, value: string | number | string[]) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;

      if (f.type === FieldType.IMAGES) {
        return { ...f, images: value as string[] };
      } else {
        return { ...f, value: String(value) };
      }
    }));
  };

  const handleAddNewField = async () => {
    try {
      // 1. Create the global field definition
      const newField = await testProductService.createField({
        label: newFieldLabel,
        type: newFieldType,
        options: newFieldType === FieldType.SELECT ? newFieldOptions : undefined
      });

      // 2. Add to local state
      setFields(prev => [...prev, {
        ...newField,
        value: '',
        images: [],
        isInherited: false,
        isRequired: false
      }]);

      // Reset and close dialog
      setNewFieldLabel('');
      setNewFieldType(FieldType.TEXT);
      setNewFieldOptions([]);
      setIsAddFieldOpen(false);
    } catch (error) {
      console.error('Error creating field:', error);
    }
  };

  // Fonction pour sauvegarder les champs du step actuel
  async function saveCurrentStep() {
    setLoading(true);
    try {
      // 1. Créer le produit si pas encore créé
      if (!productId) {
        const product = await testProductService.createProduct({
          parentId: templateId
        });
        setProductId(product.id);

        // Sauvegarder les champs obligatoires (step 1)
        for (const field of requiredFields) {
          if (!field.value && field.type !== FieldType.IMAGES) continue;
          if (field.type === FieldType.IMAGES && (!field.images || field.images.length === 0)) continue;

          const formData = new FormData();
          formData.append('productId', product.id);
          formData.append('fieldId', field.id);

          if (field.type === FieldType.IMAGES && field.images) {
            // TODO: gérer l'upload d'images
          } else {
            formData.append('value', String(field.value || ''));
          }

          const createdField = await testProductService.createProductField(formData);
          // Mettre à jour l'ID du productField dans le state
          setFields(prev => prev.map(f => 
            f.id === field.id ? { ...f, productFieldId: createdField.id } : f
          ));
        }
        return product.id;
      } else {
        // Mettre à jour les champs existants
        let fieldsToSave: FieldWithValues[] = [];
        
        if (currentStep === 1) {
          fieldsToSave = requiredFields;
        } else if (currentStep === 2) {
          // Au step 2, sauvegarder tous les champs qui ont une valeur (sauf ceux déjà sauvegardés au step 1)
          fieldsToSave = fields.filter(f => {
            if (f.type === FieldType.IMAGES) {
              return f.images && f.images.length > 0;
            }
            return f.value && f.value.trim() !== '';
          });
        }
        
        for (const field of fieldsToSave) {
          const formData = new FormData();
          formData.append('productId', productId);
          formData.append('fieldId', field.id);

          if (field.type === FieldType.IMAGES && field.images) {
            // TODO: gérer l'upload d'images
            // Pour le moment, on skip les images
            continue;
          } else {
            formData.append('value', String(field.value || ''));
          }

          if (field.productFieldId) {
            // Mettre à jour un champ existant
            await testProductService.updateProductField(field.productFieldId, formData);
          } else {
            // Créer un nouveau champ
            const createdField = await testProductService.createProductField(formData);
            setFields(prev => prev.map(f => 
              f.id === field.id ? { ...f, productFieldId: createdField.id } : f
            ));
          }
        }
        return productId;
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Error saving data');
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Navigation entre les steps
  async function handleNextStep() {
    try {
      // Valider les champs obligatoires pour le step 1
      if (currentStep === 1) {
        const hasEmptyRequired = requiredFields.some(f => {
          if (f.type === FieldType.IMAGES) {
            return !f.images || f.images.length === 0;
          }
          return !f.value || f.value.trim() === '';
        });

        if (hasEmptyRequired) {
          alert('Veuillez remplir tous les champs obligatoires');
          return;
        }
      }

      // Sauvegarder avant de passer au step suivant
      await saveCurrentStep();
      
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as Step);
      }
    } catch (error) {
      console.error('Error moving to next step:', error);
    }
  }

  function handlePreviousStep() {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      // S'assurer que le produit est créé et que tous les champs sont sauvegardés
      const effectiveProductId = await saveCurrentStep();
      
      if (!effectiveProductId) {
        throw new Error('Product ID not found');
      }

      // 3. Create Stocks (Step 3)
      if (stockMode === 'global') {
        await testProductService.createProductStock({
          productId: effectiveProductId,
          quantity: globalStock,
          productFieldIds: [] // Global stock
        });
      } else {
        for (const variant of variants) {
          const relevantProductFieldIds: string[] = [];

          for (const [vFieldId, vValue] of Object.entries(variant.fieldValues)) {
            // Create a new product field for this specific variant value
            const formData = new FormData();
            formData.append('productId', effectiveProductId);
            formData.append('fieldId', vFieldId);
            formData.append('value', vValue);
            const pf = await testProductService.createProductField(formData);
            relevantProductFieldIds.push(pf.id);
          }

          await testProductService.createProductStock({
            productId: effectiveProductId,
            quantity: variant.quantity,
            productFieldIds: relevantProductFieldIds
          });
        }
      }

      // Success
      alert('Product created successfully!');
      // Redirection vers la page du produit
      window.location.href = `/products/${effectiveProductId}`;
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    } finally {
      setLoading(false);
    }
  }

  const handleAddVariant = () => {
    if (newVariantQuantity <= 0) return;
    // Validate that all variant fields are selected? Or at least one?
    // Let's require at least one.
    if (Object.keys(newVariantValues).length === 0) return;

    setVariants(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      quantity: newVariantQuantity,
      fieldValues: { ...newVariantValues }
    }]);

    setNewVariantQuantity(0);
    setNewVariantValues({});
  };


  if (loading) return <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Chargement...</p>
    </div>
  </div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep > 1 ? 'bg-primary border-primary text-primary-foreground' : currentStep === 1 ? 'border-primary' : 'border-muted'}`}>
                {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">Informations obligatoires</p>
                <p className="text-xs text-muted-foreground">Champs du template</p>
              </div>
            </div>
            <div className={`ml-4 mt-2 h-12 border-l-2 ${currentStep > 1 ? 'border-primary' : 'border-muted'}`}></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep > 2 ? 'bg-primary border-primary text-primary-foreground' : currentStep === 2 ? 'border-primary' : 'border-muted'}`}>
                {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">Informations supplémentaires</p>
                <p className="text-xs text-muted-foreground">Ajoutez des champs personnalisés</p>
              </div>
            </div>
            <div className={`ml-4 mt-2 h-12 border-l-2 ${currentStep > 2 ? 'border-primary' : 'border-muted'}`}></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === 3 ? 'border-primary' : 'border-muted'}`}>
                3
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">Configuration des stocks</p>
                <p className="text-xs text-muted-foreground">Gérez vos stocks et variants</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Required Fields from Template */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Informations obligatoires</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Remplissez les champs obligatoires provenant du template
            </p>
          </div>
          
          {requiredFields.map(field => (
            <div key={field.id} className="p-4 border rounded-lg bg-card">
              <div className="mb-2 flex items-center">
                <span className="text-sm text-muted-foreground">
                  Champ obligatoire
                </span>
                <span className="ml-2 text-red-500">*</span>
              </div>
              {renderField(field, handleFieldChange)}
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Additional Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Informations supplémentaires</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complétez les autres champs et ajoutez des champs personnalisés si nécessaire
            </p>
          </div>

          {/* Champs hérités non obligatoires */}
          {inheritedFields.filter(f => !f.isRequired).map(field => (
            <div key={field.id} className="p-4 border rounded-lg bg-card">
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Hérité du template
                </span>
              </div>
              {renderField(field, handleFieldChange)}
            </div>
          ))}

          {/* Champs personnalisés */}
          {customFields.map(field => (
            <div key={field.id} className="p-4 border rounded-lg bg-card">
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Champ personnalisé
                </span>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                  setFields(prev => prev.filter(f => f.id !== field.id));
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {renderField(field, handleFieldChange)}
            </div>
          ))}

          <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Ajouter un champ personnalisé
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau champ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <TextField
                  label="Nom du champ"
                  value={newFieldLabel}
                  onChange={setNewFieldLabel}
                  isRequired
                />
                <SelectField
                  label="Type de champ"
                  value={newFieldType}
                  options={Object.values(FieldType)}
                  onChange={(val) => setNewFieldType(val as FieldType)}
                  isRequired
                />
                {newFieldType === FieldType.SELECT && (
                  <div className="space-y-2">
                    <Label>Options (séparées par des virgules)</Label>
                    <Input
                      placeholder="Option 1, Option 2"
                      onChange={(e) => setNewFieldOptions(e.target.value.split(',').map(s => s.trim()))}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAddNewField}>Créer le champ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Step 3: Stock Configuration */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Configuration des stocks</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les stocks de votre produit
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant={stockMode === 'global' ? 'default' : 'outline'}
                onClick={() => setStockMode('global')}
              >
                Stock global
              </Button>
              <Button
                variant={stockMode === 'variants' ? 'default' : 'outline'}
                onClick={() => setStockMode('variants')}
              >
                Par variants
              </Button>
            </div>

            {stockMode === 'global' ? (
              <div className="max-w-xs">
                <NumberField
                  label="Quantité disponible"
                  value={globalStock}
                  onChange={setGlobalStock}
                  isRequired
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Variant Builder */}
                <div className="p-4 border border-dashed rounded-lg space-y-4">
                  <h3 className="font-medium">Ajouter un variant</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variantFields.map(field => (
                      <SelectField
                        key={field.id}
                        label={field.label}
                        value={newVariantValues[field.id] || ''}
                        options={field.options || []}
                        onChange={(val) => setNewVariantValues(prev => ({ ...prev, [field.id]: val }))}
                      />
                    ))}
                    <NumberField
                      label="Quantité"
                      value={newVariantQuantity}
                      onChange={setNewVariantQuantity}
                    />
                  </div>
                  <Button onClick={handleAddVariant} disabled={newVariantQuantity <= 0}>
                    Ajouter le variant
                  </Button>
                </div>

                {/* Variants List */}
                {variants.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left">Variant</th>
                          <th className="p-3 text-left">Quantité</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map(variant => (
                          <tr key={variant.id} className="border-t">
                            <td className="p-3">
                              {Object.entries(variant.fieldValues).map(([fieldId, val]) => {
                                const field = fields.find(f => f.id === fieldId);
                                return <span key={fieldId} className="mr-2 badge badge-outline">{field?.label}: {val}</span>
                              })}
                            </td>
                            <td className="p-3">{variant.quantity}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setVariants(prev => prev.filter(v => v.id !== variant.id))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4 pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePreviousStep} disabled={loading}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Annuler
          </Button>
          {currentStep < 3 ? (
            <Button onClick={handleNextStep} disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Suivant'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Terminer et publier'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function renderField(field: FieldWithValues, onChange: (id: string, val: any) => void) {
  switch (field.type) {
    case FieldType.TEXT:
      return (
        <TextField
          label={field.label}
          value={field.value}
          onChange={(val) => onChange(field.id, val)}
        />
      );
    case FieldType.NUMBER:
      return (
        <NumberField
          label={field.label}
          value={Number(field.value)}
          onChange={(val) => onChange(field.id, val)}
        />
      );
    case FieldType.SELECT:
      return (
        <SelectField
          label={field.label}
          value={field.value}
          options={field.options || []}
          onChange={(val) => onChange(field.id, val)}
        />
      );
    case FieldType.IMAGES:
      return (
        <ImagesField
          label={field.label}
          images={field.images}
          onChange={(val) => onChange(field.id, val)}
        />
      );
    default:
      return <div>Unknown field type: {field.type}</div>;
  }
}
