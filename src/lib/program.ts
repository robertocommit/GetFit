import type { Exercise, ExerciseGuide, WorkoutType } from './types';

export const workouts: Record<WorkoutType, { title: string; focus: string; cardio: string; exercises: Exercise[] }> = {
  A: {
    title: 'Forza di base',
    focus: 'Squat · petto · schiena · presa',
    cardio: '15–20 min · camminata inclinata o cyclette',
    exercises: [
      { id: 'squat', name: 'Squat', sets: 3, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 40, unit: 'kg', increment: 5 },
      { id: 'bench', name: 'Bench press', sets: 4, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 40, unit: 'kg', increment: 2.5 },
      { id: 'row', name: 'Seated cable row', sets: 4, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5, note: 'Usa lo scatto minimo della macchina.' },
      { id: 'lateral', name: 'Lateral raises', sets: 3, reps: '12–15', minReps: 12, maxReps: 15, startWeight: 5, unit: 'kg/mano', increment: 1 },
      { id: 'curl', name: 'Dumbbell curl', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 8, unit: 'kg/mano', increment: 1 },
      { id: 'carry', name: 'Farmer carry', sets: 4, reps: '1 andata e ritorno', startWeight: 16, unit: 'kg/mano', increment: 2, tracking: 'carry', note: 'Ogni giro è una singola andata e ritorno. Il carico è facoltativo.' },
      { id: 'neck-iso', name: 'Neck isometrics', sets: 2, reps: '20–30 sec/direzione', startWeight: null, unit: 'sec', increment: null, tracking: 'timed', note: 'Solo pressione delicata contro la mano nel mese 1.' }
    ]
  },
  B: {
    title: 'Catena posteriore',
    focus: 'Dorsali · anche · unilateralità',
    cardio: 'Cardio facoltativo, ritmo facile',
    exercises: [
      { id: 'rdl', name: 'Romanian deadlift', sets: 3, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 40, unit: 'kg', increment: 5 },
      { id: 'incline-db', name: 'Incline dumbbell press', sets: 4, reps: '8–12', minReps: 8, maxReps: 12, startWeight: 12, unit: 'kg/mano', increment: 2 },
      { id: 'pulldown', name: 'Lat pulldown', sets: 4, reps: '8–12', minReps: 8, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'split-squat', name: 'Bulgarian split squat', sets: 3, reps: '8–10/gamba', minReps: 8, maxReps: 10, startWeight: 0, unit: 'kg/mano', increment: 2, note: 'Inizia a corpo libero; aggiungi peso solo con controllo.' },
      { id: 'face-pull', name: 'Face pull', sets: 3, reps: '12–15', minReps: 12, maxReps: 15, startWeight: 15, unit: 'kg', increment: 5 },
      { id: 'shrug', name: 'Shrug con manubri', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 16, unit: 'kg/mano', increment: 2 },
      { id: 'dead-hang', name: 'Dead hang', sets: 3, reps: '20–40 sec', startWeight: null, unit: 'sec', increment: null, tracking: 'timed' },
      { id: 'neck-lateral', name: 'Neck lateral isometric', sets: 2, reps: '20 sec/lato', startWeight: null, unit: 'sec', increment: null, tracking: 'timed' }
    ]
  },
  C: {
    title: 'Volume & capacità',
    focus: 'Ipertrofia · presa · condizionamento',
    cardio: '20–25 min · intensità facile',
    exercises: [
      { id: 'leg-press', name: 'Leg press', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 100, unit: 'kg', increment: 10 },
      { id: 'bench', name: 'Bench press', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 2.5 },
      { id: 'row', name: 'Seated cable row', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'pulldown', name: 'Lat pulldown', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'lateral', name: 'Lateral raises', sets: 4, reps: '12–20', minReps: 12, maxReps: 20, startWeight: 5, unit: 'kg/mano', increment: 1 },
      { id: 'pushdown', name: 'Triceps pushdown', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: null, unit: 'kg', increment: 5, note: 'Scegli un peso facile/moderato.' },
      { id: 'curl', name: 'Dumbbell curl', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 8, unit: 'kg/mano', increment: 1 },
      { id: 'carry', name: 'Farmer carry', sets: 3, reps: '1 andata e ritorno', startWeight: 16, unit: 'kg/mano', increment: 2, tracking: 'carry', note: 'Ogni giro è una singola andata e ritorno. Il carico è facoltativo.' },
      { id: 'neck', name: 'Mobilità del collo', sets: 2, reps: 'per direzione', startWeight: null, unit: 'sec', increment: null, tracking: 'mobility', note: 'Movimenti leggeri per ogni direzione, senza carico.' }
    ]
  }
};

export const monthThemes = [
  { title: 'Riavvio', text: 'Mantieni sempre qualche ripetizione di margine: la seduta deve quasi sembrarti troppo facile.' },
  { title: 'Tecnica', text: 'Movimenti puliti, senza arrivare al limite, e progressione graduale.' },
  { title: 'Massa', text: 'Priorità a spalle, dorsali, petto e braccia, mantenendo una tecnica solida.' },
  { title: 'Consolidamento', text: 'Stessa struttura, tecnica stabile e piccoli progressi.' },
  { title: 'Rifinitura', text: 'Più forte sugli stessi esercizi, senza cercare massimali.' }
];

export const exerciseGuides: Record<string, ExerciseGuide> = {
  squat: {
    equipment: 'Rack, bilanciere e dischi. Il bilanciere parte sui supporti all’altezza del petto.',
    setup: 'Bilanciere sulla parte alta della schiena, piedi poco oltre le anche e punte leggermente aperte.',
    steps: ['Fai un passo indietro e crea tensione nell’addome.', 'Porta anche e ginocchia verso il basso mantenendo tutto il piede a terra.', 'Scendi fin dove controlli la schiena, poi spingi il pavimento e risali.'],
    breathing: 'Inspira e crea pressione prima di scendere; espira dopo il punto più difficile della salita.',
    feel: 'Cosce, glutei e addome. Il peso resta distribuito su tallone, alluce e mignolo.',
    mistakes: ['Talloni che si sollevano', 'Ginocchia che collassano verso l’interno', 'Scendere perdendo la posizione della schiena'],
    alternative: 'Goblet squat con un manubrio davanti al petto.',
    safety: 'Usa le barre di sicurezza del rack e chiedi al trainer di controllare le prime sedute.'
  },
  bench: {
    equipment: 'Panca piana, rack, bilanciere e dischi.',
    setup: 'Occhi sotto il bilanciere, piedi ben appoggiati, scapole avvicinate e petto stabile.',
    steps: ['Afferra il bilanciere poco oltre la larghezza delle spalle.', 'Portalo sopra il petto e abbassalo con controllo verso la parte medio-bassa dello sterno.', 'Spingi verso l’alto senza staccare glutei o piedi.'],
    breathing: 'Inspira prima della discesa; espira mentre superi la parte difficile della spinta.',
    feel: 'Petto, tricipiti e parte anteriore delle spalle.',
    mistakes: ['Polsi piegati indietro', 'Gomiti completamente aperti a 90°', 'Bilanciere che rimbalza sul petto'],
    alternative: 'Chest press machine o dumbbell press.',
    safety: 'Imposta i fermi o fatti assistere. Non portare mai una serie a cedimento senza spotter.'
  },
  row: {
    equipment: 'Pulley basso con seduta, appoggi per i piedi e maniglia stretta o neutra.',
    setup: 'Piedi sugli appoggi, ginocchia morbide, busto alto e braccia distese.',
    steps: ['Inizia portando le scapole leggermente indietro.', 'Tira la maniglia verso l’ombelico mantenendo i gomiti vicini.', 'Fermati un istante, poi distendi lentamente le braccia.'],
    breathing: 'Espira mentre tiri; inspira nel ritorno controllato.',
    feel: 'Centro della schiena, dorsali e bicipiti.',
    mistakes: ['Dondolare molto con il busto', 'Alzare le spalle', 'Lasciare tornare il peso di colpo'],
    alternative: 'Rematore con manubrio appoggiando una mano alla panca.'
  },
  lateral: {
    equipment: 'Due manubri leggeri.',
    setup: 'In piedi, addome attivo, gomiti appena piegati e manubri ai lati.',
    steps: ['Solleva le braccia lateralmente guidando il movimento con i gomiti.', 'Fermati circa all’altezza delle spalle.', 'Scendi lentamente senza far sbattere i manubri.'],
    breathing: 'Espira salendo; inspira scendendo.',
    feel: 'Lato delle spalle, non il collo.',
    mistakes: ['Usare slancio', 'Stringere le spalle verso le orecchie', 'Scegliere un peso troppo alto'],
    alternative: 'Alzate laterali al cavo, un braccio alla volta.'
  },
  curl: {
    equipment: 'Due manubri.',
    setup: 'In piedi, braccia lungo i fianchi e gomiti vicini al busto.',
    steps: ['Piega i gomiti portando i manubri verso le spalle.', 'Mantieni il busto fermo e stringi i bicipiti.', 'Abbassa fino quasi a distendere completamente le braccia.'],
    breathing: 'Espira salendo; inspira scendendo.',
    feel: 'Parte anteriore del braccio.',
    mistakes: ['Oscillare con schiena e anche', 'Portare i gomiti molto avanti', 'Accorciare la discesa'],
    alternative: 'Curl al cavo basso o alla macchina.'
  },
  carry: {
    equipment: 'Due manubri o kettlebell dello stesso peso e un corridoio libero.',
    setup: 'Pesi ai lati, petto alto, addome attivo e spalle lontane dalle orecchie.',
    steps: ['Solleva i pesi come in un deadlift, senza curvare la schiena.', 'Cammina con passi naturali e controllati.', 'Fermati, appoggia i pesi piegando anche e ginocchia.'],
    breathing: 'Respira con cicli brevi mantenendo l’addome stabile.',
    feel: 'Presa, addome, parte alta della schiena e gambe.',
    mistakes: ['Inclinarsi su un lato', 'Fare passi troppo lunghi', 'Lasciare cadere i pesi'],
    alternative: 'Suitcase carry con un solo manubrio, alternando i lati.'
  },
  'neck-iso': {
    equipment: 'Solo la mano; nessuna macchina necessaria nel primo mese.',
    setup: 'Seduto o in piedi, collo neutro e spalle rilassate.',
    steps: ['Appoggia la mano sulla fronte.', 'Spingi la testa contro la mano senza produrre movimento.', 'Ripeti dietro e sui due lati con pressione delicata.'],
    breathing: 'Respira normalmente; non trattenere il fiato.',
    feel: 'Tensione lieve e uniforme nel collo, mai dolore.',
    mistakes: ['Spingere con forza massima', 'Muovere rapidamente la testa', 'Continuare se compaiono vertigini o dolore'],
    alternative: 'Ometti l’esercizio e mantieni solo farmer carry e row.',
    safety: 'Interrompi subito in caso di dolore, formicolio, vertigini o mal di testa.'
  },
  rdl: {
    equipment: 'Bilanciere e dischi; può partire dal rack o da terra con carico leggero.',
    setup: 'Piedi alla larghezza delle anche, bilanciere vicino alle cosce, ginocchia appena piegate.',
    steps: ['Porta il sedere indietro mantenendo il bilanciere aderente alle gambe.', 'Scendi finché senti allungarsi i posteriori coscia senza curvare la schiena.', 'Spingi le anche in avanti e torna in piedi.'],
    breathing: 'Inspira e stabilizza prima di scendere; espira tornando in alto.',
    feel: 'Posteriori della coscia e glutei, con schiena stabile.',
    mistakes: ['Trasformarlo in uno squat', 'Allontanare il bilanciere dalle gambe', 'Cercare di toccare il pavimento a tutti i costi'],
    alternative: 'RDL con due manubri.',
    safety: 'Il movimento viene dalle anche; fermati appena perdi la posizione neutra della schiena.'
  },
  'incline-db': {
    equipment: 'Panca regolabile inclinata circa 30° e due manubri.',
    setup: 'Piedi a terra, scapole appoggiate e manubri ai lati del petto.',
    steps: ['Spingi i manubri verso l’alto e leggermente verso il centro.', 'Fermati senza sbatterli tra loro.', 'Riportali lentamente ai lati del petto.'],
    breathing: 'Inspira in discesa; espira durante la spinta.',
    feel: 'Parte alta del petto, tricipiti e spalle anteriori.',
    mistakes: ['Panca troppo verticale', 'Gomiti completamente aperti', 'Inarcare eccessivamente la schiena'],
    alternative: 'Chest press inclinata alla macchina.'
  },
  pulldown: {
    equipment: 'Lat machine con barra larga e cuscinetti per bloccare le cosce.',
    setup: 'Regola i cuscinetti sopra le cosce; presa poco oltre le spalle e busto quasi verticale.',
    steps: ['Abbassa prima le scapole.', 'Tira la barra verso la parte alta del petto portando i gomiti in basso.', 'Risali lentamente fino a distendere le braccia.'],
    breathing: 'Espira tirando; inspira durante il ritorno.',
    feel: 'Dorsali sotto le ascelle e bicipiti.',
    mistakes: ['Tirare dietro la nuca', 'Dondolare all’indietro', 'Lasciare salire le spalle'],
    alternative: 'Pulldown con presa neutra o trazioni assistite.'
  },
  'split-squat': {
    equipment: 'Panca bassa; inizialmente nessun peso, poi due manubri.',
    setup: 'Un piede avanti ben stabile, dorso dell’altro piede sulla panca.',
    steps: ['Scendi verticalmente piegando il ginocchio anteriore.', 'Mantieni il piede davanti completamente a terra.', 'Spingi attraverso la gamba anteriore e risali.'],
    breathing: 'Inspira scendendo; espira salendo.',
    feel: 'Quadricipite e gluteo della gamba davanti.',
    mistakes: ['Posizione troppo stretta', 'Spingere soprattutto con la gamba sulla panca', 'Perdere l’equilibrio per eccesso di peso'],
    alternative: 'Step-up su box basso o affondo statico.'
  },
  'face-pull': {
    equipment: 'Cavo alto con corda.',
    setup: 'Cavo circa all’altezza del viso, presa con pollici verso di te e corpo stabile.',
    steps: ['Tira la corda verso occhi e fronte.', 'Apri le estremità portando le mani ai lati del viso.', 'Ritorna lentamente senza far avanzare le spalle.'],
    breathing: 'Espira tirando; inspira tornando.',
    feel: 'Parte posteriore delle spalle e parte alta della schiena.',
    mistakes: ['Usare un carico che trascina il corpo', 'Tirare verso il petto', 'Alzare le spalle'],
    alternative: 'Reverse fly alla macchina.'
  },
  shrug: {
    equipment: 'Due manubri.',
    setup: 'Pesi ai lati, braccia distese e testa neutra.',
    steps: ['Solleva le spalle verticalmente verso le orecchie.', 'Mantieni un istante senza muovere il collo.', 'Abbassa lentamente fino alla posizione iniziale.'],
    breathing: 'Espira salendo; inspira scendendo.',
    feel: 'Trapezi nella parte alta della schiena.',
    mistakes: ['Ruotare le spalle in cerchio', 'Piegare i gomiti', 'Spingere la testa in avanti'],
    alternative: 'Shrug alla macchina o con bilanciere.'
  },
  'dead-hang': {
    equipment: 'Sbarra per trazioni sufficientemente alta.',
    setup: 'Afferra la sbarra poco oltre le spalle; usa un rialzo per arrivarci senza saltare.',
    steps: ['Stacca i piedi e lascia le braccia distese.', 'Mantieni una presa attiva e il corpo tranquillo.', 'Torna sul rialzo prima che la presa ceda.'],
    breathing: 'Respira lentamente e regolarmente.',
    feel: 'Presa, avambracci e leggero allungamento della parte alta.',
    mistakes: ['Oscillare', 'Saltare giù dalla sbarra', 'Restare appeso oltre il controllo della presa'],
    alternative: 'Tenuta isometrica di due manubri pesanti.'
  },
  'neck-lateral': {
    equipment: 'Solo la mano; dal mese 2 eventualmente una banda leggerissima.',
    setup: 'Testa neutra e mano appoggiata sopra l’orecchio.',
    steps: ['Spingi delicatamente la testa verso la mano.', 'La mano impedisce ogni movimento.', 'Mantieni e ripeti dall’altro lato.'],
    breathing: 'Respira normalmente.',
    feel: 'Tensione lieve sul lato del collo.',
    mistakes: ['Piegare davvero il collo', 'Usare resistenza forte', 'Trattenere il respiro'],
    alternative: 'Ometti il lavoro diretto del collo.',
    safety: 'Nessun dolore o vertigine è accettabile.'
  },
  'leg-press': {
    equipment: 'Leg press inclinata o orizzontale con sedile e pedana.',
    setup: 'Schiena e bacino aderenti al sedile, piedi sulla pedana poco oltre le anche.',
    steps: ['Sblocca i fermi con le gambe quasi distese ma non rigide.', 'Piega le ginocchia finché il bacino resta appoggiato.', 'Spingi tutta la pedana e torna su senza bloccare violentemente le ginocchia.'],
    breathing: 'Inspira scendendo; espira spingendo.',
    feel: 'Quadricipiti e glutei.',
    mistakes: ['Bacino che si stacca dal sedile', 'Ginocchia che collassano dentro', 'Profondità eccessiva o rimbalzo'],
    alternative: 'Goblet squat o hack squat machine.',
    safety: 'Controlla dove sono le leve di sicurezza prima di iniziare.'
  },
  pushdown: {
    equipment: 'Cavo alto con corda o barra corta.',
    setup: 'Gomiti aderenti ai fianchi, busto stabile e avambracci piegati.',
    steps: ['Spingi la corda verso il basso muovendo solo gli avambracci.', 'Distendi i gomiti e separa leggermente la corda.', 'Torna con controllo senza far avanzare i gomiti.'],
    breathing: 'Espira spingendo; inspira tornando.',
    feel: 'Parte posteriore delle braccia, i tricipiti.',
    mistakes: ['Usare tutto il corpo', 'Aprire i gomiti', 'Lasciare risalire il peso di colpo'],
    alternative: 'Triceps extension alla macchina.'
  },
  neck: {
    equipment: 'Mese 1: mano. Dal mese 2: banda molto leggera.',
    setup: 'Collo neutro, banda stabile e movimento minimo e lento.',
    steps: ['Crea una resistenza molto leggera.', 'Muovi lentamente solo nell’ampiezza completamente comoda.', 'Ritorna con controllo e ripeti nelle direzioni previste.'],
    breathing: 'Respira normalmente.',
    feel: 'Lavoro leggero e controllato, mai pressione o dolore.',
    mistakes: ['Banda troppo dura', 'Movimenti rapidi', 'Ampiezza forzata'],
    alternative: 'Isometrie contro la mano o nessun lavoro diretto.',
    safety: 'Se hai avuto problemi cervicali, chiedi prima indicazioni a un professionista sanitario.'
  }
};

export function workoutTypeForDate(date: Date): WorkoutType | null {
  const day = date.getDay();
  return day === 2 ? 'A' : day === 4 ? 'B' : day === 6 ? 'C' : null;
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function monthNumber(startDate: string, date: string) {
  const start = parseLocalDate(startDate);
  const target = parseLocalDate(date);
  const weeks = Math.max(0, Math.floor((target.getTime() - start.getTime()) / 604800000));
  return Math.min(5, Math.floor(weeks / 4) + 1);
}

export function programEnd(startDate: string) {
  const end = parseLocalDate(startDate);
  end.setMonth(end.getMonth() + 5);
  return end;
}

export function schedule(startDate: string) {
  const start = parseLocalDate(startDate);
  const end = programEnd(startDate);
  const days: { date: string; type: WorkoutType }[] = [];
  for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
    const type = workoutTypeForDate(cursor);
    if (type) days.push({ date: dateKey(cursor), type });
  }
  return days;
}
