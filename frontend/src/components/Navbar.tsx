import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { authService, type User } from '@/lib/pocketbase';
import { messageService } from '@/lib/messages';
import { CartButton } from '@/components/CartButton';
import { LogOut, User as UserIcon, ShoppingBag, Menu, X, MessageSquare } from 'lucide-react';
import { LogoAndBrand } from './LogoAndBrand';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Vérifier l'utilisateur au chargement
    setUser(authService.getCurrentUser());

    // Observer les changements d'authentification
    authService.onChange((newUser) => {
      setUser(newUser);
      if (newUser) {
        loadUnreadCount();
      } else {
        setUnreadCount(0);
      }
    });

    // Charger le compteur de messages non lus
    if (authService.isAuthenticated()) {
      loadUnreadCount();

      // S'abonner aux nouveaux messages
      const unsubscribe = messageService.subscribe(() => {
        loadUnreadCount();
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await messageService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <LogoAndBrand />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Accueil
            </a>
            <a href="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Produits
            </a>
            
            {user ? (
              <>
                <a href="/dashboard/orders-waiting-seller" className="text-sm font-medium hover:text-primary transition-colors">
                  Mes commandes
                </a>
                <a href="/messages" className="text-sm font-medium hover:text-primary transition-colors relative">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full font-medium min-w-[1.25rem] text-center">
                      {unreadCount}
                    </span>
                  )}
                </a>
                <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Tableau de bord
                </a>
                <CartButton />
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="ml-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/login">Se connecter</a>
                </Button>
                <Button size="sm" asChild>
                  <a href="/signup">S'inscrire</a>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <a 
              href="/" 
              className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            >
              Accueil
            </a>
            <a 
              href="/products" 
              className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            >
              Produits
            </a>
            
            {user ? (
              <>
                <a 
                  href="/profile" 
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                  Mon profil
                </a>
                <a 
                  href="/my-products" 
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                  Mes annonces
                </a>
                <a 
                  href="/dashboard/orders-waiting-seller" 
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                  Mes commandes
                </a>
                <a 
                  href="/messages" 
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors relative"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-xs rounded-full font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </a>
                <a 
                  href="/cart" 
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                  Mon panier
                </a>
                <a 
                  href="/dashboard" 
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                  Tableau de bord
                </a>
                <div className="px-4 py-2 border-t mt-2 pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-4 py-2 space-y-2 border-t mt-2 pt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/login">Se connecter</a>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <a href="/signup">S'inscrire</a>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

