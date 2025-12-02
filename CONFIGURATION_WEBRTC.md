# Configuration WebRTC pour Reverse Proxy et Load Balancing

## Adresse IP annoncée (announcedIp)

### Pourquoi c'est important ?

Quand multiparty-meeting est derrière un reverse proxy ou un NAT, les clients WebRTC doivent connaître l'adresse IP publique pour établir les connexions média. L'`announcedIp` indique à mediasoup quelle adresse annoncer aux clients dans les ICE candidates.

### Configuration dans `server/config/config.js`

```javascript
webRtcTransport: {
  listenIps: [
    {
      ip: '0.0.0.0',  // Écoute sur toutes les interfaces locales
      announcedIp: 'VOTRE_IP_PUBLIQUE'  // IP publique accessible depuis Internet
    }
  ]
}
```

### Options pour `announcedIp`

#### 1. IP publique statique (Recommandé pour production)

```javascript
{ ip: '0.0.0.0', announcedIp: '203.0.113.1' }
```

**Avantages** :
- Fonctionne toujours, même si le DNS change
- Plus rapide (pas de résolution DNS)

**Comment trouver votre IP publique** :
```bash
curl ifconfig.me
# ou
curl ipinfo.io/ip
```

#### 2. Nom de domaine (Si DNS résout vers votre serveur)

```javascript
{ ip: '0.0.0.0', announcedIp: 'meeting.example.com' }
```

**Avantages** :
- Plus flexible si l'IP change
- Plus facile à gérer avec plusieurs serveurs

**Important** : Le domaine doit résoudre vers l'IP publique de votre serveur

#### 3. null (Développement local uniquement)

```javascript
{ ip: '0.0.0.0', announcedIp: null }
```

**Utilisation** : Uniquement pour le développement local

### Configuration avec Reverse Proxy (Caddy)

Quand vous utilisez Caddy comme reverse proxy :

1. **Caddy gère** : HTTP/HTTPS (ports 80/443) et WebSocket (Socket.io)
2. **Caddy NE gère PAS** : Les ports WebRTC UDP (40000-49999)
3. **Les ports WebRTC** doivent être directement accessibles depuis Internet

### Configuration avec Load Balancing

Avec plusieurs instances multiparty-meeting :

#### Option 1 : Même IP publique, ports différents

Chaque instance écoute sur des ports WebRTC différents :

```javascript
// Instance 1
webRtcTransport: {
  listenIps: [{ ip: '0.0.0.0', announcedIp: '203.0.113.1' }]
}
// Ports: 40000-49999

// Instance 2
webRtcTransport: {
  listenIps: [{ ip: '0.0.0.0', announcedIp: '203.0.113.1' }]
}
// Ports: 50000-59999 (différents)
```

#### Option 2 : IPs publiques différentes

Chaque instance a sa propre IP publique :

```javascript
// Instance 1
webRtcTransport: {
  listenIps: [{ ip: '0.0.0.0', announcedIp: '203.0.113.1' }]
}

// Instance 2
webRtcTransport: {
  listenIps: [{ ip: '0.0.0.0', announcedIp: '203.0.113.2' }]
}
```

### Détection automatique (Optionnel)

Vous pouvez créer un script pour détecter automatiquement l'IP publique :

```javascript
// Dans config.js, vous pouvez utiliser une variable d'environnement
webRtcTransport: {
  listenIps: [
    { 
      ip: '0.0.0.0', 
      announcedIp: process.env.ANNOUNCED_IP || null 
    }
  ]
}
```

Puis définir dans votre environnement :
```bash
export ANNOUNCED_IP=203.0.113.1
```

### Vérification

Pour vérifier que la configuration est correcte :

1. Démarrer le serveur
2. Ouvrir les DevTools du navigateur
3. Aller dans Network → WS (WebSocket)
4. Vérifier les ICE candidates dans les messages Socket.io
5. Les candidates doivent contenir votre `announcedIp`

### Dépannage

**Problème** : Les clients ne peuvent pas se connecter en WebRTC

**Solutions** :
1. Vérifier que `announcedIp` est défini (pas `null`)
2. Vérifier que les ports UDP 40000-49999 sont ouverts dans le firewall
3. Vérifier que l'IP publique est correcte
4. Tester avec `curl ifconfig.me` pour confirmer l'IP publique

**Problème** : Connexions WebRTC échouent derrière NAT

**Solutions** :
1. Configurer correctement `announcedIp` avec l'IP publique
2. Vérifier que les ports UDP sont forwardés si nécessaire
3. Considérer l'utilisation d'un TURN server (configuré dans `app/public/config/config.js`)

