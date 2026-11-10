type Decodificatore = Awaited<ReturnType<typeof creaDecodificatore>>;

/** Uno solo per tutte le foto: ognuno occupa la sua memoria */
let decodificatore: Promise<Decodificatore> | undefined;

/**
 * Le foto HEIC dell'iPhone. Chrome non le sa aprire da solo: le decodifica libheif, qui nel
 * browser (il suo motore è dentro il file JavaScript, non si scarica niente da fuori).
 */
export async function leggiHeic(file: File): Promise<ImageBitmap> {
  decodificatore ??= creaDecodificatore().catch((errore) => {
    decodificatore = undefined;
    throw errore;
  });
  const foto = (await decodificatore).decode(new Uint8Array(await file.arrayBuffer()));
  try {
    if (!foto[0]) throw new Error('heic');
    const pixel = new ImageData(foto[0].get_width(), foto[0].get_height());
    await new Promise<void>((fatto, errore) =>
      foto[0].display(pixel, (risultato) => (risultato ? fatto() : errore(new Error('heic')))),
    );
    return createImageBitmap(pixel);
  } finally {
    foto.forEach((una) => una.free());
  }
}

async function creaDecodificatore() {
  const { default: creaLibheif } = await import('libheif-js/libheif-wasm/libheif-bundle.mjs');
  return new (creaLibheif().HeifDecoder)();
}
