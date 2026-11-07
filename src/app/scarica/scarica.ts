import { Component, input, signal } from '@angular/core';
import { Pagina } from '../pagina';
import { salvaImmagini } from './salva';

@Component({
  selector: 'app-scarica',
  templateUrl: './scarica.html',
  styleUrl: './scarica.css',
})
export class Scarica {
  readonly pagine = input.required<Pagina[]>();
  readonly testo = input.required<string>();
  /** Si scarica solo dopo aver scritto lo scopo */
  readonly pronto = input.required<boolean>();

  protected readonly preparo = signal(false);

  protected async immagini(): Promise<void> {
    this.preparo.set(true);
    try {
      await salvaImmagini(this.pagine(), this.testo());
    } finally {
      this.preparo.set(false);
    }
  }
}
