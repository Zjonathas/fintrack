import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detecta se a aplicação já está rodando como app instalado (Standalone)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // 2. Detecta se o dispositivo é iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isAppleDevice);

    // 3. Captura o evento nativo de prompt de instalação do Chromium (Android / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Dispara o fluxo de instalação
  const instalar = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'unavailable'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('Erro ao disparar prompt de instalação:', err);
        return 'unavailable';
      }
    }

    if (isIOS && !isStandalone) {
      return 'ios';
    }

    return 'unavailable';
  }, [deferredPrompt, isIOS, isStandalone]);

  return {
    isInstallable: Boolean(deferredPrompt) || (isIOS && !isStandalone),
    canPromptDirectly: Boolean(deferredPrompt),
    isStandalone,
    isIOS,
    instalar,
  };
}
