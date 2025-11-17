import { pb } from './pocketbase';

// ========================================
// TYPES
// ========================================

/**
 * Représente un champ personnalisé
 */
export interface Field {
  id: string;
  label: string;
  parentId?: string;
  isDefault: boolean;
  createdByAdmin: boolean;
  userId?: string;
  created: string;
  updated: string;
  expand?: {
    parentId?: Field;
  };
}

/**
 * Association entre un produit et un champ avec sa valeur
 */
export interface ProductField {
  id: string;
  productId: string;
  fieldId: string;
  fieldValue: string; // STRING ONLY
  isVisibleByClients: boolean;
  created: string;
  updated: string;
  expand?: {
    fieldId?: Field;
    productId?: any;
  };
}

/**
 * Template = produit sans parentId
 */
export interface Template {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  condition: string;
  seller: string;
  status: string;
  location: string;
  views?: number;
  reference?: string;
  compatibility?: string;
  availableFrom?: string;
  availableUntil?: string;
  quantity?: number;
  minStockAlert?: number;
  parentId: null; // Important: null pour un template
  created: string;
  updated: string;
}

/**
 * Données pour créer un template
 */
export interface CreateTemplateData {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: File[];
  category: string;
  condition: string;
  location: string;
  status?: string;
  reference?: string;
  compatibility?: string;
  quantity?: number;
}

/**
 * Données pour mettre à jour un template
 */
export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

// ========================================
// GESTION DES TEMPLATES
// ========================================

/**
 * Récupérer tous les templates d'un utilisateur
 * Templates = produits avec parentId = null
 */
export async function fetchUserTemplates(userId: string): Promise<Template[]> {
  try {
    const records = await pb.collection('products').getFullList({
      filter: `seller = "${userId}" && parentId = null`,
      sort: '-created',
      expand: 'category',
    });
    return records as unknown as Template[];
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error);
    throw error;
  }
}

/**
 * Récupérer un template par son ID
 */
export async function getTemplateById(id: string): Promise<Template> {
  try {
    const record = await pb.collection('products').getOne(id, {
      expand: 'category',
    });
    return record as unknown as Template;
  } catch (error) {
    console.error('Erreur lors de la récupération du template:', error);
    throw error;
  }
}

/**
 * Créer un nouveau template
 */
export async function createTemplate(
  data: CreateTemplateData,
  userId: string
): Promise<Template> {
  try {
    // Créer FormData pour gérer les fichiers
    const formData = new FormData();
    
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('currency', data.currency);
    formData.append('category', data.category);
    formData.append('condition', data.condition);
    formData.append('location', data.location);
    formData.append('seller', userId);
    formData.append('status', data.status || 'Brouillon');
    formData.append('parentId', ''); // null = template
    
    // Ajouter les images
    data.images.forEach((image) => {
      formData.append('images', image);
    });
    
    // Champs optionnels
    if (data.reference) formData.append('reference', data.reference);
    if (data.compatibility) formData.append('compatibility', data.compatibility);
    if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString());
    
    const record = await pb.collection('products').create(formData);
    return record as unknown as Template;
  } catch (error) {
    console.error('Erreur lors de la création du template:', error);
    throw error;
  }
}

/**
 * Mettre à jour un template
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateData
): Promise<Template> {
  try {
    const formData = new FormData();
    
    // Ajouter uniquement les champs fournis
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.currency) formData.append('currency', data.currency);
    if (data.category) formData.append('category', data.category);
    if (data.condition) formData.append('condition', data.condition);
    if (data.location) formData.append('location', data.location);
    if (data.status) formData.append('status', data.status);
    if (data.reference) formData.append('reference', data.reference);
    if (data.compatibility) formData.append('compatibility', data.compatibility);
    if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString());
    
    // Ajouter les nouvelles images si fournies
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const record = await pb.collection('products').update(id, formData);
    return record as unknown as Template;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du template:', error);
    throw error;
  }
}

/**
 * Supprimer un template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    await pb.collection('products').delete(id);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du template:', error);
    throw error;
  }
}

// ========================================
// GESTION DES CHAMPS (FIELDS)
// ========================================

/**
 * Récupérer tous les champs par défaut (créés par l'admin)
 */
export async function fetchDefaultFields(): Promise<Field[]> {
  try {
    const records = await pb.collection('fields').getFullList({
      filter: 'isDefault = true',
      sort: 'created',
    });
    return records as unknown as Field[];
  } catch (error) {
    console.error('Erreur lors de la récupération des champs par défaut:', error);
    throw error;
  }
}

/**
 * Récupérer tous les champs personnalisés d'un utilisateur
 */
export async function fetchUserFields(userId: string): Promise<Field[]> {
  try {
    const records = await pb.collection('fields').getFullList({
      filter: `userId = "${userId}" && isDefault = false`,
      sort: 'created',
    });
    return records as unknown as Field[];
  } catch (error) {
    console.error('Erreur lors de la récupération des champs utilisateur:', error);
    throw error;
  }
}

/**
 * Récupérer tous les champs (défaut + utilisateur)
 */
export async function fetchAllFieldsForUser(userId: string): Promise<Field[]> {
  try {
    const records = await pb.collection('fields').getFullList({
      filter: `isDefault = true || userId = "${userId}"`,
      sort: 'isDefault desc, created',
    });
    return records as unknown as Field[];
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les champs:', error);
    throw error;
  }
}

/**
 * Créer un nouveau champ personnalisé
 */
export async function createField(label: string, userId: string): Promise<Field> {
  try {
    const record = await pb.collection('fields').create({
      label,
      userId,
      isDefault: false,
      createdByAdmin: false,
    });
    return record as unknown as Field;
  } catch (error) {
    console.error('Erreur lors de la création du champ:', error);
    throw error;
  }
}

/**
 * Supprimer un champ personnalisé
 */
export async function deleteField(id: string): Promise<boolean> {
  try {
    await pb.collection('fields').delete(id);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du champ:', error);
    throw error;
  }
}

// ========================================
// GESTION DES ASSOCIATIONS PRODUITS-CHAMPS
// ========================================

/**
 * Récupérer tous les champs d'un produit avec leurs valeurs
 */
export async function getProductFields(productId: string): Promise<ProductField[]> {
  try {
    const records = await pb.collection('productsFields').getFullList({
      filter: `productId = "${productId}"`,
      expand: 'fieldId',
      sort: 'created',
    });
    return records as unknown as ProductField[];
  } catch (error) {
    console.error('Erreur lors de la récupération des champs du produit:', error);
    throw error;
  }
}

/**
 * Récupérer les champs visibles d'un produit (pour l'affichage client)
 */
export async function getVisibleProductFields(productId: string): Promise<ProductField[]> {
  try {
    const records = await pb.collection('productsFields').getFullList({
      filter: `productId = "${productId}" && isVisibleByClients = true`,
      expand: 'fieldId',
      sort: 'created',
    });
    return records as unknown as ProductField[];
  } catch (error) {
    console.error('Erreur lors de la récupération des champs visibles:', error);
    throw error;
  }
}

/**
 * Associer un champ à un produit avec sa valeur
 */
export async function attachFieldToProduct(
  productId: string,
  fieldId: string,
  value: string,
  isVisible: boolean = true
): Promise<ProductField> {
  try {
    const record = await pb.collection('productsFields').create({
      productId,
      fieldId,
      fieldValue: value,
      isVisibleByClients: isVisible,
    });
    return record as unknown as ProductField;
  } catch (error) {
    console.error('Erreur lors de l\'association du champ au produit:', error);
    throw error;
  }
}

/**
 * Mettre à jour la valeur d'un champ de produit
 */
export async function updateProductField(
  productFieldId: string,
  value: string,
  isVisible?: boolean
): Promise<ProductField> {
  try {
    const data: any = { fieldValue: value };
    if (isVisible !== undefined) {
      data.isVisibleByClients = isVisible;
    }
    
    const record = await pb.collection('productsFields').update(productFieldId, data);
    return record as unknown as ProductField;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du champ du produit:', error);
    throw error;
  }
}

/**
 * Supprimer une association champ-produit
 */
export async function deleteProductField(productFieldId: string): Promise<boolean> {
  try {
    await pb.collection('productsFields').delete(productFieldId);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du champ du produit:', error);
    throw error;
  }
}

/**
 * Créer plusieurs associations champs-produit en une fois
 */
export async function attachMultipleFieldsToProduct(
  productId: string,
  fields: Array<{ fieldId: string; value: string; isVisible?: boolean }>
): Promise<ProductField[]> {
  try {
    const promises = fields.map((field) =>
      attachFieldToProduct(
        productId,
        field.fieldId,
        field.value,
        field.isVisible ?? true
      )
    );
    return await Promise.all(promises);
  } catch (error) {
    console.error('Erreur lors de l\'association multiple des champs:', error);
    throw error;
  }
}

/**
 * Récupérer les champs d'un template pour les réutiliser
 */
export async function getTemplateFields(templateId: string): Promise<ProductField[]> {
  try {
    const records = await pb.collection('productsFields').getFullList({
      filter: `productId = "${templateId}"`,
      expand: 'fieldId',
      sort: 'created',
    });
    return records as unknown as ProductField[];
  } catch (error) {
    console.error('Erreur lors de la récupération des champs du template:', error);
    throw error;
  }
}

/**
 * Copier les champs d'un template vers un nouveau produit
 */
export async function copyTemplateFieldsToProduct(
  templateId: string,
  newProductId: string
): Promise<ProductField[]> {
  try {
    const templateFields = await getTemplateFields(templateId);
    
    const fieldsToCopy = templateFields.map((field) => ({
      fieldId: field.fieldId,
      value: field.fieldValue,
      isVisible: field.isVisibleByClients,
    }));
    
    return await attachMultipleFieldsToProduct(newProductId, fieldsToCopy);
  } catch (error) {
    console.error('Erreur lors de la copie des champs du template:', error);
    throw error;
  }
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Vérifier si un produit est un template
 */
export function isTemplate(product: any): boolean {
  return product.parentId === null || product.parentId === '';
}

/**
 * Compter le nombre de champs personnalisés d'un template
 */
export async function countTemplateCustomFields(templateId: string): Promise<number> {
  try {
    const fields = await getProductFields(templateId);
    return fields.length;
  } catch (error) {
    console.error('Erreur lors du comptage des champs:', error);
    return 0;
  }
}

