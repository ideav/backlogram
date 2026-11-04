/**
 * Стандартный тег Яндекс.Метрики. Вебвизор не включаем. Счётчик стартует
 * только на домене сайта и его поддоменах: локальные превью и проверки
 * не должны засорять отчёты.
 */
export function metrikaSnippet(metrikaId: string, siteHost: string): string {
  const id = metrikaId.trim().replace(/\D/g, '')
  if (id === '') return '<!-- METRIKA_ID не задан: счётчик не подключён -->'
  const host = siteHost.trim().toLowerCase()
  const guard =
    host === ''
      ? ''
      : `if(!function(h,d){return h===d||h.slice(-d.length-1)==='.'+d}(location.hostname,${JSON.stringify(host)}))return;\n      `
  return `<script>
      (function(){${guard}(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
      ym(${id}, 'init', {clickmap:true, trackLinks:true, accurateTrackBounce:true});
      })();
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/${id}" style="position:absolute;left:-9999px;" alt="" /></div></noscript>`
}
