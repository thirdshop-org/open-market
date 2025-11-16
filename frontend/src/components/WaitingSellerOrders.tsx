import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { checkoutService, type Order, type OrderProduct } from '@/lib/checkout';
import { productService, type Product } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Package,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  Store,
} from 'lucide-react';

interface BuyerOrder {
  order: Order;
  products: OrderProduct[];
  sellerInfo: {
    id: string;
    name: string;
  };
}

export function WaitingSellerOrders() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer les commandes de l'utilisateur (sous-commandes uniquement car elles contiennent les produits)
      const allOrders = await pb.collection('orders').getFullList<Order>({
        filter: `userId = "${user.id}" && paymentStatus = "paid" && parentId != ""`,
        sort: '-created',
      });

      // Pour chaque commande, récupérer les produits et le vendeur
      const buyerOrders: BuyerOrder[] = [];

      for (const order of allOrders) {
        const products = await pb.collection('ordersProducts').getFullList<OrderProduct>({
          filter: `orderId = "${order.id}"`,
          expand: 'productId,productId.seller',
        });

        // Filtrer uniquement les produits en attente d'action du vendeur
        const pendingProducts = products.filter(
          (p) => p.productStatus === 'in_preperation' || p.productStatus === 'ready_to_be_sent'
        );

        if (pendingProducts.length > 0) {
          // Récupérer les infos du vendeur depuis le premier produit
          const firstProduct = pendingProducts[0].expand?.productId;
          const seller = firstProduct?.expand?.seller;

          buyerOrders.push({
            order,
            products: pendingProducts,
            sellerInfo: {
              id: seller?.id || '',
              name: seller?.name || seller?.username || 'Vendeur inconnu',
            },
          });
        }
      }

      setOrders(buyerOrders);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderTotal = (buyerOrder: BuyerOrder) => {
    return buyerOrder.products.reduce((sum, item) => {
      const product = item.expand?.productId;
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      in_preperation: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      ready_to_be_sent: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      sent: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      delivered: 'bg-green-100 text-green-800 hover:bg-green-100',
      cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      in_preperation: 'En préparation par le vendeur',
      ready_to_be_sent: 'Prêt à être expédié',
      sent: 'Envoyé',
      delivered: 'Livré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
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
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadOrders}>Réessayer</Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune commande en attente</h3>
          <p className="text-muted-foreground text-center">
            Toutes vos commandes ont été traitées par les vendeurs !
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/'}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continuer mes achats
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold">Mes commandes en cours</h2>
        <p className="text-muted-foreground">
          {orders.length} {orders.length > 1 ? 'commandes' : 'commande'} en attente de traitement par les vendeurs
        </p>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {orders.map((buyerOrder) => {
          const total = getOrderTotal(buyerOrder);

          return (
            <Card key={buyerOrder.order.id} className="border-2">
              <CardHeader className="bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Commande #{buyerOrder.order.id.slice(-8)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(buyerOrder.order.created)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Store className="h-4 w-4" />
                        Vendeur : {buyerOrder.sellerInfo.name}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatPrice(total)}</p>
                    <p className="text-sm text-muted-foreground">
                      {buyerOrder.products.length}{' '}
                      {buyerOrder.products.length > 1 ? 'articles' : 'article'}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Liste des produits */}
                <div className="space-y-4">
                  {buyerOrder.products.map((item, index) => {
                    const product = item.expand?.productId as Product;
                    if (!product) return null;

                    return (
                      <div key={item.id}>
                        <div className="flex gap-4">
                          {/* Image */}
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={productService.getImageUrl(product, product.images[0], '100x100')}
                              alt={product.title}
                              className="h-20 w-20 rounded object-cover"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded bg-muted flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}

                          {/* Détails */}
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Quantité : {item.quantity}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={getStatusColor(item.productStatus)}
                              >
                                {getStatusLabel(item.productStatus)}
                              </Badge>
                            </div>
                          </div>

                          {/* Prix */}
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              {formatPrice(product.price * item.quantity)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(product.price)} / unité
                            </p>
                          </div>
                        </div>

                        {index < buyerOrder.products.length - 1 && <Separator className="mt-4" />}
                      </div>
                    );
                  })}
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bouton de rafraîchissement */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={loadOrders}>
          Actualiser les commandes
        </Button>
      </div>
    </div>
  );
}