/** Una pagina pronta per il PDF: l'immagine in JPEG e le sue misure in pixel. */
export interface PaginaJpeg {
  jpeg: Uint8Array;
  larghezza: number;
  altezza: number;
}

/** Larghezza di un foglio A4 in punti PDF: ogni pagina è larga così, l'altezza segue le proporzioni */
const LARGHEZZA_A4 = 595;

/**
 * Un PDF con una pagina per immagine. Il formato PDF sa contenere un JPEG così com'è,
 * quindi basta descrivere le pagine e metterci dentro i file.
 * Niente titolo, autore o programma: il PDF non dice niente di te.
 */
export function creaPdf(pagine: PaginaJpeg[]): Blob {
  const pezzi: Uint8Array[] = [];
  const posizioni: number[] = [];
  let lunghezza = 0;
  const scrivi = (pezzo: string | Uint8Array) => {
    const byte = typeof pezzo === 'string' ? new TextEncoder().encode(pezzo) : pezzo;
    pezzi.push(byte);
    lunghezza += byte.length;
  };
  const oggetto = (numero: number, contenuto: string) => {
    posizioni[numero] = lunghezza;
    scrivi(`${numero} 0 obj\n${contenuto}\nendobj\n`);
  };

  // Gli oggetti: 1 il documento, 2 l'elenco delle pagine, poi tre per pagina (pagina, disegno, immagine)
  const primoDi = (i: number) => 3 + i * 3;
  scrivi('%PDF-1.4\n');
  oggetto(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const figli = pagine.map((_, i) => `${primoDi(i)} 0 R`).join(' ');
  oggetto(2, `<< /Type /Pages /Kids [${figli}] /Count ${pagine.length} >>`);

  pagine.forEach((pagina, i) => {
    const [numeroPagina, numeroDisegno, numeroImmagine] = [0, 1, 2].map((n) => primoDi(i) + n);
    const larghezza = LARGHEZZA_A4;
    const altezza = Math.round((LARGHEZZA_A4 * pagina.altezza) / pagina.larghezza);

    oggetto(
      numeroPagina,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${larghezza} ${altezza}] ` +
        `/Resources << /XObject << /Foto ${numeroImmagine} 0 R >> >> /Contents ${numeroDisegno} 0 R >>`,
    );
    // Il disegno della pagina: l'immagine stesa su tutto il foglio
    const disegno = `q ${larghezza} 0 0 ${altezza} 0 0 cm /Foto Do Q`;
    oggetto(numeroDisegno, `<< /Length ${disegno.length} >>\nstream\n${disegno}\nendstream`);

    posizioni[numeroImmagine] = lunghezza;
    scrivi(
      `${numeroImmagine} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pagina.larghezza} ` +
        `/Height ${pagina.altezza} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${pagina.jpeg.length} >>\nstream\n`,
    );
    scrivi(pagina.jpeg);
    scrivi('\nendstream\nendobj\n');
  });

  // L'indice finale: dove inizia ogni oggetto, in byte
  const inizioIndice = lunghezza;
  const totale = posizioni.length;
  scrivi(`xref\n0 ${totale}\n0000000000 65535 f \n`);
  for (let numero = 1; numero < totale; numero++)
    scrivi(`${String(posizioni[numero]).padStart(10, '0')} 00000 n \n`);
  scrivi(`trailer\n<< /Size ${totale} /Root 1 0 R >>\nstartxref\n${inizioIndice}\n%%EOF\n`);

  return new Blob(pezzi as BlobPart[], { type: 'application/pdf' });
}
