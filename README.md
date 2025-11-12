# 🛒 Open Market

Une marketplace moderne construite avec Astro, React, Tailwind CSS et PocketBase.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ et npm
- Docker et Docker Compose

### Installation

1. **Cloner le repository**
```bash
git clone <votre-repo>
cd open-market
```

2. **Installer les dépendances frontend**
```bash
cd frontend
npm install
```

3. **Configurer les variables d'environnement**
```bash
# Dans frontend/.env
PUBLIC_POCKETBASE_URL=http://localhost:8080
```

4. **Démarrer les services**
```bash
# À la racine du projet
docker-compose up -d

# Dans un autre terminal, démarrer le frontend
cd frontend
npm run dev
```

5. **Accéder à l'application**
- Frontend: http://localhost:4321
- PocketBase Admin: http://localhost:8080/_/

## ✨ Fonctionnalités

### ✅ Authentification (Implémenté)
- 🔐 Inscription utilisateur
- 🔑 Connexion (email ou username)
- 🚪 Déconnexion
- 👤 Gestion de session
- 📧 Vérification par email
- 🔒 Sécurité avec JWT

Voir [AUTHENTICATION.md](./AUTHENTICATION.md) pour plus de détails.

### 📦 À venir
- Gestion des produits
- Panier d'achat
- Système de paiement
- Profil utilisateur
- Messagerie
- Avis et notations

## 🏗️ Stack technique

### Frontend
- **Framework**: Astro 5.x
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.x
- **Components**: shadcn/ui style
- **Icons**: Lucide React

### Backend
- **BaaS**: PocketBase 0.32.0
- **Database**: SQLite (via PocketBase)
- **Auth**: JWT
- **Storage**: Volumes Docker

## 📁 Structure du projet

```
open-market/
├── frontend/                # Application frontend
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages Astro
│   │   ├── layouts/        # Layouts Astro
│   │   ├── lib/            # Utilitaires et services
│   │   └── styles/         # Styles globaux
│   ├── public/             # Assets statiques
│   └── package.json
├── backend/                # Configuration PocketBase
│   └── Dockerfile
├── docker-compose.yml      # Configuration Docker
└── README.md
```

## 🔧 Commandes utiles

### Frontend
```bash
cd frontend

# Développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview
```

### Backend (PocketBase)
```bash
# Démarrer
docker-compose up -d pocketbase

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f pocketbase

# Redémarrer
docker-compose restart pocketbase
```

## 📖 Documentation

- [Guide d'authentification complet](./AUTHENTICATION.md)
- [Configuration détaillée](./frontend/AUTH_SETUP.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT

---

Développé avec ❤️ pour la communauté open source
