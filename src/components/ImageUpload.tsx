import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Loader2, Info } from 'lucide-react';
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

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing,
    noClick: true // We will handle click manually to be safe on all devices
  });

  return (
    <div
      {...getRootProps()}
      onClick={open}
      className={cn(
        "group relative border border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 bg-gradient-to-b from-white/5 to-transparent",
        isDragActive ? "border-blue-500 bg-blue-500/5 scale-[1.01]" : "border-white/20 hover:border-white/40 hover:bg-white/5",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-white/20 group-hover:bg-white/10",
          isDragActive && "bg-blue-500/20 border-blue-500/50"
        )}>
          {isProcessing ? (
             <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : isDragActive ? (
            <ImageIcon className="w-5 h-5 text-blue-400 animate-bounce" />
          ) : (
            <Upload className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          )}
        </div>
        
        <div className="space-y-2 w-full">
          <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">
            {isDragActive ? 'Drop it!' : 'Upload Screenshot'}
          </p>
          
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white border border-white/10 transition-colors md:hidden"
          >
            Select Image
          </button>

          <p className="text-xs text-muted-foreground hidden md:block">
            or drag and drop screenshot
          </p>
        </div>
      </div>
    </div>
  );
};
