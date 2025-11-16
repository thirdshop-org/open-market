import { pb } from './pocketbase';
import type { Product } from './products';

// Types pour le panier
export interface CartItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  productStatus: string;
  created: string;
  updated: string;
  expand?: {
    productId?: Product;
  };
}

export interface Cart {
  id: string;
  userId: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  created: string;
  updated: string;
  items?: CartItem[];
}

export interface CartItemsByVendor {
  vendorId: string;
  vendorName: string;
  vendorAvatar?: string;
  items: CartItem[];
  totalAmount: number;
}

// Service de gestion du panier
export const cartService = {
  /**
   * Récupérer ou créer le panier actif de l'utilisateur
   */
  async getOrCreateCart(): Promise<Cart> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Chercher un panier existant avec le statut "cart" (panier en cours)
      const carts = await pb.collection('orders').getList<Cart>(1, 1, {
        filter: `userId = "${user.id}" && paymentStatus = "cart"`,
        sort: '-created',
      });

      if (carts.items.length > 0) {
        return carts.items[0];
      }

      // Créer un nouveau panier si aucun n'existe
      const newCart = await pb.collection('orders').create<Cart>({
        userId: user.id,
        totalAmount: 0,
        currency: 'EUR',
        paymentStatus: 'cart', // Statut spécial pour le panier
        notes: 'Panier en cours',
      });

      return newCart;
    } catch (error) {
      console.error('Error getting or creating cart:', error);
      throw error;
    }
  },

  /**
   * Ajouter un produit au panier
   */
  async addItem(productId: string, quantity: number = 1): Promise<CartItem> {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer ou créer le panier
      const cart = await this.getOrCreateCart();

      // Vérifier si le produit existe déjà dans le panier
      const existingItems = await pb.collection('ordersProducts').getList<CartItem>(1, 1, {
        filter: `orderId = "${cart.id}" && productId = "${productId}"`,
      });

      if (existingItems.items.length > 0) {
        // Mettre à jour la quantité si le produit existe déjà
        const existingItem = existingItems.items[0];
        return await pb.collection('ordersProducts').update<CartItem>(existingItem.id, {
          quantity: existingItem.quantity + quantity,
        });
      }

      // Ajouter le nouveau produit au panier
      const cartItem = await pb.collection('ordersProducts').create<CartItem>({
        orderId: cart.id,
        productId: productId,
        quantity: quantity,
        productStatus: 'in_preperation',
      });

      // Mettre à jour le total du panier
      await this.updateCartTotal(cart.id);

      return cartItem;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour la quantité d'un article
   */
  async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    try {
      if (quantity <= 0) {
        throw new Error('La quantité doit être supérieure à 0');
      }

      const updatedItem = await pb.collection('ordersProducts').update<CartItem>(itemId, {
        quantity: quantity,
      });

      // Récupérer l'orderId pour mettre à jour le total
      const item = await pb.collection('ordersProducts').getOne<CartItem>(itemId);
      await this.updateCartTotal(item.orderId);

      return updatedItem;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  },

  /**
   * Supprimer un article du panier
   */
  async removeItem(itemId: string): Promise<void> {
    try {
      // Récupérer l'item pour obtenir l'orderId avant suppression
      const item = await pb.collection('ordersProducts').getOne<CartItem>(itemId);
      const orderId = item.orderId;

      // Supprimer l'item
      await pb.collection('ordersProducts').delete(itemId);

      // Mettre à jour le total du panier
      await this.updateCartTotal(orderId);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  /**
   * Récupérer tous les articles du panier avec leurs détails
   */
  async getCartItems(): Promise<CartItem[]> {
    try {
      const cart = await this.getOrCreateCart();

      const items = await pb.collection('ordersProducts').getList<CartItem>(1, 50, {
        filter: `orderId = "${cart.id}"`,
        expand: 'productId,productId.seller',
        sort: '-created',
      });

      return items.items;
    } catch (error) {
      console.error('Error fetching cart items:', error);
      throw error;
    }
  },

  /**
   * Récupérer le nombre total d'articles dans le panier
   */
  async getCartItemCount(): Promise<number> {
    try {
      const items = await this.getCartItems();
      return items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('Error getting cart item count:', error);
      return 0;
    }
  },

  /**
   * Grouper les articles par vendeur
   */
  async getCartItemsByVendor(): Promise<CartItemsByVendor[]> {
    try {
      const items = await this.getCartItems();
      const vendorMap = new Map<string, CartItemsByVendor>();

      items.forEach((item) => {
        const product = item.expand?.productId;
        if (!product) return;

        const seller = product.expand?.seller;
        const vendorId = product.seller;
        const vendorName = seller?.username || seller?.name || 'Vendeur inconnu';
        const vendorAvatar = seller?.avatar;

        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, {
            vendorId,
            vendorName,
            vendorAvatar,
            items: [],
            totalAmount: 0,
          });
        }

        const vendor = vendorMap.get(vendorId)!;
        vendor.items.push(item);
        vendor.totalAmount += product.price * item.quantity;
      });

      return Array.from(vendorMap.values());
    } catch (error) {
      console.error('Error grouping cart items by vendor:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le total du panier
   */
  async updateCartTotal(cartId: string): Promise<void> {
    try {
      const items = await pb.collection('ordersProducts').getList<CartItem>(1, 50, {
        filter: `orderId = "${cartId}"`,
        expand: 'productId',
      });

      const total = items.items.reduce((sum, item) => {
        const product = item.expand?.productId;
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);

      await pb.collection('orders').update(cartId, {
        totalAmount: total,
      });
    } catch (error) {
      console.error('Error updating cart total:', error);
      throw error;
    }
  },

  /**
   * Vider le panier
   */
  async clearCart(): Promise<void> {
    try {
      const cart = await this.getOrCreateCart();
      const items = await pb.collection('ordersProducts').getList<CartItem>(1, 50, {
        filter: `orderId = "${cart.id}"`,
      });

      // Supprimer tous les articles
      await Promise.all(
        items.items.map((item) => pb.collection('ordersProducts').delete(item.id))
      );

      // Mettre à jour le total à 0
      await pb.collection('orders').update(cart.id, {
        totalAmount: 0,
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  /**
   * Récupérer le panier complet avec ses articles
   */
  async getFullCart(): Promise<Cart | null> {
    try {
      const cart = await this.getOrCreateCart();
      const items = await this.getCartItems();
      
      return {
        ...cart,
        items,
      };
    } catch (error) {
      console.error('Error fetching full cart:', error);
      return null;
    }
  },
};

