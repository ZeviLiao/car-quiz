import * as fs from 'fs';
import * as path from 'path';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  correctAnswer: string;
  options?: { [key: string]: string };
  explanation?: string;
}

class CsvToJsonConverter {
  private dataDir: string;
  private outputPath: string;

  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.outputPath = path.join(__dirname, 'questions.json');
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    result.push(current);
    return result;
  }

  private parseMultipleChoiceCsv(): Question[] {
    const csvPath = path.join(this.dataDir, 'multiple-choice-questions.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    const questions: Question[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i]);
      if (fields.length >= 5) {
        const [id, type, text, optionsJson, correctAnswer] = fields;
        
        try {
          // Parse options JSON and unescape quotes
          const unescapedJson = optionsJson.replace(/""/g, '"');
          const options = JSON.parse(unescapedJson);
          
          questions.push({
            id: id.padStart(3, '0'),
            type: 'multiple-choice',
            text: text,
            options: options,
            correctAnswer: correctAnswer
          });
        } catch (error) {
          console.warn(`Failed to parse multiple-choice question ${id}: ${error}`);
        }
      }
    }

    return questions;
  }

  private parseTrueFalseCsv(): Question[] {
    const csvPath = path.join(this.dataDir, 'true-false-questions.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    const questions: Question[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i]);
      if (fields.length >= 4) {
        const [id, type, text, correctAnswer, explanation] = fields;
        
        const question: Question = {
          id: id.padStart(3, '0'),
          type: 'true-false',
          text: text,
          correctAnswer: correctAnswer
        };

        // Only add explanation if it exists and is not empty
        if (explanation && explanation.trim()) {
          question.explanation = explanation.trim();
        }

        questions.push(question);
      }
    }

    return questions;
  }

  private sortQuestions(questions: Question[]): Question[] {
    return questions.sort((a, b) => {
      // First sort by type (multiple-choice first, then true-false)
      if (a.type !== b.type) {
        return a.type === 'multiple-choice' ? -1 : 1;
      }
      // Then sort by id within each type
      return a.id.localeCompare(b.id);
    });
  }

  async convertCsvToJson(): Promise<void> {
    try {
      console.log('正在讀取選擇題CSV檔案...');
      const multipleChoiceQuestions = this.parseMultipleChoiceCsv();
      console.log(`成功讀取 ${multipleChoiceQuestions.length} 題選擇題`);

      console.log('正在讀取是非題CSV檔案...');
      const trueFalseQuestions = this.parseTrueFalseCsv();
      console.log(`成功讀取 ${trueFalseQuestions.length} 題是非題`);

      // Combine and sort questions
      const allQuestions = [...multipleChoiceQuestions, ...trueFalseQuestions];
      const sortedQuestions = this.sortQuestions(allQuestions);

      // Write to JSON file
      const jsonContent = JSON.stringify(sortedQuestions, null, 2);
      fs.writeFileSync(this.outputPath, jsonContent, 'utf-8');

      console.log(`成功生成 questions.json 檔案: ${this.outputPath}`);
      console.log(`總題數: ${sortedQuestions.length} 題`);
      console.log(`選擇題: ${multipleChoiceQuestions.length} 題`);
      console.log(`是非題: ${trueFalseQuestions.length} 題`);

    } catch (error) {
      console.error('轉換過程發生錯誤:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const converter = new CsvToJsonConverter();
  await converter.convertCsvToJson();
}

if (require.main === module) {
  main().catch(console.error);
}

export { CsvToJsonConverter };