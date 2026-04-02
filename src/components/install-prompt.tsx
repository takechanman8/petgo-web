'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'petgo-install-dismissed'
const DISMISS_DAYS = 7

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if recently dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    // Check iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      setShow(true)
      return
    }

    // Listen for beforeinstallprompt (Chrome/Edge/etc)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg animate-slide-up">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 192 192" className="w-6 h-6">
            <ellipse cx="96" cy="120" rx="30" ry="25" fill="#ffffff" />
            <ellipse cx="66" cy="80" rx="14" ry="16" fill="#ffffff" transform="rotate(-10 66 80)" />
            <ellipse cx="126" cy="80" rx="14" ry="16" fill="#ffffff" transform="rotate(10 126 80)" />
            <ellipse cx="52" cy="105" rx="12" ry="14" fill="#ffffff" transform="rotate(-20 52 105)" />
            <ellipse cx="140" cy="105" rx="12" ry="14" fill="#ffffff" transform="rotate(20 140 105)" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">PetGoをホーム画面に追加</p>
          {isIOS ? (
            <p className="text-xs text-gray-500 mt-0.5">
              共有ボタン → 「ホーム画面に追加」をタップ
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              アプリのように素早くアクセスできます
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-green-800 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              追加
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
