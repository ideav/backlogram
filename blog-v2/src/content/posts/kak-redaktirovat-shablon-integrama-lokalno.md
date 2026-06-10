---
title: Как редактировать шаблон Интеграма локально
description: Интеграм имеет встроенный текстовый редактор шаблонов, а также конструктор на основе GapesJS для верстки простых форм, но вы также можете использовать свой локальный редактор для правки этих
  файлов.
pubDate: '2025-02-13'
category: Разработка
author: Команда Интеграм
originalUrl: https://blog.ideav.online/2025/02/kak-redaktirovat-shablon-integrama-lokalno
tags:
- разработка
---

Интеграм имеет встроенный текстовый редактор шаблонов, а также конструктор на основе GapesJS для верстки простых форм, но вы также можете использовать свой локальный редактор для правки этих файлов.

Файлы можно загрузить вручную в меню Файлы:

![enter image description here](/uploads/98f6e6d8-15bfb678-2e01-5fb6-8871-0cd6b4497b56.png)

Меню Файлы, папка templates – защищенные шаблоны

Если вы используете VS Code, то в нем есть плагин Run On Save, с помощью которого можно закидывать файлы в шаблоны Интеграма – в меню Файлы в папку templates. Он имитирует ручную загрузку с правами пользователя, роль которого имеет доступ к файлам.

В его настройках json можно использовать такой json, заменив {ВашаБД}, {ТокенАвторизации} и {ТокенXSRF} своими значениями:
```
    {
      "folders": [
        {
          "path": ".."
        }
      ],
      "settings": {
        "emeraldwalk.runonsave": {
              "commands": [
            {
              "match": "integram-front/templates/.*html$",
              "cmd": "curl -v POST -H "Connection: close" -H "Content-Type: multipart/form-data" -H "x-authorization: {ТокенАвторизации}" -F "_xsrf={ТокенXSRF}" -F "add_path=" -F "upload=Загрузить" -F "rewrite=true" -F "userfile=@${file}" https://integram.io/{ВашаБД}/dir_admin/?JSON&templates=1"
            }
          ]
        }
      },
    }
```

По аналогии можно сохранять файлы стилей и скриптов в папку download.

Заведите в своем Интеграме роль **api** и пользователя с этой ролью: ![enter image description here](/uploads/76786cdd-9c5bf15b-7aad-5e40-a446-dda7f43f1638.png) Роль с доступом на изменение файлов

Сгенерируйте этому пользователю токены в новом рабочем месте api и пользуйтесь своим любимым редактором! ![enter image description here](/uploads/b0a06a17-bcd6324b-66f9-5005-88fd-38fe87448632.png) По адресу **/api** теперь есть API-explorer

Спасибо и успехов!
