// #879: образец info.html копируется сборщиком excel-to-app буквально.
// Шаблонизатор ядра (Parse_block, crm index.php) считает {слово} точкой вставки
// и в <script>, поэтому JS template literals (`${x}`) дают пустую страницу
// (crm#5231, crm#5386). Страж: в образце нет ${…} и обратных кавычек в коде,
// а скрипт после подстановки ядра остаётся валидным JS.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const doc = readFileSync(
  new URL("../docs/marketing/info-html-app-ready.md", import.meta.url),
  "utf8",
);
const sample = (doc.match(/```html\n([\s\S]*?)\n```/) || [])[1];

test("образец info.html найден", () => {
  assert.ok(sample, "нет блока ```html в info-html-app-ready.md");
});

test("в образце нет ${…} и template literals", () => {
  assert.equal(sample.includes("${"), false, "в образце есть ${");
  assert.equal(sample.includes("`"), false, "в образце есть обратная кавычка");
});

test("скрипт образца — валидный JS после подстановки ядра", () => {
  const js = (sample.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
  assert.ok(js, "нет <script> в образце");
  const rendered = js.replace(/\{_global_\.\w+\}/g, "x");
  assert.doesNotThrow(() => new Function("return async () => {" + rendered + "}"));
});

test("в образце предупреждение про фигурные скобки", () => {
  assert.match(doc, /Фигурные скобки — только для подстановок ядра/);
});
