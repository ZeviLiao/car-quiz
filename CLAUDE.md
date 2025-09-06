# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based interactive quiz application for automotive/vehicle maintenance questions with 317 questions total (143 multiple-choice, 174 true-false). The application presents questions in Traditional Chinese, tracks progress in real-time, and provides comprehensive question management with immediate progress saving.

## Architecture

- **Main Application**: `quiz.ts` - Complete quiz logic, question management, and user interaction flow
- **Question Data**: `questions.json` - JSON file containing all quiz questions with Traditional Chinese text
- **Data Processing Pipeline**: `pdf-to-csv.ts` → `csv-to-json.ts` → `questions.json`
- **Question Interface**: Defined in `quiz.ts:28-37` with support for multiple-choice and true-false question types

## Development Commands

```bash
# Compile and run the main application
npx tsc && node quiz.js

# Compile TypeScript only
npx tsc

# Data processing pipeline (if rebuilding question database)
npx tsc pdf-to-csv.ts && node pdf-to-csv.js
npx tsc pdf-to-csv-multiple-choice.ts && node pdf-to-csv-multiple-choice.js
npx tsc csv-to-json.ts && node csv-to-json.js
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
- **PDF Processing**: `pdf-to-csv.ts` and `pdf-to-csv-multiple-choice.ts` extract questions from PDF sources
- **CSV Processing**: `csv-to-json.ts` converts CSV data to final JSON format with intelligent explanation matching
- **Verification**: `verify-explanations.ts` validates explanation coverage for true/false questions

## Question Types & Format
- **Multiple Choice**: Numbered options (1, 2, 3) stored in `options` object
- **True/False**: 'O' for correct (正確), 'X' for incorrect (錯誤)
- **Explanations**: Automatically matched for true/false questions where correct answer is 'X'

## File Structure
- `quiz.ts`: Main application logic
- `questions.json`: Complete question database (317 questions)
- `quiz-data.json`: User progress persistence (answered/failed/marked)
- `data/`: CSV source files for question data
- Processing utilities: `pdf-to-csv*.ts`, `csv-to-json.ts`, `add-explanations.ts`

## Dependencies
- `readline-sync`: Console input handling
- `pdf-parse`: PDF text extraction for data processing
- `typescript`: TypeScript compiler
- Type definitions: `@types/node`, `@types/readline-sync`, `@types/pdf-parse`