import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { FieldType, type TestField } from '@/lib/test-product-service';
import SelectField from '../SelectField';
import NumberField from '../NumberField';

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

interface StockConfigurationFormProps {
  fields: FieldWithValues[];
  stockMode: 'global' | 'variants';
  globalStock: number;
  variants: Variant[];
  onStockModeChange: (mode: 'global' | 'variants') => void;
  onGlobalStockChange: (quantity: number) => void;
  onAddVariant: (variant: Variant) => void;
  onRemoveVariant: (variantId: string) => void;
}

export function StockConfigurationForm({
  fields,
  stockMode,
  globalStock,
  variants,
  onStockModeChange,
  onGlobalStockChange,
  onAddVariant,
  onRemoveVariant
}: StockConfigurationFormProps) {
  const variantFields = fields.filter(f => f.type === FieldType.SELECT);

  // State for new variant creation
  const [newVariantValues, setNewVariantValues] = useState<Record<string, string>>({});
  const [newVariantQuantity, setNewVariantQuantity] = useState<number>(0);

  const handleAddVariant = () => {
    if (newVariantQuantity <= 0) return;
    if (Object.keys(newVariantValues).length === 0) return;

    onAddVariant({
      id: Math.random().toString(36).substr(2, 9),
      quantity: newVariantQuantity,
      fieldValues: { ...newVariantValues }
    });

    setNewVariantQuantity(0);
    setNewVariantValues({});
  };

  return (
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
            onClick={() => onStockModeChange('global')}
          >
            Stock global
          </Button>
          <Button
            variant={stockMode === 'variants' ? 'default' : 'outline'}
            onClick={() => onStockModeChange('variants')}
          >
            Par variants
          </Button>
        </div>

        {stockMode === 'global' ? (
          <div className="max-w-xs">
            <NumberField
              label="Quantité disponible"
              value={globalStock}
              onChange={onGlobalStockChange}
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
                            onClick={() => onRemoveVariant(variant.id)}
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
  );
}

