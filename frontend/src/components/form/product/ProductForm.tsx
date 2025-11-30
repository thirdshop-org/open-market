import { useState, useEffect, useRef } from 'react';
import { Button } from '../../ui/button';
import {
  testProductService,
  type TestField,
  FieldType,
  type TestProduct,
  type TestProductField,
} from '../../../lib/test-product-service';
import { RequiredInformationsForm } from './RequiredInformationsForm';
import { CustomProductInformationsForm } from './CustomProductInformationsForm';
import { pb } from '../../../lib/pocketbase';
import type { ImageValue } from '../ImagesField';

// Helper type for form state
type FieldWithValues = TestField & {
  productFieldId: string; // ID of the record in testProductsFields
  value?: string;
  images?: ImageValue[]; // Can be File (new) or string URL (existing)
  isInherited: boolean;
  isRequired: boolean;
}

export function ProductForm({ productId, templateId }: { productId?: string, templateId?: string }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // PRODUCT CONFIGURATION]
  const [product, setProduct] = useState<TestProduct | undefined>(undefined);
  // TEMPLATE CONFIGURATION
  const [template, setTemplate] = useState<TestProduct | undefined>(undefined);

  // Fields
  const [fields, setFields] = useState<FieldWithValues[]>([]);
  
  // Debounce timer for auto-save
  const saveTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Récupérer le templateId depuis l'URL au montage
  useEffect(() => {
    init();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      saveTimerRef.current.forEach(timer => clearTimeout(timer));
      saveTimerRef.current.clear();
    };
  }, []);

  function testFieldsToFieldsWithValues(testFields: TestField[], productFields: TestProductField[], templateId?: string): FieldWithValues[] {

    const productsFieldsMap = new Map<TestField, FieldWithValues | null>();

    productFields.forEach((productField) => {

      const field = testFields.find((field) => field.id === productField.fieldId);

      if ( !field ) {
        throw new Error('Field not found');
      }

      if ( productsFieldsMap.has(field) ) {
        throw new Error('Field already exists');
      }
      
      // Convert image filenames to full URLs for existing images
      let imageValues: ImageValue[] = [];
      if (field.type === FieldType.IMAGES && productField.images && productField.images.length > 0) {
        imageValues = productField.images.map(filename => {
          // If it's already a full URL or a File, keep it as is
          if (filename.startsWith('http') || filename.startsWith('data:')) {
            return filename;
          }
          // Otherwise, construct the PocketBase URL
          return pb.files.getUrl(productField, filename);
        });
      }
      
      productsFieldsMap.set(field, {
        ...field,
        productFieldId: productField.id, // Store the productField ID for updates
        value: productField.value || '',
        images: imageValues,
        isRequired: productField.isRequired,
        isInherited: productField.productId === templateId
      });

    });

    return Array.from(productsFieldsMap.values()).filter(field => field !== null);

  }

  useEffect(() => {
    if (product?.id || template?.id) {
      const params = new URLSearchParams();
      if (product?.id) params.append('productId', product.id);
      if (template?.id) params.append('templateId', template.id);
      window.history.pushState({}, '', `/dashboard/products/new?${params.toString()}`);
    }
  }, [product?.id, template?.id]);

  async function init() {
    setLoading(true);
    try {
      
      if ( templateId && productId ) {
        const template = await testProductService.getProduct(templateId);
        setTemplate(template);
        const product = await testProductService.getProduct(productId);
        setProduct(product);

        const productFields = await testProductService.getProductFields(product.id);
        const templateProductFields = await testProductService.getProductFields(template.id);

        const allFields = await testProductService.getFields();

        const fields = testFieldsToFieldsWithValues(allFields, [...templateProductFields, ...productFields], template.id);
        setFields(fields);

        return;
      }

      if ( !templateId && !productId ) {

        const template = await testProductService.getMotherTemplate();
        setTemplate(template);

        const templateProductFields = await testProductService.getProductFields(template.id);
        
        const product = await testProductService.createProduct({
          parentId: template.id
        });
        setProduct(product);

        const productFields = await testProductService.getProductFields(product.id);

        const allFields = await testProductService.getFields();

        const fields = testFieldsToFieldsWithValues(allFields, [...templateProductFields, ...productFields], template?.id);
        setFields(fields);

        return;

      }

      if ( templateId && !productId ) {
        
        const template = await testProductService.getProduct(templateId);
        setTemplate(template);

        const templateProductFields = await testProductService.getProductFields(template.id);

        const product = await testProductService.createProduct({
          parentId: template.id
        });

        setProduct(product);
        const productFields = await testProductService.getProductFields(product.id);

        const allFields = await testProductService.getFields();
        
        const fields = testFieldsToFieldsWithValues(allFields, [...templateProductFields, ...productFields], template?.id);
        setFields(fields);

        return;
      }

      if ( productId && !templateId ) {
        const product = await testProductService.getProduct(productId);
        setProduct(product);
        if ( !product.parentId ) {
          throw new Error('Product has no parentId');
        }
        const productFields = await testProductService.getProductFields(product.id);

        const template = await testProductService.getProduct(product.parentId);
        setTemplate(template);

        const templateProductFields = await testProductService.getProductFields(template.id);

        const allFields = await testProductService.getFields();
        
        const fields = testFieldsToFieldsWithValues(allFields, [...templateProductFields, ...productFields], template?.id);
        setFields(fields);

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

  const handleFieldChange = async (fieldId: string, value: string | number | ImageValue[]) => {
    // Update local state immediately for better UX
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;

      if (f.type === FieldType.IMAGES) {
        return { ...f, images: value as ImageValue[] };
      } else {
        return { ...f, value: String(value) };
      }
    }));

    // Get the field to save
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    // Clear existing timer for this field
    const existingTimer = saveTimerRef.current.get(fieldId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer to save after 1 second of inactivity
    const newTimer = setTimeout(async () => {
      try {
        setSaving(true);
        
        if (field.type === FieldType.IMAGES) {
          const images = value as ImageValue[];
          const formData = new FormData();
          
          // Process each image
          images.forEach((img) => {
            if (img instanceof File) {
              // It's a new File object - add it directly to FormData
              formData.append('images', img);
            } else if (typeof img === 'string') {
              // It's an existing URL - extract just the filename
              if (img.startsWith('http')) {
                // PocketBase URLs are like: http://127.0.0.1:8090/api/files/COLLECTION/RECORD/FILENAME.ext
                const filename = img.split('/').pop()?.split('?')[0] || '';
                if (filename) {
                  formData.append('images', filename);
                }
              } else {
                // It's already a filename
                formData.append('images', img);
              }
            }
          });
          
          await testProductService.updateProductField(field.productFieldId, formData);
        } else {
          // For text/number/select fields
          await testProductService.updateProductField(field.productFieldId, {
            value: String(value)
          });
        }
        
        console.log(`✓ Champ "${field.label}" sauvegardé`);
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde du champ "${field.label}":`, error);
        alert(`Erreur lors de la sauvegarde du champ "${field.label}"`);
      } finally {
        setSaving(false);
        saveTimerRef.current.delete(fieldId);
      }
    }, 1000); // 1 second debounce

    saveTimerRef.current.set(fieldId, newTimer);
  };

  const handleAddNewField = async (label: string, type: FieldType, options?: string[]) => {
    try {


      if ( !product?.id ) {
        throw new Error('Product ID is required');
      }

      // 1. Create the global field definition
      const newField = await testProductService.createField({
        label,
        type,
        options: type === FieldType.SELECT ? options : undefined
      });

      const newProductField = await testProductService.createProductField({
        productId: product.id,
        fieldId: newField.id,
        value: '',
        images: [],
        isRequired: false
      });


      const newFields = testFieldsToFieldsWithValues([newField], [newProductField], product.id);
      setFields(prev => [...prev, ...newFields]); 
    } catch (error) {
      console.error('Error creating field:', error);
    }
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
  };
  
  async function handleSave() {
    setLoading(true);
    
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
      {/* Auto-save indicator */}
      {saving && (
        <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2 z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
          <span className="text-sm">Sauvegarde automatique...</span>
        </div>
      )}

      {/* Template fields */}
      <RequiredInformationsForm 
        fields={fields}
        onChange={handleFieldChange}
      />

      {/* Product fields */}
        <CustomProductInformationsForm 
          fields={fields}
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
