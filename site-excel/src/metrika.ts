/**
 * Код счётчика Яндекс.Метрики для <head>.
 *
 * Жил в `vite.config.ts`, пока страница была одна. Со страницами кейсов и
 * сравнения (issue #626) тот же счётчик нужен и пререндеру — а два экземпляра
 * сниппета разъехались бы: `webvisor`, `clickmap` и прочие настройки должны
 * быть одинаковыми, иначе отчёты по страницам несопоставимы.
 */

/**
 * Пусто, если счётчик не задан. Пустой счётчик означает «не подключать»:
 * слать цели в несуществующий счётчик хуже, чем не слать вовсе, потому что
 * в Директе это выглядит как работающая цель с нулём конверсий.
 */
/**
 * `siteHost` — домен из SITE_URL. Счётчик стартует только на нём и его
 * поддоменах (issue #703): прод-сборку открывают и локально — превью,
 * пререндер, проверки на 127.0.0.1 — и такие визиты засоряли отчёты Метрики
 * адресами вида 127.0.0.1:8765. Без `ym` цели молча не уходят: conversion.ts
 * зовёт его через `window.ym?.()`.
 */
export function metrikaSnippet(metrikaId: string, siteHost = ''): string {
  const id = (metrikaId ?? '').trim().replace(/\D/g, '')
  if (id === '') return '<!-- METRIKA_ID не задан: счётчик не подключён -->'
  const host = (siteHost ?? '').trim().toLowerCase()
  const guard = host === ''
    ? ''
    : `if(!function(h,d){return h===d||h.slice(-d.length-1)==='.'+d}(location.hostname,${JSON.stringify(host)}))return;\n      `
  return `<script type="text/javascript">
      (function(){${guard}(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
      ym(${id}, 'init', {webvisor:true, clickmap:true, trackLinks:true, accurateTrackBounce:true});
      })();
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/${id}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>`
}
