import { ImpostazioniFiligrana, disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina, apriPagina, liberaFoglio } from '../pagina';
import { creaPdf } from './crea-pdf';
import { creaZip } from './crea-zip';

/** Le pagine raggruppate per documento, nell'ordine in cui compaiono */
export function perDocumento(pagine: Pagina[]): Pagina[][] {
  const gruppi = new Map<string, Pagina[]>();
  for (const pagina of pagine) {
    gruppi.set(pagina.documento, [...(gruppi.get(pagina.documento) ?? []), pagina]);
  }
  return [...gruppi.values()];
}

/** Un PDF con queste pagine. `nome` è il nome del file senza estensione. */
export async function filePdf(
  pagine: Pagina[],
  filigrana: ImpostazioniFiligrana,
  nome: string,
): Promise<File> {
  const pronte = [];
  for (const pagina of pagine) {
    pronte.push({
      jpeg: await inJpeg(pagina, filigrana),
      larghezza: pagina.larghezza,
      altezza: pagina.altezza,
    });
  }
  return new File([creaPdf(pronte)], `${nome}.pdf`, { type: 'application/pdf' });
}

/** Le immagini: una sola così com'è, più d'una in uno ZIP («nome-1.jpg», «nome-2.jpg»…) */
export async function fileImmagini(
  pagine: Pagina[],
  filigrana: ImpostazioniFiligrana,
  nome: string,
): Promise<File> {
  if (pagine.length === 1) {
    const jpeg = await inJpeg(pagine[0], filigrana);
    return new File([jpeg as BlobPart], `${nome}.jpg`, { type: 'image/jpeg' });
  }
  const immagini = [];
  for (const [i, pagina] of pagine.entries()) {
    immagini.push({ nome: `${nome}-${i + 1}.jpg`, contenuto: await inJpeg(pagina, filigrana) });
  }
  return new File([creaZip(immagini)], `${nome}.zip`, { type: 'application/zip' });
}

/**
 * La pagina con la filigrana, in JPEG. Il JPEG rifatto da zero non porta con sé metadati.
 * Si apre una pagina alla volta e la si chiude subito: anche i documenti lunghi stanno in memoria.
 */
async function inJpeg(pagina: Pagina, filigrana: ImpostazioniFiligrana): Promise<Uint8Array> {
  await fontPronto;
  const immagine = await apriPagina(pagina);
  const foglio = document.createElement('canvas');
  disegnaPagina(foglio, immagine, pagina.zone, filigrana);
  immagine.close();
  const jpeg = await new Promise<Blob>((pronta, errore) =>
    foglio.toBlob((blob) => (blob ? pronta(blob) : errore()), 'image/jpeg', 0.9),
  );
  liberaFoglio(foglio);
  return new Uint8Array(await jpeg.arrayBuffer());
}

/** Nella cartella Download */
export function salva(file: File): void {
  const collegamento = document.createElement('a');
  collegamento.href = URL.createObjectURL(file);
  collegamento.download = file.name;
  collegamento.click();
  setTimeout(() => URL.revokeObjectURL(collegamento.href), 1000);
}
