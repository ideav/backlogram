import { Link } from 'react-router-dom'
import { XCircle, Mail, Phone, Send } from 'lucide-react'

export default function Fail() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32">
      <div className="w-full text-center space-y-8">
        <div className="flex justify-center">
          <XCircle className="w-20 h-20 text-red-500" strokeWidth={1.5} />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Сожалеем, оплата неуспешна!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            Попробуйте оплатить ещё раз, также можно попробовать другой способ или другую карту.
            <br />
            Также вы можете связаться с нами по телефону или почте, указанным ниже.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 text-sm">
          <a
            href="https://t.me/qdmadept"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <Send size={16} /> @qdmadept
          </a>
          <a
            href="mailto:abc@integram.io"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <Mail size={16} /> abc@integram.io
          </a>
          <a
            href="tel:+79955060167"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <Phone size={16} /> +7 (995) 506-01-67
          </a>
        </div>

        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
