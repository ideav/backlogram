# Переезд блога на ideav.ru/blog/ — проверка и выкладка

Issue [#522](https://github.com/ideav/backlogram/issues/522). Блог собирался под
корень поддомена `blog.ideav.ru`; когда сборку скопировали в папку `/blog/`
основного домена, все пути (`/posts/…`, `/_astro/…`, `/uploads/…`) остались
корневыми и ушли мимо блога. Теперь Astro собирает блог с `base: '/blog'`, а
поддомен отдаёт 301.

Главное требование к переезду — **не потерять накопленный вес**: каждый старый
адрес обязан вести 301-редиректом на свой новый, а не «всё на главную».

## Локальная проверка на настоящем Apache

`.htaccess` нельзя проверить ни тестом, ни глазами — только сервером. Рецепт
повторяет прод: два виртуальных хоста, корневой `.htaccess` с фронт-контроллером
платформы и `.htaccess` блога в подпапке.

```bash
# 1. Собрать блог (в dist/ едет и .htaccess, и 404.html)
cd blog-v2 && npm run build && cd ..

# 2. Разложить дерево как на проде
W=/tmp/blogmove && rm -rf $W && mkdir -p $W/root $W/sub
cp -r blog-v2/dist $W/root/blog
cp public/.htaccess $W/root/.htaccess
cp index.html $W/root/index.html
printf '<?php echo "PLATFORM ENGINE"; ?>' > $W/root/index.php   # заглушка движка
cp blog-subdomain-redirect/.htaccess $W/sub/.htaccess

# 3. Виртуальные хосты
cat > $W/vhosts.conf <<'EOF'
ServerName localhost
LoadModule rewrite_module modules/mod_rewrite.so
<VirtualHost *:80>
  ServerName ideav.local
  DocumentRoot /var/www/root
  <Directory /var/www/root>
    AllowOverride All
    Require all granted
    Options -Indexes +FollowSymLinks
  </Directory>
</VirtualHost>
<VirtualHost *:80>
  ServerName blog.ideav.local
  DocumentRoot /var/www/sub
  <Directory /var/www/sub>
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>
EOF

# 4. Поднять Apache
docker run -d --name blogmove-test -p 8098:80 \
  -v $W/root:/var/www/root:ro -v $W/sub:/var/www/sub:ro \
  -v $W/vhosts.conf:/usr/local/apache2/conf/extra/httpd-vhosts.conf:ro \
  httpd:2.4-alpine sh -c \
  "sed -i 's|^#Include conf/extra/httpd-vhosts.conf|Include conf/extra/httpd-vhosts.conf|' \
   /usr/local/apache2/conf/httpd.conf && httpd-foreground"
```

Проверка (заголовок `X-Forwarded-Proto: https` имитирует TLS-прокси прода —
без него сработает правило http→https):

```bash
probe() { printf "%-50s " "$2"; curl -s -o /dev/null \
  -w "%{http_code} -> %{redirect_url}\n" -H "Host: $1" \
  -H "X-Forwarded-Proto: https" "http://localhost:8098$2"; }

probe ideav.local /blog/                                        # 200
probe ideav.local /blog/posts/integram-on-premise-lokalno/      # 200
probe ideav.local /blog/sitemap.xml                             # 301 -> /blog/sitemap-index.xml
probe ideav.local /blog/2024/03/crm-sistema-dlya-srednego-biznesa # 301 -> /blog/posts/…/
probe ideav.local /blog/net-takoy-stranicy/                     # 404 (страница блога, не движок)
probe ideav.local /asmoseo/table/42                             # уходит во фронт-контроллер
probe blog.ideav.local /posts/integram-on-premise-lokalno/      # 301 -> ideav.ru/blog/posts/…/
```

Ожидаемые ответы — в комментариях. Удалить контейнер: `docker rm -f blogmove-test`.

### Что этот прогон уже поймал

- `RedirectMatch` для `/blog/sitemap.xml` не срабатывал: mod_rewrite в том же
  файле отрабатывает раньше mod_alias, и catch-all 404 съедал редирект. Заменено
  на `RewriteRule` выше по файлу.
- **Правила корневого `.htaccess` в подпапку не наследуются.** Пока в
  `/blog/.htaccess` не было своих правил канонизации, `http://ideav.ru/blog/…`
  и `www.` отвечали 200 вместо 301 — дубли и утечка веса. Правила www→голый хост
  и http→https продублированы в файле блога.

## Порядок выкладки

1. `cd blog-v2 && npm run build` → содержимое `dist/` (вместе с `.htaccess` и
   `404.html`) выложить в `<веб-корень ideav.ru>/blog/`.
2. Пересобрать и выложить основной сайт (`npm run build`): в нём обновлены
   ссылки на блог, `robots.txt` и `sitemap-index.xml`.
3. Проверить вживую: главная блога, статья, категория, тег, поиск,
   `/blog/rss.xml`, `/blog/sitemap-index.xml`, картинка из статьи.
4. **Только после этого** заменить веб-корень `blog.ideav.ru` на
   `blog-subdomain-redirect/.htaccess`. Раньше — нельзя: поисковик поймает 301
   в ещё не выложенный контент.
5. Проверить редиректы поддомена (см. `blog-subdomain-redirect/README.md`).

## Чтобы не потерять вес — обязательные шаги после выкладки

| Шаг | Где | Зачем |
| --- | --- | --- |
| «Переезд сайта»: `blog.ideav.ru` → `ideav.ru` | Яндекс.Вебмастер | Явный сигнал о смене адреса; без него склейка идёт медленнее |
| «Изменение адреса» для ресурса `blog.ideav.ru` | Google Search Console | То же для Google; оба ресурса должны быть подтверждены |
| Добавить `https://ideav.ru/sitemap-index.xml` | Вебмастер + GSC | В индексе — карта с новыми адресами |
| Не снимать 301 с поддомена **минимум год** | Хостинг | Вес продолжает перетекать, пока по старым адресам ходят |
| Не блокировать поддомен в robots | Хостинг | Закрытый от обхода редирект поисковик не увидит и не склеит |
| Обновить внешние ссылки, где можем: соцсети, Хабр, каталоги | Вручную | Прямая ссылка сильнее ссылки через редирект |

Автоматические инварианты переезда (нет ссылок на поддомен, 301 сохраняет путь,
карты сайта смотрят в подпапку) сторожит `tests/issue-522-blog-subpath.test.mjs`.
