import * as fs from 'fs';
import * as path from 'path';
import { Question } from '../types';

// 檢查匹配情況
function debugMatching() {
  const questionsPath = path.join(__dirname, '..', 'data', 'questions.json');
  const content = fs.readFileSync(questionsPath, 'utf-8');
  const questions: Question[] = JSON.parse(content);
  
  const xAnswerQuestions = questions.filter(q => 
    q.type === 'true-false' && q.correctAnswer === 'X'
  );
  
  const withExplanation = xAnswerQuestions.filter(q => q.explanation);
  const withoutExplanation = xAnswerQuestions.filter(q => !q.explanation);
  
  console.log(`總X答案題目: ${xAnswerQuestions.length}`);
  console.log(`有說明: ${withExplanation.length}`);
  console.log(`無說明: ${withoutExplanation.length}`);
  console.log('\n=== 無說明的題目 ===');
  
  withoutExplanation.forEach(q => {
    console.log(`${q.id}: ${q.text.substring(0, 50)}...`);
  });
}

debugMatching();