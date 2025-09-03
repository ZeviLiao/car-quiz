import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';

interface TrueFalseQuestion {
  id: string;
  type: 'true-false';
  text: string;
  correctAnswer: 'O' | 'X';
  explanation?: string;
}

interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple-choice';
  text: string;
  options: { [key: string]: string };
  correctAnswer: string;
}

type Question = TrueFalseQuestion | MultipleChoiceQuestion;

class PdfToCsvConverter {
  private dataDir: string;
  private outputPath: string;
  private questionType: 'true-false' | 'multiple-choice';

  constructor(questionType: 'true-false' | 'multiple-choice' = 'true-false') {
    this.dataDir = path.join(__dirname, 'data');
    this.questionType = questionType;
    this.outputPath = path.join(this.dataDir, 
      questionType === 'true-false' ? 'true-false-questions.csv' : 'multiple-choice-questions.csv'
    );
  }

  private async extractTextFromPdf(pdfPath: string): Promise<string> {
    try {
      console.log(`正在讀取PDF檔案: ${path.basename(pdfPath)}`);
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } catch (error) {
      console.error(`讀取PDF檔案失敗: ${error}`);
      throw error;
    }
  }

  private parseTrueFalseQuestions(text: string): TrueFalseQuestion[] {
    const questions: TrueFalseQuestion[] = [];
    
    // Split text by lines and filter out empty lines
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Look for pattern: "題號 答案 題目" like "001 X 柴油引擎，是用火星塞點火的。"
      const match = line.match(/^(\d{3})\s+([○X])\s+(.+)$/);
      
      if (match) {
        const [, questionNum, answer, questionText] = match;
        
        const question: TrueFalseQuestion = {
          id: questionNum,
          type: 'true-false',
          text: questionText,
          correctAnswer: answer === '○' ? 'O' : 'X'
        };
        
        questions.push(question);
      } 
      // Handle multi-line questions where answer and question text are on separate lines
      else if (line.match(/^(\d{3})\s+([○X])$/)) {
        const [, questionNum, answer] = line.match(/^(\d{3})\s+([○X])$/)!;
        
        // Look for the question text in the next few lines
        let questionText = '';
        let j = i + 1;
        
        while (j < lines.length && j < i + 10) { // Look ahead max 10 lines
          const nextLine = lines[j];
          
          // Stop if we hit another question number
          if (nextLine.match(/^\d{3}\s+[○X]/)) break;
          
          // Skip page headers and other non-content
          if (!this.isHeaderOrPageNumber(nextLine) && nextLine.trim().length > 0) {
            if (questionText) questionText += ' ';
            questionText += nextLine;
            
            // If the line ends with punctuation, it's likely the end of the question
            if (nextLine.match(/[。！？．]$/)) {
              j++; // Move past this line
              break;
            }
          }
          
          j++;
        }
        
        if (questionText && this.isValidQuestionText(questionText)) {
          const question: TrueFalseQuestion = {
            id: questionNum,
            type: 'true-false',
            text: questionText.trim(),
            correctAnswer: answer === '○' ? 'O' : 'X'
          };
          
          questions.push(question);
          i = j - 1; // Skip the lines we've processed
        }
      }
      
      i++;
    }
    
    return questions;
  }

  private parseMultipleChoiceQuestions(text: string): MultipleChoiceQuestion[] {
    const questions: MultipleChoiceQuestion[] = [];
    
    // Split by lines and clean up
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Look for pattern: "題號 答案" like "001 1" or "004 2 question..."
      const match = line.match(/^(\d{3})\s+(\d)(.*)$/);
      
      if (match) {
        const [, questionNum, answer, remainder] = match;
        
        // Collect all content until we hit the next question number
        let allContent = remainder.trim();
        let j = i + 1;
        
        while (j < lines.length) {
          const nextLine = lines[j];
          
          // Stop if we hit another question number or header
          if (nextLine.match(/^\d{3}\s+\d/) || this.isHeaderOrPageNumber(nextLine)) {
            break;
          }
          
          if (nextLine.trim().length > 0) {
            allContent += ' ' + nextLine.trim();
          }
          j++;
        }
        
        // Parse the collected content - be more lenient about incomplete options
        if (allContent) {
          const parsedQuestion = this.parseMultipleChoiceContent(questionNum, answer, allContent);
          if (parsedQuestion) {
            questions.push(parsedQuestion);
          }
        }
        
        i = j - 1; // Skip processed lines
      }
      
      i++;
    }
    
    return questions;
  }

  private parseMultipleChoiceContent(
    questionNum: string, 
    answer: string, 
    content: string
  ): MultipleChoiceQuestion | null {
    // Extract the main question text before the first option (handle both formats)
    const questionMatch = content.match(/^(.+?)[\(（][１1][\)）]/);
    if (!questionMatch) {
      return null;
    }
    
    const questionText = questionMatch[1].trim().replace(/[：:]$/, '');
    
    // Parse options from the content
    const options: { [key: string]: string } = {};
    
    // Extract options using regex patterns (handle both formats)
    const option1Match = content.match(/[\(（][１1][\)）]([^（(]+?)(?=[\(（][２2][\)）])/);
    const option2Match = content.match(/[\(（][２2][\)）]([^（(]+?)(?=[\(（][３3][\)）])/);
    const option3Match = content.match(/[\(（][３3][\)）]([^（(]+?)(?:\s*$)/);
    
    if (option1Match) {
      options['1'] = option1Match[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/[。．]$/, '');
    }
    if (option2Match) {
      options['2'] = option2Match[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/[。．]$/, '');
    }
    if (option3Match) {
      options['3'] = option3Match[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/[。．]$/, '');
    }
    
    // For questions with incomplete options, try to extract what we can
    if (Object.keys(options).length < 3) {
      // Try alternative parsing for incomplete options with different formats
      const optionMatches = content.match(/[\(（](\d)[\)）]([^()（）]+?)(?=[\(（]\d[\)）]|$)/g);
      if (optionMatches) {
        optionMatches.forEach(match => {
          const optMatch = match.match(/[\(（](\d)[\)）](.+)/);
          if (optMatch) {
            const [, num, text] = optMatch;
            options[num] = text.trim().replace(/\s+/g, ' ').replace(/[。．]$/, '');
          }
        });
      }
    }
    
    // Must have at least valid question text and at least one option
    if (!questionText || questionText.length < 5 || Object.keys(options).length === 0) {
      return null;
    }
    
    return {
      id: questionNum,
      type: 'multiple-choice',
      text: questionText,
      options: options,
      correctAnswer: answer
    };
  }

  private isHeaderOrPageNumber(text: string): boolean {
    const headerPatterns = [
      '機械常識是非題',
      '機械常識選擇題',
      '題號',
      '答案',
      '題目',
      /^第\d+頁/,  // Page numbers
      /^共\d+頁/,  // Total pages
    ];
    
    for (const pattern of headerPatterns) {
      if (typeof pattern === 'string') {
        if (text.includes(pattern)) return true;
      } else {
        if (pattern.test(text)) return true;
      }
    }
    
    return false;
  }

  private isValidQuestionText(text: string): boolean {
    // Must have meaningful content and reasonable length
    return text.length > 5 && 
           text.length < 500 && // Not too long
           !text.match(/^[○X\d\s]*$/); // Not just symbols and numbers
  }

  private cleanQuestionText(text: string): string {
    // Remove question numbers, extra spaces, etc.
    return text.replace(/^\d+\.?\s*/, '').trim();
  }

  private extractAnswer(text: string): 'O' | 'X' | null {
    if (text.includes('(O)') || text.includes('正確')) return 'O';
    if (text.includes('(X)') || text.includes('錯誤')) return 'X';
    return null;
  }

  private questionsToCSV(questions: Question[]): string {
    if (this.questionType === 'multiple-choice') {
      return this.multipleChoiceToCSV(questions as MultipleChoiceQuestion[]);
    } else {
      return this.trueFalseToCSV(questions as TrueFalseQuestion[]);
    }
  }

  private trueFalseToCSV(questions: TrueFalseQuestion[]): string {
    const headers = ['id', 'type', 'text', 'correctAnswer', 'explanation'];
    const csvLines = [headers.join(',')];
    
    questions.forEach(q => {
      const row = [
        q.id,
        q.type,
        `"${q.text.replace(/"/g, '""')}"`, // Escape quotes
        q.correctAnswer,
        q.explanation ? `"${q.explanation.replace(/"/g, '""')}"` : ''
      ];
      csvLines.push(row.join(','));
    });
    
    return csvLines.join('\n');
  }

  private multipleChoiceToCSV(questions: MultipleChoiceQuestion[]): string {
    const headers = ['id', 'type', 'text', 'options', 'correctAnswer'];
    const csvLines = [headers.join(',')];
    
    questions.forEach(q => {
      const optionsJson = JSON.stringify(q.options).replace(/"/g, '""');
      const row = [
        q.id,
        q.type,
        `"${q.text.replace(/"/g, '""')}"`, // Escape quotes
        `"${optionsJson}"`, // JSON stringify options
        q.correctAnswer
      ];
      csvLines.push(row.join(','));
    });
    
    return csvLines.join('\n');
  }

  async convertPdfToCSV(): Promise<void> {
    try {
      // Find the appropriate PDF file based on question type
      const files = fs.readdirSync(this.dataDir);
      let targetPdf: string | undefined;
      
      if (this.questionType === 'true-false') {
        targetPdf = files.find(file => file.includes('是非題') && file.endsWith('.pdf'));
        if (!targetPdf) {
          throw new Error('找不到是非題PDF檔案');
        }
      } else {
        targetPdf = files.find(file => file.includes('選擇題') && file.endsWith('.pdf'));
        if (!targetPdf) {
          throw new Error('找不到選擇題PDF檔案');
        }
      }

      const pdfPath = path.join(this.dataDir, targetPdf);
      console.log(`處理PDF檔案: ${targetPdf}`);

      // Extract text from PDF
      const extractedText = await this.extractTextFromPdf(pdfPath);
      
      // Parse questions based on type
      let questions: Question[];
      if (this.questionType === 'true-false') {
        questions = this.parseTrueFalseQuestions(extractedText);
      } else {
        questions = this.parseMultipleChoiceQuestions(extractedText);
      }
      
      if (questions.length === 0) {
        console.log(`警告: 未找到任何${this.questionType === 'true-false' ? '是非題' : '選擇題'}`);
        return;
      }

      // Convert to CSV
      const csvContent = this.questionsToCSV(questions);
      
      // Write to file
      fs.writeFileSync(this.outputPath, csvContent, 'utf-8');
      
      const questionTypeText = this.questionType === 'true-false' ? '是非題' : '選擇題';
      console.log(`成功轉換 ${questions.length} 題${questionTypeText}到 CSV 檔案: ${this.outputPath}`);
      
    } catch (error) {
      console.error('轉換過程發生錯誤:', error);
      throw error;
    }
  }
}

// Main execution for true-false questions (default)
async function main() {
  const converter = new PdfToCsvConverter('true-false');
  await converter.convertPdfToCSV();
}

if (require.main === module) {
  main().catch(console.error);
}

export { PdfToCsvConverter, TrueFalseQuestion, MultipleChoiceQuestion, Question };