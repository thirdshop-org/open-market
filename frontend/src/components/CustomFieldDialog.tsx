import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DialogHeader } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { RadioGroup } from "./ui/radio-group";
import { RadioGroupItem } from "./ui/radio-group";
import { Type } from "lucide-react";
import { List } from "lucide-react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { Plus } from "lucide-react";
import { Check } from "lucide-react";
import { useState } from "react";
import { FieldType } from "@/lib/fields";

const fieldTypes = [
    {
        label: 'Texte libre',
        value: FieldType.TEXT,
        icon: Type,
        description: 'L\'acheteur pourra saisir n\'importe quelle valeur',
    },
    {
        label: 'Liste déroulante',
        value: FieldType.SELECT,
        icon: List,
        description: 'Définissez les valeurs possibles (ex: S, M, L, XL)',
    },
]

export function CustomFieldDialog({ isDialogOpen, setIsDialogOpen }: { isDialogOpen: boolean, setIsDialogOpen: (open: boolean) => void }) {


    const [fieldName, setFieldName] = useState('');
    const [fieldType, setFieldType] = useState<FieldType>(FieldType.TEXT);
    const [fieldValue, setFieldValue] = useState('');
    const [options, setOptions] = useState<string[]>([]);


    function handleAddField() {
        console.log('Ajouter le champ');
    }

  return (

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Nouveau champ personnalisé</DialogTitle>
        <DialogDescription>
          Ajoutez une information spécifique à votre article
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Étape 1 : Nom du champ */}
        <div className="space-y-2">
          <Label htmlFor="field-name">
            Nom du champ <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="field-name"
            placeholder="ex: Couleur" 
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
          />
        </div>

        {/* Étape 2 : Type de champ */}
        <div className="space-y-2">
          <Label>Type de champ</Label>
          <RadioGroup value={fieldType} onValueChange={(fieldType: FieldType) => setFieldType(fieldType)}>
            {fieldTypes.map((type) => (
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                    </div>
                </Label>
                </div>
            ))}
          </RadioGroup>
        </div>

        {/* Étape 3 : Valeur ou Options */}
        {fieldType === FieldType.TEXT ? (
          <TextField fieldValue={fieldValue} setFieldValue={setFieldValue} />
        ) : (
          <SelectField options={options} setOptions={setOptions} />
        )}

      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
          Annuler
        </Button>
        <Button type="button" onClick={handleAddField}>
          <Check className="w-4 h-4 mr-2" />
          Ajouter le champ
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}


function TextField({ fieldValue, setFieldValue }: { fieldValue: string, setFieldValue: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="field-value">Valeur</Label>
            <Input 
            id="field-value"
            placeholder="ex: Rouge" 
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            />
        </div>
    )
}


function SelectField({ options, setOptions }: { options: string[], setOptions: (options: string[]) => void }) {
    return (
        <div className="space-y-2">
            <Label>Options de la liste</Label>
            <div className="space-y-2">
            {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                <Input 
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                />
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeOption(index)}
                >
                    <X className="w-4 h-4" />
                </Button>
                </div>
            ))}
            <Button 
                variant="outline" 
                size="sm" 
                type="button"
                className="w-full"
                onClick={addOption}
            >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une option
            </Button>
            </div>
        </div>
    )
}