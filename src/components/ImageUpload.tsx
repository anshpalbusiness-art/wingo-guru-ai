import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}

export const ImageUpload = ({ onImageUpload, isProcessing }: ImageUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all bg-black/40 hover:bg-black/60 touch-manipulation",
        isDragActive ? "border-white bg-white/5 scale-[1.02]" : "border-white/20 hover:border-white/40",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-2.5 sm:gap-3">
        <div className={cn(
          "w-14 h-14 sm:w-16 sm:h-16 rounded-sm border-2 border-white/20 flex items-center justify-center transition-all",
          isDragActive && "border-white scale-110"
        )}>
          {isDragActive ? (
            <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-bounce" />
          ) : (
            <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-white/60" />
          )}
        </div>
        
        <div>
          <p className="text-xs sm:text-sm font-semibold text-white mb-1">
            {isDragActive ? 'Drop Screenshot Here' : 'Upload Screenshot'}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Tap or drag & drop
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground mt-1">
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 rounded border border-white/10">PNG</span>
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 rounded border border-white/10">JPG</span>
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 rounded border border-white/10">WEBP</span>
        </div>
      </div>
    </div>
  );
};
