/** Oltre questa misura il file pesa e basta: per leggere un documento avanza. */
export const LATO_MASSIMO = 2400;

/** Una pagina del documento, già letta e pronta da disegnare. */
export interface Pagina {
  /** Serve a dare un nome ai file scaricati: «patente-1.jpg» */
  nome: string;
  immagine: ImageBitmap;
}
