import { apriPdf } from '../carica/apri-pdf';
import { formato } from '../carica/leggi';

/**
 * Cosa raccontava il file oltre al documento: posizione, telefono, data, autore, programma.
 * Lo mostriamo per far vedere cosa non finisce nella copia (che è rifatta da zero e non ne ha).
 */
export async function leggiMetadati(file: File): Promise<string[]> {
  try {
    return formato(file) === 'pdf' ? await delPdf(file) : await dellaFoto(file);
  } catch {
    return [];
  }
}

async function dellaFoto(file: File): Promise<string[]> {
  const { default: exifr } = await import('exifr');
  const dati = await exifr.parse(file, { gps: true, tiff: true, exif: true });
  if (!dati) return [];
  const dispositivo = [dati.Make, dati.Model].filter(Boolean).join(' ');
  return [
    dati.latitude !== undefined &&
      `Posizione: ${dati.latitude.toFixed(5)}, ${dati.longitude.toFixed(5)}`,
    dispositivo && `Dispositivo: ${dispositivo}`,
    dati.LensModel && `Obiettivo: ${dati.LensModel}`,
    dati.DateTimeOriginal && `Scattata il ${giorno(dati.DateTimeOriginal)}`,
    dati.Software && `Programma: ${dati.Software}`,
    dati.Artist && `Autore: ${dati.Artist}`,
  ].filter((riga): riga is string => Boolean(riga));
}

async function delPdf(file: File): Promise<string[]> {
  const documento = await apriPdf(file);
  const info = (await documento.getMetadata()).info as Record<string, string>;
  await documento.destroy();
  const { PDFDateString } = await import('pdfjs-dist');
  const data = info['CreationDate'] && PDFDateString.toDateObject(info['CreationDate']);
  return [
    info['Title'] && `Titolo: ${info['Title']}`,
    info['Author'] && `Autore: ${info['Author']}`,
    info['Creator'] && `Creato con: ${info['Creator']}`,
    info['Producer'] && `Programma: ${info['Producer']}`,
    data && `Creato il ${giorno(data)}`,
  ].filter((riga): riga is string => Boolean(riga));
}

function giorno(data: Date): string {
  return data.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}
