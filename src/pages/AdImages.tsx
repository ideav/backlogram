import React from 'react'

const ads = [
  {
    id: 1,
    file: '/ad-images/ad-1-neural-flow.svg',
    title: 'Нейронная сеть',
    description: 'Абстрактная нейросеть — узлы, связи, активные сигналы. Тема: ИИ-автоматизация.',
  },
  {
    id: 2,
    file: '/ad-images/ad-2-data-circuit.svg',
    title: 'Цифровая плата',
    description: 'Дорожки печатной платы с чипом AUTO CORE в центре. Тема: технологическая основа автоматизации.',
  },
  {
    id: 3,
    file: '/ad-images/ad-3-infinity-loop.svg',
    title: 'Замкнутый цикл',
    description: 'Знак бесконечности — замкнутый цикл данных, анализа и действий. Тема: непрерывная автоматизация.',
  },
  {
    id: 4,
    file: '/ad-images/ad-4-gear-flow.svg',
    title: 'Шестерни процессов',
    description: 'Сцепленные шестерни с метриками эффективности. Тема: точность и слаженность процессов.',
  },
  {
    id: 5,
    file: '/ad-images/ad-5-data-wave.svg',
    title: 'Волна данных',
    description: 'Волновой график роста с аннотациями ключевых метрик. Тема: измеримые результаты автоматизации.',
  },
]

export default function AdImages() {
  const [selected, setSelected] = React.useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Рекламные баннеры — Яндекс Директ</h1>
        <p className="text-gray-400 mb-10 text-sm">
          5 абстрактных баннеров про автоматизацию · формат 1200×628 px · SVG
        </p>

        <div className="grid grid-cols-1 gap-10">
          {ads.map((ad) => (
            <div key={ad.id} className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
              <img
                src={ad.file}
                alt={ad.title}
                className="w-full block cursor-zoom-in"
                onClick={() => setSelected(ad.id)}
              />
              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg mb-1">
                    #{ad.id} — {ad.title}
                  </h2>
                  <p className="text-gray-400 text-sm">{ad.description}</p>
                </div>
                <a
                  href={ad.file}
                  download
                  className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Скачать SVG
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <img
            src={ads[selected - 1].file}
            alt={ads[selected - 1].title}
            className="max-w-full max-h-full rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
