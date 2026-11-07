/** Una pagina del documento, già letta e pronta da disegnare. */
export interface Pagina {
  /** Serve a dare un nome ai file scaricati: «patente-1.jpg» */
  nome: string;
  immagine: ImageBitmap;
}
