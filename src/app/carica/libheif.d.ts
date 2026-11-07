// Solo la parte di libheif-js che usiamo
declare module 'libheif-js/libheif-wasm/libheif-bundle.mjs' {
  interface FotoHeif {
    get_width(): number;
    get_height(): number;
    display(destinazione: ImageData, fatto: (risultato: ImageData | null) => void): void;
    free(): void;
  }
  interface Libheif {
    HeifDecoder: new () => { decode(dati: Uint8Array): FotoHeif[] };
  }
  const creaLibheif: () => Libheif;
  export default creaLibheif;
}
