/**
 * Le foto HEIC dell'iPhone. Chrome non le sa aprire da solo: le decodifica libheif, qui nel
 * browser (il suo motore è dentro il file JavaScript, non si scarica niente da fuori).
 */
export async function leggiHeic(file: File): Promise<ImageBitmap> {
  const { default: creaLibheif } = await import('libheif-js/libheif-wasm/libheif-bundle.mjs');
  const libheif = creaLibheif();
  const decodificatore = new libheif.HeifDecoder();
  const [foto] = decodificatore.decode(new Uint8Array(await file.arrayBuffer()));
  if (!foto) throw new Error('heic');

  const pixel = new ImageData(foto.get_width(), foto.get_height());
  await new Promise<void>((fatto, errore) =>
    foto.display(pixel, (risultato) => (risultato ? fatto() : errore(new Error('heic')))),
  );
  foto.free();
  return createImageBitmap(pixel);
}
