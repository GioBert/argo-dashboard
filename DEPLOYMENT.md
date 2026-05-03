# Deploy rapido

Questa e la configurazione minima per attivare il servizio in locale senza ancora introdurre il modello multi-figlio.

## Obiettivo della Fase 1

- mettere online la dashboard Argo rapidamente
- usare l'app quasi com'e
- privilegiare compiti e prossimi impegni nella home
- rimandare a una fase successiva la gestione di un secondo figlio

## Avvio locale con Docker

```bash
docker compose -f docker-compose.example.yml up -d --build
```

Poi aprire:

- `http://localhost:3015`

## Integrazione consigliata nello stack Casa

- servizio Docker dedicato: `argo-dashboard`
- reverse proxy Caddy su `argo.pds.casa`
- accesso iniziale con login browser-side, come previsto dal progetto originale

## Note operative

- in questa fase non vengono salvate credenziali nel repository
- il token continua a vivere nel browser dell'utente, come nel progetto originale
- l'app resta quindi single-profile fino alla fase successiva

## Fase successiva prevista

- introdurre profili figli configurabili
- predisporre `figlio_1` attivo e `figlio_2` disabilitato
- valutare automazione login/token lato server
