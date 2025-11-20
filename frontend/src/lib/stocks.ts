import { pb } from "./pocketbase";
import type { Product } from "./products";

export type Stock = {
    id: string;
    name: string;
    parentId: string;
    createdAt: string;
    updatedAt: string;
}

export const stocksService = {

    async getMyStocks(): Promise<Stock[]> {

        const user = pb.authStore.model;
        if (!user) throw new Error('Non authentifié');

        const stocks = await pb.collection('stocks').getFullList<Product>({
            filter: `seller = "${user.id}"`,
            fields: 'id,name,parentId,createdAt,updatedAt',
        });

        return stocks.map((stock) => ({
            id: stock.id,
            name: stock.name,
            parentId: stock.parentId,
            createdAt: stock.createdAt,
            updatedAt: stock.updatedAt,
        }));
        
    }

}