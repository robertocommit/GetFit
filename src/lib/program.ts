import type { Exercise, ExerciseGuide, WorkoutType } from './types';

export const workouts: Record<WorkoutType, { title: string; focus: string; cardio: string; exercises: Exercise[] }> = {
  A: {
    title: 'Forza di base',
    focus: 'Squat · petto · schiena · presa',
    cardio: '15–20 min · camminata inclinata o cyclette',
    exercises: [
      { id: 'squat', name: 'Squat', sets: 4, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 50, prescription: { fromDate: '2026-10-13', weight: 50 }, unit: 'kg', increment: 5 },
      { id: 'bench', name: 'Bench press', sets: 4, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 50, prescription: { fromDate: '2026-10-13', weight: 50 }, unit: 'kg', increment: 2.5 },
      { id: 'row', name: 'Seated cable row', sets: 4, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5, note: 'Usa lo scatto minimo della macchina.' },
      { id: 'lateral', name: 'Lateral raises', sets: 3, reps: '12–15', minReps: 12, maxReps: 15, startWeight: 5, unit: 'kg/mano', increment: 1 },
      { id: 'curl', name: 'Dumbbell curl', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 8, unit: 'kg/mano', increment: 1 },
      { id: 'carry', name: 'Farmer carry', sets: 4, reps: '1 andata e ritorno', startWeight: 20, prescription: { fromDate: '2026-10-13', weight: 20 }, unit: 'kg/mano', increment: 2, tracking: 'carry', note: 'Ogni giro è una singola andata e ritorno. Il carico è facoltativo.' },
      { id: 'dead-bug', name: 'Dead bug', sets: 2, reps: '30 sec', minReps: 30, startWeight: null, unit: 'sec', increment: null, tracking: 'timed', note: 'Alterna lentamente braccio e gamba opposti mantenendo la zona lombare appoggiata.' },
      { id: 'neck-iso', name: 'Neck isometrics', sets: 2, reps: '20–30 sec/direzione', startWeight: null, unit: 'sec', increment: null, tracking: 'timed', note: 'Solo pressione delicata contro la mano nel mese 1.' }
    ]
  },
  B: {
    title: 'Catena posteriore',
    focus: 'Dorsali · anche · unilateralità',
    cardio: 'Cardio facoltativo, ritmo facile',
    exercises: [
      { id: 'rdl', name: 'Romanian deadlift', sets: 4, reps: '8–10', minReps: 8, maxReps: 10, startWeight: 50, prescription: { fromDate: '2026-10-13', weight: 50 }, unit: 'kg', increment: 5 },
      { id: 'incline-db', name: 'Incline dumbbell press', sets: 4, reps: '8–12', minReps: 8, maxReps: 12, startWeight: 12, unit: 'kg/mano', increment: 2 },
      { id: 'pulldown', name: 'Lat pulldown', sets: 4, reps: '8–12', minReps: 8, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'split-squat', name: 'Bulgarian split squat', sets: 3, reps: '8–10/gamba', minReps: 8, maxReps: 10, startWeight: 0, unit: 'kg/mano', increment: 2, note: 'Inizia a corpo libero; aggiungi peso solo con controllo.' },
      { id: 'face-pull', name: 'Face pull', sets: 3, reps: '12–15', minReps: 12, maxReps: 15, startWeight: 15, unit: 'kg', increment: 5 },
      { id: 'shrug', name: 'Shrug con manubri', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 16, unit: 'kg/mano', increment: 2 },
      { id: 'dead-hang', name: 'Dead hang', sets: 3, reps: '20–40 sec', startWeight: null, unit: 'sec', increment: null, tracking: 'timed' },
      { id: 'pallof-hold', name: 'Pallof hold', sets: 2, reps: '20 sec/lato', minReps: 20, startWeight: null, unit: 'sec', increment: null, tracking: 'timed', note: 'Resisti alla rotazione con un cavo o una banda leggera; completa entrambi i lati in ogni tenuta.' },
      { id: 'neck-lateral', name: 'Neck lateral isometric', sets: 2, reps: '20 sec/lato', startWeight: null, unit: 'sec', increment: null, tracking: 'timed' }
    ]
  },
  C: {
    title: 'Volume & capacità',
    focus: 'Ipertrofia · presa · condizionamento',
    cardio: '20–25 min · intensità facile',
    exercises: [
      { id: 'leg-press', name: 'Leg press', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 100, unit: 'kg', increment: 10 },
      { id: 'bench', name: 'Bench press', sets: 4, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 50, prescription: { fromDate: '2026-10-13', weight: 50 }, unit: 'kg', increment: 2.5 },
      { id: 'row', name: 'Seated cable row', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'pulldown', name: 'Lat pulldown', sets: 3, reps: '10–12', minReps: 10, maxReps: 12, startWeight: 35, unit: 'kg', increment: 5 },
      { id: 'lateral', name: 'Lateral raises', sets: 4, reps: '12–20', minReps: 12, maxReps: 20, startWeight: 5, unit: 'kg/mano', increment: 1 },
      { id: 'pushdown', name: 'Triceps pushdown', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: null, unit: 'kg', increment: 5, note: 'Scegli un peso facile/moderato.' },
      { id: 'curl', name: 'Dumbbell curl', sets: 3, reps: '10–15', minReps: 10, maxReps: 15, startWeight: 8, unit: 'kg/mano', increment: 1 },
      { id: 'carry', name: 'Farmer carry', sets: 4, reps: '1 andata e ritorno', startWeight: 20, prescription: { fromDate: '2026-10-13', weight: 20 }, unit: 'kg/mano', increment: 2, tracking: 'carry', note: 'Ogni giro è una singola andata e ritorno. Il carico è facoltativo.' },
      { id: 'side-plank', name: 'Side plank', sets: 2, reps: '20 sec/lato', minReps: 20, startWeight: null, unit: 'sec', increment: null, tracking: 'timed', note: 'Completa entrambi i lati in ogni tenuta mantenendo bacino e spalle allineati.' },
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
    benefit: 'Alleni soprattutto quadricipiti e glutei, mentre il tronco mantiene stabile il carico.',
    longTermBenefit: 'Costruisci forza nelle gambe utile per alzarti da una sedia, salire le scale e sollevare oggetti da una posizione bassa. Con continuità e progressione contribuisci a mantenere massa muscolare negli anni.',
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
    benefit: 'Sviluppi petto, tricipiti e spalle anteriori attraverso una spinta orizzontale.',
    longTermBenefit: 'Costruisci forza per spingere oggetti e sostenerti sulle braccia, oltre a sviluppare la muscolatura del petto e delle braccia.',
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
    benefit: 'Rinforzi dorsali, muscoli tra le scapole e bicipiti con una tirata orizzontale.',
    longTermBenefit: 'Sviluppi la capacità di tirare oggetti verso di te e controllare le scapole sotto carico, utile anche negli altri esercizi per la parte superiore del corpo.',
    equipment: 'Pulley basso con seduta, appoggi per i piedi e maniglia stretta o neutra.',
    setup: 'Piedi sugli appoggi, ginocchia morbide, busto alto e braccia distese.',
    steps: ['Inizia portando le scapole leggermente indietro.', 'Tira la maniglia verso l’ombelico mantenendo i gomiti vicini.', 'Fermati un istante, poi distendi lentamente le braccia.'],
    breathing: 'Espira mentre tiri; inspira nel ritorno controllato.',
    feel: 'Centro della schiena, dorsali e bicipiti.',
    mistakes: ['Dondolare molto con il busto', 'Alzare le spalle', 'Lasciare tornare il peso di colpo'],
    alternative: 'Rematore con manubrio appoggiando una mano alla panca.'
  },
  lateral: {
    benefit: 'Lavori soprattutto sulla parte laterale dei deltoidi, che solleva le braccia ai lati.',
    longTermBenefit: 'Sviluppi volume nelle spalle e forza nel sollevare le braccia lateralmente, un movimento poco allenato dalle sole spinte per il petto.',
    equipment: 'Due manubri leggeri.',
    setup: 'In piedi, addome attivo, gomiti appena piegati e manubri ai lati.',
    steps: ['Solleva le braccia lateralmente guidando il movimento con i gomiti.', 'Fermati circa all’altezza delle spalle.', 'Scendi lentamente senza far sbattere i manubri.'],
    breathing: 'Espira salendo; inspira scendendo.',
    feel: 'Lato delle spalle, non il collo.',
    mistakes: ['Usare slancio', 'Stringere le spalle verso le orecchie', 'Scegliere un peso troppo alto'],
    alternative: 'Alzate laterali al cavo, un braccio alla volta.'
  },
  curl: {
    benefit: 'Rinforzi i muscoli che piegano il gomito, in particolare bicipiti e brachiale.',
    longTermBenefit: 'Costruisci forza per sollevare e tenere oggetti con il gomito piegato e aggiungi lavoro diretto per la massa delle braccia.',
    equipment: 'Due manubri.',
    setup: 'In piedi, braccia lungo i fianchi e gomiti vicini al busto.',
    steps: ['Piega i gomiti portando i manubri verso le spalle.', 'Mantieni il busto fermo e stringi i bicipiti.', 'Abbassa fino quasi a distendere completamente le braccia.'],
    breathing: 'Espira salendo; inspira scendendo.',
    feel: 'Parte anteriore del braccio.',
    mistakes: ['Oscillare con schiena e anche', 'Portare i gomiti molto avanti', 'Accorciare la discesa'],
    alternative: 'Curl al cavo basso o alla macchina.'
  },
  carry: {
    benefit: 'Alleni insieme presa, avambracci e capacità del tronco di restare stabile mentre cammini con un carico.',
    longTermBenefit: 'Sviluppi forza e resistenza per trasportare borse, valigie e attrezzi mantenendo il controllo del corpo per tutta la distanza.',
    equipment: 'Due manubri o kettlebell dello stesso peso e un corridoio libero.',
    setup: 'Pesi ai lati, petto alto, addome attivo e spalle lontane dalle orecchie.',
    steps: ['Solleva i pesi come in un deadlift, senza curvare la schiena.', 'Cammina con passi naturali e controllati.', 'Fermati, appoggia i pesi piegando anche e ginocchia.'],
    breathing: 'Respira con cicli brevi mantenendo l’addome stabile.',
    feel: 'Presa, addome, parte alta della schiena e gambe.',
    mistakes: ['Inclinarsi su un lato', 'Fare passi troppo lunghi', 'Lasciare cadere i pesi'],
    alternative: 'Suitcase carry con un solo manubrio, alternando i lati.'
  },
  'dead-bug': {
    benefit: 'Alleni il controllo dell’addome mantenendo stabile il tronco mentre braccia e gambe si muovono.',
    longTermBenefit: 'Costruisci coordinazione tra arti, bacino e tronco: una base utile per gestire i movimenti senza perdere subito il controllo della posizione della schiena.',
    image: '/guides/dead-bug.webp',
    equipment: 'Tappetino; non serve alcun carico.',
    setup: 'Sdraiato sulla schiena, anche e ginocchia a 90°, braccia verso il soffitto e zona lombare aderente al tappetino.',
    steps: ['Espira e avvicina delicatamente le costole al bacino.', 'Allunga lentamente un braccio e la gamba opposta senza inarcare la schiena.', 'Ritorna al centro e alterna i lati con controllo.'],
    breathing: 'Espira durante ogni estensione; inspira tornando al centro.',
    feel: 'Addome profondo e controllo del bacino, senza tensione nella zona lombare.',
    mistakes: ['Inarcare la zona lombare', 'Muovere gli arti troppo velocemente', 'Allungare oltre il punto che riesci a controllare'],
    alternative: 'Muovi soltanto le gambe o soltanto le braccia per ridurre la difficoltà.'
  },
  'neck-iso': {
    benefit: 'Alleni i muscoli del collo a produrre una tensione leggera senza muovere la testa.',
    longTermBenefit: 'Con una progressione prudente puoi sviluppare forza isometrica e resistenza nel mantenere la testa stabile.',
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
    benefit: 'Rinforzi glutei e posteriori della coscia e impari a piegarti dalle anche mantenendo il tronco stabile.',
    longTermBenefit: 'Costruisci forza nella catena posteriore, utile per rialzarti da una posizione inclinata e gestire sollevamenti in cui il lavoro parte dalle anche.',
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
    benefit: 'Alleni petto, soprattutto la porzione clavicolare, tricipiti e spalle anteriori con due carichi indipendenti.',
    longTermBenefit: 'Sviluppi forza nelle spinte inclinate e massa nella parte alta del petto, allenando ciascun braccio a controllare il proprio manubrio.',
    equipment: 'Panca regolabile inclinata circa 30° e due manubri.',
    setup: 'Piedi a terra, scapole appoggiate e manubri ai lati del petto.',
    steps: ['Spingi i manubri verso l’alto e leggermente verso il centro.', 'Fermati senza sbatterli tra loro.', 'Riportali lentamente ai lati del petto.'],
    breathing: 'Inspira in discesa; espira durante la spinta.',
    feel: 'Parte alta del petto, tricipiti e spalle anteriori.',
    mistakes: ['Panca troppo verticale', 'Gomiti completamente aperti', 'Inarcare eccessivamente la schiena'],
    alternative: 'Chest press inclinata alla macchina.'
  },
  pulldown: {
    benefit: 'Rinforzi dorsali e flessori del gomito tirando un carico dall’alto verso il petto.',
    longTermBenefit: 'Costruisci forza nella tirata verticale e muscolatura della schiena; è un modo per preparare il lavoro verso le trazioni con una resistenza regolabile.',
    equipment: 'Lat machine con barra larga e cuscinetti per bloccare le cosce.',
    setup: 'Regola i cuscinetti sopra le cosce; presa poco oltre le spalle e busto quasi verticale.',
    steps: ['Abbassa prima le scapole.', 'Tira la barra verso la parte alta del petto portando i gomiti in basso.', 'Risali lentamente fino a distendere le braccia.'],
    breathing: 'Espira tirando; inspira durante il ritorno.',
    feel: 'Dorsali sotto le ascelle e bicipiti.',
    mistakes: ['Tirare dietro la nuca', 'Dondolare all’indietro', 'Lasciare salire le spalle'],
    alternative: 'Pulldown con presa neutra o trazioni assistite.'
  },
  'split-squat': {
    benefit: 'Alleni quadricipiti e glutei una gamba alla volta, insieme al controllo dell’equilibrio.',
    longTermBenefit: 'Sviluppi forza per salire gradini e rialzarti da un affondo. Il lavoro separato permette di allenare entrambe le gambe senza affidare tutto il carico alla più forte.',
    equipment: 'Panca bassa; inizialmente nessun peso, poi due manubri.',
    setup: 'Un piede avanti ben stabile, dorso dell’altro piede sulla panca.',
    steps: ['Scendi verticalmente piegando il ginocchio anteriore.', 'Mantieni il piede davanti completamente a terra.', 'Spingi attraverso la gamba anteriore e risali.'],
    breathing: 'Inspira scendendo; espira salendo.',
    feel: 'Quadricipite e gluteo della gamba davanti.',
    mistakes: ['Posizione troppo stretta', 'Spingere soprattutto con la gamba sulla panca', 'Perdere l’equilibrio per eccesso di peso'],
    alternative: 'Step-up su box basso o affondo statico.'
  },
  'face-pull': {
    benefit: 'Alleni la parte posteriore delle spalle e i muscoli che controllano le scapole, con una componente di rotazione esterna.',
    longTermBenefit: 'Sviluppi forza e controllo nella parte posteriore del cingolo scapolare, completando il lavoro delle spinte per petto e spalle.',
    equipment: 'Cavo alto con corda.',
    setup: 'Cavo circa all’altezza del viso, presa con pollici verso di te e corpo stabile.',
    steps: ['Tira la corda verso occhi e fronte.', 'Apri le estremità portando le mani ai lati del viso.', 'Ritorna lentamente senza far avanzare le spalle.'],
    breathing: 'Espira tirando; inspira tornando.',
    feel: 'Parte posteriore delle spalle e parte alta della schiena.',
    mistakes: ['Usare un carico che trascina il corpo', 'Tirare verso il petto', 'Alzare le spalle'],
    alternative: 'Reverse fly alla macchina.'
  },
  shrug: {
    benefit: 'Rinforzi soprattutto il trapezio superiore, il muscolo che solleva le scapole, e alleni la presa tenendo i manubri.',
    longTermBenefit: 'Con continuità e progressione sviluppi trapezi più forti e voluminosi e maggiore capacità di sollevare le spalle contro resistenza. Questo lavoro completa quello della parte alta della schiena nelle tirate e nei trasporti.',
    equipment: 'Due manubri.',
    setup: 'Pesi ai lati, braccia distese e testa neutra.',
    steps: ['Solleva le spalle verticalmente verso le orecchie.', 'Mantieni un istante senza muovere il collo.', 'Abbassa lentamente fino alla posizione iniziale.'],
    breathing: 'Espira salendo; inspira scendendo.',
    feel: 'Trapezi nella parte alta della schiena.',
    mistakes: ['Ruotare le spalle in cerchio', 'Piegare i gomiti', 'Spingere la testa in avanti'],
    alternative: 'Shrug alla macchina o con bilanciere.'
  },
  'dead-hang': {
    benefit: 'Alleni la presa a sostenere il peso del corpo e la tolleranza alla posizione con le braccia sopra la testa.',
    longTermBenefit: 'Sviluppi resistenza di mani e avambracci utile per restare alla sbarra e preparare le trazioni. La durata va costruita rispettando il comfort delle spalle.',
    equipment: 'Sbarra per trazioni sufficientemente alta.',
    setup: 'Afferra la sbarra poco oltre le spalle; usa un rialzo per arrivarci senza saltare.',
    steps: ['Stacca i piedi e lascia le braccia distese.', 'Mantieni una presa attiva e il corpo tranquillo.', 'Torna sul rialzo prima che la presa ceda.'],
    breathing: 'Respira lentamente e regolarmente.',
    feel: 'Presa, avambracci e leggero allungamento della parte alta.',
    mistakes: ['Oscillare', 'Saltare giù dalla sbarra', 'Restare appeso oltre il controllo della presa'],
    alternative: 'Tenuta isometrica di due manubri pesanti.'
  },
  'pallof-hold': {
    benefit: 'Alleni addome e obliqui a resistere a una forza che cerca di ruotare il busto.',
    longTermBenefit: 'Sviluppi controllo del tronco contro la rotazione, utile quando spingi, tiri o gestisci un carico da un solo lato.',
    image: '/guides/pallof-hold.webp',
    equipment: 'Cavo regolabile o banda elastica fissata all’altezza del petto.',
    setup: 'Mettiti di lato rispetto al punto di ancoraggio, piedi stabili e maniglia tenuta davanti al petto.',
    steps: ['Allontanati finché senti una tensione leggera.', 'Distendi le braccia davanti a te senza lasciare ruotare il busto.', 'Mantieni la posizione, poi cambia lato.'],
    breathing: 'Respira normalmente mantenendo addome e glutei attivi.',
    feel: 'Addome e obliqui che impediscono al tronco di ruotare.',
    mistakes: ['Usare una resistenza che fa ruotare il corpo', 'Inarcare la schiena', 'Trattenere il respiro'],
    alternative: 'Pallof hold in ginocchio con una banda più leggera.'
  },
  'neck-lateral': {
    benefit: 'Alleni i muscoli laterali del collo a resistere a una pressione delicata mantenendo la testa ferma.',
    longTermBenefit: 'Puoi sviluppare forza isometrica e resistenza laterale del collo con un carico controllato. L’obiettivo è mantenere la testa stabile contro una resistenza laterale.',
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
    benefit: 'Alleni quadricipiti e glutei con il tronco sostenuto dalla macchina.',
    longTermBenefit: 'Aggiungi lavoro per forza e massa delle gambe senza dover sostenere un bilanciere sulla schiena, contribuendo alla capacità di spingere con le gambe nelle attività quotidiane.',
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
    benefit: 'Alleni direttamente i tricipiti, che distendono il gomito.',
    longTermBenefit: 'Sviluppi massa nella parte posteriore delle braccia e forza nell’estensione del gomito, che partecipa anche a panca e altre spinte.',
    equipment: 'Cavo alto con corda o barra corta.',
    setup: 'Gomiti aderenti ai fianchi, busto stabile e avambracci piegati.',
    steps: ['Spingi la corda verso il basso muovendo solo gli avambracci.', 'Distendi i gomiti e separa leggermente la corda.', 'Torna con controllo senza far avanzare i gomiti.'],
    breathing: 'Espira spingendo; inspira tornando.',
    feel: 'Parte posteriore delle braccia, i tricipiti.',
    mistakes: ['Usare tutto il corpo', 'Aprire i gomiti', 'Lasciare risalire il peso di colpo'],
    alternative: 'Triceps extension alla macchina.'
  },
  'side-plank': {
    benefit: 'Alleni soprattutto gli obliqui a mantenere il tronco stabile contro la flessione laterale.',
    longTermBenefit: 'Costruisci resistenza nel mantenere bacino e busto allineati, utile quando porti un peso da un lato o lavori in appoggio su un solo braccio.',
    image: '/guides/side-plank.webp',
    equipment: 'Tappetino; non serve alcun carico.',
    setup: 'Avambraccio sotto la spalla, gambe distese e piedi sovrapposti oppure sfalsati.',
    steps: ['Solleva il bacino creando una linea tra testa, spalle, anche e piedi.', 'Mantieni il busto fermo senza ruotare in avanti.', 'Scendi con controllo e ripeti dall’altro lato.'],
    breathing: 'Respira lentamente senza perdere la posizione.',
    feel: 'Obliqui, gluteo laterale e spalla di appoggio.',
    mistakes: ['Lasciare cadere il bacino', 'Spalla compressa verso l’orecchio', 'Ruotare il petto verso il pavimento'],
    alternative: 'Appoggia il ginocchio inferiore a terra mantenendo il bacino sollevato.'
  },
  neck: {
    benefit: 'Pratichi movimenti lenti del collo nell’ampiezza che riesci a controllare comodamente.',
    longTermBenefit: 'Coltivi il controllo del movimento e la mobilità del collo per girare e orientare la testa nelle attività quotidiane. Il beneficio cercato è la qualità del movimento, senza forzare l’ampiezza.',
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
