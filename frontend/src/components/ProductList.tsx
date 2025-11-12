import { useState, useEffect } from 'react';
import { productService, type Product } from '@/lib/products';
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';

interface Props {
  filter?: string;
  categoryId?: string;
  sellerId?: string;
  searchQuery?: string;
  myProducts?: boolean;
}

export function ProductList({ filter, categoryId, sellerId, searchQuery, myProducts }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadProducts();
  }, [filter, categoryId, sellerId, searchQuery, myProducts, page]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      let result;

      if (myProducts) {
        result = await productService.getMyProducts(page);
      } else if (searchQuery) {
        result = await productService.search(searchQuery, page);
      } else if (categoryId) {
        result = await productService.getByCategory(categoryId, page);
      } else if (sellerId) {
        result = await productService.getBySeller(sellerId, page);
      } else {
        result = await productService.getAll(page, 20, filter);
      }

      setProducts(result.items);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">Aucun produit trouvé</p>
        <p className="text-muted-foreground text-sm mt-2">
          Essayez de modifier vos critères de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grille de produits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-md border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          
          <span className="px-4 py-2">
            Page {page} sur {totalPages}
          </span>
          
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-md border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

