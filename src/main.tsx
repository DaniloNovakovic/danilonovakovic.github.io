import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UI_FONT_FAMILY } from './shared/config/typography'
import { I18nProvider } from './shared/i18n'

document.documentElement.style.setProperty('--font-ui', UI_FONT_FAMILY)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
