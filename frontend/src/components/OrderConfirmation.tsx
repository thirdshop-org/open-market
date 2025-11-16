import { useState, useEffect } from 'react';
import { checkoutService, type Order, type OrderProduct } from '@/lib/checkout';
import { productService } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CheckCircle2,
  Package,
  MapPin,
  Calendar,
  CreditCard,
  Store,
  AlertCircle,
} from 'lucide-react';

interface Props {
  orderId: string;
}

export function OrderConfirmation({ orderId }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [subOrders, setSubOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await checkoutService.getFullOrderDetails(orderId);

      if (!data.order) {
        setError('Commande introuvable');
        return;
      }

      setOrder(data.order);
      setSubOrders(data.subOrders);
      setProducts(data.products);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la commande');
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
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erreur</h2>
        <p className="text-muted-foreground mb-6">{error || 'Commande introuvable'}</p>
        <Button asChild>
          <a href="/orders">Voir mes commandes</a>
        </Button>
      </div>
    );
  }

  // Grouper les produits par vendeur
  const productsByVendor = products.reduce((acc, product) => {
    const vendorId = product.expand?.productId?.seller;
    if (!vendorId) return acc;

    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorName: product.expand?.productId?.expand?.seller?.name || 
                    product.expand?.productId?.expand?.seller?.username || 
                    'Vendeur',
        products: [],
        total: 0,
      };
    }

    const productPrice = product.expand?.productId?.price || 0;
    acc[vendorId].products.push(product);
    acc[vendorId].total += productPrice * product.quantity;

    return acc;
  }, {} as Record<string, { vendorName: string; products: OrderProduct[]; total: number }>);

  return (
    <div className="space-y-6">
      {/* En-tête de confirmation */}
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Commande confirmée !</h1>
        <p className="text-muted-foreground">
          Merci pour votre achat. Votre commande a été enregistrée avec succès.
        </p>
        <p className="text-sm text-muted-foreground">
          Numéro de commande : <span className="font-mono font-semibold">{order.id}</span>
        </p>
      </div>

      {/* Informations de la commande */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de la commande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles commandés par vendeur */}
          {Object.entries(productsByVendor).map(([vendorId, vendorData]) => (
            <Card key={vendorId} className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {vendorData.vendorName}
                </CardTitle>
                <CardDescription>
                  {vendorData.products.length}{' '}
                  {vendorData.products.length > 1 ? 'articles' : 'article'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {vendorData.products.map((item) => {
                    const product = item.expand?.productId;
                    if (!product) return null;

                    return (
                      <div key={item.id} className="flex gap-4">
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

                        <div className="flex-1">
                          <h4 className="font-semibold">{product.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantité : {item.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Statut : {checkoutService.getProductStatusLabel(item.productStatus)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(product.price * item.quantity, product.currency)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Sous-total vendeur</span>
                    <span>{formatPrice(vendorData.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Récapitulatif et informations */}
        <div className="lg:col-span-1 space-y-6">
          {/* Récapitulatif */}
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date de commande</span>
                  <span className="font-medium text-right">
                    {formatDate(order.created)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Statut</span>
                  <span className="font-medium">
                    {checkoutService.getPaymentStatusLabel(order.paymentStatus)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nombre de vendeurs</span>
                  <span className="font-medium">{Object.keys(productsByVendor).length}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Articles</span>
                  <span className="font-medium">{products.length}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total payé</span>
                <span className="text-primary">{formatPrice(order.totalAmount, order.currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Adresse de livraison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">
                {checkoutService.formatAddress(order.shippingAddress)}
              </pre>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" asChild>
              <a href="/orders">
                <Package className="h-4 w-4 mr-2" />
                Voir toutes mes commandes
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="/products">Continuer mes achats</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

