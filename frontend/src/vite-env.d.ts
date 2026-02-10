/// <reference types="vite/client" />

interface Window {
  google?: {
    accounts?: {
      id?: {
        initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void
        renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; width?: number }) => void
        disableAutoSelect: () => void
      }
    }
  }
}
