# GetFit

Diario di allenamento mobile-first per il programma di 5 mesi, con sedute ogni martedì, giovedì e sabato.

Corsa lunedì, mercoledì e venerdì; Wing Chun lunedì e mercoledì. Le sedute saltate possono essere segnate come causa maggiore, pigrizia o vacanza.

I suggerimenti mantengono i carichi al rientro dopo almeno 10 giorni senza la stessa seduta. Poi aumentano le ripetizioni con fatica 1–2/4 e propongono lo scatto previsto quando tutte le serie raggiungono il massimo delle ripetizioni allo stesso peso. Se la fatica manca, il carico resta invariato.

Ogni esercizio include una guida visuale integrata con attrezzo, preparazione, esecuzione, respirazione, errori comuni, sicurezza e alternativa: non serve lasciare l'app per cercare i movimenti.

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
