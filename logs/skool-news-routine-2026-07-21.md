# Skool News blog routine — 2026-07-21

## Result: nessun video nuovo

## Dettagli

- Canale monitorato: https://www.youtube.com/@skool-news (channel_id: `UCWUO7B2bVefoae-ruV4g3XQ`, risolto via ricerca web).
- **Limite tecnico**: l'RSS feed del canale (`https://www.youtube.com/feeds/videos.xml?channel_id=UCWUO7B2bVefoae-ruV4g3XQ`) e la pagina `/videos` del canale non sono risultati raggiungibili da questo ambiente (WebFetch ha restituito HTTP 403 su `www.youtube.com`, su alcuni mirror Invidious/Piped, e anche su domini generici non-GitHub estranei alla cache — sembra un limite dell'ambiente di esecuzione più che un blocco specifico di YouTube). Non è stato quindi possibile leggere l'elenco autoritativo degli ultimi video direttamente dalla fonte.
- **Fallback usato**: ricerca web mirata (WebSearch) con query multiple: `site:youtube.com/watch "Skool News #"`, ricerche per numero di episodio (`#65`, `#66`, `#67`, `#68`), query generiche sul canale e sugli aggiornamenti della piattaforma Skool di luglio 2026.
- Episodio più recente individuato: **Skool News #65 — "Trafficmaxxing + Sacred Geometry"** (`https://www.youtube.com/watch?v=R33Wdu6vJis`), già presente in `processed_videos.json`. Nessun episodio #66 o successivo è emerso da nessuna delle query di ricerca.
- Tutti gli altri episodi trovati tramite le ricerche (`#24, #35, #39, #47, #54, #57, #58, #60, #61, #62, #63, #64, #65`) risultano già presenti in `content/skool-news/processed_videos.json`.

## Conclusione

Confrontando i video trovati con `processed_video_urls`, **zero video nuovi** da processare in questa esecuzione. Nessun articolo creato, `processed_videos.json` non modificato.

## Nota per la prossima esecuzione

Se il blocco di rete su `youtube.com`/RSS persiste, valutare l'aggiunta di un accesso autenticato o whitelisted per l'RSS del canale, così da non dipendere solo dai risultati di ricerca (che potrebbero non essere aggiornati in tempo reale e mancare episodi pubblicati nelle ultime ore/giorni).
