export interface SourceDetail {
  source_file: string
  section_title: string
  source_type: string
  page_or_slide?: number | null
  chunk_index?: number | null
  source_url?: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  intent?: string
  sources_used?: number
  topics_referenced?: string[]
  source_details?: SourceDetail[]
  quiz_data?: QuizData | null
}

export interface ChatRequest {
  message: string
  student_name: string
  conversation_history: { role: string; content: string }[]
}

export interface ChatResponse {
  response: string
  intent: string
  sources_used: number
  topics_referenced: string[]
  quiz_data: QuizData | null
}

export interface QuizData {
  options: string[]
  correct_letter: string
}

export interface HealthResponse {
  status: string
  gemini_configured: boolean
  gemini_model: string
  materials_loaded: boolean
  stats: MaterialStats
}

export interface MaterialStats {
  total_chunks: number
  total_files: number
  files: string[]
  total_words: number
}

export interface TopicsResponse {
  topics: string[]
  stats: MaterialStats
}

export interface UploadResult {
  files_processed: { filename: string; status: string; chunks: number }[]
  total_chunks: number
  stats: MaterialStats
}

export interface QuizSubmission {
  question: string
  student_answer: string
  correct_answer: string
  topic: string
  student_name: string
}

export interface QuizResult {
  is_correct: boolean
  correct_answer: string
}

export interface ProgressResponse {
  student_id: string
  overall: { total_questions: number; correct: number; accuracy: number }
  by_topic: TopicScore[]
  weak_areas: string[]
  recent_activity: RecentActivity[]
}

export interface TopicScore {
  topic: string
  total: number
  correct: number
  accuracy: number
}

export interface RecentActivity {
  topic: string
  question: string
  is_correct: boolean
  timestamp: string
}

export interface QuizGenerateRequest {
  topic: string
  student_name?: string
}

export interface QuizGenerateResponse {
  question: string
  options: string[]
  correct_letter: string
  explanation: string
  topic: string
}

export interface StudyPlanResponse {
  due_for_review: ReviewTopic[]
  upcoming: UpcomingTopic[]
  mastered_count: number
  study_days_30d: number
}

export interface ReviewTopic {
  topic: string
  next_review: string
  interval_days: number
  repetitions: number
  last_reviewed: string | null
}

export interface UpcomingTopic {
  topic: string
  next_review: string
  interval_days: number
}
