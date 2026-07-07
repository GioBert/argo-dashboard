# Telegram Bot Service

Servizio separato per collegare ARGO_DASHBOARD a Telegram.

## Stato attuale

Scaffold iniziale:

- bootstrap Node
- validazione configurazione da `.env.local`
- adapter Argo server-side
- estrazione e formattazione compiti
- polling Telegram via API HTTP
- scheduler giornaliero minimale
- stato locale per offset e deduplica report

## Avvio locale

```bash
cd services/telegram-bot
npm run start
```

## Deploy Docker

Build context previsto: repository root.

Dockerfile:

- `services/telegram-bot/Dockerfile`

Il servizio e' pensato per girare in container:

- env vars fornite da `docker compose`
- stato persistito in volume su `/app/data`
- log esposti su stdout/stderr del container

Comandi supportati:

- `/oggi`
- `/domani`
- `/dopodomani`
- `/aggiorna`
- `/stato`

## Configurazione

Compilare:

- `.env.local` per test locale
- env file Docker dedicato in produzione

Usare come riferimento:

- `.env.local.example`
