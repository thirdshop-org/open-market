import { pb } from "./pocketbase";

export enum FieldType {
    NUMBER = 'number',
    TEXT = 'text',
    IMAGES = 'images',
    SELECT = 'select',
}

export interface TestField {
    id: string;
    label: string;
    type: FieldType;
    options?: any; // JSON field for select options
    created: string;
    updated: string;
}

export interface TestProduct {
    id: string;
    parentId?: string; // Added as per user request
    created: string;
    updated: string;
}

export interface TestProductField {
    id: string;
    productId: string;
    fieldId: string;
    value?: string;
    images?: string[];
    isRequired?: boolean;
    created: string;
    updated: string;
    expand?: {
        fieldId?: TestField;
    };
}

export interface TestProductStock {
    id: string;
    productId: string;
    quantity: number;
    productFieldIds: string[]; // Renamed from productFieldId and logic updated to array
    created: string;
    updated: string;
}

export const testProductService = {
    // Products
    async getProduct(id: string) {
        return await pb.collection('testProducts').getOne<TestProduct>(id);
    },
    async getMotherTemplate() {
        // Fetch the first product that has NO parentId
        return await pb.collection('testProducts').getFirstListItem<TestProduct>('parentId = ""');
    },
    async createProduct(data: Partial<TestProduct>) {
        return await pb.collection('testProducts').create<TestProduct>(data);
    },

    // Fields (Definitions)
    async getFields() {
        return await pb.collection('testFields').getFullList<TestField>();
    },
    async createField(data: Partial<TestField>) {
        return await pb.collection('testFields').create<TestField>(data);
    },

    // Product Fields (Values)
    async getProductFields(productId: string) {
        return await pb.collection('testProductsFields').getFullList<TestProductField>({
            filter: `productId = "${productId}"`,
            expand: 'fieldId',
        });
    },
    async createProductField(data: FormData | Partial<TestProductField>) {
        return await pb.collection('testProductsFields').create<TestProductField>(data);
    },
    async updateProductField(id: string, data: FormData | Partial<TestProductField>) {
        return await pb.collection('testProductsFields').update<TestProductField>(id, data);
    },

    // Stocks
    async getProductStocks(productId: string) {
        return await pb.collection('testProductsStocks').getFullList<TestProductStock>({
            filter: `productId = "${productId}"`,
            expand: 'productFieldIds',
        });
    },
    async createProductStock(data: Partial<TestProductStock>) {
        return await pb.collection('testProductsStocks').create<TestProductStock>(data);
    },
    async updateProductStock(id: string, data: Partial<TestProductStock>) {
        return await pb.collection('testProductsStocks').update<TestProductStock>(id, data);
    },
    async deleteProductStock(id: string) {
        return await pb.collection('testProductsStocks').delete(id);
    }
};
