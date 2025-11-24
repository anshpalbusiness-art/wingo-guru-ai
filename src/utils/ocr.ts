import Tesseract from 'tesseract.js';

export interface WingoRound {
  round: number;
  number: number;
  color: string;
}

const getColorFromNumber = (num: number): string => {
  if (num === 0) return 'Violet';
  if ([1, 2, 5, 6, 8, 9].includes(num)) return 'Red';
  if ([3, 4, 7].includes(num)) return 'Green';
  return 'Unknown';
};

export const extractWingoData = async (imageFile: File): Promise<WingoRound[]> => {
  try {
    console.log('Starting OCR processing...');
    
    const { data: { text } } = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => console.log(m),
      }
    );

    console.log('OCR Text:', text);

    // Parse the extracted text
    const rounds: WingoRound[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Try to extract round numbers and digits
    // Common patterns: "Round 12345 | 5" or "12345 5" or just "5"
    const roundPattern = /(\d{4,6})\s*[|\s]\s*(\d)/g;
    const simplePattern = /\b(\d)\b/g;

    let match;
    let roundCounter = 10000; // Default starting round

    // Try structured pattern first
    while ((match = roundPattern.exec(text)) !== null) {
      const roundNum = parseInt(match[1]);
      const number = parseInt(match[2]);
      
      if (number >= 0 && number <= 9) {
        rounds.push({
          round: roundNum,
          number: number,
          color: getColorFromNumber(number)
        });
      }
    }

    // If no structured data found, extract just numbers
    if (rounds.length === 0) {
      const numbers: number[] = [];
      while ((match = simplePattern.exec(text)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 0 && num <= 9) {
          numbers.push(num);
        }
      }

      // Create rounds from found numbers
      numbers.forEach((num, index) => {
        rounds.push({
          round: roundCounter + index,
          number: num,
          color: getColorFromNumber(num)
        });
      });
    }

    console.log('Extracted rounds:', rounds);
    
    if (rounds.length === 0) {
      throw new Error('No valid Wingo data found in image. Please ensure the screenshot shows round numbers clearly.');
    }

    return rounds;

  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to process image. Please ensure the image is clear and shows Wingo round data.');
  }
};
