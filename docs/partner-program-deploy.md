# Партнёрская программа: внедрение на боевой сайт ideav.ru

Ветка: `partner-program` (собрана из `partner-price-18500`, `partner-links`, `partner-offer-14` поверх `origin/main` a3cb687). Откат и список изменений: `ЗАМЕНА.md` (в папке ideav-работа/партнёрка у автора).

## 0. До выкладки (блокеры)
1. **Платёжная ссылка Точки на 18 500 ₽.** Кнопка «Оплатить» на странице `/excel-to-app.html#12500` ведёт на `PAYMENT_CHECKOUT_URL` (`src/pages/ExcelToApp.tsx`). Сумма в ссылке задана в Точке: создать новую ссылку на 18 500 ₽ и подставить в константу. Пока этого нет, на странице написано 18 500 ₽, а платится прежняя сумма.
2. **Утвердить раздел 14 оферты** (`src/data/partner-docs.mjs`): 5 000 ₽ с первой оплаты и 20% с последующих для партнёров с допуском; бессрочно; допуск без пересдачи; порог выплаты 1 000 ₽ (остаётся); правило «больше 3 прямых обращений».
3. **Дата вступления.** По разделу 11 оферты новая редакция вступает не раньше чем через 30 дней после публикации. Дата редакции в коде: 10 ноября 2026 (`PARTNER_OFFER_UPDATED`) — поправить на дату публикации.

## 1. Код
1. Открыть пулреквест `partner-program` → `main`, дождаться тестов (`node --test tests/*.test.mjs`; известные падения main не связаны с веткой).
2. После слияния выложить сайт обычным способом (`vite build`, содержимое `dist/` в вебрут). `public/.htaccess` копируется сборкой и уже содержит правило `^m/<токен>` над front controller — проверить, что в вебруте оно есть.

## 2. Сервер (однократно)
PHP 7.2 или новее.
1. Каталог данных вне вебруты: `mkdir -p /var/www/partner-data && chmod 700 /var/www/partner-data`, владелец — пользователь веб-сервера.
2. В вебруте создать `partner-config.php` (образец `public/partner-config.example.php`, в git не попадает):
   `define('PARTNER_DATA_DIR','/var/www/partner-data'); define('PARTNER_IP_SALT','<случайная строка>');`
3. Файлы материалов (в git не входят) положить в вебрут, например `/partner-files/`:
   `video-excel.mp4`, `video-bot.mp4`, `prezentaciya.pdf`, `kommercheskoe-predlozhenie.docx`.
4. Создать `/var/www/partner-data/materials.json` (адрес назначения берётся только отсюда):
   ```json
   {
     "video_excel": {"title": "Видео: из Excel в приложение", "url": "https://ideav.ru/partner-files/video-excel.mp4"},
     "video_bot":   {"title": "Видео: бот и дашборды",        "url": "https://ideav.ru/partner-files/video-bot.mp4"},
     "presentation":{"title": "Презентация",                  "url": "https://ideav.ru/partner-files/prezentaciya.pdf"},
     "kp":          {"title": "Коммерческое предложение",     "url": "https://ideav.ru/partner-files/kommercheskoe-predlozhenie.docx"},
     "service":     {"title": "Страница услуги",              "url": "https://ideav.ru/excel-to-app.html", "aff": true}
   }
   ```
   `"aff": true` добавляет к адресу `?aff=<номер партнёра>`, чтобы регистрация засчиталась партнёру.

## 3. Выдача ссылок партнёру и проверка
1. `php partner-links-admin.php issue <номер партнёра>` — печатает персональные ссылки `https://ideav.ru/m/<токен>` на все материалы (повторный вызов даёт те же).
2. Проверка: `curl -sI https://ideav.ru/m/<токен>` → `302` и `Location` на материал, `Cache-Control: no-store`; неизвестный токен → `404`; `curl -sI -A "TelegramBot" …` тоже `302`, но в отчёте идёт как бот.
3. Сводка открытий: `php partner-links-admin.php report` (события — `/var/www/partner-data/events.jsonl`).

## 4. Что не входит в эту ветку
- Личный кабинет партнёра в `ideav/crm` (`templates/my`): пока только макет.
- Таблицы Интеграма для событий, экзамена и клиентов партнёра; перенос событий из `events.jsonl` в таблицы.
- Сопоставление метки `?start=<токен>` в боте `@Integrammbot` с партнёром.
- Слайды презентации 4, 6, 9 (ошибки) и заглушки бота и QR на слайдах 8 и 10.
- Рекламный текст «Демонстрация бесплатно» в `scripts/direct-create-cpa-campaign.mjs` (Яндекс Директ) не менялся.

## 5. Откат
`git revert` слияния (или откатить файлы) и выложить заново. Дополнительно удалить на сервере `partner-config.php`, каталог `partner-data` и файлы `/partner-files/`. Уже розданные ссылки `ideav.ru/m/…` после отката перестанут работать.
