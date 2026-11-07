import { Component, computed, input, signal } from '@angular/core';
import { ImpostazioniFiligrana } from '../filigrana/disegna';
import { Pagina } from '../pagina';
import { perDocumento, salvaImmagini, salvaPdf } from './salva';

@Component({
  selector: 'app-scarica',
  templateUrl: './scarica.html',
  styleUrl: './scarica.css',
})
export class Scarica {
  readonly pagine = input.required<Pagina[]>();
  readonly filigrana = input.required<ImpostazioniFiligrana>();
  /** Si scarica solo dopo aver scritto lo scopo */
  readonly pronto = input.required<boolean>();

  /** Cosa si sta preparando: «tutto», un documento, «immagini» */
  protected readonly preparo = signal<string | null>(null);
  /** Con più documenti: un PDF per ciascuno (di solito è quello che serve) o uno solo */
  protected readonly unico = signal(false);
  protected readonly documenti = computed(() => perDocumento(this.pagine()));

  protected pdf(pagine: Pagina[], chi: string): Promise<void> {
    return this.prepara(chi, () => salvaPdf(pagine, this.filigrana()));
  }

  protected immagini(): Promise<void> {
    return this.prepara('immagini', () => salvaImmagini(this.pagine(), this.filigrana()));
  }

  private async prepara(chi: string, salva: () => Promise<void>): Promise<void> {
    this.preparo.set(chi);
    try {
      await salva();
    } finally {
      this.preparo.set(null);
    }
  }
}
