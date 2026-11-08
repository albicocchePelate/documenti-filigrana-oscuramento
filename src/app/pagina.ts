/** Oltre questa misura il file pesa e basta: per leggere un documento avanza. */
export const LATO_MASSIMO = 2400;

/** Una pagina del documento, già letta e pronta da disegnare. */
export interface Pagina {
  /** Il nome del file da cui arriva, senza estensione: «busta-paga» */
  documento: string;
  /** Il nome per l'immagine scaricata: «busta-paga-2» se il documento ha più pagine */
  nome: string;
  immagine: ImageBitmap;
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
