import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import {
  testProductService,
  type TestField,
  FieldType
} from '../../../lib/test-product-service';
import { RequiredInformationsForm } from './RequiredInformationsForm';
import { CustomProductInformationsForm } from './CustomProductInformationsForm';

// Helper type for form state
type FieldWithValues = TestField & {
  productFieldId?: string;
  value?: string;
  images?: string[];
  isInherited: boolean;
  isRequired?: boolean;
}

type Variant = {
  id: string;
  quantity: number;
  fieldValues: Record<string, string>;
}

export function ProductForm({ productId: initialProductId, templateId: propTemplateId }: { productId?: string, templateId?: string }) {
  const [loading, setLoading] = useState(false);

  // PRODUCT CONFIGURATION
  const [productId, setProductId] = useState<string | undefined>(initialProductId);
  const [product, setProduct] = useState<TestProduct | undefined>(undefined);
  const [productFields, setProductFields] = useState<FieldWithValues[]>([]);

  // TEMPLATE CONFIGURATION
  const [templateId, setTemplateId] = useState<string | undefined>(propTemplateId);
  const [template, setTemplate] = useState<TestProduct | undefined>(undefined);
  const [templateFields, setTemplateFields] = useState<FieldWithValues[]>([]);
  const [fields, setFields] = useState<FieldWithValues[]>([]);

  // Récupérer le templateId depuis l'URL au montage
  useEffect(() => {
    if (!propTemplateId) {
      const urlParams = new URLSearchParams(window.location.search);
      const templateIdFromUrl = urlParams.get('templateId');
      if (templateIdFromUrl) {
        setTemplateId(templateIdFromUrl);
      }
    }
    init();
  }, []);

  async function init() {
    setLoading(true);
    try {

      if ( !templateId && !productId ) {
        
        const template = await testProductService.getMotherTemplate();
        setTemplate(template);
        const templateFields = await testProductService.getProductFields(template.id);
        setTemplateFields(templateFields);
        
        const product = await testProductService.createProduct({
          parentId: template.id
        });
        setProduct(product);
        const productFields = await testProductService.getProductFields(product.id);
        setProductFields(productFields);
        return;
      }

      if ( templateId && !productId ) {
        
        const template = await testProductService.getProduct(templateId);
        setTemplate(template);
        const templateFields = await testProductService.getProductFields(template.id);
        setTemplateFields(templateFields);

        const product = await testProductService.createProduct({
          parentId: template.id
        });
        setProduct(product);
        const productFields = await testProductService.getProductFields(product.id);
        setProductFields(productFields);
        return;
      }

      if ( productId && !templateId ) {
        const product = await testProductService.getProduct(productId);
        setProduct(product);
        if ( !product.parentId ) {
          throw new Error('Product has no parentId');
        }
        const productFields = await testProductService.getProductFields(product.id);
        setProductFields(productFields);

        const template = await testProductService.getProduct(product.parentId);
        setTemplate(template);
        const templateFields = await testProductService.getProductFields(template.id);
        setTemplateFields(templateFields);
        return;
      }

      throw new Error('No templateId or productId provided');

    } catch (error) {
      console.error('Error initializing form:', error);
      alert('Error initializing form');
    } finally {
      setLoading(false);
    }
  }

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

  const handleAddNewField = async (label: string, type: FieldType, options?: string[]) => {
    try {
      // 1. Create the global field definition
      const newField = await testProductService.createField({
        label,
        type,
        options: type === FieldType.SELECT ? options : undefined
      });

      // 2. Add to local state
      setFields(prev => [...prev, {
        ...newField,
        value: '',
        images: [],
        isInherited: false,
        isRequired: false
      }]);
    } catch (error) {
      console.error('Error creating field:', error);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
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
        const requiredFields = fields.filter(f => f.isInherited && f.isRequired);
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
          fieldsToSave = fields.filter(f => f.isInherited && f.isRequired);
        } else if (currentStep === 2) {
          // Au step 2, sauvegarder tous les champs qui ont une valeur
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
        const requiredFields = fields.filter(f => f.isInherited && f.isRequired);
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
          productFieldIds: []
        });
      } else {
        for (const variant of variants) {
          const relevantProductFieldIds: string[] = [];

          for (const [vFieldId, vValue] of Object.entries(variant.fieldValues)) {
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
      window.location.href = `/products/${effectiveProductId}`;
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 w-full mx-auto p-6">

      {/* Template fields */}
      <RequiredInformationsForm 
        fields={templateFields}
        onChange={handleFieldChange}
      />

      {/* Product fields */}
        <CustomProductInformationsForm 
          fields={productFields}
          onChange={handleFieldChange}
          onAddField={handleAddNewField}
          onRemoveField={handleRemoveField}
        />

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4 pt-6 border-t">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Sauvegarde...' : 'Terminer et publier'}
        </Button>
      </div>
    </div>
  );
}
