import { LATO_MASSIMO, Pagina } from '../pagina';

/** Il PDF protetto da password: lo diciamo con parole chiare */
export class PdfProtetto extends Error {}

/** Ogni pagina del PDF diventa un'immagine, alla risoluzione che serve per leggerla bene. */
export async function leggiPdf(
  file: File,
  nome: string,
  avanzamento: (testo: string) => void,
): Promise<Pagina[]> {
  // pdf.js è grande: si carica solo quando arriva il primo PDF
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

  const documento = await pdfjs
    .getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false })
    .promise.catch((errore) => {
      throw errore?.name === 'PasswordException' ? new PdfProtetto() : errore;
    });

  const pagine: Pagina[] = [];
  for (let numero = 1; numero <= documento.numPages; numero++) {
    avanzamento(`Leggo «${file.name}»: pagina ${numero} di ${documento.numPages}…`);
    const pagina = await documento.getPage(numero);
    const misura = pagina.getViewport({ scale: 1 });
    const scala = LATO_MASSIMO / Math.max(misura.width, misura.height);
    const vista = pagina.getViewport({ scale: scala });

    const foglio = document.createElement('canvas');
    foglio.width = Math.round(vista.width);
    foglio.height = Math.round(vista.height);
    await pagina.render({ canvas: foglio, viewport: vista }).promise;

    const suffisso = documento.numPages > 1 ? `-${numero}` : '';
    pagine.push({ nome: `${nome}${suffisso}`, immagine: await createImageBitmap(foglio) });
  }
  await documento.destroy();
  return pagine;
}
