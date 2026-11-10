import { LATO_MASSIMO, Pagina, creaPagina } from '../pagina';
import { leggiHeic } from './leggi-heic';
import { leggiPdf } from './leggi-pdf';

type Formato = 'immagine' | 'heic' | 'pdf';

/** Il formato dal tipo del file, o dall'estensione quando il browser non lo sa (succede con HEIC). */
export function formato(file: File): Formato | null {
  const estensione = file.name.split('.').pop()?.toLowerCase();
  if (file.type === 'image/jpeg' || file.type === 'image/png') return 'immagine';
  if (file.type === 'application/pdf' || estensione === 'pdf') return 'pdf';
  if (/^image\/hei[cf]$/.test(file.type) || estensione === 'heic' || estensione === 'heif')
    return 'heic';
  return null;
}

/**
 * Le pagine di un file. `avanzamento` riceve a che punto è la lettura, per i PDF lunghi.
 * Tutto succede qui, nel browser: il file non va da nessuna parte.
 */
export async function leggiFile(
  file: File,
  avanzamento: (testo: string) => void,
): Promise<Pagina[]> {
  const nome = file.name.replace(/\.[^.]+$/, '');
  switch (formato(file)) {
    case 'immagine':
      // La foto viene girata nel verso giusto, come la mostra il telefono
      return [await creaPagina(inFoglio(await createImageBitmap(file)), nome, nome)];
    case 'heic':
      return [await creaPagina(inFoglio(await leggiHeic(file)), nome, nome)];
    case 'pdf':
      return leggiPdf(file, nome, avanzamento);
    default:
      throw new Error('formato');
  }
}

/** La foto su un foglio, entro LATO_MASSIMO se serve */
function inFoglio(immagine: ImageBitmap): HTMLCanvasElement {
  const scala = Math.min(1, LATO_MASSIMO / Math.max(immagine.width, immagine.height));
  const foglio = document.createElement('canvas');
  foglio.width = Math.round(immagine.width * scala);
  foglio.height = Math.round(immagine.height * scala);
  const disegno = foglio.getContext('2d')!;
  // Le parti trasparenti di un PNG diventano bianche: nel JPEG sarebbero nere
  disegno.fillStyle = '#fff';
  disegno.fillRect(0, 0, foglio.width, foglio.height);
  disegno.imageSmoothingQuality = 'high';
  disegno.drawImage(immagine, 0, 0, foglio.width, foglio.height);
  immagine.close();
  return foglio;
}
