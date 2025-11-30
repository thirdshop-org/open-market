import { useState, useEffect } from 'react';
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

// Helper type for form state
type FieldWithValues = TestField & {
  productFieldId?: string;
  value?: string;
  images?: string[];
  isInherited: boolean;
  isRequired: boolean;
}

export function ProductForm({ productId, templateId }: { productId?: string, templateId?: string }) {
  const [loading, setLoading] = useState(false);

  // PRODUCT CONFIGURATION]
  const [product, setProduct] = useState<TestProduct | undefined>(undefined);
  // TEMPLATE CONFIGURATION
  const [template, setTemplate] = useState<TestProduct | undefined>(undefined);

  // Fields
  const [fields, setFields] = useState<FieldWithValues[]>([]);

  // Récupérer le templateId depuis l'URL au montage
  useEffect(() => {
    init();
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
      
      productsFieldsMap.set(field, {
        ...field,
        value: productField.value || '',
        images: productField.images || [],
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
