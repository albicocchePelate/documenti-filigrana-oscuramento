/** Oltre questa misura il file pesa e basta: per leggere un documento avanza. */
export const LATO_MASSIMO = 2400;

/** Le miniature si disegnano larghe 72 px: il doppio resta nitido sugli schermi densi */
const LARGHEZZA_MINIATURA = 144;

/**
 * Una pagina del documento, già letta. Aperte tutte insieme, decine di pagine finirebbero la
 * memoria del telefono: si tiene compressa e si apre solo quando serve, con apriPagina.
 */
export interface Pagina {
  /** Il nome del file da cui arriva, senza estensione: «busta-paga» */
  documento: string;
  /** Il nome per l'immagine scaricata: «busta-paga-2» se il documento ha più pagine */
  nome: string;
  /** La pagina a piena risoluzione, in PNG: compressa senza perdere nulla */
  file: Blob;
  larghezza: number;
  altezza: number;
  /** Piccola e sempre pronta, per riconoscerla */
  miniatura: ImageBitmap;
  /** I rettangoli neri che coprono i dati da nascondere */
  zone: Zona[];
}

/** Un rettangolo sulla pagina, in frazioni della sua misura (da 0 a 1): vale a qualsiasi grandezza */
export interface Zona {
  x: number;
  y: number;
  larghezza: number;
  altezza: number;
}

/** Dal foglio disegnato alla pagina da tenere. Il foglio poi viene svuotato. */
export async function creaPagina(
  foglio: HTMLCanvasElement,
  documento: string,
  nome: string,
): Promise<Pagina> {
  const file = await new Promise<Blob>((pronto, errore) =>
    foglio.toBlob((blob) => (blob ? pronto(blob) : errore(new Error('png'))), 'image/png'),
  );
  const miniatura = await createImageBitmap(foglio, {
    resizeWidth: LARGHEZZA_MINIATURA,
    resizeHeight: Math.max(1, Math.round((LARGHEZZA_MINIATURA * foglio.height) / foglio.width)),
    resizeQuality: 'medium',
  });
  const pagina = { documento, nome, file, larghezza: foglio.width, altezza: foglio.height };
  liberaFoglio(foglio);
  return { ...pagina, miniatura, zone: [] };
}

/** La pagina a piena risoluzione. Chi la apre la chiude con close() quando ha finito. */
export function apriPagina(pagina: Pagina): Promise<ImageBitmap> {
  return createImageBitmap(pagina.file);
}

/** Safari tiene la memoria del canvas finché non lo si svuota: con tante pagine finisce */
export function liberaFoglio(foglio: HTMLCanvasElement): void {
  foglio.width = 0;
  foglio.height = 0;
}
