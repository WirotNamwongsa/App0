import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// init dark mode ก่อน render
const stored = JSON.parse(localStorage.getItem('jamboree-theme') || '{}')
if (stored?.state?.dark) document.documentElement.classList.add('dark')

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
    </BrowserRouter>
  </QueryClientProvider>
)