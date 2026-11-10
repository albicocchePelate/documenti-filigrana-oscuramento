import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ImpostazioniFiligrana } from '../filigrana/disegna';
import { Pagina } from '../pagina';
import { Metadati } from '../prove/metadati';
import { Verifica } from '../prove/verifica';
import { Opzione, Scelta } from '../scelta/scelta';
import { fileImmagini, filePdf, perDocumento, salva } from './salva';

export interface Uscita {
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
  readonly sposta = output<{ documento: string; verso: -1 | 1 }>();
  /** Per ogni documento, cosa conteneva oltre al documento: lo si mostra per dire che è stato tolto */
  readonly metadati = input<Metadati>({});

  private readonly verifica = inject(Verifica);

  protected readonly formato = signal<'pdf' | 'jpg'>('pdf');
  /** Con più documenti: separati (di solito è quello che serve) o tutti in un file */
  protected readonly insieme = signal(false);
  /** Si aggiunge al nome di ogni file; può restare vuota. Segue la filigrana finché non la si cambia */
  private readonly aggiuntaScritta = signal<string | null>(null);
  protected readonly aggiunta = computed(
    () => this.aggiuntaScritta() ?? (this.filigrana().attiva ? '-con-filigrana' : '-oscurato'),
  );
  /** I nomi cambiati a mano, per etichetta */
  protected readonly nomi = signal<Record<string, string>>({});
  protected readonly preparo = signal<{ etichetta: string; modo: Modo } | null>(null);
  protected readonly errore = signal('');

  /** Sul telefono la copia si manda subito (WhatsApp, Mail…) invece di cercarla tra i file */
  protected readonly condivisibile =
    matchMedia('(hover: none)').matches &&
    !!navigator.canShare?.({ files: [new File([''], 'copia.pdf', { type: 'application/pdf' })] });
  /** Il file pronto che aspetta un secondo tocco per essere condiviso (vedi condividi) */
  protected readonly pronto = signal<{ etichetta: string; file: File } | null>(null);

  constructor() {
    // Cambiato qualcosa, il file pronto non è più quello giusto
    effect(() => {
      this.pagine();
      this.filigrana();
      this.formato();
      this.aggiunta();
      this.nomi();
      untracked(() => this.pronto.set(null));
    });
  }

  protected readonly formati: Opzione<'pdf' | 'jpg'>[] = [
    { valore: 'pdf', etichetta: 'PDF' },
    { valore: 'jpg', etichetta: 'Immagini JPG' },
  ];
  protected readonly raggruppamenti: Opzione<boolean>[] = [
    { valore: false, etichetta: 'Separati' },
    { valore: true, etichetta: 'Tutti in un file' },
  ];

  protected readonly documenti = computed(() => perDocumento(this.pagine()));

  readonly uscite = computed<Uscita[]>(() => {
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

  nome(uscita: Uscita): string {
    return this.nomi()[uscita.etichetta] ?? uscita.nomeIniziale;
  }

  protected rinomina(uscita: Uscita, nome: string): void {
    this.nomi.update((nomi) => ({ ...nomi, [uscita.etichetta]: nome }));
  }

  /** Quello che segue il nome: l'aggiunta e l'estensione, «-con-filigrana.pdf» */
  coda(uscita: Uscita): string {
    const estensione =
      this.formato() === 'pdf' ? 'pdf' : uscita.pagine.length === 1 ? 'jpg' : 'zip';
    return `${senzaVietati(this.aggiunta())}.${estensione}`;
  }

  /** Il file mostrato nell'anteprima: resta lo stesso finché esiste, altrimenti il primo */
  readonly scelta = linkedSignal<Uscita[], string>({
    source: this.uscite,
    computation: (uscite, prima) =>
      uscite.some((uscita) => uscita.etichetta === prima?.value)
        ? prima!.value
        : uscite[0].etichetta,
  });
  readonly inVista = computed(
    () => this.uscite().find((uscita) => uscita.etichetta === this.scelta()) ?? this.uscite()[0],
  );

  /** Nel file unico: i documenti che contiene, nell'ordine in cui compaiono */
  protected readonly ordine = computed(() =>
    this.insieme() && this.documenti().length > 1 ? this.documenti() : [],
  );

  /** Cosa avevano i documenti del file e la copia non ha: «posizione, dispositivo, data di scatto» */
  protected tolti(uscita: Uscita): string {
    const etichette = this.documentiDi(uscita).flatMap((documento) =>
      (this.metadati()[documento] ?? []).map((dato) => dato.etichetta.toLowerCase()),
    );
    return [...new Set(etichette)].join(', ');
  }

  protected vediTolti(evento: Event, uscita: Uscita): void {
    evento.stopPropagation();
    this.verifica.mostra(this.documentiDi(uscita));
  }

  /** Se di qualche documento del file non si sono potuti leggere i dati nascosti */
  protected nonLetti(uscita: Uscita): boolean {
    return this.documentiDi(uscita).some((documento) => this.metadati()[documento] === null);
  }

  private documentiDi(uscita: Uscita): string[] {
    return [...new Set(uscita.pagine.map((pagina) => pagina.documento))];
  }

  /** «2 pagine», oppure «2 immagini in uno ZIP» */
  quante(pagine: Pagina[]): string {
    const quante = pagine.length;
    if (this.formato() === 'pdf') return quante === 1 ? '1 pagina' : `${quante} pagine`;
    return quante === 1 ? '1 immagine' : `${quante} immagini in uno ZIP`;
  }

  protected scriviAggiunta(testo: string): void {
    this.aggiuntaScritta.set(testo);
  }

  protected valore(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  /** Prepara il file, poi lo scarica o apre il menu Condividi del telefono */
  protected async consegna(uscita: Uscita, modo: Modo): Promise<void> {
    const nome =
      (senzaVietati(this.nome(uscita)).trim() || 'documento') + senzaVietati(this.aggiunta());
    this.preparo.set({ etichetta: uscita.etichetta, modo });
    this.errore.set('');
    try {
      const file =
        this.formato() === 'pdf'
          ? await filePdf(uscita.pagine, this.filigrana(), nome)
          : await fileImmagini(uscita.pagine, this.filigrana(), nome);
      if (modo === 'condividi' && navigator.canShare({ files: [file] }))
        await this.condividi(uscita, file);
      else salva(file);
    } catch {
      this.errore.set(
        `Non sono riuscito a preparare «${uscita.etichetta}». Forse manca memoria: chiudi altre schede o separa i documenti e riprova.`,
      );
    } finally {
      this.preparo.set(null);
    }
  }

  protected async condividi(uscita: Uscita, file: File): Promise<void> {
    try {
      await navigator.share({ files: [file] });
      this.pronto.set(null);
    } catch (errore) {
      // Il file ha richiesto qualche secondo e Safari non conta più il tocco: ne serve uno nuovo.
      // Chiudere il menu senza scegliere (AbortError) va bene così
      if ((errore as DOMException).name === 'NotAllowedError')
        this.pronto.set({ etichetta: uscita.etichetta, file });
    }
  }

  protected inPreparazione(uscita: Uscita, modo: Modo): boolean {
    const preparo = this.preparo();
    return preparo?.etichetta === uscita.etichetta && preparo.modo === modo;
  }
}

type Modo = 'scarica' | 'condividi';

/** Via i caratteri che i sistemi non accettano nei nomi dei file */
function senzaVietati(nome: string): string {
  return nome.replace(/[\\/:*?"<>|]/g, '');
}
