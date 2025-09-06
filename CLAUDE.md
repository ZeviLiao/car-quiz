# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based interactive quiz application for automotive/vehicle maintenance questions with 317 questions total (143 multiple-choice, 174 true-false). The application presents questions in Traditional Chinese, tracks progress in real-time, and provides comprehensive question management with immediate progress saving.

## Architecture

- **Main Application**: `src/quiz.ts` - Complete quiz logic, question management, and user interaction flow
- **Question Data**: `questions.json` - JSON file containing all quiz questions with Traditional Chinese text
- **Data Processing Pipeline**: `tools/pdf-to-csv.ts` → `tools/csv-to-json.ts` → `questions.json`
- **Question Interface**: Defined in `src/quiz.ts:28-37` with support for multiple-choice and true-false question types

## Development Commands

```bash
# Compile and run the main application
npx tsc && node dist/src/quiz.js

# Compile TypeScript only
npx tsc

# Data processing pipeline (if rebuilding question database)
npx tsc && node dist/tools/pdf-to-csv.js
npx tsc && node dist/tools/pdf-to-csv-multiple-choice.js
npx tsc && node dist/tools/csv-to-json.js
```

## Key Components

### Question Management System
- Questions loaded from `questions.json` using `loadQuestions()` function
- Fisher-Yates shuffling algorithm via `shuffleArray()` for randomization
- Three-category progress tracking: answered correctly, failed (retry queue), marked (permanently excluded)
- Real-time progress saving in `quiz-data.json` after each question

### User Interaction Flow
- Console-based interface using `readline-sync`
- Two-stage menu system: question type selection → scope selection
- Special commands: '-' (mark as never show), '?' (reveal answer, add to failed), 'q' (quit)
- Conditional explanations: only shown for true/false questions with 'X' answers

### Data Processing Tools
- **PDF Processing**: `tools/pdf-to-csv.ts` and `tools/pdf-to-csv-multiple-choice.ts` extract questions from PDF sources
- **CSV Processing**: `tools/csv-to-json.ts` converts CSV data to final JSON format with intelligent explanation matching
- **Verification**: `tools/verify-explanations.ts` validates explanation coverage for true/false questions

## Question Types & Format
- **Multiple Choice**: Numbered options (1, 2, 3) stored in `options` object
- **True/False**: 'O' for correct (正確), 'X' for incorrect (錯誤)
- **Explanations**: Automatically matched for true/false questions where correct answer is 'X'

## File Structure
- `src/quiz.ts`: Main application logic
- `tools/`: Data processing utilities directory
- `questions.json`: Complete question database (317 questions)
- `quiz-data.json`: User progress persistence (answered/failed/marked)
- `data/`: CSV source files for question data
- `dist/`: Compiled JavaScript output directory

## Dependencies
- `readline-sync`: Console input handling
- `pdf-parse`: PDF text extraction for data processing
- `typescript`: TypeScript compiler
- Type definitions: `@types/node`, `@types/readline-sync`, `@types/pdf-parse`