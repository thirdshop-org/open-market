import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2 } from 'lucide-react';
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
}


export function ProductForm({ productId, templateId }: { productId?: string, templateId: string }) {
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<FieldWithValues[]>([]);
  const [stockMode, setStockMode] = useState<'global' | 'variants'>('global');
  const [variants, setVariants] = useState<{ id: string, quantity: number, fieldValues: Record<string, string> }[]>([]);
  const [globalStock, setGlobalStock] = useState<number>(0);

  // Helper to get fields suitable for variants (e.g. Select fields)
  const variantFields = useMemo(() => fields.filter(f => f.type === FieldType.SELECT), [fields]);

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
      // 1. Load Template Fields (Inherited)
      // We need to find the fields associated with the template product
      // The templateId passed is likely the ID of the testProduct that serves as template

      // Get all product fields for the template
      const templateProductFields = await testProductService.getProductFields(templateId);

      // Map them to our state format
      const inheritedFields: FieldWithValues[] = templateProductFields.map(tpf => {
        const fieldDef = tpf.expand?.fieldId;
        if (!fieldDef) return null;

        return {
          ...fieldDef,
          productFieldId: undefined, // New product, so no ID yet
          value: '', // Empty value for the new product
          images: [],
          isInherited: true
        };
      }).filter(Boolean) as FieldWithValues[];

      setFields(inheritedFields);

    } catch (error) {
      console.error('Error initializing form:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (templateId) {
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
        isInherited: false
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

  async function handleSave() {
    setLoading(true);
    try {
      // 1. Create Product
      const product = await testProductService.createProduct({});

      // 2. Create Product Fields
      const productFieldIds: Record<string, string> = {}; // fieldId -> productFieldId

      for (const field of fields) {
        const formData = new FormData();
        formData.append('productId', product.id);
        formData.append('fieldId', field.id);

        if (field.type === FieldType.IMAGES && field.images) {
          // Handle images (assuming base64 or file objects, here simplified)
          // In a real app, we'd need to convert base64 back to file or handle upload differently
          // For now, let's assume we skip actual file upload logic or it's handled elsewhere
          // formData.append('images', ...); 
        } else {
          formData.append('value', String(field.value || ''));
        }

        const createdField = await testProductService.createProductField(formData);
        productFieldIds[field.id] = createdField.id;
      }

      // 3. Create Stocks
      if (stockMode === 'global') {
        await testProductService.createProductStock({
          productId: product.id,
          quantity: globalStock,
          productFieldIds: [] // Global stock
        });
      } else {
        for (const variant of variants) {
          // Find the productFieldIds corresponding to the variant's field values
          // Wait, the variant definition is based on field *values*.
          // But the stock links to *productFieldIds*.
          // Since we created one productField per field definition (step 2),
          // we actually link to the *same* productField records created above?
          // NO.
          // If variants exist, it implies that for "Color", we might have multiple values?
          // The current form structure (step 2) assumes ONE value per field per product.
          // "Color: Red".
          // If I want "Red" and "Blue", do I create two products?
          // OR does the "Color" field allow multiple values?

          // In the current `ProductForm`, `SelectField` allows single selection.
          // If the user wants variants, the "Color" field on the main product might need to be empty or multi-select?
          // OR, the "Variants" define the specific values, and the main form defines the "Common" values.

          // User said: "L'objectif c'est de forcer l'utilisateur à entrer des données structuré rattachant un label à une valeur."

          // If I have variants, the "Color" field shouldn't have a single value in the main form if it varies.
          // It should probably be left empty or marked as "Varies".

          // Let's assume for now that for the fields used in variants, the main form value is ignored or serves as a default.
          // AND that we need to create *additional* `testProductsFields` for the variants?
          // OR does `testProductsStocks` link to the *main* `testProductsFields`?

          // If `testProductsStocks` links to `testProductsFields`, and `testProductsFields` has a single value "Red".
          // Then I can only have stock for "Red".
          // I cannot have stock for "Blue" unless I create another `testProductsFields` record with value "Blue".

          // So, if we have variants, we likely need to create `testProductsFields` records *specifically* for the variants,
          // OR the `testProductsFields` are NOT 1-to-1 with the Product, but 1-to-N?

          // `testProductsFields` has `productId`. So a product can have multiple fields.
          // Can it have multiple fields with the SAME `fieldId`?
          // Schema doesn't forbid it (no unique index on productId + fieldId).

          // SO:
          // For "Common" fields (e.g. Material: Cotton), we create one `testProductsField`.
          // For "Variant" fields (e.g. Color: Red, Color: Blue), we create MULTIPLE `testProductsField` records?
          // And then the Stock record links to the specific "Color: Red" record and "Size: M" record.

          // This seems to be the way.

          // So, my `handleSave` logic needs to be smarter.
          // 1. Identify which fields are "Common" and which are "Variant-defining".
          // 2. For Common fields, create one `testProductsField`.
          // 3. For Variants, iterate through variants.
          //    For each variant, check if we already created a `testProductsField` for that value (e.g. Red).
          //    If not, create it.
          //    Then link the stock to these `testProductsField` IDs.

          const variantFieldIds = Object.keys(variant.fieldValues);
          const relevantProductFieldIds: string[] = [];

          for (const [vFieldId, vValue] of Object.entries(variant.fieldValues)) {
            // Create a new product field for this specific variant value
            // Note: We might want to deduplicate if multiple variants use "Red".
            const formData = new FormData();
            formData.append('productId', product.id);
            formData.append('fieldId', vFieldId);
            formData.append('value', vValue);
            const pf = await testProductService.createProductField(formData);
            relevantProductFieldIds.push(pf.id);
          }

          // Also include common fields? User said "combinations du style red et m".
          // Usually stock is tracked by the combination of *varying* attributes.

          await testProductService.createProductStock({
            productId: product.id,
            quantity: variant.quantity,
            productFieldIds: relevantProductFieldIds
          });
        }
      }

      // Success
      alert('Product created successfully!');
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


  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Product</h1>
      </div>

      {/* Fields Section */}
      <div className="space-y-6">
        {fields.map(field => (
          <div key={field.id} className="p-4 border rounded-lg bg-card">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {field.isInherited ? 'Inherited from Template' : 'Custom Field'}
              </span>
              {!field.isInherited && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                  setFields(prev => prev.filter(f => f.id !== field.id));
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {renderField(field, handleFieldChange)}
          </div>
        ))}

        <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Add Custom Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <TextField
                label="Field Label"
                value={newFieldLabel}
                onChange={setNewFieldLabel}
                isRequired
              />
              <SelectField
                label="Field Type"
                value={newFieldType}
                options={Object.values(FieldType)}
                onChange={(val) => setNewFieldType(val as FieldType)}
                isRequired
              />
              {newFieldType === FieldType.SELECT && (
                <div className="space-y-2">
                  <Label>Options (comma separated)</Label>
                  <Input
                    placeholder="Option 1, Option 2"
                    onChange={(e) => setNewFieldOptions(e.target.value.split(',').map(s => s.trim()))}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleAddNewField}>Create Field</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stock Section */}
      <div className="p-6 border rounded-lg bg-card space-y-6">
        <h2 className="text-xl font-semibold">Stock Management</h2>

        <div className="flex items-center space-x-4">
          <Button
            variant={stockMode === 'global' ? 'default' : 'outline'}
            onClick={() => setStockMode('global')}
          >
            Global Stock
          </Button>
          <Button
            variant={stockMode === 'variants' ? 'default' : 'outline'}
            onClick={() => setStockMode('variants')}
          >
            Variants
          </Button>
        </div>

        {stockMode === 'global' ? (
          <div className="max-w-xs">
            <NumberField
              label="Quantity Available"
              value={globalStock}
              onChange={setGlobalStock}
              isRequired
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Variant Builder */}
            <div className="p-4 border border-dashed rounded-lg space-y-4">
              <h3 className="font-medium">Add Variant</h3>
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
                  label="Quantity"
                  value={newVariantQuantity}
                  onChange={setNewVariantQuantity}
                />
              </div>
              <Button onClick={handleAddVariant} disabled={newVariantQuantity <= 0}>
                Add Variant Stock
              </Button>
            </div>

            {/* Variants List */}
            {variants.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Variant</th>
                      <th className="p-3 text-left">Quantity</th>
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

      <div className="flex justify-end gap-4">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </Button>
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
