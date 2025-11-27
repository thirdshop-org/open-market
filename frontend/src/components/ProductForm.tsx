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

function ImagesField({ 
  field, 
  images, 
  isRequired, 
  maxImages = 10,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
}: { 
  field: Field, 
  images: string[], 
  isRequired: boolean,
  maxImages?: number,
  acceptedFileTypes?: string[]
}) {
  const [imageList, setImageList] = useState<string[]>(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const remainingSlots = maxImages - imageList.length;
  const canAddMore = imageList.length < maxImages;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setError('');

    // Vérifier le nombre d'images
    if (imageList.length + files.length > maxImages) {
      setError(`Vous ne pouvez uploader que ${maxImages} images maximum. Il reste ${remainingSlots} emplacement(s).`);
      return;
    }

    // Vérifier les types de fichiers
    const invalidFiles = files.filter(file => !acceptedFileTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError(`Types de fichiers acceptés: ${acceptedFileTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }

    // Convertir les fichiers en URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageList(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  }

  function handleRemoveImage(index: number) {
    setImageList(prev => prev.filter((_, i) => i !== index));
    setError('');
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...imageList];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setImageList(newImages);
    setDraggedIndex(index);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {field.label} 
          <span className="text-destructive" hidden={!isRequired}>*</span>
        </Label>
        <span className="text-sm text-muted-foreground">
          {imageList.length}/{maxImages} images
          {canAddMore && ` (${remainingSlots} restant${remainingSlots > 1 ? 's' : ''})`}
        </span>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Grille d'images */}
      {imageList.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageList.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                relative group aspect-square rounded-lg overflow-hidden border-2 
                cursor-move transition-all hover:shadow-lg
                ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'}
              `}
            >
              <img 
                src={image} 
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay avec numéro et bouton supprimer */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors"
                  title="Supprimer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Numéro de l'image */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* Icône de déplacement */}
              <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Aucune image</p>
            <p className="text-xs">Cliquez sur le bouton ci-dessous pour ajouter des images</p>
          </div>
        </div>
      )}

      {/* Input file */}
      <div className="flex items-center gap-2">
        <label 
          className={`
            inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-colors cursor-pointer
            ${canAddMore 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {imageList.length === 0 ? 'Ajouter des images' : 'Ajouter plus d\'images'}
          <input 
            type="file" 
            multiple 
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileChange}
            disabled={!canAddMore}
            required={isRequired && imageList.length === 0}
            className="hidden"
          />
        </label>
        {imageList.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Glissez-déposez pour réorganiser
          </span>
        )}
      </div>
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