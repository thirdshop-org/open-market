import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { FieldType, type TestField } from '@/lib/test-product-service';
import ImagesField, { type ImageValue } from '../ImagesField';
import SelectField from '../SelectField';
import TextField from '../TextField';
import NumberField from '../NumberField';

type FieldWithValues = TestField & {
  productFieldId: string;
  value?: string;
  images?: ImageValue[];
  isInherited: boolean;
  isRequired: boolean;
}

interface CustomProductInformationsFormProps {
  fields: FieldWithValues[];
  onChange: (fieldId: string, value: string | number | ImageValue[]) => void;
  onAddField: (label: string, type: FieldType, options?: string[]) => Promise<void>;
  onRemoveField: (fieldId: string) => void;
}

export function CustomProductInformationsForm({ 
  fields, 
  onChange, 
  onAddField,
  onRemoveField 
}: CustomProductInformationsFormProps) {
  const inheritedFields = fields.filter(f => f.isInherited && !f.isRequired);
  const customFields = fields.filter(f => !f.isInherited);

  // Dialog state for new field
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>(FieldType.TEXT);
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);

  const handleAddNewField = async () => {
    await onAddField(newFieldLabel, newFieldType, newFieldType === FieldType.SELECT ? newFieldOptions : undefined);
    
    // Reset and close dialog
    setNewFieldLabel('');
    setNewFieldType(FieldType.TEXT);
    setNewFieldOptions([]);
    setIsAddFieldOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Informations supplémentaires</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complétez les autres champs et ajoutez des champs personnalisés si nécessaire
        </p>
      </div>

      {/* Champs hérités non obligatoires */}
      {inheritedFields.map(field => (
        <div key={field.id} className="p-4 border rounded-lg bg-card">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Hérité du template
            </span>
          </div>
          {renderField(field, onChange)}
        </div>
      ))}

      {/* Champs personnalisés */}
      {customFields.map(field => (
        <div key={field.id} className="p-4 border rounded-lg bg-card">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Champ personnalisé
            </span>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onRemoveField(field.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {renderField(field, onChange)}
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

