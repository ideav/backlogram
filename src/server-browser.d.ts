// Браузерная сборка react-dom/server (web-стримы) — для src/entry-server.tsx.
declare module 'react-dom/server.browser' {
  export { renderToReadableStream } from 'react-dom/server'
}
