# Compatibilité Node.js 23

Ce document décrit les adaptations effectuées pour assurer la compatibilité avec Node.js 23, étant donné que la version originale de multiparty-meeting était conçue pour Node.js 10.

## Breaking Changes Principaux

### 1. Configuration TLS (`secureOptions`)

**Problème** : La syntaxe `secureOptions: 'tlsv12'` (string) n'est plus supportée dans Node.js moderne (depuis Node.js 12+).

**Solution** : Utilisation des constantes numériques TLS et des options `minVersion`/`maxVersion` :

```javascript
// Avant (Node.js 10)
secureOptions: 'tlsv12'

// Après (Node.js 23)
secureOptions: tls.constants.SSL_OP_NO_SSLv2 | tls.constants.SSL_OP_NO_SSLv3 | ...
minVersion: 'TLSv1.2'
maxVersion: 'TLSv1.3'
```

### 2. Module SPDY

**Problème** : Le module `spdy` peut avoir des problèmes de compatibilité avec Node.js 23, notamment avec les nouvelles APIs HTTP/2.

**Solution** : Ajout d'un fallback vers `https` natif si `spdy` échoue :

```javascript
try {
    mainListener = spdy.createServer(tlsOptions, app);
} catch (error) {
    logger.warn('spdy.createServer failed, falling back to native https');
    mainListener = https.createServer(tlsOptions, app);
}
```

### 3. Warnings de Dépréciation

Plusieurs warnings peuvent apparaître avec Node.js 23 :

- **DEP0111** : `process.binding('http_parser')` est déprécié (utilisé par certaines dépendances comme `spdy`)
- **Webpack** : Options dépréciées dans webpack-dev-server (`onAfterSetupMiddleware`, `onBeforeSetupMiddleware`)

Ces warnings n'empêchent pas le fonctionnement mais indiquent que certaines dépendances doivent être mises à jour.

## Versions Testées

- **Node.js 23.3.0** : ✅ Fonctionne avec les adaptations
- **OpenSSL 3.0.15+quic** : ✅ Compatible

## Dépendances Mises à Jour

Les dépendances suivantes ont été mises à jour pour la compatibilité Node.js 23 :

- `express`: ^4.18.2 (compatible Node.js 18+)
- `socket.io`: ^4.7.2 (compatible Node.js 18+)
- `mediasoup`: ^3.14.4 (compatible Node.js 18+)
- `redis`: ^4.6.12 (compatible Node.js 18+)
- `react`: ^18.2.0 (compatible Node.js 18+)

## Modifications Effectuées

### `server/server.js`

1. **Import de `https` et `tls`** :
   ```javascript
   const https = require('https');
   const tlsModule = require('tls');
   ```

2. **Configuration TLS adaptée** :
   - Remplacement de `secureOptions: 'tlsv12'` par des constantes numériques
   - Ajout de `minVersion: 'TLSv1.2'` et `maxVersion: 'TLSv1.3'`
   - Renommage de `tls` en `tlsOptions` pour éviter les conflits

3. **Fallback pour SPDY** :
   - Try/catch autour de `spdy.createServer()`
   - Fallback vers `https.createServer()` si SPDY échoue

## Recommandations

### Pour la Production

1. **Utiliser Node.js LTS** : Bien que Node.js 23 fonctionne, il est recommandé d'utiliser **Node.js 20 LTS** pour la production.

2. **Tester Thoroughly** : Effectuer des tests approfondis, notamment :
   - Connexions WebSocket
   - WebRTC (mediasoup)
   - Sessions Redis
   - HTTPS/TLS

3. **Surveiller les Logs** : Surveiller les warnings de dépréciation qui pourraient indiquer des problèmes futurs.

### Migration depuis Node.js 10

Si vous migrez depuis Node.js 10 :

1. **Mettre à jour les dépendances** : Toutes les dépendances ont été mises à jour
2. **Vérifier la configuration TLS** : La configuration TLS a été adaptée
3. **Tester les fonctionnalités critiques** : WebRTC, WebSocket, HTTPS

## Problèmes Connus

### 1. SPDY et HTTP/2

Le module `spdy` peut avoir des problèmes avec Node.js 23. Si vous rencontrez des erreurs :

- Le code bascule automatiquement vers `https` natif
- Vous pouvez forcer l'utilisation de `https` en définissant `config.httpOnly = false` et en utilisant `https.createServer` directement

### 2. OpenSSL 3.0

OpenSSL 3.0 (inclus avec Node.js 23) a des changements de sécurité :

- Certains algorithmes sont désactivés par défaut
- Les ciphers doivent être explicitement configurés (déjà fait dans le code)

### 3. Warnings de Dépréciation

Les warnings suivants peuvent apparaître mais n'empêchent pas le fonctionnement :

```
(node:xxxxx) [DEP0111] DeprecationWarning: Access to process.binding('http_parser') is deprecated.
```

Ces warnings proviennent de dépendances tierces (notamment `spdy`) et seront corrigés dans les futures mises à jour.

## Tests de Compatibilité

Pour vérifier la compatibilité :

```bash
# Vérifier la version Node.js
node --version

# Vérifier OpenSSL
node -e "console.log(process.versions.openssl)"

# Tester le serveur
cd server
npm start

# Vérifier les logs pour les erreurs
tail -f ~/logs/multiparty-meeting/server.log
```

## Support

En cas de problème avec Node.js 23 :

1. Vérifier les logs : `~/logs/multiparty-meeting/server.log`
2. Vérifier les warnings de dépréciation
3. Consulter la documentation Node.js 23 : https://nodejs.org/en/blog/release/v23.0.0

## Notes Importantes

- **Node.js 23 est une version actuelle** (non-LTS), donc des changements peuvent encore survenir
- **Pour la production**, considérez Node.js 20 LTS qui est plus stable
- **Les adaptations effectuées** sont rétrocompatibles avec Node.js 12+ grâce aux fallbacks
