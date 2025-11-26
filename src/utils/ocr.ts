import Tesseract from 'tesseract.js';

export interface WingoRound {
  round: number;
  number: number;
  color: string;
}

const getColorFromNumber = (num: number): string => {
  // Wingo color rules:
  // Red: 2, 4, 6, 8 (even numbers except 0 and 5)
  // Green: 1, 3, 7, 9 (odd numbers except 5)
  // Violet: 0, 5 (special numbers)
  if ([0, 5].includes(num)) return 'Violet';
  if ([2, 4, 6, 8].includes(num)) return 'Red';
  if ([1, 3, 7, 9].includes(num)) return 'Green';
  return 'Unknown';
};

const resizeImage = (file: File, maxWidth: number = 1024): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        } else {
          reject(new Error('Canvas to Blob failed'));
        }
      }, 'image/jpeg', 0.8);
    };
    img.onerror = reject;
  });
};

export const extractWingoData = async (imageFile: File): Promise<WingoRound[]> => {
  try {
    console.log('Starting OCR processing...');
    
    // Resize image to speed up OCR
    const resizedImage = await resizeImage(imageFile);
    
    // Use CDN for worker to avoid path issues on mobile/deployments
    const { data: { text } } = await Tesseract.recognize(
      resizedImage,
      'eng',
      {
        // logger: (m) => console.log(m), // Disable logger for speed
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
        errorHandler: (err) => console.error('Tesseract Internal Error:', err)
      }
    );
    
    // Tesseract parameters optimization is done via the worker config but recognize options are limited in V5 simple API. 
    // V5 recognize automatically optimizes. Whitelist is better set in a lower level, but we rely on post-processing here for robustness.

    console.log('OCR Text:', text);

    // Parse the extracted text
    const rounds: WingoRound[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Try multiple patterns to extract round numbers and result digits
    
    // Pattern 1: Full format "20241125010123 | 5" or similar
    // Matches 10-15 digits (round), optional separators, single digit (result)
    const pattern1 = /(\d{10,15})[\s|:\-]*(\d)\b/g;
    
    // Pattern 2: Round number and result on separate lines or spaced
    // Looks for long number (round) ... short number (result)
    const pattern2 = /(\d{8,15}).*?(\d)\b/g;

    // Pattern 3: Just single digits 0-9 (fallback for simple lists)
    const pattern3 = /\b([0-9])\b/g;

    let match;
    let roundCounter = Date.now() % 100000000; // Use timestamp-based counter for fallback

    // Try Pattern 1 (Structured)
    const text1 = text;
    while ((match = pattern1.exec(text1)) !== null) {
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
    
    console.log('Pattern 1 extraction:', rounds.length);

    // If Pattern 1 found few results, try Pattern 2 to find more
    if (rounds.length < 5) {
      console.log('Few results from Pattern 1, trying Pattern 2...');
      // Look for lines that have a long number
      const potentialLines = lines.filter(l => /\d{8,}/.test(l));
      
      potentialLines.forEach(line => {
        // Match a long number (period) and a single digit result at the end
        // We use a more flexible regex here
        const match = line.match(/(\d{8,15})[^\d]*?(\d)\s*$/);
        
        if (match) {
          const roundNum = parseInt(match[1]);
          const number = parseInt(match[2]);
          
          if (number >= 0 && number <= 9) {
            // Check if we already have this round
            if (!rounds.some(r => r.round === roundNum)) {
              rounds.push({
                round: roundNum,
                number: number,
                color: getColorFromNumber(number)
              });
            }
          }
        }
      });
    }
    
    console.log('Pattern 2 extraction:', rounds.length);

    // SPECIAL FALLBACK: Line-ending digit scanner
    // If we still have < 5 rounds, many screenshots just look like: "Period...  Result"
    // But the period might be misread. Let's just trust lines that end in a single digit 0-9.
    if (rounds.length < 5) {
      console.log('Trying line-ending digit scan...');
      const digitLines = lines.filter(l => /\b\d\s*$/.test(l));
      
      digitLines.forEach((line, idx) => {
        const digitMatch = line.match(/(\d)\s*$/);
        if (digitMatch) {
          const num = parseInt(digitMatch[1]);
          // Try to find a period number in the same line, otherwise make one up
          const periodMatch = line.match(/(\d{8,})/);
          const roundNum = periodMatch ? parseInt(periodMatch[1]) : (roundCounter - idx);
          
          if (!rounds.some(r => r.round === roundNum)) {
             rounds.push({
              round: roundNum,
              number: num,
              color: getColorFromNumber(num)
            });
          }
        }
      });
    }

    // If still no structured data, just find all single digits
    // This is common in screenshots that just show the result column
    if (rounds.length < 3) {
      console.log('Falling back to simple digit extraction');
      const numbers: number[] = [];
      
      // Clean text to remove common non-result numbers (like time 12:30, dates, etc)
      // We'll assume single digits on their own lines or separated by spaces are results
      const cleanText = text.replace(/\d{2}:\d{2}/g, '') // Remove times
                           .replace(/\d{4}-\d{2}-\d{2}/g, ''); // Remove dates
                           
      while ((match = pattern3.exec(cleanText)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 0 && num <= 9) {
          numbers.push(num);
        }
      }

      // If we found numbers, assume they are results (most recent first usually)
      if (numbers.length > 0) {
        // Filter out sequences that don't look like results (e.g. page numbers)
        // Wingo results are random 0-9.
        
        // Take up to 20 numbers
        const validNumbers = numbers.slice(0, 20);
        
        // Clear existing rounds if we're falling back
        rounds.length = 0;
        
        validNumbers.forEach((num, index) => {
          rounds.push({
            round: roundCounter - index, // Decrement round number
            number: num,
            color: getColorFromNumber(num)
          });
        });
      }
    }

    console.log('Final extracted rounds:', rounds);
    
    if (rounds.length === 0) {
      // Log the text to see what we actually got
      console.log('Raw OCR Text:', text);
      throw new Error('No valid numbers (0-9) found in screenshot. Please crop to just the results.');
    }

    // Ensure we don't have duplicates and sort
    const uniqueRounds = Array.from(new Map(rounds.map(item => [item.round, item])).values());
    
    return uniqueRounds;

  } catch (error) {
    console.error('OCR Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // If it's a Tesseract error, it might be network/worker related
    if (msg.includes('worker') || msg.includes('network')) {
         throw new Error('OCR Engine failed to load. Please check internet connection.');
    }
    throw error; // Re-throw specific errors (like "No numbers found")
  }
};
