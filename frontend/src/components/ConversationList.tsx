import { useState, useEffect } from 'react';
import { messageService, type Conversation } from '@/lib/messages';
import { productService } from '@/lib/products';
import { Card } from '@/components/ui/card';
import { Loader2, MessageSquare } from 'lucide-react';

interface Props {
  onSelectConversation?: (otherUserId: string, productId: string) => void;
  selectedConversation?: { userId: string; productId: string };
}

export function ConversationList({ onSelectConversation, selectedConversation }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();

    // S'abonner aux nouveaux messages
    const unsubscribe = messageService.subscribe(() => {
      loadConversations();
    });

    setTimeout(() => {
      loadConversations();
    }, 4000);

    return () => {
      unsubscribe();
    };
  }, []);

  const loadConversations = async () => {
    try {
      const convs = await messageService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return `Il y a ${days} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const parseImages = (images: string) => {
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Aucune conversation</p>
        <p className="text-sm text-muted-foreground mt-2">
          Commencez une discussion en contactant un vendeur
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isSelected = 
          selectedConversation?.userId === conv.otherUser.id &&
          selectedConversation?.productId === conv.product.id;

        const images = parseImages(conv.product.images);
        const firstImage = images && images.length > 0 ? images[0] : null;

        return (
          <button
            key={`${conv.otherUser.id}-${conv.product.id}`}
            onClick={() => onSelectConversation?.(conv.otherUser.id, conv.product.id)}
            className={`w-full text-left transition-colors ${
              isSelected
                ? 'bg-primary/10 border-primary'
                : 'hover:bg-accent'
            }`}
          >
            <Card className="p-4 border-0 shadow-none">
              <div className="flex items-start gap-3">
                {/* Avatar utilisateur */}
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {conv.otherUser.avatar ? (
                    <img
                      src={conv.otherUser.avatar}
                      alt={conv.otherUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-primary">
                      {conv.otherUser.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Nom utilisateur et badge non lu */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold truncate">
                      {conv.otherUser.username}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Titre du produit */}
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {conv.product.title}
                  </p>

                  {/* Dernier message */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate flex-1">
                      {conv.lastMessage.messageContent}
                    </p>
                    <p className="text-xs text-muted-foreground ml-2 shrink-0">
                      {formatDate(conv.lastMessage.messageCreated)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

