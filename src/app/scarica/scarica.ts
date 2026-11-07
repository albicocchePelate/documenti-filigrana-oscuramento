import { Component, computed, input, signal } from '@angular/core';
import { ImpostazioniFiligrana } from '../filigrana/disegna';
import { Pagina } from '../pagina';
import { Opzione, Scelta } from '../scelta/scelta';
import { perDocumento, salvaImmagini, salvaPdf } from './salva';

/** Un file che si scarica: cosa contiene e come si chiama all'inizio */
interface Uscita {
  etichetta: string;
  nomeIniziale: string;
  pagine: Pagina[];
}

@Component({
  selector: 'app-scarica',
  imports: [Scelta],
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
  /** Si aggiunge al nome di ogni file; può restare vuota */
  protected readonly aggiunta = signal('-con-filigrana');
  /** I nomi cambiati a mano, per etichetta */
  protected readonly nomi = signal<Record<string, string>>({});
  /** L'etichetta della riga che si sta preparando */
  protected readonly preparo = signal<string | null>(null);

  protected readonly formati: Opzione<'pdf' | 'jpg'>[] = [
    { valore: 'pdf', etichetta: 'PDF' },
    { valore: 'jpg', etichetta: 'Immagini JPG' },
  ];
  protected readonly raggruppamenti: Opzione<boolean>[] = [
    { valore: false, etichetta: 'Separati' },
    { valore: true, etichetta: 'Tutti in un file' },
  ];

  protected readonly documenti = computed(() => perDocumento(this.pagine()));

  /** Una riga per ogni file che si otterrà */
  protected readonly uscite = computed<Uscita[]>(() => {
    const documenti = this.documenti();
    if (documenti.length > 1 && this.insieme()) {
      return [{ etichetta: 'Tutti i documenti', nomeIniziale: 'documenti', pagine: this.pagine() }];
    }
    return documenti.map((pagine) => ({
      etichetta: pagine[0].documento,
      nomeIniziale: pagine[0].documento,
      pagine,
    }));
  });

  protected nome(uscita: Uscita): string {
    return this.nomi()[uscita.etichetta] ?? uscita.nomeIniziale;
  }

  protected rinomina(uscita: Uscita, nome: string): void {
    this.nomi.update((nomi) => ({ ...nomi, [uscita.etichetta]: nome }));
  }

  /** Quello che segue il nome: l'aggiunta e l'estensione, «-con-filigrana.pdf» */
  protected coda(uscita: Uscita): string {
    const estensione =
      this.formato() === 'pdf' ? 'pdf' : uscita.pagine.length === 1 ? 'jpg' : 'zip';
    return `${senzaVietati(this.aggiunta())}.${estensione}`;
  }

  /** «2 pagine», oppure «2 immagini in uno ZIP» */
  protected contenuto(uscita: Uscita): string {
    const quante = uscita.pagine.length;
    if (this.formato() === 'pdf') return quante === 1 ? '1 pagina' : `${quante} pagine`;
    return quante === 1 ? '1 immagine' : `${quante} immagini in uno ZIP`;
  }

  protected valore(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected async scarica(uscita: Uscita): Promise<void> {
    const nome =
      (senzaVietati(this.nome(uscita)).trim() || 'documento') + senzaVietati(this.aggiunta());
    this.preparo.set(uscita.etichetta);
    try {
      if (this.formato() === 'pdf') await salvaPdf(uscita.pagine, this.filigrana(), nome);
      else await salvaImmagini(uscita.pagine, this.filigrana(), nome);
    } finally {
      this.preparo.set(null);
    }
  }
}

/** Via i caratteri che i sistemi non accettano nei nomi dei file */
function senzaVietati(nome: string): string {
  return nome.replace(/[\\/:*?"<>|]/g, '');
}
