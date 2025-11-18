import { getTemplateFields, type Field, type ProductField } from "@/lib/templates"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Label } from "./ui/label"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select"
import {
    Calculator,
    Calendar,
    CreditCard,
    Plus,
    Settings,
    Smile,
    User,
  } from "lucide-react"
  
  import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
  } from "@/components/ui/command"

export function TemplateEditor() {
    const [open, setOpen] = useState(false)
    const [fieldToEdit, setFieldToEdit] = useState<Field | null>(null)


    useEffect(()=>{
        loadData()
    },[])

    const loadData = async () => {
        
    }

    const [searchValue, setSearchValue] = useState("")


    const template : Template = {
        id: "1",
        label: "Nom du template",
        isDefault: true,
        createdByAdmin: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    }

    const templateFields : ProductField[] = [{
        id: "1",
        fieldId: "1",
        fieldValue: "Valeur du champ",
        isVisibleByClients: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        productId: "1",
    }]

    const fields : Field[] = [{
        id: "1",
        label: "Nom du champ",
        isDefault: true,
        createdByAdmin: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    }]

    const inputTypes = [
        {
            label: "Texte",
            value: "text",
        },
        {
            label: "Nombre",
            value: "number",
        },
        {
            label: "Sélection",
            value: "select",
        },
        {
            label: "Date",
            value: "date",
        },
    ]

    function handleAddNewField() {
        setFieldToEdit({
            id: "2",
            label: searchValue,
            isDefault: false,
            createdByAdmin: false,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        })
    }


  return (
    <div>
      <h1>Template Editor</h1>


        {

            fields.map((field) => ( 
                <InputGroup key={field.id} onClick={() => setFieldToEdit(field)}>
                    <InputGroupInput placeholder="Type to search..." />
                    <InputGroupAddon align="inline-end">
                    <InputGroupButton variant="secondary">Options</InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
            ))
        }

        <Button onClick={() => handleAddNewField()}>Ajouter un nouveau champ</Button>

      <Drawer open={!!fieldToEdit} onOpenChange={() => setFieldToEdit(null)} direction="right"  >
        <DrawerContent>
            <DrawerHeader>
            <DrawerTitle>{fieldToEdit?.label}</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
            </DrawerHeader>
            
            <form className="space-y-4 p-4">

                {/* Field label */}
                <Input type="text" placeholder="Nom du champ" value={fieldToEdit?.label} onChange={(e) => {
                    if (fieldToEdit) {
                        setFieldToEdit({ ...fieldToEdit, label: e.target.value })
                    }
                }} />

                <Command className="rounded-lg border shadow-md md:min-w-[450px]">
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                            <CommandItem>
                                <Calendar />
                                <span>Calendar</span>
                            </CommandItem>
                            <CommandItem>
                                <Smile />
                                <span>Search Emoji</span>
                            </CommandItem>
                            <CommandItem disabled>
                                <Calculator />
                                <span>Calculator</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>

                {/* Input type */}
                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selectionner le type de champ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {inputTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Field value */}
                <Input type="text" placeholder="Valeur du champ" value={fieldToEdit?.value} onChange={(e) => {
                    if (fieldToEdit) {
                        setFieldToEdit({ ...fieldToEdit, value: e.target.value })
                    }
                }} />

                { /* Field is visible by clients */ }
                <Checkbox id="isVisibleByClients" checked={fieldToEdit?.isVisibleByClients} onCheckedChange={(checked) => {
                    if (fieldToEdit) {
                        setFieldToEdit({ ...fieldToEdit, isVisibleByClients: checked })
                    }
                }} />
                 <Label htmlFor="isVisibleByClients">Visible aux clients</Label>

                { /* Field is required   */ }
                <Checkbox id="isRequired" checked={fieldToEdit?.isRequired} onCheckedChange={(checked) => {
                    if (fieldToEdit) {
                        setFieldToEdit({ ...fieldToEdit, isRequired: checked })
                    }
                }} />
                <Label htmlFor="isRequired">Champ requis</Label>

            </form>

            <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose>
                <Button variant="outline">Cancel</Button>
            </DrawerClose>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>

    </div>
  )
}



