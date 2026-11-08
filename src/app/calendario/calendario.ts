import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  linkedSignal,
  model,
  signal,
} from '@angular/core';

const MESI = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

/** Un giorno nella griglia del mese */
interface Giorno {
  data: string;
  numero: number;
  oggi: boolean;
  scelto: boolean;
}

/**
 * Il campo data con un calendario nello stile del sito: quello del browser non si può cambiare.
 * Da tastiera: frecce per spostarsi, Pagina su e giù per i mesi, Invio per scegliere, Esc per chiudere.
 */
@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
  host: {
    '(document:pointerdown)': 'clicFuori($event)',
    '(focusout)': 'fuocoFuori($event)',
  },
})
export class Calendario {
  /** Nel formato «2026-11-12» */
  readonly data = model.required<string>();

  protected readonly aperto = signal(false);
  protected readonly nomiGiorni = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
  protected readonly oggi = inFormato(new Date());

  /** Il giorno su cui si trova la tastiera: parte da quello scelto */
  protected readonly attivo = linkedSignal(() => this.data());

  protected readonly leggibile = computed(() =>
    daFormato(this.data()).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  );

  protected readonly titolo = computed(() => {
    const giorno = daFormato(this.attivo());
    return `${MESI[giorno.getMonth()]} ${giorno.getFullYear()}`;
  });

  /** Il mese del giorno attivo, preceduto da caselle vuote per partire da lunedì */
  protected readonly giorni = computed<(Giorno | null)[]>(() => {
    const attivo = daFormato(this.attivo());
    const anno = attivo.getFullYear();
    const mese = attivo.getMonth();
    const vuote = (new Date(anno, mese, 1).getDay() + 6) % 7;
    const quanti = new Date(anno, mese + 1, 0).getDate();
    const giorni: (Giorno | null)[] = Array(vuote).fill(null);
    for (let numero = 1; numero <= quanti; numero++) {
      const data = inFormato(new Date(anno, mese, numero));
      giorni.push({ data, numero, oggi: data === this.oggi, scelto: data === this.data() });
    }
    return giorni;
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected apriOChiudi(): void {
    if (this.aperto()) {
      this.aperto.set(false);
      return;
    }
    this.attivo.set(this.data());
    this.aperto.set(true);
    this.aFuoco();
  }

  protected scegli(data: string): void {
    this.data.set(data);
    this.chiudi();
  }

  protected cambiaMese(verso: -1 | 1): void {
    const giorno = daFormato(this.attivo());
    const ultimo = new Date(giorno.getFullYear(), giorno.getMonth() + verso + 1, 0).getDate();
    giorno.setDate(Math.min(giorno.getDate(), ultimo));
    giorno.setMonth(giorno.getMonth() + verso);
    this.attivo.set(inFormato(giorno));
  }

  protected tasto(evento: KeyboardEvent): void {
    const spostamenti: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (evento.key in spostamenti) {
      const giorno = daFormato(this.attivo());
      giorno.setDate(giorno.getDate() + spostamenti[evento.key]);
      this.attivo.set(inFormato(giorno));
    } else if (evento.key === 'PageUp' || evento.key === 'PageDown') {
      this.cambiaMese(evento.key === 'PageUp' ? -1 : 1);
    } else if (evento.key === 'Escape') {
      this.chiudi();
    } else {
      return;
    }
    evento.preventDefault();
    if (this.aperto()) this.aFuoco();
  }

  protected clicFuori(evento: PointerEvent): void {
    if (!this.host.nativeElement.contains(evento.target as Node)) this.aperto.set(false);
  }

  protected fuocoFuori(evento: FocusEvent): void {
    if (!this.host.nativeElement.contains(evento.relatedTarget as Node)) this.aperto.set(false);
  }

  /** Chiude e torna sul campo, così la tastiera non si perde */
  private chiudi(): void {
    this.aperto.set(false);
    this.host.nativeElement.querySelector<HTMLElement>('.campo')?.focus();
  }

  private aFuoco(): void {
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('.giorno[tabindex="0"]')?.focus(),
      { injector: this.injector },
    );
  }
}

/** «2026-11-12» → la data, a mezzanotte dell'ora locale */
function daFormato(testo: string): Date {
  const [anno, mese, giorno] = testo.split('-').map(Number);
  return new Date(anno, mese - 1, giorno);
}

function inFormato(data: Date): string {
  const due = (numero: number) => String(numero).padStart(2, '0');
  return `${data.getFullYear()}-${due(data.getMonth() + 1)}-${due(data.getDate())}`;
}
