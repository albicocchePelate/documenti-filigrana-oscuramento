import { Pagina } from '../pagina';

const FONT = '"DM Sans Variable", system-ui, sans-serif';

/** Il font del sito va caricato prima di disegnare, altrimenti il canvas usa quello di sistema. */
export const fontPronto = document.fonts.load(`600 16px ${FONT}`).catch(() => []);

/** Cosa scrivere e quanto si vede: da 0 (invisibile) a 1 (pieno) */
export interface ImpostazioniFiligrana {
  testo: string;
  visibilita: number;
}

/** «Solo per affitto via Roma 10 · 12/11/2026»: la scritta scelta, poi la data */
export function testoFiligrana(scritta: string, data: string): string {
  const giorno = data ? new Date(`${data}T12:00`).toLocaleDateString('it-IT') : '';
  return [scritta.trim(), giorno].filter(Boolean).join(' · ');
}

/** Disegna sul foglio la pagina e, sopra, la filigrana. */
export function disegnaPagina(
  foglio: HTMLCanvasElement,
  pagina: Pagina,
  filigrana: ImpostazioniFiligrana,
): void {
  foglio.width = pagina.immagine.width;
  foglio.height = pagina.immagine.height;
  const disegno = foglio.getContext('2d')!;
  disegno.drawImage(pagina.immagine, 0, 0);
  disegnaFiligrana(disegno, foglio.width, foglio.height, filigrana);
}

// Il testo si ripete in diagonale su tutta la pagina: tagliarlo via è impossibile.
function disegnaFiligrana(
  disegno: CanvasRenderingContext2D,
  larghezza: number,
  altezza: number,
  { testo, visibilita }: ImpostazioniFiligrana,
): void {
  const corpo = Math.max(14, Math.round(Math.min(larghezza, altezza) / 24));
  const diagonale = Math.hypot(larghezza, altezza);

  disegno.save();
  disegno.font = `600 ${corpo}px ${FONT}`;
  disegno.textBaseline = 'middle';
  // Grigio semitrasparente con un bordo chiaro: si legge sia sui fogli bianchi sia sulle foto scure
  disegno.fillStyle = `rgba(60, 60, 60, ${visibilita})`;
  disegno.strokeStyle = `rgba(255, 255, 255, ${visibilita})`;
  disegno.lineWidth = Math.max(1, corpo / 12);
  disegno.translate(larghezza / 2, altezza / 2);
  disegno.rotate(-Math.PI / 6);

  const passoX = disegno.measureText(testo).width + corpo * 3;
  const passoY = corpo * 3.5;
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
