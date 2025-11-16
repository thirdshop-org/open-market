import { useState } from 'react';
import { type Product, productService } from '@/lib/products';
import { cartService } from '@/lib/cart';
import { authService } from '@/lib/pocketbase';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Eye, ShoppingCart, Loader2, Check } from 'lucide-react';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const firstImage = product.images && product.images.length > 0 
    ? productService.getImageUrl(product, product.images[0], '300x200')
    : null;

  const categoryName = product.expand?.category?.name || 'Sans catégorie';
  const sellerName = product.expand?.seller?.username || 'Vendeur';
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const isOwner = currentUser && product.seller === currentUser.id;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/products';
      return;
    }

    setAddingToCart(true);
    try {
      await cartService.addItem(product.id, 1);
      setAddedToCart(true);
      
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    } catch (err: any) {
      alert('Erreur lors de l\'ajout au panier : ' + err.message);
    } finally {
      setAddingToCart(false);
    }
  };

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

        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
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
          </div>
          
          {/* Bouton Ajouter au panier - seulement si disponible et pas le propriétaire */}
          {product.status === 'Disponible' && !isOwner && (
            <Button 
              className="w-full"
              size="sm"
              onClick={handleAddToCart}
              disabled={addingToCart || addedToCart}
            >
              {addingToCart ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : addedToCart ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Ajouté
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ajouter au panier
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </a>
  );
}

