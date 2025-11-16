import { useState, useEffect } from 'react';
import { cartService, type CartItemsByVendor } from '@/lib/cart';
import { productService } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Store,
  Package,
  AlertCircle,
} from 'lucide-react';
import { authService } from '@/lib/pocketbase';
export function Cart() {
  const [itemsByVendor, setItemsByVendor] = useState<CartItemsByVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const isAuthenticated = authService.isAuthenticated() ?? false;

  useEffect(() => {

    if (!isAuthenticated) {
      window.location.href = '/login?redirect=/cart';
      return;
    }

    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await cartService.getCartItemsByVendor();
      setItemsByVendor(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId);
      return;
    }

    setUpdatingItems((prev) => new Set(prev).add(itemId));

    try {
      await cartService.updateItemQuantity(itemId, newQuantity);
      await loadCart();
    } catch (err: any) {
      alert('Erreur lors de la mise à jour : ' + err.message);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Voulez-vous retirer cet article du panier ?')) {
      return;
    }

    setUpdatingItems((prev) => new Set(prev).add(itemId));

    try {
      await cartService.removeItem(itemId);
      await loadCart();
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + err.message);
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Voulez-vous vider complètement votre panier ?')) {
      return;
    }

    setLoading(true);
    try {
      await cartService.clearCart();
      await loadCart();
    } catch (err: any) {
      alert('Erreur lors du vidage du panier : ' + err.message);
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const totalAmount = itemsByVendor.reduce((sum, vendor) => sum + vendor.totalAmount, 0);
  const totalItems = itemsByVendor.reduce(
    (sum, vendor) => sum + vendor.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadCart}>Réessayer</Button>
      </div>
    );
  }

  if (itemsByVendor.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Votre panier est vide</h2>
        <p className="text-muted-foreground mb-6">
          Ajoutez des articles pour commencer vos achats
        </p>
        <Button asChild>
          <a href="/products">Découvrir les produits</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mon panier</h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems > 1 ? 'articles' : 'article'} de{' '}
            {itemsByVendor.length} {itemsByVendor.length > 1 ? 'vendeurs' : 'vendeur'}
          </p>
        </div>
        <Button variant="outline" onClick={handleClearCart}>
          <Trash2 className="h-4 w-4 mr-2" />
          Vider le panier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des articles groupés par vendeur */}
        <div className="lg:col-span-2 space-y-4">
          {itemsByVendor.map((vendor) => (
            <Card 
              key={vendor.vendorId}
              className="border-2 border-primary/20 shadow-md"
            >
              {/* En-tête du vendeur */}
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {vendor.vendorAvatar ? (
                      <img
                        src={vendor.vendorAvatar}
                        alt={vendor.vendorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {vendor.vendorName}
                    </CardTitle>
                    <CardDescription>
                      {vendor.items.length} {vendor.items.length > 1 ? 'articles' : 'article'} •{' '}
                      {formatPrice(vendor.totalAmount)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Articles du vendeur */}
              <CardContent className="p-0">
                {vendor.items.map((item, index) => {
                  const product = item.expand?.productId;
                  if (!product) return null;

                  const isUpdating = updatingItems.has(item.id);

                  return (
                    <div key={item.id}>
                      <div className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex gap-4">
                          {/* Image du produit */}
                          <div className="flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={productService.getImageUrl(
                                  product,
                                  product.images[0],
                                  '100x100'
                                )}
                                alt={product.title}
                                className="h-20 w-20 rounded object-cover"
                              />
                            ) : (
                              <div className="h-20 w-20 rounded bg-muted flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Détails du produit */}
                          <div className="flex-1 min-w-0">
                            <a
                              href={`/products/${product.id}`}
                              className="font-semibold hover:text-primary transition-colors line-clamp-2"
                            >
                              {product.title}
                            </a>
                            <p className="text-sm text-muted-foreground mt-1">
                              {product.condition} • {product.expand?.category?.name}
                            </p>
                            <p className="text-lg font-bold text-primary mt-2">
                              {formatPrice(product.price, product.currency)}
                            </p>
                          </div>

                          {/* Contrôles de quantité */}
                          <div className="flex flex-col items-end justify-between">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleUpdateQuantity(item.id, item.quantity - 1)
                                }
                                disabled={isUpdating || item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <span className="w-8 text-center font-semibold">
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  item.quantity
                                )}
                              </span>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleUpdateQuantity(item.id, item.quantity + 1)
                                }
                                disabled={isUpdating}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {index < vendor.items.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {itemsByVendor.map((vendor) => (
                  <div key={vendor.vendorId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{vendor.vendorName}</span>
                    <span className="font-medium">{formatPrice(vendor.totalAmount)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary text-2xl">{formatPrice(totalAmount)}</span>
              </div>

              <Button size="lg" className="w-full" asChild>
                <a href="/checkout">Procéder au paiement</a>
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Les frais de livraison seront calculés à l'étape suivante
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

