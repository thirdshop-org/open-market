import { useState, useEffect } from 'react';

type Product = {
  id: string;
  created: string;
  updated: string;
}

enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  IMAGES = 'images',
}

type Field = {
  id: string;
  label: string;
  type: FieldType;
  created: string;
  updated: string;
}

type ProductField = {
  id: string;
  images: string[];
  value: string;
  productId: Product['id'];
  fieldId: Field['id'];
  created: string;
  updated: string;
}

type ProductStock = {
  id:string;
  productId: Product['id'];
  quantity: number;
  productFieldId: ProductField['id'];
  created: string;
  updated: string;
}

export function ProductForm({ productId, templateId }) {

  const [loading, setLoading] = useState(false);

  //PRODUCT
  const [product, setProduct] = useState<Product | null>(null);
  const [productTemplateFields, setProductTemplateFields] = useState<ProductField[]>([]);
  const [productFields, setProductFields] = useState<Field[]>([]);
  //TEMPLATE
  const [template, setTemplate] = useState<Product | null>(null);
  const [templateProductFields, setTemplateProductFields] = useState<ProductField[]>([]);
  const [templateFields, setTemplateFields] = useState<Field[]>([]);

  async function getProductById(productId: Product['id']): Promise<Product> {
    return {
      id: productId,
      created: '2021-01-01',
      updated: '2021-01-01',
    }
  }

  async function getFields(fieldsIds: string[]): Promise<Field[]> {
    return [  
      {
        id: '1',
        label: 'Prix',
        type: FieldType.TEXT,
        created: '2021-01-01',
        updated: '2021-01-01',
      },
      {
        id: '2',
        label: 'Images',
        type: FieldType.IMAGES,
        created: '2021-01-01',
        updated: '2021-01-01',
      }
    ]
  }

  async function getProductFields(productId: Product['id']): Promise<ProductField[]> {
    return [
      {
        id: '1',
        images: [],
        value: '20.00',
        productId: productId,
        fieldId: '1',
        created: '2021-01-01',
        updated: '2021-01-01',
      },
      {
        id: '2',
        images: ['image1.jpg', 'image2.jpg'],
        value: '',
        productId: productId,
        fieldId: '2',
        created: '2021-01-01',
        updated: '2021-01-01',
      }
    ]
  }

  async function init() {
    setLoading(true);
    try {
      const product = await getProductById('productId');
      setProduct(product);

      const template = await getProductById('templateId');
      setTemplate(template);

      // Load product template fields
      const templateProductFields = await getProductFields(template.id);
      setTemplateProductFields(templateProductFields);

      const templateFields = await getFields(templateProductFields.map(field => field.fieldId));
      setTemplateFields(templateFields);

      // Load product fields
      const productFields = await getProductFields(product.id);
      setProductTemplateFields(productFields);

      const fields = await getFields(productFields.map(field => field.fieldId));
      setProductFields(fields);

    } catch (error) {
      console.error('Error getting product:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, [productId]);

  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Product Form</h1>

      <div>
        <h2>Template</h2>
        <pre>{JSON.stringify(template, null, 2)}</pre>
        <p>Template Product Fields</p>
        <pre>{JSON.stringify(templateProductFields, null, 2)}</pre>
        <p>Template Fields</p>
        <pre>{JSON.stringify(templateFields, null, 2)}</pre>
      </div>


      <div>
        <h2>Product</h2>
        <pre>{JSON.stringify(product, null, 2)}</pre>
        <pre>{JSON.stringify(productTemplateFields, null, 2)}</pre>
        <pre>{JSON.stringify(productFields, null, 2)}</pre>
      </div>

    </div>
  )
}