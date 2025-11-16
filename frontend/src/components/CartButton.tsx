import { useState, useEffect } from 'react';
import { cartService } from '@/lib/cart';
import { authService } from '@/lib/pocketbase';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CartButton() {
  const [itemCount, setItemCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier l'authentification
    setIsAuthenticated(authService.isAuthenticated());

    // Observer les changements d'authentification
    authService.onChange((user) => {
      setIsAuthenticated(!!user);
      if (user) {
        loadCartCount();
      } else {
        setItemCount(0);
      }
    });

    // Charger le compteur initial si connecté
    if (authService.isAuthenticated()) {
      loadCartCount();
    }
  }, []);

  const loadCartCount = async () => {
    try {
      const count = await cartService.getCartItemCount();
      setItemCount(count);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      asChild
    >
      <a href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </a>
    </Button>
  );
}

