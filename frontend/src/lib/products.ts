import { pb } from './pocketbase';

// Types pour les produits
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  created: string;
  updated: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  condition: 'Neuf' | 'Occasion' | 'Reconditionné';
  seller: string;
  status: 'Disponible' | 'Vendu' | 'Réservé' | 'Brouillon';
  location: string;
  views: number;
  reference?: string;
  compatibility?: string;
  created: string;
  updated: string;
  expand?: {
    category?: Category;
    seller?: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
}

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: 'Neuf' | 'Occasion' | 'Reconditionné';
  status: 'Disponible' | 'Vendu' | 'Réservé' | 'Brouillon';
  location: string;
  reference?: string;
  compatibility?: string;
}

// Service de gestion des produits
export const productService = {
  /**
   * Récupérer tous les produits avec pagination
   */
  async getAll(page = 1, perPage = 20, filter = '') {
    try {
      return await pb.collection('products').getList<Product>(page, perPage, {
        filter: filter || 'status = "Disponible"',
        sort: '-created',
        expand: 'category,seller',
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  /**
   * Récupérer un produit par ID
   */
  async getById(id: string) {
    try {
      const product = await pb.collection('products').getOne<Product>(id, {
        expand: 'category,seller',
      });
      
      // Incrémenter les vues
      await pb.collection('products').update(id, {
        views: product.views + 1,
      });
      
      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau produit
   */
  async create(data: ProductFormData, images: File[]) {
    try {
      const formData = new FormData();
      
      // Ajouter les données du produit
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      // Ajouter les images
      images.forEach((image) => {
        formData.append('images', image);
      });
      
      // Ajouter le vendeur (utilisateur connecté)
      const user = pb.authStore.model;
      if (user) {
        formData.append('seller', user.id);
      }
      
      // Initialiser les vues à 0
      formData.append('views', '0');
      
      return await pb.collection('products').create<Product>(formData);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un produit
   */
  async update(id: string, data: Partial<ProductFormData>, images?: File[]) {
    try {
      const formData = new FormData();
      
      // Ajouter les données modifiées
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Ajouter les nouvelles images si présentes
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append('images', image);
        });
      }
      
      return await pb.collection('products').update<Product>(id, formData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  /**
   * Supprimer un produit
   */
  async delete(id: string) {
    try {
      return await pb.collection('products').delete(id);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Rechercher des produits
   */
  async search(query: string, page = 1, perPage = 20) {
    try {
      const filter = `(title ~ "${query}" || description ~ "${query}" || reference ~ "${query}") && status = "Disponible"`;
      return await pb.collection('products').getList<Product>(page, perPage, {
        filter,
        sort: '-created',
        expand: 'category,seller',
      });
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  /**
   * Filtrer par catégorie
   */
  async getByCategory(categoryId: string, page = 1, perPage = 20) {
    try {
      return await pb.collection('products').getList<Product>(page, perPage, {
        filter: `category = "${categoryId}" && status = "Disponible"`,
        sort: '-created',
        expand: 'category,seller',
      });
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  /**
   * Récupérer les produits d'un vendeur
   */
  async getBySeller(sellerId: string, page = 1, perPage = 20) {
    try {
      return await pb.collection('products').getList<Product>(page, perPage, {
        filter: `seller = "${sellerId}"`,
        sort: '-created',
        expand: 'category,seller',
      });
    } catch (error) {
      console.error('Error fetching products by seller:', error);
      throw error;
    }
  },

  /**
   * Récupérer mes produits (utilisateur connecté)
   */
  async getMyProducts(page = 1, perPage = 20) {
    try {
      const user = pb.authStore.model;
      if (!user) throw new Error('Non authentifié');
      
      return await pb.collection('products').getList<Product>(page, perPage, {
        filter: `seller = "${user.id}"`,
        sort: '-created',
        expand: 'category,seller',
      });
    } catch (error) {
      console.error('Error fetching my products:', error);
      throw error;
    }
  },

  /**
   * Générer l'URL d'une image de produit
   */
  getImageUrl(product: Product, filename: string, thumb?: string) {
    return pb.files.getUrl(product, filename, { thumb });
  },
};

// Service de gestion des catégories
export const categoryService = {
  /**
   * Récupérer toutes les catégories
   */
  async getAll() {
    try {
      return await pb.collection('categories').getFullList<Category>({
        sort: 'name',
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  /**
   * Récupérer une catégorie par ID
   */
  async getById(id: string) {
    try {
      return await pb.collection('categories').getOne<Category>(id);
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  /**
   * Récupérer une catégorie par slug
   */
  async getBySlug(slug: string) {
    try {
      const records = await pb.collection('categories').getFullList<Category>({
        filter: `slug = "${slug}"`,
      });
      return records[0] || null;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      throw error;
    }
  },
};

