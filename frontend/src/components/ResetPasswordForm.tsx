import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { pb } from '@/lib/pocketbase';
import { AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

interface Props {
  token: string;
}

export function ResetPasswordForm({ token }: Props) {
  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      window.location.href = '/login';
    }
  }, [success, countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Token de réinitialisation invalide ou manquant');
      setLoading(false);
      return;
    }

    try {
      await pb.collection('users').confirmPasswordReset(
        token,
        formData.password,
        formData.passwordConfirm
      );
      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.status === 400) {
        setError('Le lien de réinitialisation est invalide ou expiré. Veuillez demander un nouveau lien.');
      } else {
        setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Mot de passe réinitialisé !</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Votre mot de passe a été changé avec succès.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirection vers la page de connexion dans {countdown} seconde{countdown > 1 ? 's' : ''}...
              </p>
            </div>
            <Button asChild>
              <a href="/login">
                Aller à la connexion maintenant
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Lien invalide</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Le lien de réinitialisation est invalide ou manquant.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/forgot-password">
                Demander un nouveau lien
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour votre compte
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={8}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Au moins 8 caractères
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Confirmer le mot de passe</Label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <a href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

