# Personal Health — терминал здоровья

Дашборд для настенного планшета в стиле зелёного ЭЛТ-терминала. Показывает данные из Garmin Connect, погоду и часы.

**Страницы** (переключаются стрелками `[<] [>]` или клавишами ← →):

1. **Главная.** Фигура с проработанными мышцами (MuscleMapJS), шаги, сон, пульс покоя, Body Battery, стресс, графики и журнал тренировок.
2. **Тренировки.** Последняя тренировка с упражнениями, итоги за 7 дней, история.
3. **Сон.** Оценка, фазы сна, факторы оценки, ночи по фазам, средние показатели.
4. **Бег.** Последняя пробежка (темп, каденс, мощность, пульсовые зоны), графики, итоги.

## Стек

React 18, TypeScript, Vite. Сборка собирается в **один HTML-файл** (`vite-plugin-singlefile`) и открывается прямо с диска. Цель сборки — Chrome 109, последний Chrome для Windows 8.1. Анимации сделаны на anime.js 3.

## Команды

```bash
npm install
npm run dev          # разработка: http://localhost:5173
npm run build        # сборка → dist/tablet/
npm test             # unit-тесты (Vitest)
npm run lint         # ESLint
npm run format       # Prettier
npm run ci           # всё, что проверяет CI: lint, format, typecheck, тесты, сборка, размер
```

После `npm run build` в `dist/tablet/` лежат:

- `garmin-dashboard.html` — весь дашборд в одном файле;
- `start-dashboard.bat` — запуск на планшете.

## Установка на планшет (Windows)

1. Скачай `garmin-dashboard.html` и `start-dashboard.bat` из [последнего релиза](https://github.com/OlegDegterov/personal_health/releases/latest) и положи оба файла на рабочий стол планшета.
2. Запусти `start-dashboard.bat`. Он откроет Chrome в режиме киоска с отдельным профилем и отключённой проверкой CORS: API Garmin не разрешает запросы из браузера. В этом окне ничего, кроме дашборда, не открывай.
3. **[НАСТРОЙКИ]** → вставь Personal API key из Garmin Connect (Настройки → Personal API Token) → сохрани.
4. Автозапуск: положи ярлык на `start-dashboard.bat` в `shell:startup` и включи автовход (`netplwiz`).

Настройки и последний ответ хранятся в `localStorage` этого профиля Chrome (ключи `gdcfg`, `gdcache`).

### Автообновление

При каждом запуске `start-dashboard.bat` проверяет последний релиз на GitHub. Если там новая версия, батник скачивает `garmin-dashboard.html`, сверяет SHA-256 с `SHA256SUMS.txt` из того же релиза и только после этого заменяет файл на рабочем столе. Предыдущая версия сохраняется рядом как `garmin-dashboard.prev.html`.

- Нет сети, таймаут или хэш не совпал: запускается текущий файл, ничего не ломается.
- Журнал: `%USERPROFILE%\garmin-dash-update.log`.
- Отключить: `set "UPDATE=0"` в начале батника.
- Откатиться: удали `garmin-dashboard.html`, переименуй `garmin-dashboard.prev.html` в `garmin-dashboard.html` и выключи обновление. Или скачай нужную версию со страницы Releases.
- Версия видна в верхней строке дашборда (`v1.2.3`).
- Сам батник не обновляется. Если в релизе изменился `start-dashboard.bat`, замени его вручную.

## Релизы и CI

- Коммиты в `main` попадают только через PR со squash-merge. Заголовок PR оформляется по [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/): `feat: …` поднимает minor-версию, `fix: …` и `perf: …` — patch, `feat!: …` — major. Остальные типы (`chore`, `ci`, `docs`, `refactor`, `test`) релиз не создают.
- CI на каждый PR: lint, format, typecheck, тесты, сборка и проверка размера HTML (лимит 450 KB). Сборка из PR доступна как артефакт `tablet-<sha>`.
- [release-please](https://github.com/googleapis/release-please) держит открытым PR «chore(main): release X.Y.Z» с обновлённым `CHANGELOG.md` и версией. Когда его мёржишь, появляются тег `vX.Y.Z` и GitHub Release с файлами `garmin-dashboard.html`, `start-dashboard.bat`, zip-архивом, `SHA256SUMS.txt` и build provenance (`gh attestation verify garmin-dashboard.html -R OlegDegterov/personal_health`).
- Dependabot раз в неделю присылает сгруппированные обновления npm и GitHub Actions. Мажорные версии React и anime.js игнорируются: цель — Chrome 109.

## Разработка на Mac с живыми данными

```bash
npm run dev
open -na "Google Chrome" --args --user-data-dir=/tmp/chrome-garmin-dev --disable-web-security http://localhost:5173
```

## Структура

```
src/
  api/         garmin.ts (токен + эндпоинты), weather.ts (Open-Meteo), http.ts
  lib/         parse.ts (ответы Garmin → данные), types.ts, constants.ts, format.ts, demo.ts
  hooks/       useGarmin (опрос по интервалу + кэш), useNow, useWeather, useSize
  components/  BodyMap, TopBar, SettingsModal, charts (canvas), ui (Frame, SegBar, Kv, Typewriter, CanvasBox)
  pages/       OverviewPage, WorkoutsPage, SleepPage, RunningPage
  vendor/musclemap/   MuscleMapJS (MIT), вендорено из исходников
scripts/       start-dashboard.bat (запуск + автообновление), pack-tablet.mjs, check-size.mjs
.github/       CI, release-please, Dependabot
```

## Ограничения API Garmin

- Personal API отдаёт только выполненные тренировки. Календарь и Garmin Coach (запланированные) возвращают 404, поэтому «сегодня» и «завтра» берутся из недельного плана в настройках.
- Ключ действует от 30 дней до года. Когда истечёт, создай новый и вставь его в настройки.

## Лицензии сторонних компонентов

- MuscleMapJS — MIT © 2026 Abdofallah, `src/vendor/musclemap/LICENSE`. Данные контуров тела из MuscleMap SwiftUI SDK, MIT © Melih Çolpan.
- anime.js — MIT © Julian Garnier.
- Погода — Open-Meteo (CC BY 4.0).
