# GetFit

Diario di allenamento mobile-first per il programma di 5 mesi, con sedute ogni martedì, giovedì e sabato.

Corsa lunedì, mercoledì e venerdì; Wing Chun lunedì e mercoledì. Le sedute saltate possono essere segnate come causa maggiore, pigrizia o vacanza.

I suggerimenti mantengono i carichi al rientro dopo almeno 10 giorni senza la stessa seduta. Poi aumentano le ripetizioni con fatica 1–2/4 e propongono lo scatto previsto quando tutte le serie raggiungono il massimo delle ripetizioni allo stesso peso. Se la fatica manca, il carico resta invariato.

Ogni esercizio include una guida visuale integrata con benefici e obiettivi a lungo termine, attrezzo, preparazione, esecuzione, respirazione, errori comuni, sicurezza e alternativa: non serve lasciare l'app per cercare i movimenti.

## Avvio

```bash
npm install
cp .env.example .env
npm run migrate
npm run dev
```

In produzione:

```bash
npm run build
node build
```

Variabili richieste:

- `DATABASE_URL`: URL PostgreSQL.
- `PORT`: porta del server Node (opzionale, default `3000`).

Le migration SQL sono in `migrations/` e vengono registrate nella tabella `schema_migrations`.

Per verificare la progressione con Node 22.18 o successivo:

```bash
node --test scripts/progression.test.mjs
```

## Novembre 2026

La versione `november-2026` è valida dal 2 al 29 novembre. Le dodici sedute A/B/C e gli obiettivi delle quattro settimane sono in `src/lib/november.ts`. La scheda di ogni seduta è salvata in `workout_sessions.training_context`; le registrazioni esistenti mantengono esercizi e valori precedenti. Aprire una seduta non crea allenamenti completati.

La registrazione usa direttamente i campi di carico, ripetizioni e serie. I pannelli di approvazione degli obiettivi e di consenso/dolore cervicale sono stati rimossi su richiesta dell’utente, insieme ai relativi obblighi sul server. I dati già salvati rimangono nel database; NR resta nullo. Le guide agli esercizi rimangono consultabili. Gli elastici conservano configurazione e dati descrittivi facoltativi, senza conversioni in kg; ripetizioni, secondi e lati sono distinti per serie.

La migrazione additiva `008_november_program.sql` aggiunge `training_context`, `hold_seconds` e `side`. È stata applicata allo schema personale `a40e42` il 2 novembre 2026 in una transazione, verificando che i checksum dei campi preesistenti di sedute, serie e attività rimanessero identici. Non serve una nuova migrazione per rimuovere i pannelli. Stormkit registra la migrazione nel deploy che include il file; rieseguire la 008 è sicuro grazie a `IF NOT EXISTS`.

Verifica: `npm run check`, `npm test`, `npm run build`.
