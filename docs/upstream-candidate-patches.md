# Upstream Candidate Patches

Questa nota separa le modifiche che hanno senso come contributo generico al progetto
originale `DTrombett/argo-dashboard` da quelle che devono restare nel fork
`GioBert/argo-dashboard` perche' specifiche del contesto self-hosted o familiare.

## Upstream-ready

### 1. Fix `Illegal invocation` sul client browser

File:
- [components/dashboard/ClientProvider.tsx](../components/dashboard/ClientProvider.tsx)

Motivazione:
- corregge un bug reale del browser client
- non dipende dal contesto self-hosted
- migliora l'affidabilita' del login e delle chiamate successive

Note:
- va proposto come bugfix puro

### 2. Attendere `State.Ready` prima delle chiamate extra del client

File principali:
- [app/dashboard/menu/[slug]/page.tsx](../app/dashboard/menu/%5Bslug%5D/page.tsx)

Motivazione:
- evita errori tipo `Client is not logged in!`
- protegge tutte le pagine che usano metodi extra della libreria
- migliora il coordinamento tra stato del client e richieste aggiuntive

Note:
- questa parte e' candidata forte a una PR separata

### 3. Gestione robusta del testo lungo

File principali:
- [components/dashboard/ExpandText.tsx](../components/dashboard/ExpandText.tsx)
- [components/dashboard/ListElement.tsx](../components/dashboard/ListElement.tsx)

Motivazione:
- evita card inutili con testo troncato
- migliora leggibilita' di compiti, comunicazioni e note
- utile in modo generale, non solo nel fork

Note:
- la PR dovrebbe essere limitata al comportamento `Espandi/Riduci`
- meglio evitare di mescolarla con scelte di layout piu' opinionate

### 4. Popup leggibili per messaggi e comunicazioni

File principali:
- [components/dashboard/PopupMessaggio.tsx](../components/dashboard/PopupMessaggio.tsx)
- [components/dashboard/Updates.tsx](../components/dashboard/Updates.tsx)
- [app/dashboard/menu/[slug]/page.tsx](../app/dashboard/menu/%5Bslug%5D/page.tsx)

Motivazione:
- rende consultabili messaggi lunghi
- permette di mostrare allegati dove disponibili
- migliora la fruizione di `bacheca` e `bachecaAlunno`

Note:
- da proporre solo dopo un piccolo giro di stabilizzazione nel fork

### 5. Fallback menu dinamico al posto del `404`

File:
- [app/dashboard/menu/[slug]/page.tsx](../app/dashboard/menu/%5Bslug%5D/page.tsx)

Motivazione:
- una pagina generica con dati utili e' meglio di un `404`
- valorizza meglio i dati gia' presenti nel payload dashboard

Note:
- va presentata come improvement UX, non come bugfix

## Buone candidate, ma da rifinire prima

### Home con altezze piu' dinamiche

File:
- [app/dashboard/page.tsx](../app/dashboard/page.tsx)
- [components/dashboard/Entry.tsx](../components/dashboard/Entry.tsx)

Motivazione:
- migliora la fruizione delle sezioni importanti

Rischio:
- scelta piu' opinionata
- va verificata bene su viewport diverse

### `compitiAssegnati` diviso in `Entro domani`, `Successivi`, `Precedenti`

File:
- [app/dashboard/menu/[slug]/page.tsx](../app/dashboard/menu/%5Bslug%5D/page.tsx)

Motivazione:
- pagina piu' utile del semplice elenco cronologico

Rischio:
- e' una scelta di prodotto, non solo tecnica

### `orario` reso piu' leggibile

File:
- [app/dashboard/menu/[slug]/page.tsx](../app/dashboard/menu/%5Bslug%5D/page.tsx)

Motivazione:
- migliore presentazione di materia, docente, aula e note

Rischio:
- dipende molto da come il maintainer vuole mappare i campi restituiti da Argo

## Da tenere nel fork

Queste modifiche non sono materiale da upstream, almeno non nella forma attuale.

- integrazione con `argo.pds.casa`
- qualunque riferimento a `RPI_SSD`
- catture locali in `docs/captures`
- workflow di debug pensato per il tuo ambiente
- documentazione di deployment self-hosted
- scelte UX molto orientate all'uso "genitore"
- futura predisposizione multi-figlio

## Ordine consigliato per eventuali PR upstream

1. Fix `fetch` / `Illegal invocation`
2. Attesa di `State.Ready` per le chiamate extra
3. Gestione del testo lungo con `ExpandText`
4. Popup messaggi e allegati
5. Solo dopo: miglioramenti piu' opinionati su home e menu

## Strategia consigliata

Non partire da una PR grande presa direttamente dal commit del fork.

Meglio:

1. isolare una patch per volta
2. ridurre il diff al minimo indispensabile
3. evitare riferimenti al contesto self-hosted
4. aprire PR corte e difendibili
