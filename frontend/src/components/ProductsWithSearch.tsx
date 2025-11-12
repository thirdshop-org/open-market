import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { ProductFilters } from './ProductFilters';
import { ProductList } from './ProductList';

interface Filters {
  category: string;
  condition: string;
  priceMin: string;
  priceMax: string;
  status: string;
}

interface Props {
  myProducts?: boolean;
  showStatus?: boolean;
}

export function ProductsWithSearch({ myProducts = false, showStatus = false }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    category: '',
    condition: '',
    priceMin: '',
    priceMax: '',
    status: '',
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Rechercher une pièce, référence, description..."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filtres (sidebar) */}
        <div className="md:col-span-1">
          <ProductFilters
            onFilterChange={handleFilterChange}
            showStatus={showStatus}
          />
        </div>

        {/* Liste des produits */}
        <div className="md:col-span-3">
          <ProductList
            searchQuery={searchQuery}
            myProducts={myProducts}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}

