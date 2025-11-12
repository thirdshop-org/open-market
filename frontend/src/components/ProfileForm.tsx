import { useState, useEffect } from 'react';
import { authService, pb, type User } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle, User as UserIcon, Camera } from 'lucide-react';

export function ProfileForm() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        name: currentUser.name || '',
      });
      
      // Générer l'URL de l'avatar si existant
      if (currentUser.avatar) {
        const avatarUrl = pb.files.getUrl(currentUser, currentUser.avatar, { thumb: '200x200' });
        setAvatarPreview(avatarUrl);
      }
    }

    // Observer les changements d'authentification
    authService.onChange((newUser) => {
      if (newUser) {
        setUser(newUser);
        setFormData({
          username: newUser.username || '',
          email: newUser.email || '',
          name: newUser.name || '',
        });
        if (newUser.avatar) {
          const avatarUrl = pb.files.getUrl(newUser, newUser.avatar, { thumb: '200x200' });
          setAvatarPreview(avatarUrl);
        }
      } else {
        // Rediriger si déconnecté
        window.location.href = '/login';
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setMessage({ type: '', text: '' });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const updatedUser = await pb.collection('users').update(user.id, formData);
      setUser(updatedUser as User);
      
      const avatarUrl = pb.files.getUrl(updatedUser, updatedUser.avatar, { thumb: '200x200' });
      setAvatarPreview(avatarUrl);
      
      setMessage({ type: 'success', text: 'Avatar mis à jour avec succès !' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour de l\'avatar' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updatedUser = await pb.collection('users').update(user.id, formData);
      setUser(updatedUser as User);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (passwordData.password !== passwordData.passwordConfirm) {
      setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      return;
    }

    if (passwordData.password.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setPasswordLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await pb.collection('users').update(user.id, {
        oldPassword: passwordData.oldPassword,
        password: passwordData.password,
        passwordConfirm: passwordData.passwordConfirm,
      });
      
      setMessage({ type: 'success', text: 'Mot de passe changé avec succès !' });
      setPasswordData({ oldPassword: '', password: '', passwordConfirm: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors du changement de mot de passe' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Message de retour */}
      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-destructive/10 text-destructive'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Avatar et informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
          <CardDescription>Changez votre photo de profil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-primary" />
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Formats acceptés : JPG, PNG, GIF
              </p>
              <p className="text-sm text-muted-foreground">
                Taille maximale : 5 MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations du profil */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Modifiez vos informations de profil</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Votre nom d'utilisateur unique sur la plateforme
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
              {!user.verified && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  ⚠️ Votre email n'est pas vérifié. Vérifiez votre boîte de réception.
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Changement de mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
          <CardDescription>Gérez la sécurité de votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordForm(true)}
            >
              Changer le mot de passe
            </Button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Mot de passe actuel</Label>
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={passwordData.password}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Au moins 8 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  value={passwordData.passwordConfirm}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changement...
                    </>
                  ) : (
                    'Changer le mot de passe'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ oldPassword: '', password: '', passwordConfirm: '' });
                  }}
                  disabled={passwordLoading}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

