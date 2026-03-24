# /generate-questions — Create Question Bank Content

When the user runs `/generate-questions <subject> <level> <topic> [count]`,
execute this workflow:

1. **Verify syllabus alignment:**
   - Check that the topic exists in MOE syllabus for the target level
   - Reference the syllabus PDFs in project knowledge

2. **Generate questions** (default: 5) following this schema:
   ```json
   {
     "subject": "Mathematics",
     "level": "Primary 4",
     "topic": "Fractions",
     "difficulty": "standard",
     "question": "...",
     "options": [
       { "label": "A", "text": "...", "correct": true },
       { "label": "B", "text": "...", "correct": false, "explanation": "..." },
       { "label": "C", "text": "...", "correct": false, "explanation": "..." },
       { "label": "D", "text": "...", "correct": false, "explanation": "..." }
     ],
     "worked_solution": "Step 1: ... Step 2: ...",
     "examiner_tip": "In PSLE, the keyword is..."
   }
   ```

3. **Quality checks:**
   - Each wrong option has a specific, educational explanation
   - Worked solution shows every step
   - Difficulty spread: 1 foundation, 2 standard, 1 advanced, 1 hots
   - Language is age-appropriate Singapore English

4. **Save** to `data/questions/{level}-{subject}.json`
