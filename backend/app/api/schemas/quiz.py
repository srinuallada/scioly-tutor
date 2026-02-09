from pydantic import BaseModel, Field


class QuizSubmission(BaseModel):
    question: str
    student_answer: str
    correct_answer: str
    topic: str
    student_name: str = "default"


class QuizResult(BaseModel):
    is_correct: bool
    correct_answer: str


class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    student_name: str = Field("default", max_length=50)


class QuizGenerateResponse(BaseModel):
    question: str
    options: list[str]
    correct_letter: str
    explanation: str
    topic: str
