import { useState, useEffect } from 'react';
import { productService, type Product } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/pocketbase';
import { 
  Loader2, 
  MapPin, 
  Eye, 
  Calendar, 
  Tag, 
  Package, 
  Mail, 
  Edit, 
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Props {
  productId: string;
}

export function ProductDetail({ productId }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await productService.getById(productId);
      setProduct(data);

      // Vérifier si l'utilisateur est le propriétaire
      const currentUser = authService.getCurrentUser();
      if (currentUser && data.seller === currentUser.id) {
        setIsOwner(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return;
    }

    setDeleting(true);
    try {
      await productService.delete(productId);
      window.location.href = '/my-products';
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + err.message);
      setDeleting(false);
    }
  };

  const nextImage = () => {
    if (product && product.images) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Produit introuvable</h2>
        <p className="text-muted-foreground mb-6">{error || 'Ce produit n\'existe pas ou a été supprimé'}</p>
        <Button asChild>
          <a href="/products">Retour aux produits</a>
        </Button>
      </div>
    );
  }

  const categoryName = product.expand?.category?.name || 'Sans catégorie';
  const sellerName = product.expand?.seller?.username || 'Vendeur';
  const sellerAvatar = product.expand?.seller?.avatar;

  return (
    <div className="space-y-6">
      {/* Boutons d'action pour le propriétaire */}
      {isOwner && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" asChild>
            <a href={`/products/${productId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </a>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galerie d'images */}
        <div className="space-y-4">
          {/* Image principale */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={productService.getImageUrl(product, product.images[currentImageIndex])}
                  alt={`${product.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Boutons de navigation */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Indicateur */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Aucune image
              </div>
            )}
          </div>

          {/* Miniatures */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  <img
                    src={productService.getImageUrl(product, image, '100x100')}
                    alt={`Miniature ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informations du produit */}
        <div className="space-y-6">
          {/* En-tête */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="text-primary font-medium">{categoryName}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                {product.condition}
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {product.status}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {product.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {product.views} vues
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(product.created).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Prix */}
          <div className="py-4 border-y">
            <p className="text-4xl font-bold text-primary">
              {product.price.toFixed(2)} {product.currency}
            </p>
          </div>

          {/* Informations complémentaires */}
          {(product.reference || product.compatibility || product.location) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.reference && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Référence</p>
                      <p className="text-sm text-muted-foreground">{product.reference}</p>
                    </div>
                  </div>
                )}

                {product.compatibility && (
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Compatibilité</p>
                      <p className="text-sm text-muted-foreground">{product.compatibility}</p>
                    </div>
                  </div>
                )}

                {product.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Localisation</p>
                      <p className="text-sm text-muted-foreground">{product.location}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vendeur */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendeur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {sellerAvatar ? (
                      <img 
                        src={sellerAvatar} 
                        alt={sellerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-primary">
                        {sellerName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{sellerName}</p>
                    <p className="text-sm text-muted-foreground">Membre depuis {new Date(product.created).getFullYear()}</p>
                  </div>
                </div>

                {!isOwner && authService.isAuthenticated() && (
                  <Button asChild>
                    <a href={`/messages?user=${product.seller}&product=${product.id}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Contacter
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bouton d'action principal */}
          {!isOwner && product.status === 'Disponible' && authService.isAuthenticated() && (
            <Button size="lg" className="w-full" asChild>
              <a href={`/messages?user=${product.seller}&product=${product.id}`}>
                <Mail className="h-5 w-5 mr-2" />
                Contacter le vendeur
              </a>
            </Button>
          )}

          {!isOwner && product.status === 'Disponible' && !authService.isAuthenticated() && (
            <Button size="lg" className="w-full" asChild>
              <a href="/login">
                <Mail className="h-5 w-5 mr-2" />
                Se connecter pour contacter
              </a>
            </Button>
          )}

          {product.status !== 'Disponible' && !isOwner && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-muted-foreground">
                Ce produit n'est plus disponible
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

