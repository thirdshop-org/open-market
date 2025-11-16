import { pb } from './pocketbase';
import type { Order, OrderProduct } from './checkout';
import type { Product } from './products';

// Type pour une commande vendeur avec ses détails
export interface SellerOrder {
  order: Order;
  products: OrderProduct[];
  buyer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: any;
}

// Type pour les statistiques vendeur
export interface SellerStats {
  pendingOrders: number;
  readyToSend: number;
  sent: number;
  delivered: number;
  totalRevenue: number;
}

// Service de gestion des commandes pour les vendeurs
export const sellerOrderService = {
  /**
   * Récupérer toutes les commandes où le vendeur a des produits
   */
  async getMySellerOrders(page = 1, perPage = 20): Promise<{
    items: SellerOrder[];
    totalPages: number;
  }> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer tous les produits du vendeur
      const myProducts = await pb.collection('products').getFullList<Product>({
        filter: `seller = "${user.id}"`,
        fields: 'id',
      });

      const productIds = myProducts.map((p) => p.id);

      if (productIds.length === 0) {
        return { items: [], totalPages: 0 };
      }

      // Récupérer les orderProducts qui contiennent nos produits
      const orderProductsResult = await pb.collection('ordersProducts').getList<OrderProduct>(
        page,
        perPage,
        {
          filter: productIds.map((id) => `productId = "${id}"`).join(' || '),
          expand: 'orderId,orderId.userId,productId,productId.seller',
          sort: '-created',
        }
      );

      // Grouper par commande
      const ordersMap = new Map<string, SellerOrder>();

      for (const orderProduct of orderProductsResult.items) {
        const order = orderProduct.expand?.orderId as Order;
        if (!order) continue;

        const orderId = order.id;

        if (!ordersMap.has(orderId)) {
          const buyer = order.expand?.userId || {};
          ordersMap.set(orderId, {
            order,
            products: [],
            buyer: {
              id: buyer.id || '',
              name: buyer.name || buyer.username || 'Acheteur',
              email: buyer.email || '',
              phone: buyer.phone || '',
            },
            shippingAddress: order.shippingAddress
              ? JSON.parse(order.shippingAddress)
              : null,
          });
        }

        ordersMap.get(orderId)!.products.push(orderProduct);
      }

      return {
        items: Array.from(ordersMap.values()),
        totalPages: orderProductsResult.totalPages,
      };
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      throw error;
    }
  },

  /**
   * Récupérer uniquement les commandes en attente d'envoi
   * (statut: in_preperation ou ready_to_be_sent)
   */
  async getPendingOrders(): Promise<SellerOrder[]> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer tous les produits du vendeur
      const myProducts = await pb.collection('products').getFullList<Product>({
        filter: `seller = "${user.id}"`,
        fields: 'id',
      });

      const productIds = myProducts.map((p) => p.id);

      if (productIds.length === 0) {
        return [];
      }

      // Récupérer les orderProducts en attente
      const productFilter = productIds.map((id) => `productId = "${id}"`).join(' || ');
      const statusFilter =
        '(productStatus = "in_preperation" || productStatus = "ready_to_be_sent")';
      const filter = `(${productFilter}) && ${statusFilter}`;

      const orderProducts = await pb.collection('ordersProducts').getFullList<OrderProduct>({
        filter,
        expand: 'orderId,orderId.userId,productId,productId.seller',
        sort: '-created',
      });

      // Grouper par commande
      const ordersMap = new Map<string, SellerOrder>();

      for (const orderProduct of orderProducts) {
        const order = orderProduct.expand?.orderId as Order;
        if (!order || order.paymentStatus !== 'paid') continue;

        const orderId = order.id;

        if (!ordersMap.has(orderId)) {
          const buyer = order.expand?.userId || {};
          ordersMap.set(orderId, {
            order,
            products: [],
            buyer: {
              id: buyer.id || '',
              name: buyer.name || buyer.username || 'Acheteur',
              email: buyer.email || '',
              phone: buyer.phone || '',
            },
            shippingAddress: order.shippingAddress,
          });
        }

        ordersMap.get(orderId)!.products.push(orderProduct);
      }

      return Array.from(ordersMap.values());
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      throw error;
    }
  },

  /**
   * Récupérer les commandes prêtes à être envoyées
   */
  async getReadyToSendOrders(): Promise<SellerOrder[]> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      const myProducts = await pb.collection('products').getFullList<Product>({
        filter: `seller = "${user.id}"`,
        fields: 'id',
      });

      const productIds = myProducts.map((p) => p.id);

      if (productIds.length === 0) {
        return [];
      }

      const productFilter = productIds.map((id) => `productId = "${id}"`).join(' || ');
      const statusFilter = 'productStatus = "ready_to_be_sent"';
      const filter = `(${productFilter}) && ${statusFilter}`;

      const orderProducts = await pb.collection('ordersProducts').getFullList<OrderProduct>({
        filter,
        expand: 'orderId,orderId.userId,productId',
        sort: '-created',
      });

      const ordersMap = new Map<string, SellerOrder>();

      for (const orderProduct of orderProducts) {
        const order = orderProduct.expand?.orderId as Order;
        if (!order || order.paymentStatus !== 'paid') continue;

        const orderId = order.id;

        if (!ordersMap.has(orderId)) {
          const buyer = order.expand?.userId || {};
          ordersMap.set(orderId, {
            order,
            products: [],
            buyer: {
              id: buyer.id || '',
              name: buyer.name || buyer.username || 'Acheteur',
              email: buyer.email || '',
              phone: buyer.phone || '',
            },
            shippingAddress: order.shippingAddress
              ? JSON.parse(order.shippingAddress)
              : null,
          });
        }

        ordersMap.get(orderId)!.products.push(orderProduct);
      }

      return Array.from(ordersMap.values());
    } catch (error) {
      console.error('Error fetching ready to send orders:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le statut d'un produit dans une commande
   */
  async updateProductStatus(
    orderProductId: string,
    newStatus: 'in_preperation' | 'ready_to_be_sent' | 'sent' | 'delivered' | 'cancelled'
  ): Promise<void> {
    try {
      await pb.collection('ordersProducts').update(orderProductId, {
        productStatus: newStatus,
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      throw error;
    }
  },

  /**
   * Marquer tous les produits d'une commande comme "prêts à être envoyés"
   */
  async markOrderAsReadyToSend(orderProducts: OrderProduct[]): Promise<void> {
    try {
      await Promise.all(
        orderProducts.map((item) =>
          pb.collection('ordersProducts').update(item.id, {
            productStatus: 'ready_to_be_sent',
          })
        )
      );
    } catch (error) {
      console.error('Error marking order as ready to send:', error);
      throw error;
    }
  },

  /**
   * Marquer tous les produits d'une commande comme "envoyés"
   */
  async markOrderAsSent(orderProducts: OrderProduct[]): Promise<void> {
    try {
      await Promise.all(
        orderProducts.map((item) =>
          pb.collection('ordersProducts').update(item.id, {
            productStatus: 'sent',
          })
        )
      );
    } catch (error) {
      console.error('Error marking order as sent:', error);
      throw error;
    }
  },

  /**
   * Obtenir les statistiques du vendeur
   */
  async getSellerStats(): Promise<SellerStats> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      const myProducts = await pb.collection('products').getFullList<Product>({
        filter: `seller = "${user.id}"`,
        fields: 'id',
      });

      const productIds = myProducts.map((p) => p.id);

      if (productIds.length === 0) {
        return {
          pendingOrders: 0,
          readyToSend: 0,
          sent: 0,
          delivered: 0,
          totalRevenue: 0,
        };
      }

      const productFilter = productIds.map((id) => `productId = "${id}"`).join(' || ');

      // Compter par statut
      const [pending, readyToSend, sent, delivered, all] = await Promise.all([
        pb.collection('ordersProducts').getList(1, 1, {
          filter: `(${productFilter}) && productStatus = "in_preperation"`,
        }),
        pb.collection('ordersProducts').getList(1, 1, {
          filter: `(${productFilter}) && productStatus = "ready_to_be_sent"`,
        }),
        pb.collection('ordersProducts').getList(1, 1, {
          filter: `(${productFilter}) && productStatus = "sent"`,
        }),
        pb.collection('ordersProducts').getList(1, 1, {
          filter: `(${productFilter}) && productStatus = "delivered"`,
        }),
        pb.collection('ordersProducts').getFullList({
          filter: productFilter,
          expand: 'orderId,productId',
        }),
      ]);

      // Calculer le revenu total (commandes payées uniquement)
      let totalRevenue = 0;
      for (const item of all) {
        const order = item.expand?.orderId as Order;
        const product = item.expand?.productId as Product;
        if (order?.paymentStatus === 'paid' && product) {
          totalRevenue += product.price * item.quantity;
        }
      }

      return {
        pendingOrders: pending.totalItems,
        readyToSend: readyToSend.totalItems,
        sent: sent.totalItems,
        delivered: delivered.totalItems,
        totalRevenue,
      };
    } catch (error) {
      console.error('Error fetching seller stats:', error);
      return {
        pendingOrders: 0,
        readyToSend: 0,
        sent: 0,
        delivered: 0,
        totalRevenue: 0,
      };
    }
  },

  /**
   * Formater une adresse pour l'affichage
   */
  formatAddress(address: any): string {
    if (!address) return 'Adresse non disponible';
    
    return `${address.fullName}\n${address.addressLine1}${
      address.addressLine2 ? '\n' + address.addressLine2 : ''
    }\n${address.postalCode} ${address.city}\n${address.country}${
      address.phone ? '\nTél: ' + address.phone : ''
    }`;
  },

  /**
   * Obtenir le statut en français
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      in_preperation: 'En préparation',
      ready_to_be_sent: 'Prêt à envoyer',
      sent: 'Envoyé',
      delivered: 'Livré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  },

  /**
   * Obtenir la couleur du badge selon le statut
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      in_preperation: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      ready_to_be_sent: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      sent: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      delivered: 'bg-green-100 text-green-800 hover:bg-green-100',
      cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  },
};

