/** Oltre questa misura il file pesa e basta: per leggere un documento avanza. */
export const LATO_MASSIMO = 2400;

/** Una pagina del documento, già letta e pronta da disegnare. */
export interface Pagina {
  /** Il nome del file da cui arriva, senza estensione: «busta-paga» */
  documento: string;
  /** Il nome per l'immagine scaricata: «busta-paga-2» se il documento ha più pagine */
  nome: string;
  immagine: ImageBitmap;
}
