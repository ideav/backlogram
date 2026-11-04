import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// #868: кнопки перехода продублированы в конце текста каждого слайда.
for (const name of ['deck-partner', 'deck-client']) {
    test(`${name}: переход в конце слайда`, () => {
        const html = readFileSync(new URL(`../public/partners/${name}.html`, import.meta.url), 'utf8');
        assert.match(html, /nav\.className = 'slide-nav'/);
        assert.match(html, /'Далее: ' \+ title/);
        assert.match(html, /\.slide-nav-next \{/);
        assert.match(html, /b\.disabled = /, 'на краях колоды стрелка панели неактивна');
        assert.match(html, /\.bar, \.slide-nav \{ display: none; \}/, 'в печати кнопки скрыты');
    });
}
