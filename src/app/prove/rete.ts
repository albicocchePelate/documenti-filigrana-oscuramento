import { Injectable, signal } from '@angular/core';

/**
 * Cosa passa per la rete da quando la pagina è aperta, contato dal browser stesso:
 * le richieste verso altri siti e i tentativi di invio che la regola della pagina ha bloccato.
 */
@Injectable({ providedIn: 'root' })
export class Rete {
  readonly altriSiti = signal(0);
  readonly inviiBloccati = signal(0);
  readonly online = signal(navigator.onLine);

  constructor() {
    new PerformanceObserver((elenco) => {
      for (const voce of elenco.getEntries()) {
        // Le richieste a questo sito sono il codice dello strumento che arriva; contano le altre
        if (new URL(voce.name).origin !== location.origin) this.altriSiti.update((n) => n + 1);
      }
    }).observe({ type: 'resource', buffered: true });

    document.addEventListener('securitypolicyviolation', (evento) => {
      // In locale il server di sviluppo di Angular apre una connessione per ricaricare la pagina
      // (ws://localhost): la regola la blocca, ma non è un invio. Online non esiste.
      if (evento.blockedURI.startsWith('ws://localhost')) return;
      if (/connect-src|form-action/.test(evento.effectiveDirective))
        this.inviiBloccati.update((n) => n + 1);
    });

    addEventListener('online', () => this.online.set(true));
    addEventListener('offline', () => this.online.set(false));
  }
}
