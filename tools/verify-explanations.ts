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

// 檢查說明的合理性
function verifyExplanations() {
  const questionsPath = path.join(__dirname, '..', 'questions.json');
  const content = fs.readFileSync(questionsPath, 'utf-8');
  const questions: Question[] = JSON.parse(content);
  
  const xAnswerQuestions = questions.filter(q => 
    q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation
  );
  
  console.log(`=== 檢查 ${xAnswerQuestions.length} 題錯誤答案的說明合理性 ===\n`);
  
  xAnswerQuestions.forEach(q => {
    console.log(`題目 ${q.id}:`);
    console.log(`問題: ${q.text}`);
    console.log(`正確答案: ${q.correctAnswer} (錯誤)`);
    console.log(`說明: ${q.explanation}`);
    console.log(`---`);
  });
}

verifyExplanations();