# Tecnolambro — sito vetrina

Sito statico (HTML/CSS/JS vanilla + GSAP via CDN). Nessun build step: si può
aprire con un server statico qualsiasi e va in produzione così com'è su
Netlify, Vercel o hosting tradizionale.

## Sviluppo locale

Serve un server statico qualsiasi (per i moduli/font serviti da `assets/`).
Da questa cartella:

```bash
npx serve .
```

oppure

```bash
python -m http.server 8080
```

## Struttura

```
index.html            one-page principale
privacy-policy.html   pagina legale (leggera, no GSAP)
cookie-policy.html    pagina legale (leggera, no GSAP)
note-legali.html      pagina legale (leggera, no GSAP)
css/style.css         design system + animazioni del sito principale
css/legal.css         stile leggero per le pagine legali
js/main.js            tutta la logica GSAP/ScrollTrigger/SplitText + form/cookie
assets/fonts/         Space Grotesk + IBM Plex Mono, self-hosted (nessuna
                       chiamata a Google Fonts: vedi cookie-policy.html)
assets/img/           loghi e immagini reali del cliente (vedi sotto)
robots.txt, sitemap.xml
```

## Asset reali ancora mancanti

Cercare nel codice il commento `<!-- ASSET REALE DA SOSTITUIRE: ... -->`
per il punto esatto in cui va inserito ogni asset. In sintesi:

1. **`assets/img/tecnolambro-logo.png`** — il file del logo ufficiale
   fornito dal cliente non è ancora stato salvato in questa cartella (è
   stato incollato come immagine in chat, non come file: va salvato e
   copiato qui manualmente). Finché manca, la nav mostra un fallback
   testuale "TECNOLAMBRO".
2. **Colore blu del brand** — `--blue-500` in `css/style.css` è una stima
   a occhio fatta sull'anteprima del logo, non un valore campionato con un
   color-picker sul file reale. Una volta disponibile il PNG, campionare
   il blu esatto (e derivarne le varianti `--blue-700/800/900/950`) e
   aggiornare le variabili in cima a `css/style.css`.
3. Foto e video reali dello stabilimento di Miradolo Terme (per affiancare
   o sostituire le illustrazioni tecniche vettoriali).
4. Copie digitali dei certificati ISO 9001:2015 / ISO 14001:2015, per i
   link "scarica il certificato" nella sezione Qualità.
5. Elenco clienti/settori che il cliente autorizza a citare o mostrare
   come loghi (attualmente non c'è nessun blocco loghi cliente: solo
   Siemens Telecomunicazioni è citata, come da fatto storico verificato).
6. Email aziendale ufficiale, da inserire in footer, form e pagine legali
   (oggi il sito espone solo il telefono +39 0382 75385).
7. **Form di contatto**: `#contact-form` in `index.html` non è collegato
   a nessun backend. Il JS in `js/main.js` (`initContactForm`) intercetta
   il submit e mostra solo un messaggio di stato: va collegato a un
   servizio reale (form handler del proprio hosting, indirizzo email
   dedicato, o altro) prima della pubblicazione.
8. **Dominio**: tutte le URL assolute (canonical, Open Graph, JSON-LD,
   sitemap.xml, robots.txt) usano `https://www.tecnolambro.it/` come
   segnaposto plausibile: va confermato o sostituito con il dominio reale
   prima del lancio.

## Nota legale importante

**Privacy Policy, Cookie Policy e Note legali sono bozze**, scritte sulla
base di ciò che il sito effettivamente installa oggi (nessun cookie di
profilazione, nessun analytics; unico servizio di terze parti è la mappa
di Google Maps, caricata solo su azione esplicita dell'utente). Vanno
fatte validare da un consulente legale/privacy prima della pubblicazione,
in particolare:

- se in futuro si aggiungono strumenti come Google Analytics, pixel di
  remarketing, newsletter o CRM, queste pagine e il banner cookie vanno
  aggiornati **prima** di attivare quegli strumenti, non dopo;
- il banner cookie in `js/main.js` (`initCookieBanner`) blocca il
  caricamento della mappa finché l'utente non accetta esplicitamente:
  è un'implementazione tecnica corretta, ma la sua conformità va comunque
  verificata da un legale in base all'evoluzione del sito.

## Accessibilità e motion

- Ogni animazione GSAP è disattivata (fallback statico, contenuto sempre
  visibile) se l'utente ha impostato `prefers-reduced-motion: reduce`.
- La galleria orizzontale "Cosa facciamo" e la sequenza hero degradano a
  un layout statico (grid che va a capo / illustrazione ferma) sotto
  reduced motion, invece di restare bloccate a metà animazione.
- Contrasti, focus state e struttura heading sono stati impostati per
  WCAG 2.1 AA; è comunque consigliata una verifica finale con uno
  strumento come axe o Lighthouse dopo l'inserimento degli asset reali
  (immagini/video aggiungono testo alternativo da rivedere caso per caso).

## v2 (fuori scope per questa consegna)

Il brief menziona come step opzionale futuro il porting della sequenza
hero "Moto Perpetuo" su Three.js/WebGL per un pezzo 3D texturizzato. La
versione attuale è interamente SVG + CSS 3D transforms (via GSAP), più
leggera e affidabile su tutti i dispositivi: da valutare come evoluzione
solo dopo validazione di questa versione con il cliente.
