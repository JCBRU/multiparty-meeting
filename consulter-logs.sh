#!/bin/bash
# Script pour consulter les logs du serveur multiparty-meeting

LOG_TYPE="${1:-server}"
case "$LOG_TYPE" in
    server|s)
        LOG_FILE="$HOME/logs/multiparty-meeting/server.log"
        shift
        ;;
    frontend|f|app|a)
        LOG_FILE="$HOME/logs/multiparty-meeting/frontend.log"
        shift
        ;;
    *)
        LOG_FILE="$HOME/logs/multiparty-meeting/server.log"
        ;;
esac

if [ ! -f "$LOG_FILE" ]; then
    echo "Erreur : Le fichier de logs n'existe pas : $LOG_FILE"
    exit 1
fi

case "$1" in
    follow|-f|--follow)
        echo "Suivi des logs en temps réel (Ctrl+C pour quitter)..."
        tail -f "$LOG_FILE"
        ;;
    error|--error|-e)
        echo "Affichage des erreurs uniquement..."
        tail -f "$LOG_FILE" | grep -i error
        ;;
    warn|--warn|-w)
        echo "Affichage des warnings et erreurs..."
        tail -f "$LOG_FILE" | grep -E "(WARN|ERROR|warning|error)"
        ;;
    last|--last|-n)
        LINES=${2:-50}
        echo "Dernières $LINES lignes :"
        tail -n "$LINES" "$LOG_FILE"
        ;;
    search|--search|-s)
        if [ -z "$2" ]; then
            echo "Usage: $0 [server|frontend] search <terme>"
            exit 1
        fi
        echo "Recherche de '$2' dans les logs..."
        grep -i "$2" "$LOG_FILE" | tail -20
        ;;
    *)
        echo "Usage: $0 [server|frontend] {follow|error|warn|last|search} [options]"
        echo ""
        echo "Types de logs disponibles :"
        echo "  server, s           Logs du serveur backend (défaut)"
        echo "  frontend, f, app, a Logs du frontend React"
        echo ""
        echo "Commandes disponibles :"
        echo "  follow, -f          Suivre les logs en temps réel"
        echo "  error, -e           Afficher uniquement les erreurs"
        echo "  warn, -w            Afficher warnings et erreurs"
        echo "  last [n], -n [n]    Afficher les n dernières lignes (défaut: 50)"
        echo "  search <terme>, -s  Rechercher un terme dans les logs"
        echo ""
        echo "Exemples :"
        echo "  $0 follow              # Suivre les logs serveur en temps réel"
        echo "  $0 frontend follow     # Suivre les logs frontend en temps réel"
        echo "  $0 last 100            # Afficher les 100 dernières lignes du serveur"
        echo "  $0 frontend search webpack  # Rechercher 'webpack' dans les logs frontend"
        echo "  $0 error               # Afficher uniquement les erreurs du serveur"
        exit 1
        ;;
esac

