# Silver Pines — дело Эдди Вельвета / The Eddie Velvet case

Доска улик по сюжету **Silver Pines** (Wych Elm / Team17, 2026): персонажи, события, три концовки, гипотезы и улики за и против. Итоговая версия доски помечена как вердикт, опровергнутые — как ложный след. Собрано для разбора на канале «SuHo'е мнение».

An evidence board for the plot of **Silver Pines** (Wych Elm / Team17, 2026): characters, events, the three endings, hypotheses, and the clues for and against each one. The board's final version is marked as the verdict, ruled-out versions as false leads.

## Что внутри / What's inside

| Путь / Path | Что это / What it is |
|---|---|
| `data/build_data.py` | Источник правды: все карточки и связи. Правки вносятся здесь. / Single source of truth: every card and link. Edit here. |
| `data/data.json` | Сгенерированные данные доски. / Generated board data. |
| `data/i18n_en.json` | Английский перевод карточек, связей и подписей источников. / English translation of cards, link notes and source titles. |
| `src/template.html` | Шаблон страницы: разметка и стили. / Page template: markup and styles. |
| `src/board.js` | Логика доски: граф Cytoscape.js, вкладки, досье, переключатель RU/EN. / Board logic: Cytoscape.js graph, tabs, dossier, RU/EN switch. |
| `tools/build_html.py` | Собирает один файл `dist/index.html` из шаблона, скрипта, данных и перевода. / Builds the single-file `dist/index.html`. |
| `tools/build_canvas.py` | Собирает Obsidian Canvas. / Builds the Obsidian canvas. |
| `dist/index.html` | Готовая страница: открыть в браузере. / The built page: open it in a browser. |
| `dist/silver-pines-board.canvas` | Та же доска для Obsidian. / The same board for Obsidian. |

## Сборка / Build

```sh
./build.sh
```

Нужен только Python 3, без зависимостей. / Needs nothing but Python 3.

Каждый пуш в `main` пересобирает доску и выкладывает `dist/` на GitHub Pages (`.github/workflows/pages.yml`): <https://scrobot.github.io/silver-pines-mind-map/>. / Every push to `main` rebuilds the board and publishes `dist/` to GitHub Pages.

Язык страницы переключается кнопками RU / EN в шапке, выбор запоминается. Ссылка с `#en` или `#ru` в конце сразу открывает нужный язык.

The page language switches with the RU / EN buttons in the header and is remembered. A link ending in `#en` or `#ru` opens that language directly.

## Откуда данные / Sources

- Сама игра: реплики, записки, памятные вещи и сцены всех трёх концовок. Реплики даны по русской локализации.
- Артбук «The Art of Silver Pines» (Wych Elm / Team17): имена персонажей и боссов, ключ-арт. Страницы указаны прямо в карточках. / The artbook: character and boss names, the key art; page numbers are on the cards.
- В английской версии реплики игры даны в оригинале там, где оригинал известен из источников. Остальное переведено с русской локализации. / In the English version, game lines use the original English wherever a source quotes it; the rest is translated back from the Russian localization.
- Теории сообщества, интервью разработчиков и пресса — ссылки прямо в карточках.

Spoilers: the board covers the whole game, all three endings included.
