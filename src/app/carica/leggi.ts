import { LATO_MASSIMO, Pagina } from '../pagina';
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
      return [{ documento: nome, nome, immagine: await riduci(await createImageBitmap(file)) }];
    case 'heic':
      return [{ documento: nome, nome, immagine: await riduci(await leggiHeic(file)) }];
    case 'pdf':
      return leggiPdf(file, nome, avanzamento);
    default:
      throw new Error('formato');
  }
}

/** Riporta l'immagine entro LATO_MASSIMO, se serve. */
export async function riduci(immagine: ImageBitmap): Promise<ImageBitmap> {
  const scala = Math.min(1, LATO_MASSIMO / Math.max(immagine.width, immagine.height));
  if (scala === 1) return immagine;

  const ridotta = await createImageBitmap(immagine, {
    resizeWidth: Math.round(immagine.width * scala),
    resizeHeight: Math.round(immagine.height * scala),
    resizeQuality: 'high',
  });
  immagine.close();
  return ridotta;
}
