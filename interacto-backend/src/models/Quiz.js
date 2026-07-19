import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true }
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    audience: { type: String, required: true },
    goal: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    questions: { type: [QuestionSchema], default: [] },
    roomCode: { type: String }
  },
  {
    timestamps: true
  }
);

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
export default Quiz;
