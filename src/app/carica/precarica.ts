/**
 * Le librerie grandi (PDF, HEIC, dati delle foto) arrivano subito dopo la pagina, in sottofondo.
 * Così, staccata la connessione, lo strumento legge ancora tutto.
 */
export function precarica(): void {
  Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs'),
    import('libheif-js/libheif-wasm/libheif-bundle.mjs'),
    import('exifr'),
  ]).catch(() => {});
}
