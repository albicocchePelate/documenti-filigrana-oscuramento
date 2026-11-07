import { Component, ElementRef, effect, input, output, signal, viewChildren } from '@angular/core';
import { disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina } from '../pagina';

@Component({
  selector: 'app-anteprima',
  templateUrl: './anteprima.html',
  styleUrl: './anteprima.css',
})
export class Anteprima {
  readonly pagine = input.required<Pagina[]>();
  readonly testo = input.required<string>();
  readonly togli = output<number>();

  private readonly fogli = viewChildren<ElementRef<HTMLCanvasElement>>('foglio');
  private readonly fontCaricato = signal(false);

  constructor() {
    fontPronto.then(() => this.fontCaricato.set(true));

    // Ogni volta che cambiano le pagine o il testo, si ridisegna tutto
    effect(() => {
      this.fontCaricato();
      const pagine = this.pagine();
      const testo = this.testo();
      this.fogli().forEach((foglio, i) => disegnaPagina(foglio.nativeElement, pagine[i], testo));
    });
  }
}
