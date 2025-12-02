# Configuration pour Reverse Proxy et Load Balancer

Ce document décrit comment configurer multiparty-meeting pour fonctionner derrière un reverse proxy et un load balancer.

## Reverse Proxy supportés

- **Caddy** : Voir `CADDY.md` et `Caddyfile.example`
- **Nginx** : Voir `nginx.example.conf`

## Configuration du serveur

### 1. Configuration dans `server/config/config.js`

Pour activer le mode reverse proxy, modifiez la configuration :

```javascript
{
  // ... autres configurations ...
  
  // Activer le mode reverse proxy
  behindReverseProxy: true,
  
  // Si le reverse proxy gère SSL, vous pouvez utiliser httpOnly
  httpOnly: true, // ou false si le serveur gère encore SSL
  
  // Port d'écoute (le reverse proxy se connectera ici)
  listeningPort: 3443,
  
  // Désactiver le redirect HTTP si le reverse proxy le gère
  listeningRedirectPort: null, // ou 3000 si nécessaire
}
```

### 2. Headers requis du reverse proxy

Le reverse proxy doit envoyer les headers suivants :

- `X-Forwarded-Proto`: `https` ou `http`
- `X-Forwarded-Host`: Le nom d'hôte original
- `X-Forwarded-For`: L'adresse IP du client
- `X-Real-IP`: L'adresse IP réelle du client (optionnel)

### 3. Configuration Nginx

Voir `nginx.example.conf` pour un exemple de configuration Nginx complète.

Points importants :
- Utiliser `ip_hash` pour les sessions WebSocket (sticky sessions)
- Configurer correctement les WebSockets pour Socket.io
- Transmettre tous les headers X-Forwarded-*

### 4. Ports à exposer

- **3443** (HTTPS) ou **3000** (HTTP si httpOnly=true) : Port principal
- **40000-49999** (UDP/TCP) : Ports WebRTC pour mediasoup

### 5. Docker Compose

Un fichier `docker-compose.yml` est fourni pour faciliter le déploiement avec Redis.

Pour démarrer :
```bash
docker-compose up -d
```

### 6. Load Balancing

Pour le load balancing avec plusieurs instances :

1. **Sessions** : Utiliser `ip_hash` dans Nginx pour les sticky sessions
2. **Redis** : Partagé entre toutes les instances pour les sessions
3. **WebRTC** : Chaque instance doit avoir ses propres ports UDP/TCP

### 7. Health Check

Le serveur expose un endpoint `/health` pour les health checks du load balancer.

### 8. Configuration des cookies

Les cookies sont configurés avec :
- `secure: true` (HTTPS only)
- `sameSite: 'lax'` (protection CSRF)
- `httpOnly: true` (protection XSS)

Ces paramètres fonctionnent correctement derrière un reverse proxy grâce à `trust proxy`.

## Exemple de déploiement

1. Déployer plusieurs instances multiparty-meeting
2. Configurer Nginx comme reverse proxy avec load balancing
3. Utiliser Redis partagé pour les sessions
4. Configurer les certificats SSL sur Nginx
5. Ouvrir les ports WebRTC (40000-49999) sur chaque instance

