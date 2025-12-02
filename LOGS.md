# Consultation des logs du serveur multiparty-meeting

Le serveur multiparty-meeting utilise le module `debug` de Node.js pour la gestion des logs. Les logs sont écrits dans la **console (stdout/stderr)** et peuvent être consultés selon la méthode de démarrage du serveur.

## Méthodes pour consulter les logs

### 1. Si le serveur est lancé directement avec npm/node

Si vous lancez le serveur avec `npm start` ou `node server.js` directement :

```bash
# Les logs s'affichent directement dans le terminal
cd /home/mbjbu01/multiparty-meeting/server
npm start
```

Les logs apparaissent en temps réel dans le terminal.

### 2. Si le serveur est lancé en arrière-plan

Si le serveur tourne en arrière-plan, vous pouvez :

#### Rediriger les logs vers un fichier

```bash
# Démarrer le serveur avec redirection des logs
cd /home/mbjbu01/multiparty-meeting/server
npm start > /var/log/multiparty-meeting.log 2>&1 &

# Consulter les logs en temps réel
tail -f /var/log/multiparty-meeting.log

# Consulter les dernières lignes
tail -n 100 /var/log/multiparty-meeting.log

# Rechercher dans les logs
grep -i error /var/log/multiparty-meeting.log
```

### 3. Si le serveur est géré par systemd

Si vous utilisez le service systemd (`multiparty-meeting.service`) :

```bash
# Consulter les logs avec journalctl
sudo journalctl -u multiparty-meeting -f

# Consulter les dernières lignes
sudo journalctl -u multiparty-meeting -n 100

# Consulter les logs depuis une date/heure spécifique
sudo journalctl -u multiparty-meeting --since "2024-01-01 10:00:00"

# Consulter les logs d'erreur uniquement
sudo journalctl -u multiparty-meeting -p err

# Exporter les logs dans un fichier
sudo journalctl -u multiparty-meeting > /tmp/multiparty-meeting-logs.txt
```

### 4. Si le serveur est dans Docker

Si vous utilisez Docker Compose :

```bash
# Consulter les logs en temps réel
docker-compose logs -f multiparty-meeting

# Consulter les dernières lignes
docker-compose logs --tail=100 multiparty-meeting

# Consulter les logs depuis le début
docker-compose logs multiparty-meeting

# Consulter les logs d'un conteneur spécifique
docker logs -f multiparty-meeting-app
```

### 5. Si le serveur est géré par PM2

Si vous utilisez PM2 :

```bash
# Consulter les logs en temps réel
pm2 logs multiparty-meeting

# Consulter uniquement les erreurs
pm2 logs multiparty-meeting --err

# Consulter uniquement la sortie standard
pm2 logs multiparty-meeting --out

# Exporter les logs
pm2 logs multiparty-meeting --lines 1000 > /tmp/pm2-logs.txt
```

## Configuration des logs

### Variable d'environnement DEBUG

Les logs sont contrôlés par la variable d'environnement `DEBUG`. Par défaut, le script `npm start` définit :

```bash
DEBUG='*mediasoup* *INFO* *WARN* *ERROR*'
```

### Niveaux de logs disponibles

Le serveur utilise plusieurs préfixes pour les logs :

- `multiparty-meeting-server` : Logs généraux du serveur
- `multiparty-meeting-server:INFO` : Logs informatifs
- `multiparty-meeting-server:WARN` : Avertissements
- `multiparty-meeting-server:ERROR` : Erreurs
- `multiparty-meeting-server:Room` : Logs spécifiques aux rooms
- `multiparty-meeting-server:Peer` : Logs spécifiques aux peers
- `*mediasoup*` : Logs de mediasoup (WebRTC)

### Exemples de configuration DEBUG

```bash
# Tous les logs
DEBUG='*' npm start

# Seulement les erreurs et warnings
DEBUG='*ERROR* *WARN*' npm start

# Logs mediasoup uniquement
DEBUG='*mediasoup*' npm start

# Logs du serveur et des rooms
DEBUG='multiparty-meeting-server*' npm start

# Logs complets (recommandé pour le développement)
DEBUG='*mediasoup* *INFO* *WARN* *ERROR*' npm start
```

## Filtrage des logs

### Avec grep

```bash
# Filtrer les erreurs
tail -f /var/log/multiparty-meeting.log | grep ERROR

# Filtrer les connexions
tail -f /var/log/multiparty-meeting.log | grep "Connected\|connection"

# Filtrer les rooms
tail -f /var/log/multiparty-meeting.log | grep Room

# Filtrer mediasoup
tail -f /var/log/multiparty-meeting.log | grep mediasoup
```

### Avec journalctl

```bash
# Filtrer par priorité
sudo journalctl -u multiparty-meeting -p warning

# Filtrer par mot-clé
sudo journalctl -u multiparty-meeting | grep ERROR

# Filtrer par date
sudo journalctl -u multiparty-meeting --since today
```

## Rotation des logs

### Avec logrotate (pour fichiers de logs)

Créez `/etc/logrotate.d/multiparty-meeting` :

```
/var/log/multiparty-meeting.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 user group
    postrotate
        # Redémarrer le service si nécessaire
        # systemctl restart multiparty-meeting
    endscript
}
```

### Avec journalctl (systemd)

Les logs systemd sont automatiquement gérés. Pour limiter la taille :

```bash
# Vérifier la configuration
sudo journalctl --disk-usage

# Limiter la taille des logs
sudo journalctl --vacuum-size=500M

# Limiter la durée de rétention
sudo journalctl --vacuum-time=30d
```

## Logs importants à surveiller

### Connexions Redis

```
multiparty-meeting-server:INFO Connected to Redis
```

### Création de rooms

```
multiparty-meeting-server:Room creating a new Room [roomId:"..."]
```

### Connexions de peers

```
multiparty-meeting-server:Peer constructor() [id:"...", socket:"..."]
```

### Erreurs WebRTC

```
multiparty-meeting-server:ERROR ...
*mediasoup* ERROR ...
```

### Health check

Les requêtes vers `/health` ne génèrent généralement pas de logs, mais vous pouvez vérifier :

```bash
curl https://your-domain.com/health
```

## Dépannage

### Pas de logs visibles

1. Vérifiez que `DEBUG` est configuré :
   ```bash
   echo $DEBUG
   ```

2. Vérifiez que le serveur tourne :
   ```bash
   ps aux | grep node
   ```

3. Vérifiez les permissions sur les fichiers de logs :
   ```bash
   ls -la /var/log/multiparty-meeting.log
   ```

### Logs trop verbeux

Réduisez le niveau de DEBUG :

```bash
DEBUG='*ERROR* *WARN*' npm start
```

### Logs manquants

Vérifiez que le serveur écrit bien dans stdout/stderr et non dans un fichier spécifique.

## Recommandations pour la production

1. **Rediriger les logs vers un fichier** :
   ```bash
   npm start > /var/log/multiparty-meeting.log 2>&1
   ```

2. **Configurer la rotation des logs** avec logrotate

3. **Utiliser un gestionnaire de processus** comme PM2 ou systemd pour une meilleure gestion des logs

4. **Surveiller les erreurs** :
   ```bash
   tail -f /var/log/multiparty-meeting.log | grep ERROR
   ```

5. **Centraliser les logs** avec des outils comme ELK, Loki, ou Graylog pour les environnements multi-instances (GRA/SBG)

