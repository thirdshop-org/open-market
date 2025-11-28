import { FieldType, type TestField } from '@/lib/test-product-service';
import ImagesField from '../ImagesField';
import SelectField from '../SelectField';
import TextField from '../TextField';
import NumberField from '../NumberField';

type FieldWithValues = TestField & {
  productFieldId?: string;
  value?: string;
  images?: string[];
  isInherited: boolean;
  isRequired?: boolean;
}

interface RequiredInformationsFormProps {
  fields: FieldWithValues[];
  onChange: (fieldId: string, value: string | number | string[]) => void;
}

export function RequiredInformationsForm({ fields, onChange }: RequiredInformationsFormProps) {
  const requiredFields = fields.filter(f => f.isInherited && f.isRequired);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Informations obligatoires</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Remplissez les champs obligatoires provenant du template
        </p>
      </div>
      
      {requiredFields.map(field => (
        <div key={field.id} className="p-4 border rounded-lg bg-card">
          <div className="mb-2 flex items-center">
            <span className="text-sm text-muted-foreground">
              Champ obligatoire
            </span>
            <span className="ml-2 text-red-500">*</span>
          </div>
          {renderField(field, onChange)}
        </div>
      ))}
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

