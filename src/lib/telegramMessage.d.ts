export type TelegramSeg = { t: string; b?: boolean; href?: string }
export type TelegramLine = { hr: true } | { segs: TelegramSeg[] }
export function parseTelegramMessage(text: string): TelegramLine[]
