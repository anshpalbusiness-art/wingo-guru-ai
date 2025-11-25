import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StarfieldBackground } from '@/components/StarfieldBackground';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <StarfieldBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Install WOLF AI</h1>
          <p className="text-gray-400 text-lg">Get the full app experience on your device</p>
        </div>

        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm p-8">
          {isInstalled ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">App Installed!</h2>
                <p className="text-gray-400">WOLF AI is now installed on your device</p>
              </div>
              <Button 
                onClick={() => navigate('/')}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                Open App
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <img 
                  src="/pwa-512x512.png" 
                  alt="WOLF AI" 
                  className="w-32 h-32 mx-auto mb-4 rounded-2xl"
                />
                <h2 className="text-2xl font-bold mb-2">Install WOLF AI</h2>
                <p className="text-gray-400">Access predictions instantly from your home screen</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-6 h-6 text-white mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Works Offline</h3>
                    <p className="text-sm text-gray-400">Access your predictions even without internet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="w-6 h-6 text-white mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Fast & Lightweight</h3>
                    <p className="text-sm text-gray-400">Loads instantly like a native app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-white mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">No App Store Required</h3>
                    <p className="text-sm text-gray-400">Install directly from your browser</p>
                  </div>
                </div>
              </div>

              {deferredPrompt ? (
                <Button 
                  onClick={handleInstallClick}
                  className="w-full bg-white text-black hover:bg-gray-200"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Install Now
                </Button>
              ) : (
                <div className="text-center text-sm text-gray-400 space-y-2">
                  <p>To install WOLF AI on your device:</p>
                  <div className="text-left bg-gray-800/50 rounded-lg p-4 space-y-2">
                    <p><strong>iPhone/iPad:</strong> Tap Share → Add to Home Screen</p>
                    <p><strong>Android:</strong> Tap Menu (⋮) → Install app</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-gray-700 hover:bg-gray-800"
              >
                Continue in Browser
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
