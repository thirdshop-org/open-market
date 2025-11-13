import { pb } from './pocketbase';

// Types pour les messages (depuis la vue userMessages)
export interface Message {
  id: string;
  messageId: string;
  messageContent: string;
  messageIsRead: boolean;
  messageCreated: string;
  messageUpdated: string;
  productId: string;
  productTitle: string;
  productImages: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  receiverUserId: string;
  receiverUserUsername: string;
  receiverUserAvatar?: string;
}

// Type pour les messages de la collection originale (pour l'envoi)
export interface MessageCreate {
  sender: string;
  receiver: string;
  product: string;
  content: string;
  isRead: boolean;
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
    images: string;
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

      // On envoie toujours à la collection messages originale
      await pb.collection('messages').create<MessageCreate>({
        sender: user.id,
        receiver: receiverId,
        product: productId,
        content: content.trim(),
        isRead: false,
      });

      // Retourner le dernier message de la vue pour avoir toutes les infos
      const messages = await pb.collection('userMessages').getList<Message>(1, 1, {
        filter: `senderId = "${user.id}" && receiverUserId = "${receiverId}" && productId = "${productId}"`,
        sort: '-messageCreated',
      });

      return messages.items[0];
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

      const filter = `((senderId = "${user.id}" && receiverUserId = "${otherUserId}") || (senderId = "${otherUserId}" && receiverUserId = "${user.id}")) && productId = "${productId}"`;

      return await pb.collection('userMessages').getList<Message>(page, perPage, {
        filter,
        sort: 'messageCreated',
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
      const messages = await pb.collection('userMessages').getFullList<Message>({
        filter: `senderId = "${user.id}" || receiverUserId = "${user.id}"`,
        sort: '-messageCreated',
      });

      // Grouper par conversation (combinaison utilisateur + produit)
      const conversationsMap = new Map<string, Conversation>();

      messages.forEach((message) => {
        const otherUserId = message.senderId === user.id ? message.receiverUserId : message.senderId;
        const key = `${otherUserId}-${message.productId}`;

        if (!conversationsMap.has(key)) {
          const otherUser = message.senderId === user.id 
            ? {
                id: message.receiverUserId,
                username: message.receiverUserUsername,
                avatar: message.receiverUserAvatar,
              }
            : {
                id: message.senderId,
                username: message.senderUsername,
                avatar: message.senderAvatar,
              };

          conversationsMap.set(key, {
            otherUser,
            product: {
              id: message.productId,
              title: message.productTitle,
              images: message.productImages,
            },
            lastMessage: message,
            unreadCount: 0,
          });
        }

        // Compter les messages non lus
        if (!message.messageIsRead && message.receiverUserId === user.id) {
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

      const messages = await pb.collection('userMessages').getFullList<Message>({
        filter: `receiverUserId = "${user.id}" && messageIsRead = false`,
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

    // S'abonner à la vue userMessages
    pb.collection('userMessages').subscribe<Message>('*', (e) => {
      if (e.action === 'create') {
        // Notifier seulement si le message est pour l'utilisateur actuel
        if (e.record.receiverUserId === user.id || e.record.senderId === user.id) {
          callback(e.record);
        }
      }
    });

    // Retourner une fonction de désabonnement
    return () => {
      pb.collection('userMessages').unsubscribe('*');
    };
  },

  /**
   * Vérifier si une conversation existe
   */
  async conversationExists(otherUserId: string, productId: string) {
    try {
      const user = pb.authStore.model;
      if (!user) return false;

      const filter = `((senderId = "${user.id}" && receiverUserId = "${otherUserId}") || (senderId = "${otherUserId}" && receiverUserId = "${user.id}")) && productId = "${productId}"`;

      const messages = await pb.collection('userMessages').getList<Message>(1, 1, {
        filter,
      });

      return messages.items.length > 0;
    } catch (error) {
      console.error('Error checking conversation:', error);
      return false;
    }
  },
};

