import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ImpostazioniFiligrana, disegnaPagina, fontPronto } from '../filigrana/disegna';
import { Pagina, Zona } from '../pagina';
import { Miniatura } from './miniatura';

const ZOOM = [1, 1.5, 2, 3, 4];

/** Una pagina alla volta, grande, con sotto le miniature per saltare da una all'altra. */
@Component({
  selector: 'app-anteprima',
  imports: [Miniatura],
  templateUrl: './anteprima.html',
  styleUrl: './anteprima.css',
  host: {
    tabindex: '0',
    // Le frecce sfogliano quando l'anteprima ha il focus: con più file ognuno ha la sua
    '(keydown)': 'tasto($event)',
    // Un clic fuori dalla zona scelta la deseleziona (il clic sulla zona non arriva fin qui)
    '(document:pointerdown)': 'zonaScelta.set(null)',
  },
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

  /** Zoom: 1 è la pagina intera nel riquadro */
  protected readonly zoom = signal(1);
  /** Quanto è grande il riquadro, per calcolare la misura della pagina */
  private readonly spazio = signal({ larghezza: 0, altezza: 0 });
  /** La larghezza della pagina a schermo: intera nel riquadro, per lo zoom */
  protected readonly larghezza = computed(() => {
    const pagina = this.pagina();
    if (!pagina) return 0;
    const proporzione = pagina.immagine.width / pagina.immagine.height;
    const { larghezza, altezza } = this.spazio();
    return Math.min(larghezza, altezza * proporzione) * this.zoom();
  });
  private readonly vista = viewChild<ElementRef<HTMLElement>>('vista');
  /** Trascinando la pagina ingrandita ci si sposta: da dove è partito il trascinamento */
  private spostamento: { x: number; y: number } | null = null;

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

  /** La striscia delle miniature: se non ci stanno tutte, compaiono le frecce */
  private readonly miniature = viewChild<ElementRef<HTMLElement>>('miniature');
  protected readonly scorre = signal(false);
  protected readonly inizioStriscia = signal(true);
  protected readonly fineStriscia = signal(false);
  private readonly injector = inject(Injector);
  private readonly fontCaricato = signal(false);

  constructor() {
    fontPronto.then(() => this.fontCaricato.set(true));

    // La misura del riquadro cambia con la finestra: la pagina intera deve starci sempre
    effect((pulisci) => {
      const vista = this.vista()?.nativeElement;
      if (!vista) return;
      const osservatore = new ResizeObserver(([voce]) =>
        this.spazio.set({ larghezza: voce.contentRect.width, altezza: voce.contentRect.height }),
      );
      osservatore.observe(vista);
      pulisci(() => osservatore.disconnect());
    });

    // Si rimisura quando cambia la striscia o una miniatura (che prende la sua misura disegnandosi)
    effect((pulisci) => {
      const striscia = this.miniature()?.nativeElement;
      if (!striscia) return;
      this.pagine();
      const osservatore = new ResizeObserver(() => this.misuraStriscia());
      osservatore.observe(striscia);
      afterNextRender(
        () => [...striscia.children].forEach((miniatura) => osservatore.observe(miniatura)),
        { injector: this.injector },
      );
      pulisci(() => osservatore.disconnect());
    });

    // La miniatura della pagina mostrata resta sempre in vista
    effect(() => {
      const indice = this.corrente();
      this.miniature()?.nativeElement.children[indice]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      });
    });

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
    const foglio = evento.currentTarget as HTMLElement;
    if (!this.copro()) {
      // Pagina ingrandita: trascinandola ci si sposta
      if (this.zoom() > 1) {
        foglio.setPointerCapture(evento.pointerId);
        this.spostamento = { x: evento.clientX, y: evento.clientY };
      }
      return;
    }
    foglio.setPointerCapture(evento.pointerId);
    this.inizio = punto(evento, foglio);
    this.zonaScelta.set(null);
  }

  protected trascina(evento: PointerEvent): void {
    const vista = this.vista()?.nativeElement;
    if (this.spostamento && vista) {
      vista.scrollLeft -= evento.clientX - this.spostamento.x;
      vista.scrollTop -= evento.clientY - this.spostamento.y;
      this.spostamento = { x: evento.clientX, y: evento.clientY };
      return;
    }
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
    this.spostamento = null;
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

  /** Un passo di zoom avanti (1) o indietro (-1), tenendo fermo il centro di quello che si vede */
  protected ingrandisci(verso: 1 | -1): void {
    const attuale = ZOOM.indexOf(this.zoom());
    const nuovo = ZOOM[Math.max(0, Math.min(ZOOM.length - 1, attuale + verso))];
    const vista = this.vista()?.nativeElement;
    if (!vista || nuovo === this.zoom()) return;
    const centroX = (vista.scrollLeft + vista.clientWidth / 2) / vista.scrollWidth;
    const centroY = (vista.scrollTop + vista.clientHeight / 2) / vista.scrollHeight;
    this.zoom.set(nuovo);
    requestAnimationFrame(() => {
      vista.scrollLeft = centroX * vista.scrollWidth - vista.clientWidth / 2;
      vista.scrollTop = centroY * vista.scrollHeight - vista.clientHeight / 2;
    });
  }

  /** Rotella con Ctrl, o pizzico sul trackpad: zoom. Senza Ctrl la rotella scorre la pagina */
  protected rotella(evento: WheelEvent): void {
    if (!evento.ctrlKey) return;
    evento.preventDefault();
    this.ingrandisci(evento.deltaY < 0 ? 1 : -1);
  }

  protected misuraStriscia(): void {
    const striscia = this.miniature()?.nativeElement;
    if (!striscia) return;
    this.scorre.set(striscia.scrollWidth > striscia.clientWidth + 1);
    this.inizioStriscia.set(striscia.scrollLeft <= 1);
    this.fineStriscia.set(striscia.scrollLeft + striscia.clientWidth >= striscia.scrollWidth - 1);
  }

  /** Di quasi una schermata di miniature, lasciandone in vista un pezzo per orientarsi */
  protected scorriMiniature(verso: -1 | 1): void {
    const striscia = this.miniature()!.nativeElement;
    striscia.scrollBy({ left: verso * striscia.clientWidth * 0.8, behavior: 'smooth' });
  }

  protected vai(passo: number): void {
    this.mostra(this.corrente() + passo);
  }

  /** Cambiare pagina annulla una richiesta di togliere ancora in sospeso */
  protected mostra(indice: number): void {
    this.confermaTogli.set(false);
    this.zonaScelta.set(null);
    this.zoom.set(1);
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
