import { type Product, productService } from '@/lib/products';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { MapPin, Eye } from 'lucide-react';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const firstImage = product.images && product.images.length > 0 
    ? productService.getImageUrl(product, product.images[0], '300x200')
    : null;

  const categoryName = product.expand?.category?.name || 'Sans catégorie';
  const sellerName = product.expand?.seller?.username || 'Vendeur';

  return (
    <a href={`/products/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {firstImage ? (
            <img
              src={firstImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Aucune image
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Catégorie et état */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary font-medium">{categoryName}</span>
              <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                {product.condition}
              </span>
            </div>

            {/* Titre */}
            <h3 className="font-semibold text-lg line-clamp-2 min-h-14">
              {product.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
              {product.description.replace(/<[^>]*>/g, '')}
            </p>

            {/* Référence si présente */}
            {product.reference && (
              <p className="text-xs text-muted-foreground">
                Réf: {product.reference}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary">
              {product.price.toFixed(2)} {product.currency}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {product.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {product.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {product.views}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </a>
  );
}

