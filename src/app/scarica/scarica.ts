import { Component, input, signal } from '@angular/core';
import { Pagina } from '../pagina';
import { salvaImmagini, salvaPdf } from './salva';

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

  protected pdf(): Promise<void> {
    return this.prepara(() => salvaPdf(this.pagine(), this.testo()));
  }

  protected immagini(): Promise<void> {
    return this.prepara(() => salvaImmagini(this.pagine(), this.testo()));
  }

  private async prepara(salva: () => Promise<void>): Promise<void> {
    this.preparo.set(true);
    try {
      await salva();
    } finally {
      this.preparo.set(false);
    }
  }
}
