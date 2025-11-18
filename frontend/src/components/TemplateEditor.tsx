import { 
    getTemplateFields,
    getProductFields, 
    fetchDefaultFields, 
    fetchUserFields,
    type Field, 
    type ProductField,
    type Template 
} from "@/lib/templates"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Label } from "./ui/label"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import {
    Plus,
    Settings,
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
  } from "@/components/ui/command"

// Type étendu pour le formulaire d'édition de champ
interface FieldFormData extends Field {
    value?: string;
    isVisibleByClients?: boolean;
    isRequired?: boolean;
    inputType?: string;
}

export function TemplateEditor() {
    const [open, setOpen] = useState(false)
    const [fieldToEdit, setFieldToEdit] = useState<FieldFormData | null>(null)
    const [defaultFields, setDefaultFields] = useState<Field[]>([])
    const [userFields, setUserFields] = useState<Field[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSearchFocused, setIsSearchFocused] = useState(false)

    // TODO: Récupérer l'ID utilisateur depuis le contexte d'authentification
    const userId = "user123" // Mock pour le moment

    useEffect(()=>{
        loadData()
    },[])

    const loadData = async () => {
        setIsLoading(true)
        try {
            // Charger les champs par défaut
            const defaultFieldsData = await fetchDefaultFields()
            setDefaultFields(defaultFieldsData)
            
            // Charger les champs personnalisés de l'utilisateur
            const userFieldsData = await fetchUserFields(userId)
            setUserFields(userFieldsData)
        } catch (error) {
            console.error("Erreur lors du chargement des champs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const [searchValue, setSearchValue] = useState("")

    // Filtrer les champs en fonction de la recherche
    const filteredDefaultFields = defaultFields.filter(field => 
        field.label.toLowerCase().includes(searchValue.toLowerCase())
    )
    const filteredUserFields = userFields.filter(field => 
        field.label.toLowerCase().includes(searchValue.toLowerCase())
    )

    // Vérifier si le texte de recherche correspond exactement à un champ existant
    const exactMatch = [...defaultFields, ...userFields].find(
        field => field.label.toLowerCase() === searchValue.toLowerCase()
    )

    const template : Template = {
        id: "1",
        title: "Nom du template",
        description: "Description du template",
        price: 0,
        currency: "EUR",
        images: [],
        category: "",
        condition: "new",
        seller: userId,
        status: "Brouillon",
        location: "",
        parentId: null,
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

    // Les champs sont maintenant chargés depuis l'API via defaultFields et userFields

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
        setSearchValue("")
        setFieldToEdit({
            id: "",
            label: "",
            isDefault: false,
            createdByAdmin: false,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            value: "",
            isVisibleByClients: true,
            isRequired: false,
            inputType: "text",
        })
    }

    async function handleSelectExistingField(field: Field) {
        setSearchValue(field.label)
        
        // Charger la dernière configuration utilisée de ce champ (si disponible)
        // Pour l'instant, on utilise des valeurs par défaut intelligentes
        const fieldConfig: FieldFormData = {
            ...field,
            value: "",
            isVisibleByClients: true,
            isRequired: false,
            inputType: "text",
        }
        
        // Si le champ a un parentId, on pourrait charger sa configuration parente
        if (field.parentId) {
            // TODO: Charger la config du champ parent si nécessaire
        }
        
        setFieldToEdit(fieldConfig)
        setIsSearchFocused(false)
    }

    function handleCreateNewFieldFromSearch() {
        setFieldToEdit({
            id: "",
            label: searchValue,
            isDefault: false,
            createdByAdmin: false,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            value: "",
            isVisibleByClients: true,
            isRequired: false,
            inputType: "text",
        })
        setIsSearchFocused(false)
    }


  return (
    <div>
      <h1>Template Editor</h1>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Chargement des champs...</p>
        </div>
      ) : (
        <>
          {/* Affichage des champs du template (pour l'instant mockup) */}
          {templateFields.map((field) => ( 
              <InputGroup key={field.id} onClick={() => setFieldToEdit(null)}>
                  <InputGroupInput placeholder="Type to search..." />
                  <InputGroupAddon align="inline-end">
                  <InputGroupButton variant="secondary">Options</InputGroupButton>
                  </InputGroupAddon>
              </InputGroup>
          ))}

          <Button onClick={() => handleAddNewField()}>Ajouter un nouveau champ</Button>
        </>
      )}

      <Drawer open={!!fieldToEdit} onOpenChange={(open) => {
        if (!open) {
          setFieldToEdit(null)
          setSearchValue("")
          setIsSearchFocused(false)
        }
      }} direction="right">
        <DrawerContent className="min-w-4/10 max-w-none" >
            <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              {fieldToEdit?.id ? (
                <>
                  {fieldToEdit.isDefault ? (
                    <Settings className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span>Ajouter un champ existant</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Créer un nouveau champ</span>
                </>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {fieldToEdit?.id 
                ? `Configurez comment "${fieldToEdit.label}" sera utilisé dans ce template`
                : "Recherchez un champ existant ou créez-en un nouveau pour votre template"
              }
            </DrawerDescription>
            </DrawerHeader>

            <form className="space-y-4 p-4">

                {/* Field label with search */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Nom du champ</Label>
                        {fieldToEdit?.label && !isSearchFocused && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchValue(fieldToEdit.label)
                                    setIsSearchFocused(true)
                                }}
                            >
                                Changer
                            </Button>
                        )}
                    </div>
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput 
                            placeholder="Rechercher un champ ou créer un nouveau..." 
                            value={searchValue}
                            onValueChange={setSearchValue}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => {
                                // Petit délai pour permettre le clic sur les suggestions
                                setTimeout(() => setIsSearchFocused(false), 200)
                            }}
                            disabled={!!(fieldToEdit?.label && !isSearchFocused)}
                        />

                        {isSearchFocused && (
                            <CommandList>
                                <CommandEmpty>
                                    {searchValue ? (
                                        <div className="py-6 text-center">
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Aucun champ trouvé pour "{searchValue}"
                                            </p>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={handleCreateNewFieldFromSearch}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Créer "{searchValue}"
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="py-6 text-center text-sm">Commencez à taper pour rechercher...</p>
                                    )}
                                </CommandEmpty>

                                {filteredDefaultFields.length > 0 && (
                                    <CommandGroup heading="Champs par défaut">
                                        {filteredDefaultFields.map((field) => (
                                            <CommandItem
                                                key={field.id}
                                                onSelect={() => handleSelectExistingField(field)}
                                            >
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>{field.label}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                {filteredUserFields.length > 0 && (
                                    <CommandGroup heading="Mes champs personnalisés">
                                        {filteredUserFields.map((field) => (
                                            <CommandItem
                                                key={field.id}
                                                onSelect={() => handleSelectExistingField(field)}
                                            >
                                                <User className="mr-2 h-4 w-4" />
                                                <span>{field.label}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                {!exactMatch && searchValue && (filteredDefaultFields.length > 0 || filteredUserFields.length > 0) && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem onSelect={handleCreateNewFieldFromSearch}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                <span>Créer un nouveau champ "{searchValue}"</span>
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        )}
                    </Command>

                    {/* Afficher les informations du champ sélectionné */}
                    {fieldToEdit?.label && !isSearchFocused && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{fieldToEdit.label}</span>
                                    {fieldToEdit.id ? (
                                        fieldToEdit.isDefault ? (
                                            <Badge variant="secondary" className="text-xs">
                                                <Settings className="mr-1 h-3 w-3" />
                                                Champ par défaut
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs">
                                                <User className="mr-1 h-3 w-3" />
                                                Champ personnalisé
                                            </Badge>
                                        )
                                    ) : (
                                        <Badge variant="default" className="text-xs">
                                            <Plus className="mr-1 h-3 w-3" />
                                            Nouveau champ
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {fieldToEdit.id 
                                        ? "Ce champ existe déjà et sera réutilisé" 
                                        : "Un nouveau champ sera créé lors de l'enregistrement"
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input type */}
                <div className="space-y-2">
                    <Label>Type de champ</Label>
                    <Select 
                        value={fieldToEdit?.inputType || "text"}
                        onValueChange={(value) => {
                            if (fieldToEdit) {
                                setFieldToEdit({ ...fieldToEdit, inputType: value })
                            }
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner le type de champ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {inputTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Field value */}
                <div className="space-y-2">
                    <Label htmlFor="fieldValue">Valeur par défaut</Label>
                    <Input 
                        id="fieldValue"
                        type="text" 
                        placeholder="Valeur du champ" 
                        value={fieldToEdit?.value || ""} 
                        onChange={(e) => {
                            if (fieldToEdit) {
                                setFieldToEdit({ ...fieldToEdit, value: e.target.value })
                            }
                        }} 
                    />
                    <p className="text-xs text-muted-foreground">
                        Cette valeur sera utilisée par défaut pour ce champ
                    </p>
                </div>

                {/* Options du champ */}
                <div className="space-y-3 pt-2">
                    <Label className="text-base">Options</Label>
                    
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="isVisibleByClients" 
                            checked={fieldToEdit?.isVisibleByClients || false} 
                            onCheckedChange={(checked) => {
                                if (fieldToEdit) {
                                    setFieldToEdit({ ...fieldToEdit, isVisibleByClients: checked === true })
                                }
                            }} 
                        />
                        <Label 
                            htmlFor="isVisibleByClients" 
                            className="text-sm font-normal cursor-pointer"
                        >
                            Visible aux clients
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                        Ce champ sera affiché publiquement dans la fiche produit
                    </p>

                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="isRequired" 
                            checked={fieldToEdit?.isRequired || false} 
                            onCheckedChange={(checked) => {
                                if (fieldToEdit) {
                                    setFieldToEdit({ ...fieldToEdit, isRequired: checked === true })
                                }
                            }} 
                        />
                        <Label 
                            htmlFor="isRequired" 
                            className="text-sm font-normal cursor-pointer"
                        >
                            Champ obligatoire
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                        Ce champ devra être rempli obligatoirement
                    </p>
                </div>

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



