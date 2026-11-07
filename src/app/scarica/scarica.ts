import { Component, computed, input, signal } from '@angular/core';
import { ImpostazioniFiligrana } from '../filigrana/disegna';
import { Pagina } from '../pagina';
import { perDocumento, salvaImmagini, salvaPdf } from './salva';

/** Un file che si scarica: cosa contiene e come si chiama nella riga */
interface Uscita {
  etichetta: string;
  pagine: Pagina[];
}

@Component({
  selector: 'app-scarica',
  templateUrl: './scarica.html',
  styleUrl: './scarica.css',
})
export class Scarica {
  readonly pagine = input.required<Pagina[]>();
  readonly filigrana = input.required<ImpostazioniFiligrana>();
  /** Si scarica solo dopo aver completato la scritta */
  readonly pronto = input.required<boolean>();

  protected readonly formato = signal<'pdf' | 'jpg'>('pdf');
  /** Con più documenti: separati (di solito è quello che serve) o tutti in un file */
  protected readonly insieme = signal(false);
  /** L'etichetta della riga che si sta preparando */
  protected readonly preparo = signal<string | null>(null);

  protected readonly documenti = computed(() => perDocumento(this.pagine()));

  /** Una riga per ogni file che si otterrà */
  protected readonly uscite = computed<Uscita[]>(() => {
    const documenti = this.documenti();
    if (documenti.length === 1)
      return [{ etichetta: documenti[0][0].documento, pagine: documenti[0] }];
    if (this.insieme()) return [{ etichetta: 'Tutti i documenti', pagine: this.pagine() }];
    return documenti.map((pagine) => ({ etichetta: pagine[0].documento, pagine }));
  });

  /** «2 pagine», oppure «2 immagini in uno ZIP» */
  protected contenuto(uscita: Uscita): string {
    const quante = uscita.pagine.length;
    if (this.formato() === 'pdf') return quante === 1 ? '1 pagina' : `${quante} pagine`;
    return quante === 1 ? '1 immagine' : `${quante} immagini in uno ZIP`;
  }

  protected async scarica(uscita: Uscita): Promise<void> {
    this.preparo.set(uscita.etichetta);
    try {
      if (this.formato() === 'pdf') await salvaPdf(uscita.pagine, this.filigrana());
      else await salvaImmagini(uscita.pagine, this.filigrana());
    } finally {
      this.preparo.set(null);
    }
  }
}
