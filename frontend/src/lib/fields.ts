export enum FieldType {
    TEXT = 'text',
    SELECT = 'select',
}

export interface Field {
    id: string;
    label: string;
    options?: string[];
    fieldType?: string; // 'text' ou 'number'
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

export interface ProductField {
    id: string;
    productId: string;
    fieldId: string;
    fieldValue: string; // STRING ONLY
    isVisibleByClients: boolean;
    created: string;
    updated: string;
}