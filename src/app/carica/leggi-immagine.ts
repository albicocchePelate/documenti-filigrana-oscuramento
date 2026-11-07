import { Pagina } from '../pagina';

/** Oltre questa misura il file pesa e basta: per leggere un documento avanza. */
const LATO_MASSIMO = 2400;

const FORMATI = ['image/jpeg', 'image/png'];

export function formatoLeggibile(file: File): boolean {
  return FORMATI.includes(file.type);
}

export async function leggiImmagine(file: File): Promise<Pagina> {
  const nome = file.name.replace(/\.[^.]+$/, '');
  // La foto viene girata nel verso giusto, come la mostra il telefono
  const originale = await createImageBitmap(file);
  const scala = Math.min(1, LATO_MASSIMO / Math.max(originale.width, originale.height));
  if (scala === 1) return { nome, immagine: originale };

  const ridotta = await createImageBitmap(originale, {
    resizeWidth: Math.round(originale.width * scala),
    resizeHeight: Math.round(originale.height * scala),
    resizeQuality: 'high',
  });
  originale.close();
  return { nome, immagine: ridotta };
}
