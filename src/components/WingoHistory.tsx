import { WingoRound } from '@/utils/ocr';
import { cn } from '@/lib/utils';

interface WingoHistoryProps {
  data: WingoRound[];
}

export const WingoHistory = ({ data }: WingoHistoryProps) => {
  if (!data || data.length === 0) return null;

  return null; // Component content moved to Index.tsx for better layout control
};
