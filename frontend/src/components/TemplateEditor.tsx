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
import { Label } from "./ui/label"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import {
    Plus,
    Settings,
    User,
    Type,
    Hash,
    Edit,
    Trash2,
    Eye,
    EyeOff,
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
    fieldType?: string; // 'text' ou 'number'
}

// Type pour les champs du template (en mockup pour le moment)
interface TemplateFieldConfig {
    id: string; // ID temporaire pour le mockup
    fieldId: string; // ID du champ (si existant) ou vide pour nouveau
    label: string;
    fieldType: string; // 'text' ou 'number'
    value: string;
    isVisibleByClients: boolean;
    isRequired: boolean;
    isDefault?: boolean; // Pour savoir si c'est un champ par défaut
}

export function TemplateEditor() {
    const [open, setOpen] = useState(false)
    const [fieldToEdit, setFieldToEdit] = useState<FieldFormData | null>(null)
    const [fieldToEditIndex, setFieldToEditIndex] = useState<number | null>(null) // Pour savoir si on édite un champ existant
    const [defaultFields, setDefaultFields] = useState<Field[]>([])
    const [userFields, setUserFields] = useState<Field[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [templateFieldsConfig, setTemplateFieldsConfig] = useState<TemplateFieldConfig[]>([])

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

    // Les champs du template sont maintenant gérés par templateFieldsConfig

    const fieldTypes = [
        {
            label: "Texte",
            value: "text",
            icon: Type,
        },
        {
            label: "Nombre",
            value: "number",
            icon: Hash,
        },
    ]

    // Helper pour obtenir l'icône d'un type de champ
    const getFieldTypeIcon = (type: string) => {
        const fieldType = fieldTypes.find(t => t.value === type)
        return fieldType?.icon || Type
    }

    // Helper pour obtenir le label d'un type de champ
    const getFieldTypeLabel = (type: string) => {
        const fieldType = fieldTypes.find(t => t.value === type)
        return fieldType?.label || "Texte"
    }

    function handleAddNewField() {
        setSearchValue("")
        setFieldToEditIndex(null) // Nouveau champ
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
            fieldType: "text",
        })
    }

    function handleEditField(index: number) {
        const field = templateFieldsConfig[index]
        setFieldToEditIndex(index)
        setSearchValue(field.label)
        setFieldToEdit({
            id: field.fieldId,
            label: field.label,
            isDefault: field.isDefault || false,
            createdByAdmin: field.isDefault || false,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            value: field.value,
            isVisibleByClients: field.isVisibleByClients,
            isRequired: field.isRequired,
            fieldType: field.fieldType,
        })
    }

    function handleDeleteField(index: number) {
        setTemplateFieldsConfig(prev => prev.filter((_, i) => i !== index))
    }

    function handleSaveField() {
        if (!fieldToEdit?.label) return

        const newFieldConfig: TemplateFieldConfig = {
            id: fieldToEditIndex !== null ? templateFieldsConfig[fieldToEditIndex].id : `temp-${Date.now()}`,
            fieldId: fieldToEdit.id || "",
            label: fieldToEdit.label,
            fieldType: fieldToEdit.fieldType || "text",
            value: fieldToEdit.value || "",
            isVisibleByClients: fieldToEdit.isVisibleByClients || false,
            isRequired: fieldToEdit.isRequired || false,
            isDefault: fieldToEdit.isDefault,
        }

        if (fieldToEditIndex !== null) {
            // Édition d'un champ existant
            setTemplateFieldsConfig(prev => prev.map((field, i) => 
                i === fieldToEditIndex ? newFieldConfig : field
            ))
        } else {
            // Ajout d'un nouveau champ
            setTemplateFieldsConfig(prev => [...prev, newFieldConfig])
        }

        // Fermer le drawer
        setFieldToEdit(null)
        setFieldToEditIndex(null)
        setSearchValue("")
        setIsSearchFocused(false)
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
            fieldType: field.fieldType || "text", // Récupérer fieldType depuis le champ ou "text" par défaut
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
            fieldType: "text",
        })
        setIsSearchFocused(false)
    }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Éditeur de Template</h1>
          <p className="text-muted-foreground mt-1">
            Configurez les champs qui seront utilisés dans vos produits
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Chargement des champs...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Liste des champs du template */}
          {templateFieldsConfig.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Champs du template ({templateFieldsConfig.length})</h2>
              <div className="grid gap-3">
                {templateFieldsConfig.map((field, index) => {
                  const FieldIcon = getFieldTypeIcon(field.fieldType)
                  return (
                    <div
                      key={field.id}
                      className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {/* Icône du type de champ */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <FieldIcon className="h-5 w-5 text-primary" />
                      </div>

                      {/* Informations du champ */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{field.label}</h3>
                          {field.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Défaut
                            </Badge>
                          )}
                          {field.isRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Requis
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FieldIcon className="h-3 w-3" />
                            {getFieldTypeLabel(field.fieldType)}
                          </span>
                          {field.value && (
                            <span className="truncate">
                              Valeur: {field.value}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            {field.isVisibleByClients ? (
                              <>
                                <Eye className="h-3 w-3" />
                                Visible
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3" />
                                Masqué
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditField(index)}
                          title="Éditer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteField(index)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center p-12 border-2 border-dashed rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">Aucun champ ajouté</h3>
                <p className="text-sm text-muted-foreground">
                  Commencez par ajouter des champs à votre template
                </p>
              </div>
            </div>
          )}

          {/* Bouton d'ajout */}
          <Button onClick={() => handleAddNewField()} size="lg" className="w-full">
            <Plus className="mr-2 h-5 w-5" />
            Ajouter un champ
          </Button>
        </div>
      )}

      <Drawer open={!!fieldToEdit} onOpenChange={(open) => {
        if (!open) {
          setFieldToEdit(null)
          setFieldToEditIndex(null)
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

                {/* Field type */}
                <div className="space-y-2">
                    <Label>Type de champ</Label>
                    <Select 
                        value={fieldToEdit?.fieldType || "text"}
                        onValueChange={(value) => {
                            if (fieldToEdit) {
                                setFieldToEdit({ ...fieldToEdit, fieldType: value })
                            }
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner le type de champ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {fieldTypes.map((type) => (
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
                        type={fieldToEdit?.fieldType === "number" ? "number" : "text"}
                        placeholder={fieldToEdit?.fieldType === "number" ? "Entrer un nombre" : "Valeur du champ"}
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
            <Button 
                onClick={handleSaveField}
                disabled={!fieldToEdit?.label}
            >
                {fieldToEditIndex !== null ? "Mettre à jour" : "Ajouter le champ"}
            </Button>
            <DrawerClose asChild>
                <Button variant="outline">Annuler</Button>
            </DrawerClose>  
            </DrawerFooter>
        </DrawerContent>
    </Drawer>

    </div>
  )
}



