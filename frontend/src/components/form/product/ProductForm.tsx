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
  isRequired?: boolean;
}

export function ProductForm({ productId, templateId }: { productId?: string, templateId?: string }) {
  const [loading, setLoading] = useState(false);

  // PRODUCT CONFIGURATION
  const [product, setProduct] = useState<TestProduct | undefined>(undefined);
  // TEMPLATE CONFIGURATION
  const [template, setTemplate] = useState<TestProduct | undefined>(undefined);

  // Fields
  const [fields, setFields] = useState<FieldWithValues[]>([]);

  // Récupérer le templateId depuis l'URL au montage
  useEffect(() => {
    init();
  }, []);

  function testFieldsToFieldsWithValues(testFields: TestField[], productFields: TestProductField[]): FieldWithValues[] {

    return testFields.map((testField) => {
      const productField = productFields.find((productField) => productField.fieldId === testField.id);

      if ( !productField ) return null;

      try {
        if ( testField.options ) {
          testField.options = JSON.parse( testField.options );
          if ( !Array.isArray( testField.options ) ) throw new Error('Options is not an array')
        } else { 
          testField.options = [];
        }
        
      } catch (error) {
        console.error(error);
        testField.options = []
      }

      return {
        ...testField,
        value: productField?.value || '',
        images: productField?.images || [],
        isInherited: false,
        isRequired: false
      };
    }).filter( field => field !== null )

  }

  async function init() {
    setLoading(true);
    try {

      const allFields = await testProductService.getFields();

      if ( !templateId && !productId ) {
        
        const template = await testProductService.getMotherTemplate();
        setTemplate(template);

        const templateProductFields = await testProductService.getProductFields(template.id);
        
        const product = await testProductService.createProduct({
          parentId: template.id
        });
        setProduct(product);

        const productFields = await testProductService.getProductFields(product.id);

        const fields = testFieldsToFieldsWithValues(allFields, [...templateProductFields, ...productFields]);
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
        
        const fields = testFieldsToFieldsWithValues(allFields, [...templateProductFields, ...productFields]);
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
        
        const fields = testFieldsToFieldsWithValues(allFields, [...templateProductFields, ...productFields]);
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
