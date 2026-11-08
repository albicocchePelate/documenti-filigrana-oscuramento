import {
  Component,
  ElementRef,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ImpostazioniFiligrana, disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina, Zona } from '../pagina';
import { Miniatura } from './miniatura';

/** Una pagina alla volta, grande, con sotto le miniature per saltare da una all'altra. */
@Component({
  selector: 'app-anteprima',
  imports: [Miniatura],
  templateUrl: './anteprima.html',
  styleUrl: './anteprima.css',
  // Le frecce sfogliano quando l'anteprima ha il focus: con più file ognuno ha la sua
  host: { tabindex: '0', '(keydown)': 'tasto($event)' },
})
export class Anteprima {
  readonly pagine = input.required<Pagina[]>();
  readonly filigrana = input.required<ImpostazioniFiligrana>();
  readonly togli = output<Pagina>();
  readonly copri = output<{ pagina: Pagina; zone: Zona[] }>();

  /** «Copri una zona» acceso: trascinando sulla pagina si disegna un rettangolo */
  protected readonly copro = signal(false);
  /** Il rettangolo che si sta trascinando, non ancora aggiunto */
  protected readonly bozza = signal<Zona | null>(null);
  /** La zona cliccata: mostra la × per toglierla */
  protected readonly zonaScelta = signal<Zona | null>(null);
  private inizio: { x: number; y: number } | null = null;

  /** La pagina mostrata: resta la stessa quando se ne aggiungono, si sposta se si toglie */
  protected readonly corrente = linkedSignal<Pagina[], number>({
    source: this.pagine,
    computation: (pagine, prima) => Math.max(0, Math.min(prima?.value ?? 0, pagine.length - 1)),
  });
  protected readonly pagina = computed(() => this.pagine()[this.corrente()]);

  /** «busta-paga · pagina 2 di 3» */
  protected readonly didascalia = computed(() => {
    const pagina = this.pagina();
    if (!pagina) return '';
    const stesse = this.pagine().filter((altra) => altra.documento === pagina.documento);
    return stesse.length > 1
      ? `${pagina.documento} · pagina ${stesse.indexOf(pagina) + 1} di ${stesse.length}`
      : pagina.documento;
  });

  /** Chiesto di togliere la pagina: si aspetta la conferma */
  protected readonly confermaTogli = signal(false);
  private attesaConferma?: ReturnType<typeof setTimeout>;

  private readonly grande = viewChild<ElementRef<HTMLCanvasElement>>('grande');
  private readonly fontCaricato = signal(false);

  constructor() {
    fontPronto.then(() => this.fontCaricato.set(true));

    // La pagina grande si ridisegna quando cambia lei o la filigrana
    effect(() => {
      this.fontCaricato();
      const foglio = this.grande()?.nativeElement;
      const pagina = this.pagina();
      if (foglio && pagina) disegnaPagina(foglio, pagina, this.filigrana());
    });
  }

  /** Primo clic: chiede conferma. Se non arriva entro qualche secondo, si torna indietro */
  protected chiediTogli(): void {
    this.confermaTogli.set(true);
    clearTimeout(this.attesaConferma);
    this.attesaConferma = setTimeout(() => this.confermaTogli.set(false), 5000);
  }

  protected confermaTogliPagina(): void {
    clearTimeout(this.attesaConferma);
    this.confermaTogli.set(false);
    this.togli.emit(this.pagine()[this.corrente()]);
  }

  protected inizia(evento: PointerEvent): void {
    if (!this.copro()) return;
    const foglio = evento.currentTarget as HTMLElement;
    foglio.setPointerCapture(evento.pointerId);
    this.inizio = punto(evento, foglio);
    this.zonaScelta.set(null);
  }

  protected trascina(evento: PointerEvent): void {
    if (!this.inizio) return;
    const fine = punto(evento, evento.currentTarget as HTMLElement);
    this.bozza.set({
      x: Math.min(this.inizio.x, fine.x),
      y: Math.min(this.inizio.y, fine.y),
      larghezza: Math.abs(fine.x - this.inizio.x),
      altezza: Math.abs(fine.y - this.inizio.y),
    });
  }

  /** Lasciato il dito o il mouse, il rettangolo si aggiunge (se non è un semplice clic) */
  protected finisci(): void {
    const zona = this.bozza();
    this.inizio = null;
    this.bozza.set(null);
    if (!zona || zona.larghezza < 0.01 || zona.altezza < 0.01) return;
    const pagina = this.pagina();
    this.copri.emit({ pagina, zone: [...pagina.zone, zona] });
  }

  protected scegliZona(evento: PointerEvent, zona: Zona): void {
    evento.stopPropagation();
    this.zonaScelta.set(zona);
  }

  protected togliZona(zona: Zona): void {
    const pagina = this.pagina();
    this.zonaScelta.set(null);
    this.copri.emit({ pagina, zone: pagina.zone.filter((altra) => altra !== zona) });
  }

  protected annullaUltima(): void {
    const pagina = this.pagina();
    this.zonaScelta.set(null);
    this.copri.emit({ pagina, zone: pagina.zone.slice(0, -1) });
  }

  protected vai(passo: number): void {
    this.mostra(this.corrente() + passo);
  }

  /** Cambiare pagina annulla una richiesta di togliere ancora in sospeso */
  protected mostra(indice: number): void {
    this.confermaTogli.set(false);
    this.zonaScelta.set(null);
    this.corrente.set(Math.max(0, Math.min(indice, this.pagine().length - 1)));
  }

  /** Frecce della tastiera per sfogliare, tranne quando si scrive in un campo */
  protected tasto(evento: KeyboardEvent): void {
    if ((evento.target as HTMLElement).closest('input, textarea')) return;
    if (evento.key === 'ArrowLeft') this.vai(-1);
    if (evento.key === 'ArrowRight') this.vai(1);
  }
}

/** Dove si trova il puntatore sul foglio, in frazioni (da 0 a 1) */
function punto(evento: PointerEvent, foglio: HTMLElement): { x: number; y: number } {
  const area = foglio.getBoundingClientRect();
  const dentro = (valore: number) => Math.max(0, Math.min(1, valore));
  return {
    x: dentro((evento.clientX - area.left) / area.width),
    y: dentro((evento.clientY - area.top) / area.height),
  };
}
