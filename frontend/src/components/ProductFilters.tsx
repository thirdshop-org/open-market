import { useState, useEffect } from 'react';
import { categoryService, type Category } from '@/lib/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Filter, Loader2 } from 'lucide-react';

interface Filters {
  category: string;
  condition: string;
  priceMin: string;
  priceMax: string;
  status: string;
}

interface Props {
  onFilterChange: (filters: Filters) => void;
  showStatus?: boolean;
}

export function ProductFilters({ onFilterChange, showStatus = false }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    category: '',
    condition: '',
    priceMin: '',
    priceMax: '',
    status: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAll();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      category: '',
      condition: '',
      priceMin: '',
      priceMax: '',
      status: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-4">
      {/* Bouton toggle mobile */}
      <Button
        variant="outline"
        className="w-full md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtres
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
            Actifs
          </span>
        )}
      </Button>

      {/* Panneau de filtres */}
      <Card className={`${isOpen ? 'block' : 'hidden'} md:block`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* État */}
          <div className="space-y-2">
            <Label>État</Label>
            <select
              value={filters.condition}
              onChange={(e) => handleFilterChange('condition', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Tous les états</option>
              <option value="Neuf">Neuf</option>
              <option value="Occasion">Occasion</option>
              <option value="Reconditionné">Reconditionné</option>
            </select>
          </div>

          {/* Prix */}
          <div className="space-y-2">
            <Label>Prix (€)</Label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                min="0"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                min="0"
              />
            </div>
          </div>

          {/* Statut (seulement pour mes annonces) */}
          {showStatus && (
            <div className="space-y-2">
              <Label>Statut</Label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Tous les statuts</option>
                <option value="Disponible">Disponible</option>
                <option value="Réservé">Réservé</option>
                <option value="Vendu">Vendu</option>
                <option value="Brouillon">Brouillon</option>
              </select>
            </div>
          )}

          {/* Compteur de filtres actifs */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {Object.values(filters).filter(v => v !== '').length} filtre(s) actif(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

