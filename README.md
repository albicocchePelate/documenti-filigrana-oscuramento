# Filigrana e oscuramento per documenti

Strumento per preparare una copia di un documento prima di inviarla: carta d'identità, patente,
busta paga, contratto. Sulla copia si aggiunge una filigrana con scopo e data, per esempio «Solo
per affitto via Roma 10 · 12/11/2026», e si coprono i dati che non servono. Se la copia viene
usata per altro, la scritta lo rende evidente.

## Cosa fa

- Legge JPG, PNG, HEIC e PDF, anche più file insieme. I PDF vengono aperti pagina per pagina.
- Filigrana ripetuta in diagonale su tutta la pagina: scritta, data, visibilità, dimensione,
  colore e fittezza si possono scegliere. Si può anche toglierla e usare solo l'oscuramento.
- Zone nere da disegnare sopra i dati da nascondere, con lo zoom per essere precisi.
- Pagine da togliere, documenti da tenere separati o da unire in un unico file, nell'ordine scelto.
- Copie in PDF o in immagini JPG, con il nome che si vuole.

## Privacy

Tutto avviene nel browser, sul computer di chi lo usa. I documenti non vengono caricati da nessuna
parte e non restano salvati: chiudendo la pagina spariscono.

Si può verificare in diversi modi, descritti anche nella finestra «Verifica» dello strumento:

- funziona senza connessione a internet;
- negli strumenti per sviluppatori del browser, alla voce Rete, compaiono solo i file dello
  strumento che arrivano: niente esce con i documenti o con i loro dati;
- la pagina chiede al browser di rifiutare i collegamenti aperti dal codice per spedire dati,
  anche da parte delle librerie usate (`connect-src 'none'`, in cima a
  [`src/index.html`](src/index.html)).

Le copie sono ridisegnate da zero e non contengono i dati nascosti dell'originale: posizione,
dispositivo, data di scatto, autore, programma usato. Lo strumento mostra quali dati aveva ogni
file prima di toglierli.

## Limiti

- Il testo delle copie in PDF non si può selezionare o cercare: ogni pagina diventa un'immagine.
  È voluto, così sotto le zone nere non resta niente.
- I PDF protetti da password non si aprono.
- Le pagine diventano immagini di al massimo 2400 pixel per lato, circa 200 dpi su un A4: si legge
  bene, ma le scritte minute dei fogli grandi perdono definizione.
- Nelle copie in PDF ogni pagina è larga come un A4, qualunque fosse la misura dell'originale.
- Le pagine non si ruotano e, dentro un documento, non si cambiano di ordine.

Realizzato con il supporto di AI.
