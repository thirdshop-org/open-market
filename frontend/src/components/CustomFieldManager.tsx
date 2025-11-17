import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  fetchUserFields,
  fetchDefaultFields,
  createField,
  deleteField,
  getProductFields,
  attachFieldToProduct,
  updateProductField,
  deleteProductField,
  type Field,
  type ProductField,
} from '@/lib/templates';
import { pb } from '@/lib/pocketbase';
import { Plus, Trash2, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  templateId: string;
}

export function CustomFieldManager({ templateId }: Props) {
  const [defaultFields, setDefaultFields] = useState<Field[]>([]);
  const [userFields, setUserFields] = useState<Field[]>([]);
  const [productFields, setProductFields] = useState<ProductField[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // État pour l'ajout d'un nouveau champ
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [addingField, setAddingField] = useState(false);
  
  // État pour l'ajout d'un champ existant au template
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [fieldVisible, setFieldVisible] = useState(true);
  const [attachingField, setAttachingField] = useState(false);

  useEffect(() => {
    loadData();
  }, [templateId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) return;

      // Charger tous les champs
      const [defaults, customs, productFieldsData] = await Promise.all([
        fetchDefaultFields(),
        fetchUserFields(currentUser.id),
        getProductFields(templateId),
      ]);

      setDefaultFields(defaults);
      setUserFields(customs);
      setProductFields(productFieldsData);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement des champs' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = async () => {
    if (!newFieldLabel || newFieldLabel.length < 2) {
      setMessage({ type: 'error', text: 'Le nom du champ doit contenir au moins 2 caractères' });
      return;
    }

    setAddingField(true);
    setMessage({ type: '', text: '' });

    try {
      const currentUser = pb.authStore.model;
      if (!currentUser) {
        setMessage({ type: 'error', text: 'Vous devez être connecté' });
        return;
      }

      const newField = await createField(newFieldLabel, currentUser.id);
      setUserFields([...userFields, newField]);
      setNewFieldLabel('');
      setMessage({ type: 'success', text: 'Champ créé avec succès' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erreur lors de la création du champ' });
    } finally {
      setAddingField(false);
    }
  };

  const handleDeleteField = async (fieldId: string, fieldLabel: string) => {
    if (!confirm(`Supprimer le champ "${fieldLabel}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await deleteField(fieldId);
      setUserFields(userFields.filter(f => f.id !== fieldId));
      setMessage({ type: 'success', text: 'Champ supprimé avec succès' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erreur lors de la suppression du champ' });
    }
  };

  const handleAttachField = async () => {
    if (!selectedFieldId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un champ' });
      return;
    }

    // Vérifier si le champ n'est pas déjà attaché
    const alreadyAttached = productFields.some(pf => pf.fieldId === selectedFieldId);
    if (alreadyAttached) {
      setMessage({ type: 'error', text: 'Ce champ est déjà attaché au template' });
      return;
    }

    setAttachingField(true);
    setMessage({ type: '', text: '' });

    try {
      const newProductField = await attachFieldToProduct(
        templateId,
        selectedFieldId,
        fieldValue,
        fieldVisible
      );
      
      // Recharger les données pour avoir les expand
      await loadData();
      
      setSelectedFieldId('');
      setFieldValue('');
      setFieldVisible(true);
      setMessage({ type: 'success', text: 'Champ attaché au template' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erreur lors de l\'attachement du champ' });
    } finally {
      setAttachingField(false);
    }
  };

  const handleUpdateProductField = async (productFieldId: string, newValue: string) => {
    try {
      await updateProductField(productFieldId, newValue);
      setProductFields(productFields.map(pf => 
        pf.id === productFieldId ? { ...pf, fieldValue: newValue } : pf
      ));
      setMessage({ type: 'success', text: 'Valeur mise à jour' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    }
  };

  const handleToggleVisibility = async (productFieldId: string, currentVisibility: boolean) => {
    try {
      const productField = productFields.find(pf => pf.id === productFieldId);
      if (!productField) return;

      await updateProductField(productFieldId, productField.fieldValue, !currentVisibility);
      setProductFields(productFields.map(pf => 
        pf.id === productFieldId ? { ...pf, isVisibleByClients: !currentVisibility } : pf
      ));
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors du changement de visibilité' });
    }
  };

  const handleRemoveProductField = async (productFieldId: string, fieldLabel: string) => {
    if (!confirm(`Retirer le champ "${fieldLabel}" du template ?`)) {
      return;
    }

    try {
      await deleteProductField(productFieldId);
      setProductFields(productFields.filter(pf => pf.id !== productFieldId));
      setMessage({ type: 'success', text: 'Champ retiré du template' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  // Champs disponibles pour l'attachement (tous sauf ceux déjà attachés)
  const availableFields = [...defaultFields, ...userFields].filter(
    field => !productFields.some(pf => pf.fieldId === field.id)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de notification */}
      {message.text && (
        <div 
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Champs obligatoires (info) */}
      <Card>
        <CardHeader>
          <CardTitle>Champs obligatoires</CardTitle>
          <CardDescription>
            Ces champs sont requis pour tous les produits et ne peuvent pas être modifiés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {defaultFields.map(field => (
              <Badge key={field.id} variant="secondary" className="px-3 py-1">
                {field.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Champs personnalisés du template */}
      <Card>
        <CardHeader>
          <CardTitle>Champs personnalisés de ce template</CardTitle>
          <CardDescription>
            Gérez les champs spécifiques à ce template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {productFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun champ personnalisé. Ajoutez-en ci-dessous.
            </p>
          ) : (
            <div className="space-y-3">
              {productFields.map(productField => {
                const field = productField.expand?.fieldId;
                if (!field) return null;

                return (
                  <div key={productField.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">{field.label}</Label>
                        {field.isDefault && (
                          <Badge variant="outline" className="text-xs">Défaut</Badge>
                        )}
                      </div>
                      <Input
                        value={productField.fieldValue}
                        onChange={(e) => handleUpdateProductField(productField.id, e.target.value)}
                        placeholder="Valeur par défaut (optionnel)"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(productField.id, productField.isVisibleByClients)}
                        title={productField.isVisibleByClients ? 'Visible aux clients' : 'Caché aux clients'}
                      >
                        {productField.isVisibleByClients ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {!field.isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProductField(productField.id, field.label)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attacher un champ existant */}
      {availableFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un champ existant</CardTitle>
            <CardDescription>
              Sélectionnez un champ existant à ajouter à ce template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Champ</Label>
                <select
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sélectionner un champ</option>
                  {availableFields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.label} {field.isDefault ? '(Défaut)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Valeur par défaut</Label>
                <Input
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="Optionnel"
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label>Visibilité</Label>
                <div className="flex items-center h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldVisible}
                      onChange={(e) => setFieldVisible(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Visible aux clients</span>
                  </label>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAttachField}
              disabled={attachingField || !selectedFieldId}
              className="w-full"
            >
              {attachingField ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter au template
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Créer un nouveau champ */}
      <Card>
        <CardHeader>
          <CardTitle>Créer un nouveau champ</CardTitle>
          <CardDescription>
            Créez un champ personnalisé que vous pourrez réutiliser dans d'autres templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Nom du champ (ex: Référence interne, Compatibilité...)"
                maxLength={100}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateField();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              onClick={handleCreateField}
              disabled={addingField || !newFieldLabel}
            >
              {addingField ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Liste des champs personnalisés de l'utilisateur */}
          {userFields.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Vos champs personnalisés :</p>
              <div className="flex flex-wrap gap-2">
                {userFields.map(field => (
                  <Badge key={field.id} variant="outline" className="px-3 py-1 flex items-center gap-2">
                    {field.label}
                    <button
                      type="button"
                      onClick={() => handleDeleteField(field.id, field.label)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

