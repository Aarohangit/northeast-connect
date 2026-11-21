import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { strings } from './strings.js'

const LangContext = createContext(null)

function initialLang() {
  const saved = localStorage.getItem('lang')
  if (saved && strings[saved]) return saved
  const nav = (navigator.language || 'en').slice(0, 2)
  return strings[nav] ? nav : 'en'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l) => {
    localStorage.setItem('lang', l)
    setLangState(l)
  }, [])

  const t = useCallback(
    (key, vars) => {
      let s = strings[lang][key] ?? strings.en[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v)
      return s
    },
    [lang],
  )

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

/** Speech recognition locale for each UI language. */
export const SPEECH_LOCALE = { as: 'as-IN', hi: 'hi-IN', en: 'en-IN' }
