# Filigrana e oscuramento per documenti

Prima di mandare la carta d'identità all'agenzia o la busta paga al padrone di casa: ci metti sopra
una scritta con scopo e data, «Solo per affitto via Roma 10 · 12/11/2026», e copri con un
rettangolo nero i dati che non servono. Se la copia finisce altrove, si vede a chi era destinata.

Funziona con JPG, PNG, HEIC e PDF, anche più file insieme. Scarichi PDF o immagini.

## I tuoi file non escono dal computer

Tutto succede nel browser: non c'è un server che riceve i documenti. Non devi fidarti, puoi
controllarlo:

- **Rete**: tasto destro → Ispeziona → Rete, poi usa lo strumento. Non parte nessuna richiesta.
- **Senza internet**: stacca il Wi-Fi, funziona lo stesso.
- **Il blocco**: in cima a [`src/index.html`](src/index.html) la pagina dichiara
  `connect-src 'none'`. Il browser rifiuta qualsiasi invio, anche se il codice ci provasse.
- **Niente salvato**: Ispeziona → Applicazione → Archiviazione è vuota. Chiudi la scheda e i
  documenti spariscono.

Le copie sono rifatte da zero, pagina per pagina: non hanno posizione, telefono, data di scatto,
autore o programma dell'originale. Lo strumento ti fa vedere cosa conteneva ogni file.

## Com'è fatto

Angular, senza server. Ogni cartella di `src/app` ha un compito:

| Cartella     | Cosa fa                                                                         |
| ------------ | ------------------------------------------------------------------------------- |
| `carica`     | legge i file: immagini, HEIC (con libheif), PDF (con pdf.js) pagina per pagina  |
| `filigrana`  | la scritta ripetuta in diagonale; `disegna.ts` disegna la pagina finale         |
| `anteprima`  | le pagine, lo zoom e le zone da coprire                                         |
| `scarica`    | crea PDF e ZIP a mano, senza librerie, e li salva                               |
| `prove`      | la finestra Verifica: richieste di rete, metadati, connessione                  |
| `calendario` | il campo data                                                                   |

Per provarlo sul tuo computer:

```bash
npm install
npm start
```

Lo stile (font, colori, tema chiaro e scuro) arriva da
[codice.albicocchepelate.it](https://codice.albicocchepelate.it/kit/stile.css).
