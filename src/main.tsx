import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-naskh-arabic/700.css'
import '@fontsource/noto-sans-arabic/400.css'
import '@fontsource/noto-sans-arabic/600.css'
import './styles/tokens.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
