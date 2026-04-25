import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const requiredHtmlFiles = ['index.html', 'start.html']

for (const fileName of requiredHtmlFiles) {
  test(`${fileName} includes the Yandex.Metrika counter`, () => {
    const source = readFileSync(new URL(`../${fileName}`, import.meta.url), 'utf8')

    assert.match(source, /<!-- Yandex\.Metrika counter -->/)
    assert.match(source, /https:\/\/mc\.yandex\.ru\/metrika\/tag\.js\?id=108758829/)
    assert.match(source, /ym\(108758829, 'init'/)
    assert.match(source, /ssr:true/)
    assert.match(source, /webvisor:true/)
    assert.match(source, /ecommerce:"dataLayer"/)
    assert.match(source, /https:\/\/mc\.yandex\.ru\/watch\/108758829/)
    assert.match(source, /<!-- \/Yandex\.Metrika counter -->/)
  })
}
