import { pb } from "./pocketbase";
import type { Product } from "./products";

export type Stock = {
    id: string;
    name: string;
    userId: string;
    created: string;
    updated: string;
}

type ProductsInStocks = {
    id: string;
    stockId: string;
    productId: string;
    quantityAvailable: number;
    created: string;
    updated: string;
}

export const stocksService = {

    async getMyStocks(): Promise<Stock[]> {

        const user = pb.authStore.model;
        if (!user) throw new Error('Non authentifié');

        const stocks = await pb.collection('stocks').getFullList<Stock>({
            filter: `userId = "${user.id}"`,
            fields: 'id,name,userId,created,updated',
        });

        return stocks;
        
    },

    async createStock(name: string, userId: string): Promise<Stock> {
        const stock = await pb.collection('stocks').create<Stock>({
            name,
            userId,
        });
        return stock;
    },

    async getProductsInStock(stockId: string): Promise<ProductsInStocks[]> {
        const products = await pb.collection('productsInStocks').getFullList<ProductsInStocks>({
            filter: `stockId = "${stockId}"`,
            fields: 'id,stockId,productId,quantityAvailable',
            expand: 'productId',
        });
        return products;
    }

}