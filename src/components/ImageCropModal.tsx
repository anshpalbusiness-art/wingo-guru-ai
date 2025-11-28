import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, Crop, RotateCw, Maximize2 } from 'lucide-react';

interface ImageCropModalProps {
  image: string | null;
  onComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

export const ImageCropModal = ({ image, onComplete, onCancel }: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!image || !croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onComplete(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[95vh] md:h-[90vh] bg-black border-white/20 p-3 md:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-white flex items-center gap-2 text-base md:text-lg">
            <Crop className="w-4 h-4 md:w-5 md:h-5" />
            Crop Screenshot
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 bg-black/40 rounded-lg overflow-hidden touch-none" style={{ minHeight: '250px' }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            showGrid={true}
            style={{
              containerStyle: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              cropAreaStyle: {
                border: '2px solid rgba(255, 255, 255, 0.5)',
              },
            }}
          />
        </div>

        <div className="space-y-2 md:space-y-3">
          {/* Zoom Control */}
          <div className="flex items-center gap-2 md:gap-3">
            <ZoomOut className="w-3 h-3 md:w-4 md:h-4 text-white/70 flex-shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([value]) => setZoom(value)}
              className="flex-1"
            />
            <ZoomIn className="w-3 h-3 md:w-4 md:h-4 text-white/70 flex-shrink-0" />
            <span className="text-xs text-white/50 min-w-[3rem] text-right">{zoom.toFixed(1)}x</span>
          </div>

          {/* Rotation Control */}
          <div className="flex items-center gap-2 md:gap-3">
            <RotateCw className="w-3 h-3 md:w-4 md:h-4 text-white/70 flex-shrink-0" />
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={([value]) => setRotation(value)}
              className="flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRotation(0)}
              className="text-white/70 hover:text-white hover:bg-white/10 h-6 px-2 text-xs"
            >
              Reset
            </Button>
            <span className="text-xs text-white/50 min-w-[3rem] text-right">{rotation}°</span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}
              className="text-white/70 hover:text-white hover:bg-white/10 text-xs md:text-sm"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Reset All
            </Button>
          </div>

          {/* Tip */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 md:p-3">
            <p className="text-xs text-blue-200/70">
              💡 <span className="hidden md:inline">Pinch to zoom on mobile. </span>Crop to focus only on the Wingo results table.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCropConfirm}
            disabled={isProcessing}
            className="bg-white text-black hover:bg-white/90 w-full sm:w-auto"
          >
            {isProcessing ? 'Processing...' : 'Crop & Analyze'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
