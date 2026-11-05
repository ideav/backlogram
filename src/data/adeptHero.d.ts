export interface AdeptHero {
  id: string
  label: string
  src: string
}
export const ADEPT_HEROES: AdeptHero[]
export const ADEPT_HERO_COOKIE: string
export function nextAdeptHero(lastId: string | null | undefined, random?: () => number): AdeptHero
export function readAdeptHeroCookie(cookie: string | null | undefined): string | null
export function adeptHeroCookie(id: string): string
