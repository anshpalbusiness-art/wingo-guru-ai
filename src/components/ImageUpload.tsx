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
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all bg-black/40",
        isDragActive ? "border-white bg-white/5" : "border-white/20 hover:border-white/50",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center gap-3">
        {isDragActive ? (
          <ImageIcon className="w-12 h-12 text-white animate-bounce" />
        ) : (
          <Upload className="w-12 h-12 text-white/60" />
        )}
        
        <div>
          <p className="text-lg font-semibold text-white">
            {isDragActive ? 'Drop image here' : 'Upload Wingo Screenshot'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Drag & drop or click to select
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Supports PNG, JPG, JPEG, WEBP
        </p>
      </div>
    </div>
  );
};
