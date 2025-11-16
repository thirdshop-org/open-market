import { pb } from './pocketbase';
import { cartService } from './cart';

// Types pour le checkout
export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface BillingAddress extends ShippingAddress {}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  currency: string;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cart';
  notes?: string;
  parentId?: string; // Pour lier les sous-commandes à la commande parent
  created: string;
  updated: string;
  expand?: {
    userId?: any;
  };
}

export interface OrderProduct {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  productStatus: 'in_preperation' | 'ready_to_be_sent' | 'sent' | 'delivered' | 'cancelled';
  created: string;
  updated: string;
  expand?: {
    productId?: any;
    orderId?: any;
  };
}

export interface CheckoutResult {
  success: boolean;
  mainOrderId?: string;
  subOrders?: Order[];
  error?: string;
}

// Service de gestion du checkout
export const checkoutService = {
  /**
   * Valider les informations d'adresse
   */
  validateAddress(address: Partial<ShippingAddress>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address.fullName || address.fullName.trim().length < 2) {
      errors.push('Le nom complet est requis (minimum 2 caractères)');
    }

    if (!address.addressLine1 || address.addressLine1.trim().length < 5) {
      errors.push('L\'adresse est requise (minimum 5 caractères)');
    }

    if (!address.city || address.city.trim().length < 2) {
      errors.push('La ville est requise');
    }

    if (!address.postalCode || !/^\d{5}$/.test(address.postalCode)) {
      errors.push('Le code postal doit contenir 5 chiffres');
    }

    if (!address.country || address.country.trim().length < 2) {
      errors.push('Le pays est requis');
    }

    if (!address.phone || !/^[+]?[0-9\s-]{8,20}$/.test(address.phone)) {
      errors.push('Le numéro de téléphone est invalide');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Simuler un paiement (retourne toujours succès après un délai)
   */
  async simulatePayment(amount: number): Promise<{ success: boolean; transactionId: string }> {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simuler un succès (99% de réussite pour réalisme)
    const success = Math.random() > 0.01;

    return {
      success,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  /**
   * Créer une commande à partir du panier
   * Crée une commande principale et des sous-commandes par vendeur
   */
  async createOrdersFromCart(
    shippingAddress: ShippingAddress,
    billingAddress: BillingAddress,
    paymentMethod: string = 'simulated'
  ): Promise<CheckoutResult> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer le panier avec les articles groupés par vendeur
      const itemsByVendor = await cartService.getCartItemsByVendor();

      if (itemsByVendor.length === 0) {
        throw new Error('Le panier est vide');
      }

      // Calculer le total
      const totalAmount = itemsByVendor.reduce((sum, vendor) => sum + vendor.totalAmount, 0);

      // Simuler le paiement
      const paymentResult = await this.simulatePayment(totalAmount);

      if (!paymentResult.success) {
        return {
          success: false,
          error: 'Le paiement a échoué. Veuillez réessayer.',
        };
      }

      // Créer la commande principale (parent)
      const mainOrder = await pb.collection('orders').create<Order>({
        userId: user.id,
        totalAmount: totalAmount,
        currency: 'EUR',
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: JSON.stringify(billingAddress),
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        notes: `Paiement simulé - Transaction: ${paymentResult.transactionId}`,
      });

      const subOrders: Order[] = [];

      // Créer une sous-commande par vendeur
      for (const vendor of itemsByVendor) {
        const subOrder = await pb.collection('orders').create<Order>({
          userId: user.id,
          totalAmount: vendor.totalAmount,
          currency: 'EUR',
          shippingAddress: JSON.stringify(shippingAddress),
          billingAddress: JSON.stringify(billingAddress),
          paymentMethod: paymentMethod,
          paymentStatus: 'paid',
          parentId: mainOrder.id,
          notes: `Commande pour le vendeur: ${vendor.vendorName}`,
        });

        subOrders.push(subOrder);

        // Créer les produits de la sous-commande
        for (const item of vendor.items) {
          await pb.collection('ordersProducts').create({
            orderId: subOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            productStatus: 'in_preperation',
          });

          // Optionnel : Mettre à jour le statut du produit à "Réservé" ou "Vendu"
          const product = item.expand?.productId;
          if (product) {
            await pb.collection('products').update(product.id, {
              status: 'Réservé', // ou "Vendu" selon votre logique
            });
          }
        }
      }

      // Vider le panier
      await cartService.clearCart();

      return {
        success: true,
        mainOrderId: mainOrder.id,
        subOrders: subOrders,
      };
    } catch (error: any) {
      console.error('Error creating orders:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la commande',
      };
    }
  },

  /**
   * Récupérer une commande par ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await pb.collection('orders').getOne<Order>(orderId, {
        expand: 'userId',
      });
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  /**
   * Récupérer les produits d'une commande
   */
  async getOrderProducts(orderId: string): Promise<OrderProduct[]> {
    try {
      const products = await pb.collection('ordersProducts').getList<OrderProduct>(1, 50, {
        filter: `orderId = "${orderId}"`,
        expand: 'productId,productId.seller',
        sort: 'created',
      });
      return products.items;
    } catch (error) {
      console.error('Error fetching order products:', error);
      return [];
    }
  },

  /**
   * Récupérer toutes les commandes de l'utilisateur
   */
  async getMyOrders(page = 1, perPage = 20): Promise<{ items: Order[]; totalPages: number }> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer uniquement les commandes principales (sans parentId) ou toutes selon le besoin
      const result = await pb.collection('orders').getList<Order>(page, perPage, {
        filter: `userId = "${user.id}" && paymentStatus != "cart"`,
        sort: '-created',
        expand: 'userId',
      });

      return {
        items: result.items,
        totalPages: result.totalPages,
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  /**
   * Récupérer les sous-commandes d'une commande principale
   */
  async getSubOrders(parentOrderId: string): Promise<Order[]> {
    try {
      const subOrders = await pb.collection('orders').getFullList<Order>({
        filter: `parentId = "${parentOrderId}"`,
        sort: 'created',
      });
      return subOrders;
    } catch (error) {
      console.error('Error fetching sub-orders:', error);
      return [];
    }
  },

  /**
   * Obtenir les détails complets d'une commande avec produits et sous-commandes
   */
  async getFullOrderDetails(orderId: string): Promise<{
    order: Order | null;
    products: OrderProduct[];
    subOrders: Order[];
  }> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        return { order: null, products: [], subOrders: [] };
      }

      // Si c'est une commande principale, récupérer les sous-commandes
      const subOrders = await this.getSubOrders(orderId);

      // Récupérer les produits de toutes les sous-commandes
      let allProducts: OrderProduct[] = [];
      if (subOrders.length > 0) {
        for (const subOrder of subOrders) {
          const products = await this.getOrderProducts(subOrder.id);
          allProducts = [...allProducts, ...products];
        }
      } else {
        // Si pas de sous-commandes, c'est peut-être une sous-commande elle-même
        allProducts = await this.getOrderProducts(orderId);
      }

      return {
        order,
        products: allProducts,
        subOrders,
      };
    } catch (error) {
      console.error('Error fetching full order details:', error);
      return { order: null, products: [], subOrders: [] };
    }
  },

  /**
   * Formater une adresse pour l'affichage
   */
  formatAddress(addressJson: string): string {
    try {
      const address: ShippingAddress = JSON.parse(addressJson);
      return `${address.fullName}\n${address.addressLine1}${
        address.addressLine2 ? '\n' + address.addressLine2 : ''
      }\n${address.postalCode} ${address.city}\n${address.country}`;
    } catch {
      return 'Adresse non disponible';
    }
  },

  /**
   * Obtenir le statut de la commande en français
   */
  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      paid: 'Payée',
      failed: 'Échouée',
      refunded: 'Remboursée',
      cart: 'Panier',
    };
    return labels[status] || status;
  },

  /**
   * Obtenir le statut du produit en français
   */
  getProductStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      in_preperation: 'En préparation',
      ready_to_be_sent: 'Prêt à être envoyé',
      sent: 'Envoyé',
      delivered: 'Livré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  },
};

