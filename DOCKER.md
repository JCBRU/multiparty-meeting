# Configuration Docker pour multiparty-meeting

Ce document décrit comment containeriser multiparty-meeting avec Docker, en séparant le serveur et le frontend dans des containers distincts.

## Architecture

- **Container `server`** : Serveur Node.js avec mediasoup (WebRTC)
- **Container `frontend`** : Application React servie par Nginx
- **Container `redis`** : Redis pour les sessions

## Problème des Ports WebRTC

mediasoup nécessite l'accès à une plage de ports UDP/TCP (40000-49999) pour les connexions WebRTC. Cela représente **10 000 ports** à exposer, ce qui peut être problématique avec Docker.

### Solutions

#### Option 1 : `network_mode: host` (Recommandé)

**Avantages** :
- Pas besoin d'exposer les ports individuellement
- Meilleures performances réseau
- Plus simple à configurer

**Inconvénients** :
- Le container partage le réseau de l'hôte
- Moins d'isolation réseau
- Peut entrer en conflit avec d'autres services sur l'hôte

**Configuration** : Utiliser `docker-compose.yml` (par défaut)

#### Option 2 : Exposition des ports (Alternative)

**Avantages** :
- Meilleure isolation réseau
- Compatible avec tous les environnements Docker

**Inconvénients** :
- Exposition de 10 000+ ports UDP/TCP
- Peut être lent à démarrer
- Consomme plus de ressources

**Configuration** : Utiliser `docker-compose.no-host.yml`

## Utilisation

### Option 1 : Avec `network_mode: host` (Recommandé)

```bash
# Build et démarrage
docker-compose up -d --build

# Voir les logs
docker-compose logs -f server
docker-compose logs -f frontend

# Arrêter
docker-compose down
```

### Option 2 : Sans `network_mode: host`

```bash
# Build et démarrage
docker-compose -f docker-compose.no-host.yml up -d --build

# Voir les logs
docker-compose -f docker-compose.no-host.yml logs -f

# Arrêter
docker-compose -f docker-compose.no-host.yml down
```

## Configuration

### Variables d'environnement

Le serveur peut être configuré via les variables d'environnement dans `docker-compose.yml` :

```yaml
environment:
  - NODE_ENV=production
  - DEBUG=*mediasoup* *INFO* *WARN* *ERROR*
  - REDIS_HOST=localhost  # ou 'redis' si sans network_mode: host
  - REDIS_PORT=6379
```

### Certificats TLS

Les certificats TLS doivent être placés dans `server/certs/` :

```bash
server/certs/
  ├── mediasoup-demo.localhost.cert.pem
  └── mediasoup-demo.localhost.key.pem
```

Ils sont montés en lecture seule dans le container.

### Configuration du Frontend

La configuration du frontend peut être modifiée dans `app/public/config/config.js` et sera servie par Nginx.

## Ports Exposés

### Avec `network_mode: host`

- **3443** : HTTPS (serveur)
- **3000** : HTTP redirect (serveur)
- **40000-49999** : WebRTC UDP/TCP (automatiquement accessible)
- **8080** : Frontend (Nginx)

### Sans `network_mode: host`

- **3443** : HTTPS (serveur)
- **3000** : HTTP redirect (serveur)
- **40000-49999** : WebRTC UDP/TCP (exposés explicitement)
- **8080** : Frontend (Nginx)

## Build Séparé

### Build du Frontend

```bash
# Build du frontend uniquement
docker build -f Dockerfile.frontend -t multiparty-frontend .

# Ou avec docker-compose
docker-compose build frontend
```

### Build du Serveur

```bash
# Build du serveur uniquement
docker build -f Dockerfile.server -t multiparty-server .

# Ou avec docker-compose
docker-compose build server
```

## Production avec Reverse Proxy

### Configuration Caddy/Nginx

Si vous utilisez un reverse proxy (Caddy/Nginx) devant les containers :

1. **Frontend** : Le reverse proxy peut servir directement les fichiers statiques ou proxy vers le container Nginx
2. **Serveur** : Le reverse proxy doit proxy vers le port 3443 du serveur
3. **WebRTC** : Les ports 40000-49999 doivent être directement accessibles (pas via le reverse proxy)

### Exemple avec Caddy

```caddy
meeting.example.com {
    # Frontend (optionnel : servir directement depuis le build)
    handle /static/* {
        root * /path/to/app/build
        file_server
    }
    
    # Backend API et WebSocket
    handle /socket.io/* {
        reverse_proxy localhost:3443 {
            transport http {
                versions h2c 1.1
            }
        }
    }
    
    handle {
        reverse_proxy localhost:3443
    }
}
```

## Health Checks

Les containers incluent des health checks :

- **Redis** : `redis-cli ping`
- **Server** : `GET /health` sur le port 3443

Vérifier l'état :

```bash
docker-compose ps
```

## Logs

### Consulter les logs

```bash
# Tous les services
docker-compose logs -f

# Serveur uniquement
docker-compose logs -f server

# Frontend uniquement
docker-compose logs -f frontend

# Dernières 100 lignes
docker-compose logs --tail=100 server
```

### Logs persistants

Les logs du serveur sont stockés dans le volume `server_logs` :

```bash
# Accéder aux logs
docker-compose exec server cat /app/logs/server.log

# Ou monter un volume local
# Dans docker-compose.yml, ajouter :
volumes:
  - ./logs:/app/logs
```

## Volumes

- **redis_data** : Données Redis persistantes
- **server_logs** : Logs du serveur

Pour sauvegarder les données :

```bash
# Backup Redis
docker-compose exec redis redis-cli SAVE
docker cp multiparty-redis:/data/dump.rdb ./backup/

# Backup logs
docker cp multiparty-server:/app/logs ./backup/
```

## Dépannage

### Le serveur ne démarre pas

```bash
# Vérifier les logs
docker-compose logs server

# Vérifier les ports
docker-compose ps
netstat -tulpn | grep -E "3443|3000"

# Vérifier Redis
docker-compose exec redis redis-cli ping
```

### WebRTC ne fonctionne pas

1. Vérifier que les ports 40000-49999 sont ouverts :
   ```bash
   # Sur l'hôte
   sudo ufw allow 40000:49999/udp
   sudo ufw allow 40000:49999/tcp
   ```

2. Vérifier la configuration `announcedIp` dans `server/config/config.js`

3. Vérifier les logs mediasoup :
   ```bash
   docker-compose logs server | grep mediasoup
   ```

### Frontend ne se charge pas

1. Vérifier que le container frontend tourne :
   ```bash
   docker-compose ps frontend
   ```

2. Vérifier les logs :
   ```bash
   docker-compose logs frontend
   ```

3. Tester l'accès :
   ```bash
   curl http://localhost:8080
   ```

## Optimisations

### Multi-stage Build

Les Dockerfiles utilisent déjà des builds multi-stage pour optimiser la taille des images.

### Cache des Layers

Pour accélérer les rebuilds :

```bash
# Build avec cache
docker-compose build --parallel

# Build sans cache (si nécessaire)
docker-compose build --no-cache
```

## Sécurité

### Recommandations

1. **Ne pas exposer Redis** publiquement (port 6379)
2. **Utiliser des secrets** pour les certificats TLS
3. **Limiter les ressources** avec `deploy.resources` dans docker-compose
4. **Utiliser des images officielles** (node:20-slim, nginx:alpine)

### Exemple avec limites de ressources

```yaml
server:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

## Notes Importantes

1. **network_mode: host** : Nécessite Docker avec accès au réseau de l'hôte (pas disponible dans Docker Desktop sur Mac/Windows par défaut)

2. **Ports WebRTC** : Les ports 40000-49999 doivent être accessibles depuis Internet pour que WebRTC fonctionne

3. **Certificats** : En production, utilisez des certificats valides (Let's Encrypt, etc.)

4. **Redis** : En production, configurez Redis avec authentification et persistence

