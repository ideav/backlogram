// Типы для src/data/home-cases.mjs (plain-ESM data, общий для React и пререндера).

export interface CaseScreenshot {
  /** Имя файла в public/ — без ведущего слэша: в React к нему клеится BASE_URL. */
  file: string
  /** Реальная ширина файла в пикселях — атрибут width, даёт браузеру aspect-ratio. */
  width: number
  /** Реальная высота файла в пикселях — атрибут height. */
  height: number
  /** Описание для скринридера и поиска по картинкам. */
  alt: string
  /** Короткая подпись под картинкой в статическом снапшоте. */
  caption: string
}

export declare const HOME_CASE_SCREENSHOTS: Record<'orbita' | 'sovereignty' | 'pdn', CaseScreenshot>
