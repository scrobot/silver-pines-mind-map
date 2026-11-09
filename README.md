# Silver Pines — дело Эдди Вельвета / The Eddie Velvet case

Доска улик по сюжету **Silver Pines** (Wych Elm / Team17, 2026): персонажи, события, три концовки, гипотезы и улики за и против. Каждая улика привязана к месту в игре, где её видно: сцена, записка, плёнка, страница дневника. Доска самодостаточна: читается без внешнего контекста и покрывает игру целиком.

An evidence board for the plot of **Silver Pines** (Wych Elm / Team17, 2026): characters, events, the three endings, hypotheses, and the clues for and against each one. Every clue is anchored to the place in the game where it can be seen: a scene, a note, a tape, a diary page. The board stands on its own: it needs no outside context and covers the whole game.

Внимание: спойлеры ко всей игре, включая все три концовки. / Spoilers: the board covers the whole game, all three endings included.

## Что внутри / What's inside

| Путь / Path | Что это / What it is |
|---|---|
| `data/build_data.py` | Источник правды: все карточки и связи. Правки вносятся здесь. / Single source of truth: every card and link. Edit here. |
| `data/data.json` | Сгенерированные данные доски. / Generated board data. |
| `data/i18n_en.json` | Английский перевод карточек, связей и подписей источников. / English translation of cards, link notes and source titles. |
| `data/board.json` | Раскладка пробковой доски: где висит каждая улика, чем приколота, какие нити между ними. / The cork board's layout: where each clue hangs, how it is pinned, the threads between them. |
| `data/board_nodes.json` | Какая улика на доске какой карточке дела соответствует. / Which clue on the board belongs to which card in the case file. |
| `src/template.html` | Шаблон страницы: разметка и стили оболочки. / Page template: markup and the shell's styles. |
| `src/board.css` | Оформление доски: бумага, кнопки, нити, свет лампы. / The board's look: paper, pins, threads, lamp light. |
| `src/cork.js` | Сама доска: рисует пробку, двигает камеру, открывает улики. / The board itself: draws the cork, moves the camera, opens clues. |
| `src/board.js` | Оболочка дела: вкладки, досье, поиск, переключатель RU/EN. / The case-file shell: tabs, dossier, search, RU/EN switch. |
| `assets/` | Картинки, фактуры и шрифты доски — готовые, лежат в репозитории. / The board's images, textures and fonts — prebuilt and committed. |
| `tools/build_html.py` | Собирает `dist/index.html` и кладёт рядом `assets/`. / Builds `dist/index.html` and copies `assets/` beside it. |
| `tools/build_canvas.py` | Собирает Obsidian Canvas. / Builds the Obsidian canvas. |
| `tools/import_board.py` | Переносит раскладку доски из проекта ролика. Запускается руками. / Imports the board layout from the film project. Run by hand. |
| `tools/build_assets.py` | Пережимает картинки и собирает шрифты. Запускается руками, нужен Pillow. / Re-encodes the images and gathers the fonts. Run by hand, needs Pillow. |
| `dist/index.html` | Готовая страница: открыть в браузере. / The built page: open it in a browser. |
| `dist/silver-pines-board.canvas` | Та же доска для Obsidian. / The same board for Obsidian. |

`data/data.json` и `dist/` — результат сборки: руками их не правят. / `data/data.json` and `dist/` are build output: never edit them by hand.

## Сборка / Build

```sh
./build.sh
```

Или те же шаги вручную / Or the same steps by hand:

```sh
python data/build_data.py
python tools/build_html.py
python tools/build_canvas.py data/data.json dist/silver-pines-board.canvas
```

Нужен только Python 3, без зависимостей. / Needs nothing but Python 3.

Каждый пуш в `main` пересобирает доску и выкладывает `dist/` на GitHub Pages (`.github/workflows/pages.yml`). / Every push to `main` rebuilds the board and publishes `dist/` to GitHub Pages.

Язык страницы переключается кнопками RU / EN в шапке, выбор запоминается. Ссылка с `#en` или `#ru` в конце сразу открывает нужный язык.

The page language switches with the RU / EN buttons in the header and is remembered. A link ending in `#en` or `#ru` opens that language directly.

## Откуда данные / Sources

- Доска опирается на саму игру. В карточке указано место, где улику видно: сцена, записка, плёнка, страница дневника, концовка.
- Цитаты приведены по русским субтитрам игры. Часть ключевых реплик вычитана по кадрам и приведена дословно — список в [`docs/verification.md`](docs/verification.md); остальные записаны по ходу прохождения и могут расходиться с игрой в отдельных словах.
- В английской версии реплики игры даны в оригинале там, где оригинал известен; остальное переведено с русской локализации.
- Внешние материалы — интервью разработчиков, пресса, обсуждения игроков, гайды, справочные ссылки — размечены как внешние и даны ссылками прямо в карточках. Правило доски: внешний пересказ не бывает единственным основанием для факта из игры; где опереться больше не на что, карточка говорит об этом прямо.

- The board rests on the game itself. Each card names the place where the clue can be seen: a scene, a note, a tape, a diary page, an ending.
- Quotes follow the game's Russian subtitles. Some key lines have been read off the frames and are quoted verbatim — see [`docs/verification.md`](docs/verification.md); the rest were taken down during play and may differ from the game in individual words.
- In the English version, game lines use the original English wherever it is known; the rest is translated back from the Russian localization.
- Outside material — developer interviews, press, player discussion, guides, reference links — is labelled as outside material and linked from the cards themselves. The board's rule: an outside retelling is never the sole basis for an in-game fact; where there is nothing else to stand on, the card says so.

## Права / Rights

Код и письменный разбор — под лицензией MIT (`LICENSE`); кадры и цитаты из игры принадлежат правообладателям, см. [`NOTICE`](NOTICE). / The code and the written analysis are MIT (`LICENSE`); the game stills and quoted game text belong to their rightsholders, see [`NOTICE`](NOTICE).
