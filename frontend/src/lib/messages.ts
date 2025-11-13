import { pb } from './pocketbase';

// Types pour les messages
export interface Message {
  id: string;
  sender: string;
  receiver: string;
  product: string;
  content: string;
  isRead: boolean;
  created: string;
  updated: string;
  expand?: {
    sender?: {
      id: string;
      username: string;
      avatar?: string;
    };
    receiver?: {
      id: string;
      username: string;
      avatar?: string;
    };
    product?: {
      id: string;
      title: string;
      images?: string[];
    };
  };
}

export interface Conversation {
  otherUser: {
    id: string;
    username: string;
    avatar?: string;
  };
  product: {
    id: string;
    title: string;
    images?: string[];
  };
  lastMessage: Message;
  unreadCount: number;
}

// Service de messagerie
export const messageService = {
  /**
   * Envoyer un message
   */
  async send(receiverId: string, productId: string, content: string) {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      return await pb.collection('messages').create<Message>({
        sender: user.id,
        receiver: receiverId,
        product: productId,
        content: content.trim(),
        isRead: false,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Récupérer les messages d'une conversation
   */
  async getConversation(otherUserId: string, productId: string, page = 1, perPage = 50) {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      const filter = `((sender = "${user.id}" && receiver = "${otherUserId}") || (sender = "${otherUserId}" && receiver = "${user.id}")) && product = "${productId}"`;

      return await pb.collection('messages').getList<Message>(page, perPage, {
        filter,
        sort: 'created',
        expand: 'sender,receiver,product',
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  /**
   * Récupérer toutes les conversations de l'utilisateur
   */
  async getConversations() {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer tous les messages où l'utilisateur est impliqué
      const messages = await pb.collection('messages').getFullList<Message>({
        filter: `sender.id = "${user.id}" || receiver.id = "${user.id}"`,
        sort: '-created',
        expand: 'sender,receiver,product',
      });

      // Grouper par conversation (combinaison utilisateur + produit)
      const conversationsMap = new Map<string, Conversation>();

      messages.forEach((message) => {
        const otherUserId = message.sender === user.id ? message.receiver : message.sender;
        const key = `${otherUserId}-${message.product}`;

        if (!conversationsMap.has(key)) {
          const otherUser = message.sender === user.id 
            ? message.expand?.receiver 
            : message.expand?.sender;

          if (otherUser && message.expand?.product) {
            conversationsMap.set(key, {
              otherUser: {
                id: otherUser.id,
                username: otherUser.username,
                avatar: otherUser.avatar,
              },
              product: {
                id: message.expand.product.id,
                title: message.expand.product.title,
                images: message.expand.product.images,
              },
              lastMessage: message,
              unreadCount: 0,
            });
          }
        }

        // Compter les messages non lus
        if (!message.isRead && message.receiver === user.id) {
          const conv = conversationsMap.get(key);
          if (conv) {
            conv.unreadCount++;
          }
        }
      });

      return Array.from(conversationsMap.values());
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Marquer les messages comme lus
   */
  async markAsRead(otherUserId: string, productId: string) {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      // Récupérer tous les messages non lus de cette conversation
      const messages = await pb.collection('messages').getFullList<Message>({
        filter: `sender = "${otherUserId}" && receiver = "${user.id}" && product = "${productId}" && isRead = false`,
      });

      // Marquer chaque message comme lu
      const promises = messages.map((message) =>
        pb.collection('messages').update(message.id, { isRead: true })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  /**
   * Compter les messages non lus
   */
  async getUnreadCount() {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');

      const messages = await pb.collection('messages').getFullList<Message>({
        filter: `receiver = "${user.id}" && isRead = false`,
      });

      return messages.length;
    } catch (error) {
      console.error('Error counting unread messages:', error);
      return 0;
    }
  },

  /**
   * S'abonner aux nouveaux messages (temps réel)
   */
  subscribe(callback: (message: Message) => void) {
    const user = pb.authStore.model;
    if (!user) return () => {};

    pb.collection('messages').subscribe<Message>('*', (e) => {
      if (e.action === 'create') {
        // Notifier seulement si le message est pour l'utilisateur actuel
        if (e.record.receiver === user.id || e.record.sender === user.id) {
          callback(e.record);
        }
      }
    });

    // Retourner une fonction de désabonnement
    return () => {
      pb.collection('messages').unsubscribe('*');
    };
  },

  /**
   * Vérifier si une conversation existe
   */
  async conversationExists(otherUserId: string, productId: string) {
    try {
      const user = pb.authStore.model;
      if (!user) return false;

      const filter = `((sender = "${user.id}" && receiver = "${otherUserId}") || (sender = "${otherUserId}" && receiver = "${user.id}")) && product = "${productId}"`;

      const messages = await pb.collection('messages').getList<Message>(1, 1, {
        filter,
      });

      return messages.items.length > 0;
    } catch (error) {
      console.error('Error checking conversation:', error);
      return false;
    }
  },
};

