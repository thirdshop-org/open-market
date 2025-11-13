import React, { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';

interface MessagingInterfaceProps {
  initialUserId?: string;
  initialProductId?: string;
}

export const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  initialUserId,
  initialProductId,
}) => {
  const [selectedConversation, setSelectedConversation] = useState<{
    userId: string;
    productId: string;
  } | null>(null);

  // Initialiser avec les paramètres de l'URL
  useEffect(() => {
    if (initialUserId && initialProductId) {
      setSelectedConversation({
        userId: initialUserId,
        productId: initialProductId,
      });
    }
  }, [initialUserId, initialProductId]);

  const handleSelectConversation = (userId: string, productId: string) => {
    setSelectedConversation({ userId, productId });
    
    // Mettre à jour l'URL sans recharger la page
    const newUrl = `/messages?user=${userId}&product=${productId}`;
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
      {/* Liste des conversations */}
      <div className="lg:col-span-1 overflow-y-auto border rounded-lg">
        <ConversationList
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Fenêtre de chat */}
      <div className="lg:col-span-2 border rounded-lg overflow-hidden">
        {selectedConversation ? (
          <ChatWindow
            otherUserId={selectedConversation.userId}
            productId={selectedConversation.productId}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 opacity-20"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>Sélectionnez une conversation</p>
              <p className="text-sm mt-2">Choisissez une conversation dans la liste</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

