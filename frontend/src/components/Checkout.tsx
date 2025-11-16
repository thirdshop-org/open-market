import { useState, useEffect } from 'react';
import { cartService, type CartItemsByVendor } from '@/lib/cart';
import { checkoutService, type ShippingAddress, type BillingAddress } from '@/lib/checkout';
import { productService } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Package,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function Checkout() {
  const [itemsByVendor, setItemsByVendor] = useState<CartItemsByVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Adresse de livraison
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'France',
    phone: '',
  });

  // Adresse de facturation
  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'France',
    phone: '',
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await cartService.getCartItemsByVendor();
      if (data.length === 0) {
        window.location.href = '/cart';
        return;
      }
      setItemsByVendor(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const handleShippingChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
    if (sameAsBilling) {
      setBillingAddress((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleBillingChange = (field: keyof BillingAddress, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation des adresses
    const shippingValidation = checkoutService.validateAddress(shippingAddress);
    if (!shippingValidation.valid) {
      setError('Adresse de livraison : ' + shippingValidation.errors.join(', '));
      return;
    }

    const addressToValidate = sameAsBilling ? shippingAddress : billingAddress;
    const billingValidation = checkoutService.validateAddress(addressToValidate);
    if (!billingValidation.valid) {
      setError('Adresse de facturation : ' + billingValidation.errors.join(', '));
      return;
    }

    setProcessing(true);

    try {
      const result = await checkoutService.createOrdersFromCart(
        shippingAddress,
        sameAsBilling ? shippingAddress : billingAddress,
        'simulated'
      );

      if (result.success && result.mainOrderId) {
        // Rediriger vers la page de confirmation
        window.location.href = `/order-confirmation?orderId=${result.mainOrderId}`;
      } else {
        setError(result.error || 'Erreur lors du paiement');
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du paiement');
      setProcessing(false);
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Finaliser la commande</h1>
        <p className="text-muted-foreground">
          {totalItems} {totalItems > 1 ? 'articles' : 'article'} • {formatPrice(totalAmount)}
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire d'adresse */}
          <div className="lg:col-span-2 space-y-6">
            {/* Adresse de livraison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse de livraison
                </CardTitle>
                <CardDescription>Où souhaitez-vous recevoir votre commande ?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="fullName">Nom complet *</Label>
                    <Input
                      id="fullName"
                      value={shippingAddress.fullName}
                      onChange={(e) => handleShippingChange('fullName', e.target.value)}
                      required
                      disabled={processing}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="addressLine1">Adresse *</Label>
                    <Input
                      id="addressLine1"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => handleShippingChange('addressLine1', e.target.value)}
                      required
                      disabled={processing}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="addressLine2">Complément d'adresse</Label>
                    <Input
                      id="addressLine2"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => handleShippingChange('addressLine2', e.target.value)}
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Code postal *</Label>
                    <Input
                      id="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleShippingChange('postalCode', e.target.value)}
                      required
                      maxLength={5}
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                      required
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Pays *</Label>
                    <Input
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => handleShippingChange('country', e.target.value)}
                      required
                      disabled={processing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => handleShippingChange('phone', e.target.value)}
                      required
                      disabled={processing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adresse de facturation */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse de facturation</CardTitle>
                <CardDescription>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      disabled={processing}
                      className="rounded"
                    />
                    <span>Identique à l'adresse de livraison</span>
                  </label>
                </CardDescription>
              </CardHeader>

              {!sameAsBilling && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="billing_fullName">Nom complet *</Label>
                      <Input
                        id="billing_fullName"
                        value={billingAddress.fullName}
                        onChange={(e) => handleBillingChange('fullName', e.target.value)}
                        required
                        disabled={processing}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="billing_addressLine1">Adresse *</Label>
                      <Input
                        id="billing_addressLine1"
                        value={billingAddress.addressLine1}
                        onChange={(e) => handleBillingChange('addressLine1', e.target.value)}
                        required
                        disabled={processing}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="billing_addressLine2">Complément d'adresse</Label>
                      <Input
                        id="billing_addressLine2"
                        value={billingAddress.addressLine2}
                        onChange={(e) => handleBillingChange('addressLine2', e.target.value)}
                        disabled={processing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="billing_postalCode">Code postal *</Label>
                      <Input
                        id="billing_postalCode"
                        value={billingAddress.postalCode}
                        onChange={(e) => handleBillingChange('postalCode', e.target.value)}
                        required
                        maxLength={5}
                        disabled={processing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="billing_city">Ville *</Label>
                      <Input
                        id="billing_city"
                        value={billingAddress.city}
                        onChange={(e) => handleBillingChange('city', e.target.value)}
                        required
                        disabled={processing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="billing_country">Pays *</Label>
                      <Input
                        id="billing_country"
                        value={billingAddress.country}
                        onChange={(e) => handleBillingChange('country', e.target.value)}
                        required
                        disabled={processing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="billing_phone">Téléphone *</Label>
                      <Input
                        id="billing_phone"
                        type="tel"
                        value={billingAddress.phone}
                        onChange={(e) => handleBillingChange('phone', e.target.value)}
                        required
                        disabled={processing}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Articles par vendeur */}
                <div className="space-y-3">
                  {itemsByVendor.map((vendor) => (
                    <div key={vendor.vendorId} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-primary" />
                        <span>{vendor.vendorName}</span>
                      </div>
                      {vendor.items.map((item) => {
                        const product = item.expand?.productId;
                        if (!product) return null;
                        return (
                          <div key={item.id} className="flex justify-between text-sm ml-6">
                            <span className="text-muted-foreground">
                              {product.title} × {item.quantity}
                            </span>
                            <span className="font-medium">
                              {formatPrice(product.price * item.quantity, product.currency)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-sm font-medium ml-6 pt-1 border-t">
                        <span>Sous-total</span>
                        <span>{formatPrice(vendor.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary text-2xl">{formatPrice(totalAmount)}</span>
                </div>

                {/* Bouton de paiement */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payer {formatPrice(totalAmount)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Paiement sécurisé simulé
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

