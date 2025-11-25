import { pb } from "./pocketbase";

export enum FieldType {
    TEXT = 'text',
    SELECT = 'select',
}

export interface Field {
    id: string;
    label: string;
    productId: string;
    options?: string[];
    fieldType?: FieldType;
    fieldValue: string;
    fieldOptions?: string[];
    isDefault: boolean;
    createdByAdmin: boolean;
    isVisibleByClients: boolean;
    created: string;
    updated: string;
}

export const fieldService = {
    async getProductFields(productId: string) {
        return await pb.collection('fields').getList<Field>(1, 100, {
            filter: `productId = "${productId}"`,
        });
    },
    async createField(field: Field) {
        return await pb.collection('fields').create(field);
    },
    async updateField(field: Field) {
        return await pb.collection('fields').update(field.id, field);
    },
    async deleteField(fieldId: string) {
        return await pb.collection('fields').delete(fieldId);
    },
}