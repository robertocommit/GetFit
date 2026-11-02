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

La versione `november-2026` è valida dal 2 al 29 novembre. Le dodici sedute A/B/C e gli obiettivi delle quattro settimane sono in `src/lib/november.ts`. La scheda della seduta viene salvata in `workout_sessions.training_context`; una seduta già registrata conserva esercizi, valori e versione precedenti. Aprire una seduta non crea registrazioni completate.

Gli obiettivi programmati si distinguono dai campi effettivi. Il pulsante di approvazione richiede conferme di tecnica e tolleranza, non applica aumenti dopo fatica 4/4, consolida prima di aumentare il peso con fatica 3/4 e mantiene la fase precedente se il lavoro non è stato completato. Le modifiche manuali restano possibili; NR resta nullo. Farmer carry, Pallof hold e mobilità mantengono le rispettive unità e i dati non quantificati. La corsa del mercoledì propone 1,5 / 1,8 / 2,1 / 2,5 km senza sovrascrivere la distanza effettiva; al massimo una nuova corsa con sprint per settimana. Nessun valore viene applicato alle attività già salvate.

Il blocco **Forza cervicale — Elastici · Fase 1** è una proposta da validare con il fisioterapista. Le quattro configurazioni con elastici non dispongono di illustrazioni biomeccaniche verificate per il caso individuale: l'app richiede una dimostrazione professionale specifica prima di abilitarne la registrazione. Non propone montaggi improvvisati. Il chin nod dispone di uno schema SVG indicativo e resta senza elastico. Non sono inserite rotazioni resistite. L'unico timer preesistente è quello dell'intera seduta: non esiste un timer per singola contrazione da integrare.

Marca, modello, colore, livello nominale, configurazione, ancoraggio e distanza/allungamento sono salvati nella configurazione dell'esercizio. Ripetizioni, secondi di contrazione e lato sono distinti per serie. Il carico numerico cervicale resta nullo. Il dolore 0–10 e la tolleranza sono salvati per seduta e restano distinti dalla fatica 1–4. La registrazione di nuovi sintomi deve rimanere possibile anche dopo aver eseguito alcune serie: il server conserva queste serie e impedisce di registrarne di nuove finché persistono le condizioni di blocco.

Le indicazioni generali di sicurezza e di controllo motorio sono state confrontate con [CUH: Neck exercises and advice](https://www.cuh.nhs.uk/patient-information/neck-exercises-and-advice/), [NHS inform: Exercises for neck problems](https://www.nhsinform.scot/illnesses-and-conditions/muscle-bone-and-joints/neck-and-back-problems-and-conditions/exercises-for-neck-problems) e [CLCH: Neck pain](https://clch.nhs.uk/services/musculoskeletal-physiotherapy/managing-conditions/neck-pain). Queste fonti non validano il dosaggio individuale né i montaggi con elastici: occorre il fisioterapista.

Migrazione additiva necessaria prima del nuovo server: `008_november_program.sql`. Aggiunge `training_context` (JSONB), `hold_seconds` e `side`, senza aggiornare lo storico. Lo schema è personale e usa le tabelle singleton già esistenti; non vengono toccati schemi di altre applicazioni. Stormkit gestisce le migrazioni distribuite; il comando locale `npm run migrate` usa un registro separato e va eseguito soltanto sul database locale configurato.

Verifica: `npm run check`, `npm test`, `npm run build`. I test di novembre coprono tutte le date, i valori, le lateralità, i blocchi di sicurezza, le condizioni di progressione, le guide e la conservazione delle definizioni storiche.

Verifiche di integrazione effettuate il 2 novembre 2026 su un database PostgreSQL di prova isolato (PGlite): migrazione ripetuta due volte, confronto dello storico prima/dopo, salvataggio e rilettura via API di consenso, dolore, secondi e lati, rifiuto di nuove serie in presenza di sintomi, protezione delle sedute concluse e limite settimanale agli sprint. Verifica browser a 390 px: nessun overflow o errore JavaScript, guide consultabili, consenso e dolore persistenti dopo ricarica, lati separati e storico bloccato.

La migrazione 008 è stata applicata anche allo schema di produzione `a40e42` il 2 novembre 2026 in una transazione. I checksum di tutti i campi preesistenti in sedute, serie e attività sono rimasti identici. Il registro gestito da Stormkit verrà aggiornato dal successivo deploy che includerà il file; rieseguire la sola 008 è sicuro grazie a `IF NOT EXISTS`.
