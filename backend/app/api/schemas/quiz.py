from pydantic import BaseModel


class QuizSubmission(BaseModel):
    question: str
    student_answer: str
    correct_answer: str
    topic: str
    student_name: str = "default"


class QuizResult(BaseModel):
    is_correct: bool
    correct_answer: str
