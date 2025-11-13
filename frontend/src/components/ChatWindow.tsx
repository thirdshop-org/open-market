import { useState, useEffect, useRef } from 'react';
import { messageService, type Message } from '@/lib/messages';
import { productService } from '@/lib/products';
import { authService } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, Send, Package } from 'lucide-react';

interface Props {
  otherUserId: string;
  productId: string;
  otherUserName?: string;
}

export function ChatWindow({ otherUserId, productId, otherUserName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [detectedUserName, setDetectedUserName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = authService.getCurrentUser();

  // Utiliser le nom fourni ou le nom détecté depuis les messages
  const displayUserName = otherUserName || detectedUserName || 'Utilisateur';

  useEffect(() => {
    loadMessages();
    loadProduct();
    markAsRead();

    // S'abonner aux nouveaux messages
    const unsubscribe = messageService.subscribe((message) => {
      if (
        (message.senderId === otherUserId && message.receiverUserId === currentUser?.id) ||
        (message.senderId === currentUser?.id && message.receiverUserId === otherUserId)
      ) {
        if (message.productId === productId) {
          setMessages((prev) => [...prev, message]);
          markAsRead();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [otherUserId, productId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const result = await messageService.getConversation(otherUserId, productId);
      setMessages(result.items);
      
      // Détecter le nom de l'autre utilisateur depuis le premier message
      if (result.items.length > 0 && !otherUserName) {
        const firstMessage = result.items[0];
        const name = firstMessage.senderId === otherUserId 
          ? firstMessage.senderUsername
          : firstMessage.receiverUserUsername;
        setDetectedUserName(name);
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProduct = async () => {
    try {
      const prod = await productService.getById(productId);
      setProduct(prod);
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await messageService.markAsRead(otherUserId, productId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const message = await messageService.send(otherUserId, productId, newMessage);
      if (message) {
        setMessages((prev) => [...prev, message]);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const dateKey = formatDate(message.messageCreated);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    return groups;
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div className="flex flex-col h-full">
      {/* Header avec info produit */}
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          {product && (
            <>
              {(() => {
                const images = parseImages(product.images);
                return images && images.length > 0 && (
                  <img
                    src={productService.getImageUrl(product, images[0], '100x100')}
                    alt={product.title}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{displayUserName}</p>
                <a
                  href={`/products/${productId}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
                >
                  <Package className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{product.title}</span>
                </a>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            {/* Séparateur de date */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                {date}
              </span>
            </div>

            {/* Messages du jour */}
            {msgs.map((message) => {
              const isOwn = message.senderId === currentUser?.id;

              return (
                <div
                  key={message.id}
                  className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {message.messageContent}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatTime(message.messageCreated)}
                      {isOwn && message.messageIsRead && ' • Lu'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />

        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun message</p>
            <p className="text-sm mt-2">Envoyez un message pour démarrer la conversation</p>
          </div>
        )}
      </CardContent>

      {/* Input message */}
      <div className="border-t p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

