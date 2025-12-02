# Configuration Haute Disponibilité (HA) - GRA et SBG

Ce document décrit la configuration pour deux instances multiparty-meeting en haute disponibilité géographiquement distribuées.

## Architecture

- **Instance GRA** : Gravelines (France)
- **Instance SBG** : Strasbourg (France)
- **Redis** : Partagé entre les deux instances (cluster ou sentinel)
- **Caddy** : Reverse proxy avec failover/routing géographique

## Configuration des instances

### Instance GRA

Dans `server/config/config.js` :

```javascript
{
  // ... autres configurations ...
  
  // Mode reverse proxy activé
  behindReverseProxy: true,
  httpOnly: false,
  listeningPort: 3443,
  
  // Adresse IP publique de GRA
  mediasoup: {
    webRtcTransport: {
      listenIps: [
        { 
          ip: '0.0.0.0', 
          announcedIp: 'IP_PUBLIQUE_GRA'  // IP publique de l'instance GRA
        }
      ]
    }
  }
}
```

### Instance SBG

Dans `server/config/config.js` :

```javascript
{
  // ... autres configurations ...
  
  // Mode reverse proxy activé
  behindReverseProxy: true,
  httpOnly: false,
  listeningPort: 3443,
  
  // Adresse IP publique de SBG
  mediasoup: {
    webRtcTransport: {
      listenIps: [
        { 
          ip: '0.0.0.0', 
          announcedIp: 'IP_PUBLIQUE_SBG'  // IP publique de l'instance SBG
        }
      ]
    }
  }
}
```

## Configuration Redis partagé

### Option 1 : Redis Sentinel (Recommandé pour HA)

Configuration Redis Sentinel pour la haute disponibilité :

```yaml
# docker-compose-redis-sentinel.yml
version: '3.8'

services:
  redis-master-gra:
    image: redis:7-alpine
    container_name: redis-master-gra
    command: redis-server --appendonly yes
    volumes:
      - redis-gra-data:/data
    networks:
      - redis-network

  redis-sentinel-gra:
    image: redis:7-alpine
    container_name: redis-sentinel-gra
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./redis-sentinel.conf:/etc/redis/sentinel.conf
    depends_on:
      - redis-master-gra
    networks:
      - redis-network

  redis-master-sbg:
    image: redis:7-alpine
    container_name: redis-master-sbg
    command: redis-server --appendonly yes --replicaof redis-master-gra 6379
    volumes:
      - redis-sbg-data:/data
    depends_on:
      - redis-master-gra
    networks:
      - redis-network

  redis-sentinel-sbg:
    image: redis:7-alpine
    container_name: redis-sentinel-sbg
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./redis-sentinel.conf:/etc/redis/sentinel.conf
    depends_on:
      - redis-master-sbg
    networks:
      - redis-network

volumes:
  redis-gra-data:
  redis-sbg-data:

networks:
  redis-network:
    driver: bridge
```

### Option 2 : Redis Cluster

Pour une configuration plus robuste avec réplication automatique.

### Configuration serveur pour Redis Sentinel

Dans `server/config/config.js` pour chaque instance :

```javascript
{
  redisOptions: {
    // Pour Redis Sentinel
    sentinels: [
      { host: 'redis-sentinel-gra', port: 26379 },
      { host: 'redis-sentinel-sbg', port: 26379 }
    ],
    name: 'mymaster',  // Nom du master dans Sentinel
    // ou pour Redis simple
    // host: 'redis-gra',
    // port: 6379
  }
}
```

## Configuration Caddy pour HA

### Option 1 : Failover automatique

```caddy
meeting.example.com {
    # Health check avec failover
    reverse_proxy gra-instance:3443 sbg-instance:3443 {
        # Essayer GRA en premier, puis SBG en cas d'échec
        lb_policy first
        
        # Health check pour détecter les instances down
        health_uri /health
        health_interval 10s
        health_timeout 5s
        health_status 200
        
        # Failover automatique
        fail_duration 30s
        max_fails 3
        
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
        header_up X-Real-IP {remote_host}
    }
}
```

### Option 2 : Routing géographique (Recommandé)

Route les utilisateurs vers l'instance la plus proche :

```caddy
meeting.example.com {
    # Routing basé sur la géolocalisation ou DNS
    # GRA pour les utilisateurs en Europe de l'Ouest
    # SBG pour les utilisateurs en Europe Centrale/Est
    
    # Fallback vers l'autre instance si la première est down
    reverse_proxy gra-instance:3443 sbg-instance:3443 {
        lb_policy first
        health_uri /health
        health_interval 10s
        fail_duration 30s
        max_fails 3
    }
}
```

### Option 3 : DNS avec health checks

Utiliser DNS avec health checks pour router automatiquement :

- `meeting-gra.example.com` → Instance GRA
- `meeting-sbg.example.com` → Instance SBG
- `meeting.example.com` → Caddy avec failover

## Configuration des sessions

Avec Redis partagé, les sessions fonctionnent entre les deux instances :

```javascript
// Dans server/config/config.js
{
  cookieSecret: 'SECRET_PARTAGE_ENTRE_INSTANCES',  // MÊME secret sur les deux instances
  cookieName: 'multiparty-meeting.sid',
  // Redis partagé gère les sessions
}
```

## Ports WebRTC

Chaque instance doit avoir ses ports WebRTC directement accessibles :

- **GRA** : Ports 40000-49999 UDP/TCP sur IP publique GRA
- **SBG** : Ports 40000-49999 UDP/TCP sur IP publique SBG

Les clients se connecteront à l'IP publique de l'instance active.

## Migration des sessions actives

Quand une instance tombe :

1. Caddy détecte via health check (`/health`)
2. Caddy bascule vers l'autre instance
3. Les nouvelles connexions vont vers l'instance active
4. Les sessions existantes dans Redis restent disponibles
5. Les WebSockets existants doivent se reconnecter (Socket.io gère la reconnexion automatique)

## Monitoring et alertes

### Health checks

Chaque instance expose `/health` :

```bash
# Vérifier GRA
curl https://gra-instance:3443/health

# Vérifier SBG
curl https://sbg-instance:3443/health
```

### Métriques recommandées

- Temps de réponse `/health`
- Nombre de rooms actives
- Nombre de peers connectés
- État Redis
- Utilisation CPU/RAM

## Déploiement

### Checklist

- [ ] Configurer `announcedIp` avec l'IP publique de chaque instance
- [ ] Configurer Redis partagé (Sentinel ou Cluster)
- [ ] Configurer Caddy avec failover
- [ ] Ouvrir les ports WebRTC (40000-49999 UDP/TCP) sur chaque instance
- [ ] Tester le failover en arrêtant une instance
- [ ] Configurer les alertes de monitoring
- [ ] Documenter les procédures de basculement

### Test de failover

1. Démarrer les deux instances
2. Vérifier que Caddy route vers GRA
3. Arrêter l'instance GRA
4. Vérifier que Caddy bascule vers SBG automatiquement
5. Redémarrer GRA
6. Vérifier que les nouvelles connexions peuvent aller vers GRA

## Notes importantes

1. **Sessions WebSocket** : Les WebSockets existants seront interrompus lors du failover, mais Socket.io se reconnectera automatiquement
2. **Rooms actives** : Les rooms actives sur une instance ne sont pas automatiquement migrées vers l'autre
3. **WebRTC** : Les connexions WebRTC actives seront perdues lors du failover (les clients devront se reconnecter)
4. **Redis** : Doit être hautement disponible pour que les sessions fonctionnent entre instances

