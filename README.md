# Silver Pines — дело Эдди Вельвета / The Eddie Velvet case

Доска улик по сюжету **Silver Pines** (Wych Elm / Team17, 2026): персонажи, события, три концовки, гипотезы и улики за и против. У каждой улики есть ссылка на нужную секунду в записи стрима. Собрано для разбора на канале «SuHo'е мнение».

An evidence board for the plot of **Silver Pines** (Wych Elm / Team17, 2026): characters, events, the three endings, hypotheses, and the clues for and against each one. Every clue links to the exact second of a stream recording.

## Что внутри / What's inside

| Путь / Path | Что это / What it is |
|---|---|
| `data/build_data.py` | Источник правды: все карточки и связи. Правки вносятся здесь. / Single source of truth: every card and link. Edit here. |
| `data/data.json` | Сгенерированные данные доски. / Generated board data. |
| `src/template.html` | Шаблон страницы (Cytoscape.js, вкладки, досье). / Page template (Cytoscape.js, tabs, dossier panel). |
| `tools/build_html.py` | Собирает `dist/index.html` из шаблона и данных. / Builds `dist/index.html`. |
| `tools/build_canvas.py` | Собирает Obsidian Canvas. / Builds the Obsidian canvas. |
| `dist/index.html` | Готовая страница: открыть в браузере. / The built page: open it in a browser. |
| `dist/silver-pines-board.canvas` | Та же доска для Obsidian. / The same board for Obsidian. |

## Сборка / Build

```sh
./build.sh
```

Нужен только Python 3, без зависимостей. / Needs nothing but Python 3.

## Откуда данные / Sources

- Три стрима автора с полным прохождением на 100%: [13.10](https://youtu.be/o3eT4Ipg67E), [17.10](https://youtu.be/29WK_-5cpOQ), [18.10.2026](https://youtu.be/YNTpIQ-cENk). Таймкоды на доске ведут в эти записи.
- Ключевые реплики сверены по кадрам записи экрана (русские субтитры игры). Остальные цитаты взяты из расшифровки, где автор зачитывал текст вслух, и в них возможны неточности.
- Теории сообщества, интервью разработчиков и пресса — ссылки прямо в карточках.

Spoilers: the board covers the whole game, all three endings included.
