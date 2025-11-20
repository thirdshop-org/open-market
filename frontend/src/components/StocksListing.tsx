import { useEffect, useState } from "react";
import { stocksService, type Stock } from "@/lib/stocks";

export function StocksListing() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(()=>{
        getStocks();
    }, []);


    const getStocks = async () => {
        const stocks = await stocksService.getMyStocks();
        setStocks(stocks);
        setLoading(false);
    }

    return (
        <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stocks.map((stock) => (
                <div key={stock.id} className="border rounded-lg p-4">
                    <h2 className="text-lg font-bold">{stock.name}</h2>
                    <p className="text-sm text-muted-foreground">{stock.parentId}</p>
                </div>
            ))}
        </div>
        </div>
    );
    
}