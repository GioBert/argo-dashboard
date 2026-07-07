# Deploy

Questo progetto pubblica `https://argo.pds.casa` tramite Raspberry, non tramite Vercel.

## Runbook rapido

Punti verificati:

- host runtime: `raspberrypiSSD`
- checkout remoto: `/home/pi/argo_dashboard`
- compose file attivo: `/home/pi/argo_dashboard/docker-compose.example.yml`
- container pubblico: `argo-dashboard`
- porta host Raspberry: `3015`

Comando di deploy verificato:

```bash
ssh raspberrypiSSD "cd /home/pi/argo_dashboard && docker-compose -f docker-compose.example.yml up -d --build argo-dashboard"
```

Nota:

- su questo host usare `docker-compose` v1
- non dare per scontato `docker compose`
- non omettere `-f docker-compose.example.yml`

## Fix mirato senza toccare il checkout remoto

Usare questo flusso quando il Raspberry ha una working tree sporca o poco affidabile.

1. Verificare lo stato Git remoto.
2. Se il checkout e' sporco, evitare `git pull` e `git reset`.
3. Copiare solo i file necessari.
4. Ricostruire solo `argo-dashboard`.
5. Verificare container, chunk e UI pubblica.

Comandi:

```bash
ssh raspberrypiSSD "cd /home/pi/argo_dashboard && git status -sb"
scp components/dashboard/ClientProvider.tsx raspberrypiSSD:/home/pi/argo_dashboard/components/dashboard/ClientProvider.tsx
scp components/dashboard/LogOutButton.tsx raspberrypiSSD:/home/pi/argo_dashboard/components/dashboard/LogOutButton.tsx
ssh raspberrypiSSD "cd /home/pi/argo_dashboard && docker-compose -f docker-compose.example.yml up -d --build argo-dashboard"
```

## Perche' un checkout remoto sporco e' rischioso

Significa che sul Raspberry esistono file modificati o non tracciati rispetto al commit atteso.

Effetti pratici:

- `git pull` puo' fallire per conflitti locali
- `git reset` puo' cancellare hotfix presenti solo sul Raspberry
- un deploy "pulito" puo' in realta' sovrascrivere modifiche mai riportate nel repo locale

Per questo il primo comando da eseguire e':

```bash
ssh raspberrypiSSD "cd /home/pi/argo_dashboard && git status -sb"
```

## Verifica post-deploy

Controlli minimi:

- `docker ps` deve mostrare `argo-dashboard` in stato `healthy`
- `https://argo.pds.casa/` deve rispondere
- `https://argo.pds.casa/dashboard` non deve restare nello stato `MayNeedLogin`
- il bundle attivo non deve piu' contenere il vecchio recovery path

Comandi utili:

```bash
ssh raspberrypiSSD "docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}' | grep argo-dashboard"
ssh raspberrypiSSD "docker exec argo-dashboard sh -lc 'grep -R -n MayNeedLogin /app/.next/static/chunks || true'"
curl -L https://argo.pds.casa/_next/static/chunks/4622-0dd5cb82d8fcf88f.js
```

Nota:

- se il vecchio chunk storico restituisce `Not Found`, dopo un rebuild corretto e' normale
- il controllo corretto e' sul chunk attualmente presente nel container

## Quando usare `--no-cache`

Forzare il rebuild se:

- i sorgenti remoti sono corretti
- ma il container continua a servire chunk con codice vecchio

Comandi:

```bash
ssh raspberrypiSSD "cd /home/pi/argo_dashboard && docker-compose -f docker-compose.example.yml build --no-cache argo-dashboard"
ssh raspberrypiSSD "cd /home/pi/argo_dashboard && docker-compose -f docker-compose.example.yml up -d argo-dashboard"
```

Ordine dei controlli:

1. sorgenti remoti in `/home/pi/argo_dashboard/components/dashboard/`
2. sorgenti dentro il container in `/app/components/dashboard/`
3. chunk in `/app/.next/static/chunks/`
4. solo alla fine URL pubblica

## Problema noto: `KeyError: 'ContainerConfig'`

Su questo Raspberry `docker-compose` v1 puo' fallire in `up -d` se esiste un vecchio container `Exited`.

Workaround verificato:

```bash
ssh raspberrypiSSD "docker ps -a --format '{{.Names}} {{.Status}}' | grep argo"
ssh raspberrypiSSD "docker rm -f <container-exited>"
ssh raspberrypiSSD "cd /home/pi/argo_dashboard && docker-compose -f docker-compose.example.yml up -d argo-dashboard"
```

## Manutenzione Docker e Portainer

Quando `https://portainer.pds.casa/` mostra immagini obsolete o spazio Docker in crescita, usare una pulizia conservativa.

Prima verificare:

```bash
ssh raspberrypiSSD "docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'"
ssh raspberrypiSSD "docker image ls --format '{{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}\t{{.Size}}'"
ssh raspberrypiSSD "docker system df"
```

Pulizia consigliata:

```bash
ssh raspberrypiSSD "docker image prune -a -f"
ssh raspberrypiSSD "docker builder prune -f"
```

Questa procedura rimuove:

- immagini non usate da alcun container
- build cache non attiva

Questa procedura non rimuove:

- container attivi
- volumi in uso
- immagini ancora referenziate da container esistenti

Verifica finale:

```bash
ssh raspberrypiSSD "docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'"
ssh raspberrypiSSD "docker system df"
```

Esito verificato il `2026-06-30`:

- `22` container attivi rimasti `Up`
- circa `3.51 GB` recuperati da immagini obsolete
- circa `3.53 GB` recuperati da build cache
- totale recuperato: circa `7.0 GB`

Immagini obsolete rimosse in quel giro:

- `portainer/portainer-ce:lts`
- vecchie immagini base `node`, `python`, `alpine`, `caddy`
- immagini applicative non piu' referenziate da container

## Fix login/logout da ricordare

Comportamento corretto:

- se il bootstrap con token locale fallisce, il client deve pulire la sessione locale e tornare a `NeedLogin`
- il bottone `Log out` deve cancellare i dati locali anche se `client.logOut()` fallisce

Obiettivo:

- evitare il banner bloccante `Aggiornamento dati non riuscito, prova a eseguire il log out`
- riportare l'utente al form di login senza interventi manuali extra

## Note di fase

- login ancora browser-side
- token ancora lato browser
- nessuna credenziale nel repository
- app ancora single-profile

## Bot Telegram

Il bot gira nello stack Docker, non come processo Windows.

- env file: `services/telegram-bot/.env.local`
- volume stato: `argo-telegram-bot-data`
- evitare avvii concorrenti locali con `node.exe`
