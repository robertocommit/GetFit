# GetFit

Diario di allenamento mobile-first per il programma di 5 mesi, con sedute ogni martedì, giovedì e sabato.

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
