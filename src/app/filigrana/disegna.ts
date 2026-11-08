import { Pagina } from '../pagina';

const FONT = '"DM Sans Variable", system-ui, sans-serif';

/** Il font del sito va caricato prima di disegnare, altrimenti il canvas usa quello di sistema. */
export const fontPronto = document.fonts.load(`600 16px ${FONT}`).catch(() => []);

/** Come appare la filigrana. La visibilità va da 0 (invisibile) a 1 (piena). */
export interface StileFiligrana {
  visibilita: number;
  dimensione: 'piccola' | 'media' | 'grande';
  colore: 'grigio' | 'rosso' | 'blu';
  fittezza: 'rada' | 'normale' | 'fitta';
}

export const STILE_INIZIALE: StileFiligrana = {
  visibilita: 0.38,
  dimensione: 'media',
  colore: 'grigio',
  fittezza: 'normale',
};

/** Se c'è, cosa scrivere, e come */
export interface ImpostazioniFiligrana extends StileFiligrana {
  attiva: boolean;
  testo: string;
}

/** Il lato corto della pagina diviso per questo numero dà l'altezza del testo */
const DIVISORE = { piccola: 34, media: 24, grande: 16 };
const COLORE = { grigio: '60, 60, 60', rosso: '190, 30, 30', blu: '30, 70, 170' };
/** Lo spazio tra una scritta e l'altra, in multipli dell'altezza del testo */
const SPAZIO = { rada: 6, normale: 3.5, fitta: 2.2 };

/** «Solo per affitto via Roma 10 · 12/11/2026»: la scritta scelta, poi la data */
export function testoFiligrana(scritta: string, data: string): string {
  const giorno = data ? new Date(`${data}T12:00`).toLocaleDateString('it-IT') : '';
  return [scritta.trim(), giorno].filter(Boolean).join(' · ');
}

/**
 * Disegna sul foglio la pagina, poi le zone coperte, poi la filigrana sopra a tutto.
 * Sotto le zone il disegno è nero pieno: nel file scaricato quel dato non c'è più.
 */
export function disegnaPagina(
  foglio: HTMLCanvasElement,
  pagina: Pagina,
  filigrana: ImpostazioniFiligrana,
): void {
  foglio.width = pagina.immagine.width;
  foglio.height = pagina.immagine.height;
  const disegno = foglio.getContext('2d')!;
  disegno.drawImage(pagina.immagine, 0, 0);
  disegno.fillStyle = '#000';
  for (const zona of pagina.zone) {
    disegno.fillRect(
      zona.x * foglio.width,
      zona.y * foglio.height,
      zona.larghezza * foglio.width,
      zona.altezza * foglio.height,
    );
  }
  if (filigrana.attiva) disegnaFiligrana(disegno, foglio.width, foglio.height, filigrana);
}

// Il testo si ripete in diagonale su tutta la pagina: tagliarlo via è impossibile.
function disegnaFiligrana(
  disegno: CanvasRenderingContext2D,
  larghezza: number,
  altezza: number,
  { testo, visibilita, dimensione, colore, fittezza }: ImpostazioniFiligrana,
): void {
  const corpo = Math.max(12, Math.round(Math.min(larghezza, altezza) / DIVISORE[dimensione]));
  const diagonale = Math.hypot(larghezza, altezza);

  disegno.save();
  disegno.font = `600 ${corpo}px ${FONT}`;
  disegno.textBaseline = 'middle';
  // Colore semitrasparente con un bordo chiaro: si legge sia sui fogli bianchi sia sulle foto scure
  disegno.fillStyle = `rgba(${COLORE[colore]}, ${visibilita})`;
  disegno.strokeStyle = `rgba(255, 255, 255, ${visibilita})`;
  disegno.lineWidth = Math.max(1, corpo / 12);
  disegno.translate(larghezza / 2, altezza / 2);
  disegno.rotate(-Math.PI / 6);

  const passoX = disegno.measureText(testo).width + corpo * SPAZIO[fittezza];
  const passoY = corpo * SPAZIO[fittezza];
  for (let y = -diagonale / 2, riga = 0; y < diagonale / 2; y += passoY, riga++) {
    // Righe sfalsate, così non restano colonne vuote
    const sfalsamento = (riga % 2) * (passoX / 2);
    for (let x = -diagonale / 2 - sfalsamento; x < diagonale / 2; x += passoX) {
      disegno.strokeText(testo, x, y);
      disegno.fillText(testo, x, y);
    }
  }
  disegno.restore();
}
