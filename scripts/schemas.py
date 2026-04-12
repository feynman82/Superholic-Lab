from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class ClozeBlank(BaseModel):
    number: str
    options: List[str]
    correct_answer: str

class EditingLine(BaseModel):
    line_number: int
    text: str
    underlined_word: str
    correct_word: str

# NEW: The Procedural Diagram Engine
class VisualPayload(BaseModel):
    engine: Literal["diagram-library", "mermaid"] = Field(description="Always use 'diagram-library' for math/science drawings. Use 'mermaid' for text-only flowcharts.")
    function_name: str = Field(description="The name of the function to call. e.g., 'horizontalBarChart', 'plantLifeCycle'")
    params: str = Field(description="A VALID JSON STRING containing the exact parameters to feed into the function. You MUST output this as a stringified JSON object. Example: '{\"contents\": \"water\", \"volume\": 50}'")

class QuestionSchema(BaseModel):
    subject: Literal["English Language", "Mathematics", "Science"]
    level: Literal["Primary 3", "Primary 4", "Primary 5", "Primary 6"]
    topic: str 
    difficulty: Literal["easy", "medium", "hard"]
    type: Literal["mcq", "short_ans", "word_problem", "cloze", "editing", "open_ended"]
    marks: int
    instructions: Optional[str]
    question_text: str 
    options: Optional[List[str]]
    correct_answer: Optional[str]
    model_answer: Optional[str]
    passage: Optional[str] 
    blanks: Optional[List[ClozeBlank]] 
    passage_lines: Optional[List[EditingLine]]
    source_pdf: str
    visual_payload: Optional[VisualPayload] = Field(default=None, description="Extract diagram data into procedural parameters instead of an image.")
    flag_review: bool = Field(default=False)

class ExtractionResult(BaseModel):
    questions: List[QuestionSchema]