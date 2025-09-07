# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript-based interactive console quiz application for automotive maintenance education. Features 317 Traditional Chinese questions (143 multiple-choice, 174 true-false) with sophisticated progress tracking, immediate data persistence, and intelligent explanation matching.

## Development Commands

```bash
# Production build (main app only, excludes tools)
npm run build

# Start quiz application
npm start

# Development workflow (build + run)
npm run dev

# Compile all TypeScript files including tools
npx tsc

# Compile production build only
npx tsc -p tsconfig.prod.json

# Data processing pipeline (rebuild question database)
npx tsc && node dist/tools/pdf-to-csv.js
npx tsc && node dist/tools/pdf-to-csv-multiple-choice.js
npx tsc && node dist/tools/csv-to-json.ts
```

## Core Architecture

### Application Flow (`src/quiz.ts`)
**Two-Stage Menu System**:
1. Question type selection (true-false/multiple-choice/mixed)
2. Scope selection (failed-only/all-available)

**Progress Management**: Three-category tracking system
- `answeredQuestions`: Correctly answered, excluded from future rounds
- `failedQuestions`: Incorrect answers, priority for retry
- `markedQuestions`: Permanently excluded via `-` command

**Question Loading Logic**:
- Loads from `src/data/questions.json` via `loadQuestions()`
- **Hardcoded filters**: Excludes controversial question ID '034'
- **Dynamic filters**: Excludes user-marked and previously answered questions
- **Randomization**: Fisher-Yates shuffle algorithm via `shuffleArray()`

### Data Persistence (`quiz-data.json`)
**Real-time saving**: Every user interaction triggers `saveQuizData()`
- Prevents data loss on unexpected exits
- Atomic write operations to `src/data/quiz-data.json`
- Automatic session recovery on startup

### User Interaction Commands
**During Quiz**:
- `'-'`: Mark never show again (permanent exclusion + answer reveal)
- `'?'`: Don't know (answer reveal + add to failed queue)
- `'q'`: Quit with session statistics

**Answer Input Flexibility**:
- True/false: Accept `1`/`2`, `O`/`X`, `o`/`x`
- Multiple-choice: Direct option selection `1`, `2`, `3`

## Data Processing Pipeline

### 1. PDF Extraction (`src/tools/pdf-to-csv.ts`)
**Primary Algorithm**: Pattern-based text extraction using `pdf-parse`
- **True/False Pattern**: `^\d{3}\s+[○X]\s+(.+)$`
- **Multiple-Choice Pattern**: `^\d{3}\s+\d(.*)$`
- **Multi-line handling**: Smart text assembly for questions spanning multiple lines
- **Data validation**: Filters headers, validates content length

### 2. CSV Processing (`src/tools/csv-to-json.ts`)
**Core Logic**: Merges CSV files with intelligent explanation matching
- **Explanation Database**: 157 hardcoded explanation mappings
- **Fuzzy Matching**: 80% similarity threshold using character comparison
- **Text Normalization**: Removes punctuation/spaces for better matching
- **Conditional Explanations**: Only adds to true-false questions with 'X' answers

### 3. Data Validation Tools
- `verify-explanations.ts`: QA tool for explanation coverage
- `debug-matching.ts`: Diagnostic statistics for explanation matching
- `add-explanations.ts`: Standalone explanation addition utility

## Build System

### Dual Configuration Strategy
**Production (`tsconfig.prod.json`)**:
- **Selective compilation**: Only `src/quiz.ts` and `src/types/`
- **Excludes**: `src/tools/**/*` from output
- **Purpose**: Lightweight deployment build

**Development (`tsconfig.json`)**:
- **Full compilation**: Includes all tools and utilities
- **Purpose**: Development and data processing

### Output Structure
```
dist/
├── quiz.js          # Main application
├── types/           # TypeScript interfaces  
├── data/            # Copied from src/data/
└── tools/           # Data processing utilities (dev only)
```

## Question Data Format

### Question Interface
```typescript
interface Question {
  id: string;                    // Format: "001", "002", etc.
  type: 'multiple-choice' | 'true-false';
  text: string;                  // Traditional Chinese question text
  correctAnswer: string;         // "1"|"2"|"3" for MC, "O"|"X" for TF
  options?: {                    // Only for multiple-choice
    [key: string]: string;       // "1": "選項一", "2": "選項二", etc.
  };
  explanation?: string;          // Only for true-false with 'X' answers
}
```

### Progress Data Format
```typescript
interface QuizData {
  failedQuestions: Question[];     # Incorrect answers → retry queue
  answeredQuestions: Question[];   # Correct answers → excluded
  markedQuestions: Question[];     # User marked → permanently excluded
}
```

## Implementation Details

### Terminal UI
- **Color System**: ANSI escape codes via `colors` constant
- **Input Library**: `readline-sync` for synchronous console interaction
- **Progress Display**: Real-time statistics after each question

### Data Integrity
- **Question Exclusion**: ID '034' hardcoded filter due to controversial content
- **Explanation Coverage**: 64 true-false questions with 'X' answers have explanations
- **Source Control**: CSV files in `src/tools/src_data/` are single source of truth

### Error Handling
- **Graceful failures**: PDF parsing errors logged but don't crash application
- **Data validation**: Question format validation before processing
- **Recovery mechanisms**: Automatic progress recovery on restart

## Key Algorithms

### Fisher-Yates Shuffle (`shuffleArray()`)
Ensures unbiased question randomization for each quiz session.

### Fuzzy String Matching (explanation pairing)
Character-by-character comparison with 80% similarity threshold for automatic explanation assignment.

### Three-Category Progress Tracking
Sophisticated state management ensuring questions flow correctly between answered/failed/marked categories.