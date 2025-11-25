import { Menu, HelpCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export const HelpPricingSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-black/60 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-black/95 border-white/20 text-white backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="text-white font-display text-2xl">Menu</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Help & Pricing Information
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {/* Help Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold font-display">Help</h3>
            </div>
            <Separator className="bg-white/10" />
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                For any kind of help, contact us on Telegram:
              </p>
              <a
                href="https://t.me/wealthelites28"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
                t.me/wealthelites28
              </a>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold font-display">Pricing</h3>
            </div>
            <Separator className="bg-white/10" />
            <div className="bg-black/40 border border-white/10 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-premium mb-4">
                <DollarSign className="h-8 w-8 text-black" />
              </div>
              <p className="text-2xl font-bold text-white mb-2 font-display">Coming Soon</p>
              <p className="text-sm text-muted-foreground">
                Pricing plans will be available shortly. Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
