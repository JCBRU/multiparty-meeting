# Configuration Caddy pour multiparty-meeting

Ce document décrit comment configurer Caddy comme reverse proxy et load balancer pour multiparty-meeting.

## Configuration de base

### 1. Configuration Caddyfile

Utilisez le fichier `Caddyfile.example` comme base. Points importants :

- **Sticky sessions** : Utilisez `lb_policy ip_hash` pour maintenir les sessions WebSocket
- **WebSocket** : Route `/socket.io/*` avec support WebSocket explicite
- **Health checks** : Endpoint `/health` pour vérifier l'état des instances
- **Headers** : Transmission des headers `X-Forwarded-*` pour le reverse proxy

### 2. Configuration du serveur

Dans `server/config/config.js`, activez le mode reverse proxy :

```javascript
{
  behindReverseProxy: true,
  httpOnly: false, // ou true si Caddy gère SSL et vous utilisez HTTP en interne
  listeningPort: 3443,
  listeningRedirectPort: null, // Désactivé car Caddy gère les redirects
}
```

### 3. Load Balancing avec plusieurs instances

Pour plusieurs instances multiparty-meeting :

```caddy
reverse_proxy localhost:3443 localhost:3444 localhost:3445 {
    lb_policy ip_hash
    # ... autres configurations
}
```

### 4. Ports WebRTC et adresse IP annoncée

Les ports WebRTC (40000-49999 UDP/TCP) doivent être directement accessibles depuis Internet, pas via le reverse proxy. Caddy ne peut pas proxy ces ports UDP.

**CRITIQUE - Adresse IP annoncée** : Dans `server/config/config.js`, vous DEVEZ configurer `announcedIp` dans `webRtcTransport.listenIps` :

```javascript
webRtcTransport: {
  listenIps: [
    { 
      ip: '0.0.0.0',  // Écoute sur toutes les interfaces
      announcedIp: '203.0.113.1'  // VOTRE IP PUBLIQUE ou domaine
    }
  ]
}
```

**Options pour `announcedIp`** :
- **IP publique** : L'adresse IP publique de votre serveur (recommandé)
- **Domaine** : Votre domaine si le DNS résout vers votre serveur
- **null** : Seulement pour développement local

**Important** : 
- Chaque instance doit avoir ses propres ports WebRTC ou utiliser un mécanisme de routage au niveau réseau
- L'`announcedIp` doit être l'adresse IP publique accessible depuis Internet pour les ports WebRTC
- En mode load balancing, chaque instance peut avoir la même `announcedIp` si elles partagent la même IP publique

### 5. Configuration avec Docker

Si vous utilisez Docker, vous pouvez exposer les ports ainsi :

```yaml
ports:
  - "3443:3443"  # HTTP/HTTPS
  - "40000-49999:40000-49999/udp"  # WebRTC UDP
  - "40000-49999:40000-49999/tcp"  # WebRTC TCP
```

### 6. SSL/TLS

Caddy gère automatiquement les certificats SSL avec Let's Encrypt. Assurez-vous que :
- Le domaine pointe vers votre serveur
- Les ports 80 et 443 sont ouverts
- Caddy a les permissions nécessaires

### 7. Exemple de déploiement complet

```caddy
meeting.example.com {
    # Compression
    encode gzip zstd

    # Headers de sécurité et reverse proxy
    header {
        X-Forwarded-Proto {scheme}
        X-Forwarded-Host {host}
        X-Real-IP {remote_host}
    }

    # Health check
    handle /health {
        reverse_proxy multiparty-1:3443 multiparty-2:3443 multiparty-3:3443 {
            health_uri /health
            health_interval 30s
        }
    }

    # WebSocket avec sticky sessions (CRITIQUE)
    handle /socket.io/* {
        reverse_proxy multiparty-1:3443 multiparty-2:3443 multiparty-3:3443 {
            lb_policy ip_hash  # Sticky sessions obligatoires
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
            header_up X-Real-IP {remote_host}
            transport http {
                versions h2c 1.1
                read_timeout 600s
                write_timeout 600s
            }
        }
    }
    
    # Fichiers statiques avec cache
    handle /static/* {
        reverse_proxy multiparty-1:3443 multiparty-2:3443 multiparty-3:3443 {
            lb_policy round_robin
            header_up X-Forwarded-Proto {scheme}
        }
        header Cache-Control "public, max-age=31536000, immutable"
    }
    
    # Tout le reste avec sticky sessions
    handle {
        reverse_proxy multiparty-1:3443 multiparty-2:3443 multiparty-3:3443 {
            lb_policy ip_hash
            header_up X-Forwarded-Proto {scheme}
            header_up X-Forwarded-Host {host}
            header_up X-Real-IP {remote_host}
            health_uri /health
            health_interval 30s
        }
    }
}
```

### 8. Vérification

Testez la configuration :

```bash
# Vérifier la santé
curl https://your-domain.com/health

# Vérifier les WebSockets
# Ouvrir les DevTools du navigateur et vérifier les connexions Socket.io
```

## Notes importantes

1. **Sessions** : Les sticky sessions (`ip_hash`) sont essentielles pour WebSocket en load balancing
2. **Redis** : Doit être partagé entre toutes les instances pour les sessions
3. **WebRTC** : Les ports UDP doivent être directement accessibles
4. **Health checks** : Caddy vérifie automatiquement `/health` pour le load balancing
5. **Haute Disponibilité** : Pour une configuration HA (GRA/SBG), voir `HA_SETUP.md` et `Caddyfile.ha.example`

