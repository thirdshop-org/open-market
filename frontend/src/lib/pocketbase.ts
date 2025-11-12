import PocketBase from 'pocketbase';

// Configuration de l'URL du backend PocketBase
const PB_URL = import.meta.env.PUBLIC_POCKETBASE_URL || 'http://localhost:8080';

// Instance unique de PocketBase
export const pb = new PocketBase(PB_URL);

// Types pour l'utilisateur
export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatar?: string;
  verified: boolean;
  created: string;
  updated: string;
}

// Service d'authentification
export const authService = {
  // Inscription
  async signup(email: string, password: string, passwordConfirm: string, username: string) {
    try {
      const record = await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        username,
      });
      
      // Optionnel : envoyer un email de vérification
      await pb.collection('users').requestVerification(email);
      
      return { success: true, user: record };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erreur lors de l\'inscription' };
    }
  },

  // Connexion
  async login(emailOrUsername: string, password: string) {
    try {
      const authData = await pb.collection('users').authWithPassword(
        emailOrUsername,
        password
      );
      return { success: true, user: authData.record };
    } catch (error: any) {
      return { success: false, error: error.message || 'Identifiants incorrects' };
    }
  },

  // Déconnexion
  logout() {
    pb.authStore.clear();
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return pb.authStore.isValid;
  },

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return pb.authStore.model as User | null;
  },

  // Observer les changements d'authentification
  onChange(callback: (user: User | null) => void) {
    pb.authStore.onChange(() => {
      callback(pb.authStore.model as User | null);
    });
  },

  // Rafraîchir le token
  async refreshAuth() {
    try {
      await pb.collection('users').authRefresh();
      return true;
    } catch (error) {
      return false;
    }
  },
};

export default pb;

