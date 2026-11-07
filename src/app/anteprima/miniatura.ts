import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { Pagina } from '../pagina';

/** Larghezza delle miniature, in pixel */
const LARGHEZZA = 96;

/**
 * Disegna la sua pagina, in piccolo e senza filigrana: serve solo a riconoscerla.
 * Ogni miniatura pensa alla sua, così quando una pagina sparisce le altre non si confondono.
 */
@Directive({ selector: 'canvas[appMiniatura]' })
export class Miniatura {
  readonly pagina = input.required<Pagina>({ alias: 'appMiniatura' });

  constructor() {
    const foglio = inject<ElementRef<HTMLCanvasElement>>(ElementRef).nativeElement;
    effect(() => {
      const immagine = this.pagina().immagine;
      foglio.width = LARGHEZZA;
      foglio.height = Math.round((LARGHEZZA * immagine.height) / immagine.width);
      foglio.getContext('2d')!.drawImage(immagine, 0, 0, foglio.width, foglio.height);
    });
  }
}
