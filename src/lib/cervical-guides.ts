import type { ExerciseGuide } from './types';
export const cervicalSafety = 'Proposta da approvare con il fisioterapista prima della prima esecuzione. Il benessere soggettivo non dimostra la risoluzione della protrusione o ernia. Usa soltanto resistenza minima, controllabile e indolore; verifica integrità della banda e stabilità dell’ancoraggio. Non usare bande danneggiate, fissaggi improvvisati, resistenze massimali, carichi sulla testa, ponti o neck harness pesanti. Mai elastici attorno alla gola o sul collo anteriore, né vicino a occhi, naso o bocca. Evita ogni possibilità di rimbalzo verso il viso. Respira senza trattenere il fiato e non andare a cedimento. Interrompi per dolore acuto, vertigini, formicolio, dolore irradiato o debolezza. Nuovi sintomi neurologici o sintomi progressivi richiedono valutazione medica. Non progredire se peggiori durante la seduta o nelle ore successive.';
const common = {
  breathing:'Respira normalmente durante ogni contrazione; non trattenere il fiato.',
  feel:'Contrazione lieve, controllata e indolore. Testa neutra e spalle rilassate.',
  alternative:'Se mancano attrezzatura sicura, approvazione o dimostrazione professionale, escludi l’esercizio. Non sostituirlo con resistenza manuale.',
  safety:cervicalSafety,
  requiresDemonstration:true,
  longTermBenefit:'Obiettivo della fase: sviluppare gradualmente resistenza e controllo cervicale. Lavoro dinamico resistito e rotazioni resistite richiedono una valutazione separata.'
};
export const cervicalGuides: Record<string,ExerciseGuide> = {
  'band-neck-flexion': {
    image: '/guides/band-neck-flexion.webp',
    imageAlt: 'Flessione cervicale isometrica: testa neutra e fascia sopra le sopracciglia, elastico ancorato dietro alla stessa altezza, freccia della trazione posteriore.',
    ...common,benefit:'Lavoro isometrico leggero dei flessori cervicali, mantenendo la posizione neutra.',
    equipment:'Banda da fisioterapia molto leggera, ancoraggio stabile e fascia da testa specifica compatibile con il collegamento frontale. La fascia deve distribuire la pressione senza stringere il collo, ostacolare il respiro o scivolare sugli occhi. Senza fascia adatta non eseguire.',
    setup:'Seduto o in piedi con busto eretto. La configurazione deve essere prima dimostrata dal fisioterapista: trazione posteriore sulla parte frontale della fascia, all’altezza della testa, senza componenti oblique o contatto sul viso.',
    steps:['Fai verificare fascia, percorso della banda e ancoraggio; non improvvisare nodi o fissaggi.', 'Mantieni sguardo orizzontale e mento lievemente retratto.', 'Contrasta delicatamente la trazione posteriore senza muovere la testa.', 'Mantieni per i secondi indicati e respira.', 'Riduci gradualmente la tensione e rilassa prima della ripetizione successiva.'],
    mistakes:['Piegare o iperestendere il collo','Sollevare le spalle o trattenere il respiro','Resistenza elevata','Elastico improvvisato sulla fronte o fascia che scivola sugli occhi']
  },
  'band-neck-extension': {
    image: '/guides/band-neck-extension.webp',
    imageAlt: 'Estensione cervicale isometrica: banda dietro il cranio ed estremità tenute avanti dalle mani, sopra gli occhi; la testa resta ferma mentre la trazione è diretta in avanti.',
    ...common,benefit:'Lavoro isometrico leggero degli estensori cervicali, senza iperestensione.',
    equipment:'Elastico molto leggero con appoggio occipitale stabile previsto per l’esercizio; estremità tenute davanti al corpo all’altezza della fronte, sopra gli occhi o ancoraggio stabile secondo la dimostrazione del fisioterapista. Nessun passaggio davanti al viso.',
    setup:'Busto eretto, mento leggermente retratto. Banda dietro l’occipite, con una trazione leggera in avanti. La presa e il percorso devono impedire scivolamenti e rimbalzi verso il viso.',
    steps:['Fai dimostrare e verificare l’appoggio occipitale e la presa delle estremità o l’ancoraggio.', 'Applica una lieve trazione in avanti mantenendo la testa neutra.', 'Contrasta la tensione senza muovere né spingere indietro la testa.', 'Mantieni la contrazione e respira normalmente.', 'Allenta lentamente la banda e rilassa.'],
    mistakes:['Iperestendere il collo','Spingere la testa indietro','Banda che può scivolare o rimbalzare sul viso','Resistenza eccessiva o rilascio brusco']
  },
  'band-neck-lateral': {
    image: '/guides/band-neck-lateral.webp',
    imageAlt: 'Due viste frontali: lato destro con ancoraggio alla sinistra della persona, lato sinistro con ancoraggio alla sua destra. Elastico orizzontale e testa ferma in entrambe le configurazioni.',
    ...common,benefit:'Lavoro isometrico dei flessori laterali cervicali nelle due direzioni, registrate separatamente.',
    equipment:'Banda molto leggera, fascia da testa progettata per collegamenti laterali e ancoraggio stabile regolabile all’altezza della testa. Nessun passaggio sul viso o davanti agli occhi.',
    setup:'Testa e busto allineati, spalle rilassate. “Destra” e “sinistra” nel diario indicano il lato muscolare che contrasta la trazione, non il lato dell’ancoraggio. Le due configurazioni richiedono dimostrazione professionale.',
    steps:['Lato destro: il fisioterapista dispone il collegamento e l’ancoraggio a sinistra per creare una lieve trazione verso sinistra. Contrasta verso destra mantenendo la testa ferma.', 'Mantieni la contrazione per i secondi indicati, respira e rilascia lentamente.', 'Lato sinistro: configura il sistema specularmente, con ancoraggio a destra e trazione verso destra. Contrasta verso sinistra senza inclinare la testa.', 'Completa e registra separatamente serie e ripetizioni per entrambi i lati.', 'In entrambe le configurazioni evita trazioni oblique, rotazioni, pressioni sul viso e qualunque percorso della banda vicino agli occhi.'],
    mistakes:['Inclinare visibilmente la testa','Ruotare il collo o alzare una spalla','Ancoraggio troppo alto o basso con trazione obliqua','Banda davanti agli occhi o pressione sul viso']
  },
  'band-neck-retraction': {
    image: '/guides/band-neck-retraction.webp',
    imageAlt: 'Retrazione cervicale: avambracci alla parete, banda dietro il cranio ed estremità nelle mani. La testa arretra di poco con sguardo orizzontale; le frecce distinguono movimento e trazione.',
    ...common,benefit:'Controllo motorio e rinforzo leggero dei retrattori e stabilizzatori cervicali.',
    equipment:'Banda molto leggera con appoggio occipitale sicuro e parete stabile. Le estremità sono mantenute davanti al corpo e gli avambracci appoggiati alla parete soltanto nella configurazione dimostrata dal fisioterapista.',
    setup:'Configurazione da verificare e dimostrare professionalmente prima dell’attivazione: posizione della banda sull’occipite, presa delle estremità, appoggio degli avambracci e direzione della trazione. Nell’immagine, la freccia arancione indica la trazione della banda verso le mani e quella verde il piccolo arretramento della testa. Le estremità restano ai lati del viso, sopra gli occhi.',
    steps:['Dopo la dimostrazione professionale, posizionati di fronte alla parete con testa neutra.', 'Disponi banda, mani e avambracci esattamente nella configurazione validata, con tensione molto leggera.', 'Porta delicatamente la testa indietro retraendo il mento, senza guardare in alto.', 'Mantieni per i secondi prescritti senza accentuare l’escursione.', 'Ritorna lentamente e rilassa.'],
    mistakes:['Guardare in alto o spingere in iperestensione','Cercare maggiore escursione','Improvvisare il montaggio o usare una banda instabile','Aumentare insieme ripetizioni, durata e resistenza']
  },
  'chin-nod': {
    image: '/guides/chin-nod-v2.webp',
    imageAlt: 'Chin nod supino: testa appoggiata su un asciugamano, ginocchia piegate, piccolo cenno del mento senza sollevare la testa e senza elastico.',
    ...common,requiresDemonstration:false,
    benefit:'Piccolo cenno del mento per controllo e resistenza dei flessori cervicali profondi.',
    equipment:'Tappetino e appoggio confortevole per la testa, senza resistenza esterna. Nessun elastico a novembre.',
    setup:'Supino, ginocchia piegate e testa comodamente appoggiata. Rilassa la mandibola.',
    steps:['Esegui un piccolo cenno di assenso con il mento.', 'Mantieni la testa appoggiata, senza sollevarla o spingerla con forza nel supporto.', 'Mantieni per i secondi indicati respirando normalmente.', 'Rilascia lentamente e ripeti con precisione.'],
    mistakes:['Sollevare la testa','Stringere la mandibola','Fare un movimento ampio o forzato','Aggiungere un elastico'],
    alternative:'Riduci il movimento secondo le indicazioni del fisioterapista oppure escludi l’esercizio.'
  }
};
