import { Injectable, signal } from '@angular/core';

/**
 * Cosa passa per la rete da quando la pagina è aperta, contato dal browser stesso:
 * i file del sito (il codice dello strumento), le richieste verso altri siti e
 * i tentativi di invio che la regola della pagina ha bloccato.
 */
@Injectable({ providedIn: 'root' })
export class Rete {
  readonly fileDelSito = signal(0);
  readonly altriSiti = signal(0);
  readonly inviiBloccati = signal(0);
  readonly online = signal(navigator.onLine);

  constructor() {
    new PerformanceObserver((elenco) => {
      for (const voce of elenco.getEntries()) {
        if (new URL(voce.name).origin === location.origin) this.fileDelSito.update((n) => n + 1);
        else this.altriSiti.update((n) => n + 1);
      }
    }).observe({ type: 'resource', buffered: true });

    document.addEventListener('securitypolicyviolation', (evento) => {
      if (/connect-src|form-action/.test(evento.effectiveDirective))
        this.inviiBloccati.update((n) => n + 1);
    });

    addEventListener('online', () => this.online.set(true));
    addEventListener('offline', () => this.online.set(false));
  }
}
