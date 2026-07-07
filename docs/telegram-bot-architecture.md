# Bot Telegram per ARGO_DASHBOARD

## Obiettivo

Realizzare un servizio separato dal frontend che faccia da ponte tra Argo e un gruppo Telegram domestico.

Prima fase:

- 1 account Argo
- 1 gruppo Telegram
- 1 admin
- sola area `Compiti assegnati`
- invio giornaliero automatico dei compiti per il giorno dopo
- comandi on demand per `oggi`, `domani`, `dopodomani`

## Vincoli del progetto attuale

Il sito attuale usa un modello browser-side:

- le credenziali vengono inviate al server solo per ottenere il token
- il token viene poi usato dal client browser
- il dashboard payload viene letto nel browser tramite `portaleargo-api`

Per il bot questo modello non basta, perche' serve un processo server-side persistente e schedulato.

## Decisioni architetturali

### 1. Servizio separato

Il bot non va integrato nel frontend Next.js come semplice route API.

Meglio creare un servizio dedicato:

- lifecycle indipendente
- scheduler indipendente
- segreti separati dal sito pubblico
- minore accoppiamento con il rendering web

### 2. Riutilizzo libreria Argo

Il bot deve riusare `portaleargo-api` per:

- login
- rinnovo sessione
- fetch dashboard

Non conviene usare scraping HTML o sessioni copiate manualmente dal browser.

### 3. Gestione credenziali

Scelta consigliata:

- salvare le credenziali Argo cifrate a riposo
- ottenere e riusare il token solo lato server
- rigenerare il token in automatico quando la sessione scade

Motivo:

- e' piu' robusto del salvataggio di un token volatile
- evita procedure manuali
- consente invii schedulati affidabili

## Struttura consigliata

Directory proposta nel repository:

```text
services/
  telegram-bot/
    src/
      config/
      storage/
      argo/
      homework/
      telegram/
      scheduler/
      app.ts
    package.json
    tsconfig.json
    README.md
```

## Moduli

### `config/`

Responsabilita':

- lettura env
- validazione configurazione
- gestione whitelist

Variabili iniziali:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_CHAT_IDS`
- `TELEGRAM_ADMIN_USER_IDS`
- `ARGO_USERNAME`
- `ARGO_PASSWORD`
- `ARGO_SCHOOL_CODE`
- `ARGO_SECRET_KEY`
- `TZ=Europe/Rome`

### `storage/`

Responsabilita':

- persistenza minima
- cifratura locale
- cache ultimo snapshot

Scelta MVP:

- file JSON locale fuori dal repo oppure volume Docker dedicato

Dati minimi:

- configurazione account
- ultimo hash compiti pubblicati
- timestamp ultima sincronizzazione
- eventuali errori tecnici recenti

### `argo/`

Responsabilita':

- login Argo
- fetch dashboard
- gestione token
- retry controllati

API interne attese:

- `login()`
- `getDashboard()`
- `refreshIfNeeded()`

### `homework/`

Responsabilita':

- estrarre `registro[].compiti[]`
- normalizzare i record
- filtrare per oggi, domani, dopodomani
- costruire il blocco "entro domani"

Formato minimo normalizzato:

```ts
type HomeworkItem = {
  dueDate: string;
  subject: string;
  teacher?: string;
  text: string;
  sourcePk?: string;
};
```

### `telegram/`

Responsabilita':

- binding bot Telegram
- controllo autorizzazioni
- rendering messaggi
- gestione comandi

Comandi MVP:

- `/oggi`
- `/domani`
- `/dopodomani`
- `/aggiorna`
- `/stato`

### `scheduler/`

Responsabilita':

- job giornaliero
- invio al gruppo
- deduplica messaggi

Scelta MVP:

- schedulazione interna al processo
- invio una volta al giorno a orario fisso, per esempio `18:30 Europe/Rome`

## Sicurezza

Regole minime obbligatorie:

- mai loggare credenziali Argo
- mai loggare token Telegram o token Argo
- limitare il bot a chat whitelistate
- permettere i comandi sensibili solo ad admin whitelistati
- fare setup credenziali solo via file env o chat privata admin
- cifrare a riposo ogni dato che consenta login automatico
- non pubblicare nel gruppo dati oltre i compiti richiesti

Scelta pragmatica MVP:

- credenziali lette da env in sviluppo
- storage locale cifrato per cache e stato
- gruppo autorizzato via `chat_id`
- admin autorizzato via `user_id`

## Privacy

Per minimizzare l'esposizione:

- il gruppo deve ricevere solo il riepilogo compiti
- niente debug payload Argo nel gruppo
- niente informazioni scolastiche non necessarie
- nessuna risposta a utenti o chat non autorizzate

## Flusso operativo MVP

### Sync giornaliera

1. lo scheduler avvia il fetch
2. il client Argo esegue login o refresh token
3. il servizio estrae i compiti
4. genera la sezione `domani`
5. confronta hash con l'ultimo invio
6. se diverso, pubblica nel gruppo
7. aggiorna stato locale

### Richiesta manuale

1. un utente autorizzato invia `/oggi`, `/domani` o `/dopodomani`
2. il bot verifica chat e utente
3. aggiorna i dati da Argo
4. risponde con il riepilogo richiesto

## Formato messaggi

Esempio:

```text
Compiti per domani - 04/05/2026

- Matematica: esercizi pag. 123 n. 4, 5, 6
- Inglese: studiare unit 7
- Storia: ripassare capitolo 3
```

Dettagli utili:

- raggruppare per materia
- mantenere testo breve e leggibile
- indicare "nessun compito" in modo esplicito

## Stack consigliato

Scelta semplice e coerente con il repo:

- Node.js 20+
- TypeScript
- `portaleargo-api`
- una libreria Telegram stabile per bot
- Docker per il deploy

Non serve database nella prima fase.

## Deploy consigliato

Container separato:

- `argo-dashboard` per il sito
- `argo-telegram-bot` per il ponte Telegram

Serve:

- volume per stato/cache
- env file separato
- restart automatico

## Piano di implementazione

### Fase A

- confermare requisiti MVP
- scegliere nome bot e chat target
- decidere orario invio automatico

### Fase B

- creare `services/telegram-bot`
- configurare TypeScript e package
- aggiungere loader config

### Fase C

- implementare client Argo server-side
- verificare login
- verificare estrazione compiti

### Fase D

- implementare normalizzazione e filtri data
- testare `oggi`, `domani`, `dopodomani`

### Fase E

- implementare bot Telegram
- introdurre whitelist chat e admin
- aggiungere comandi MVP

### Fase F

- implementare scheduler e deduplica
- aggiungere logging minimale
- preparare compose dedicato

## Criteri di accettazione MVP

- il bot si avvia senza frontend
- legge i compiti da Argo con login automatico
- risponde correttamente a `/oggi`, `/domani`, `/dopodomani`
- pubblica ogni giorno il riepilogo di domani
- non risponde a chat non autorizzate
- non espone segreti nei log

## Scelte rinviate

Da non affrontare subito:

- multi-figlio
- piu' gruppi Telegram
- pannello web di amministrazione
- allegati
- bacheca, promemoria, voti
- setup self-service via Telegram
