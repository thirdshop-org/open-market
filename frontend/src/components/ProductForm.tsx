import { useState, useEffect, useMemo } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

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
  isRequired: boolean; // Required if set to true or if the field is comming from a template
  options?: string[];
  defaultOption?: string;
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

type FieldExpandWithProductField = Field & {
  expand: {
    productFields: ProductField[];
  }
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
  const productFieldsExpanded = useMemo(() => {
    return matchProductFieldsToFields(productFields, productTemplateFields);
  }, [productFields, productTemplateFields]);
  //TEMPLATE
  const [template, setTemplate] = useState<Product | null>(null);
  const [templateProductFields, setTemplateProductFields] = useState<ProductField[]>([]);
  const [templateFields, setTemplateFields] = useState<Field[]>([]);
  const templateFieldsExpanded = useMemo(() => {
    return matchProductFieldsToFields(templateFields, templateProductFields);
  }, [templateFields, templateProductFields]);

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
        isRequired: true,
        created: '2021-01-01',
        updated: '2021-01-01',
      },
      {
        id: '2',
        label: 'Images',
        type: FieldType.IMAGES,
        isRequired: false,
        created: '2021-01-01',
        updated: '2021-01-01',
      },
      {
        id: '3',
        label: 'Couleur',
        type: FieldType.SELECT,
        options: ['Rouge', 'Vert', 'Bleu'],
        defaultOption: 'Rouge',
        isRequired: false,
        created: '2021-01-01',
        updated: '2021-01-01',
      },
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
        images: ['https://picsum.photos/200', 'https://picsum.photos/200'],
        value: '',
        productId: productId,
        fieldId: '2',
        created: '2021-01-01',
        updated: '2021-01-01',
      },
      {
        id: '3',
        images: [],
        value: 'Rouge',
        productId: productId,
        fieldId: '3',
        created: '2021-01-01',
        updated: '2021-01-01',
      },
    ]
  }

  function matchProductFieldsToFields(Fields: Field[], ProductFields: ProductField[]): FieldExpandWithProductField[] {
    
    return Fields.map(field => {

      const productFields = ProductFields.filter(productField => productField.fieldId === field.id);

      return { 
        ...field, 
        expand: { 
          productFields: productFields 
        } 
      };
    });
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
        <h2>Template Fields</h2>
        {templateFieldsExpanded.map(field => (
          <div key={field.id}>
            {fieldToComponent(field)}
            <h3>{field.label}</h3>
            {field.expand.productFields.map(productField => (
              <div key={productField.id}>{productField.value}</div>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}


function fieldToComponent(field: FieldExpandWithProductField): React.ReactNode {
  switch (field.type) {
    case FieldType.TEXT:

      const textFieldValue = field.expand.productFields[0];
    
      return <TextField field={field} value={textFieldValue.value} isRequired={field.isRequired} />;

    case FieldType.NUMBER:

      const numberFieldValue = field.expand.productFields[0];

      return <NumberField field={field} value={numberFieldValue.value} isRequired={field.isRequired} />;
    case FieldType.SELECT:

      const selectFieldValue = field.expand.productFields[0];

      const options = field.options || [];

      return <SelectField field={field} value={selectFieldValue.value} options={options} isRequired={field.isRequired} />;
    case FieldType.IMAGES:

      const images = field.expand.productFields.map(productField => productField.images).flat();

      return <ImagesField field={field} images={images} isRequired={field.isRequired} />;
    default:
      return null;
  }
}

function ImagesField({ field, images, isRequired }: { field: Field, images: string[], isRequired: boolean }) {

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
  }

  return (
    <div>
      <Label>{field.label} <span className="text-destructive" hidden={!isRequired}>*</span> </Label>
      {images.map(image => (
        <img src={image} alt={image} />
      ))}
      <input type="file" multiple onChange={handleChange} required={isRequired} />
    </div>
  )
  
}

function TextField({ field, value, isRequired }: { field: Field, value?: string, isRequired: boolean }) {

  const [fieldValue, setFieldValue] = useState(value || '');

  return (
    <div>
      <Label>{field.label} <span className="text-destructive" hidden={!isRequired}>*</span> </Label>
      <Input type="text" value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} required={isRequired} />
    </div>
  )

}

function NumberField({ field, value, isRequired }: { field: Field, value?: number, isRequired: boolean }) {
  const [fieldValue, setFieldValue] = useState(value || 0);

  return (
    <div>
      <Label>{field.label} <span className="text-destructive" hidden={!isRequired}>*</span> </Label>
      <Input type="number" value={fieldValue} onChange={(e) => setFieldValue(Number(e.target.value))} required={isRequired} />
    </div>
  ) 
}

function SelectField({ field, value, options, isRequired }: { field: Field, value?: string, options: string[], isRequired: boolean }) {
  const [fieldValue, setFieldValue] = useState(value || field.defaultOption || '');

  return (
    <div>
      <Label>{field.label} <span className="text-destructive" hidden={!isRequired}>*</span> </Label>
      <Select value={fieldValue} onValueChange={(value) => setFieldValue(value)} required={isRequired} >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a value" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option, index) => (
              <SelectItem key={index} value={option}>{option}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}