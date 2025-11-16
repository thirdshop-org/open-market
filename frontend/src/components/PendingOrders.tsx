import { useState, useEffect } from 'react';
import { sellerOrderService, type SellerOrder } from '@/lib/seller-orders';
import { productService } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Package,
  Truck,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export function PendingOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await sellerOrderService.getPendingOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReadyToSend = async (sellerOrder: SellerOrder) => {
    const orderId = sellerOrder.order.id;
    setUpdatingItems((prev) => new Set(prev).add(orderId));

    try {
      await sellerOrderService.markOrderAsReadyToSend(sellerOrder.products);
      await loadOrders();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleMarkAsSent = async (sellerOrder: SellerOrder) => {
    if (!confirm('Confirmer l\'envoi de cette commande ?')) {
      return;
    }

    const orderId = sellerOrder.order.id;
    setUpdatingItems((prev) => new Set(prev).add(orderId));

    try {
      await sellerOrderService.markOrderAsSent(sellerOrder.products);
      await loadOrders();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleUpdateStatus = async (
    orderProductId: string,
    newStatus: 'in_preperation' | 'ready_to_be_sent' | 'sent'
  ) => {
    setUpdatingItems((prev) => new Set(prev).add(orderProductId));

    try {
      await sellerOrderService.updateProductStatus(orderProductId, newStatus);
      await loadOrders();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(orderProductId);
        return next;
      });
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

  const getOrderTotal = (sellerOrder: SellerOrder) => {
    return sellerOrder.products.reduce((sum, item) => {
      const product = item.expand?.productId;
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const allProductsReadyToSend = (sellerOrder: SellerOrder) => {
    return sellerOrder.products.every((item) => item.productStatus === 'ready_to_be_sent');
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
            Toutes vos commandes sont à jour !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold">Commandes en attente d'envoi</h2>
        <p className="text-muted-foreground">
          {orders.length} {orders.length > 1 ? 'commandes' : 'commande'} à traiter
        </p>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {orders.map((sellerOrder) => {
          const isUpdating = updatingItems.has(sellerOrder.order.id);
          const total = getOrderTotal(sellerOrder);
          const isReadyToSend = allProductsReadyToSend(sellerOrder);

          return (
            <Card key={sellerOrder.order.id} className="border-2">
              <CardHeader className="bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Commande #{sellerOrder.order.id.slice(-8)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(sellerOrder.order.created)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {sellerOrder.buyer.name}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatPrice(total)}</p>
                    <p className="text-sm text-muted-foreground">
                      {sellerOrder.products.length}{' '}
                      {sellerOrder.products.length > 1 ? 'articles' : 'article'}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Liste des produits */}
                <div className="space-y-4">
                  {sellerOrder.products.map((item, index) => {
                    const product = item.expand?.productId;
                    if (!product) return null;

                    const itemUpdating = updatingItems.has(item.id);

                    return (
                      <div key={item.id}>
                        <div className="flex gap-4">
                          {/* Image */}
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={productService.getImageUrl(product, product.images[0], '100x100')}
                              alt={product.title}
                              className="h-16 w-16 rounded object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}

                          {/* Détails */}
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantité : {item.quantity}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className={sellerOrderService.getStatusColor(item.productStatus)}
                              >
                                {sellerOrderService.getStatusLabel(item.productStatus)}
                              </Badge>
                            </div>
                          </div>

                          {/* Prix et actions */}
                          <div className="text-right space-y-2">
                            <p className="font-semibold">
                              {formatPrice(product.price * item.quantity)}
                            </p>

                            {/* Boutons de changement de statut */}
                            {item.productStatus === 'in_preperation' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(item.id, 'ready_to_be_sent')}
                                disabled={itemUpdating}
                              >
                                {itemUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Prêt
                                  </>
                                )}
                              </Button>
                            )}

                            {item.productStatus === 'ready_to_be_sent' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(item.id, 'in_preperation')}
                                disabled={itemUpdating}
                              >
                                {itemUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4 mr-2" />
                                    En préparation
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {index < sellerOrder.products.length - 1 && <Separator className="mt-4" />}
                      </div>
                    );
                  })}
                </div>

                {/* Adresse de livraison */}
                {sellerOrder.shippingAddress && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Adresse de livraison</p>
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {sellerOrderService.formatAddress(sellerOrder.shippingAddress)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions globales */}
                <div className="mt-6 flex gap-2">
                  {!isReadyToSend && (
                    <Button
                      onClick={() => handleMarkAsReadyToSend(sellerOrder)}
                      disabled={isUpdating}
                      variant="outline"
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Tout marquer comme prêt
                        </>
                      )}
                    </Button>
                  )}

                  {isReadyToSend && (
                    <Button
                      onClick={() => handleMarkAsSent(sellerOrder)}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-2" />
                          Marquer comme envoyé
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

