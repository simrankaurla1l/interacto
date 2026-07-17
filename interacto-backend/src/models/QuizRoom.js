import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    optionIndex: { type: Number, default: null },
    correct: { type: Boolean, default: false }
  },
  { _id: false }
);

const ParticipantSchema = new mongoose.Schema(
  {
    participantId: { type: String, required: true },
    name: { type: String, required: true },
    connected: { type: Boolean, default: true },
    score: { type: Number, default: 0 },
    answers: { type: [AnswerSchema], default: [] }
  },
  { _id: false }
);

const QuizRoomSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['lobby', 'active', 'finished'], default: 'lobby' },
    currentQuestionIndex: { type: Number, default: -1 },
    questionEndsAt: { type: Date, default: null },
    participants: { type: [ParticipantSchema], default: [] }
  },
  {
    timestamps: true
  }
);

const QuizRoom = mongoose.models.QuizRoom || mongoose.model('QuizRoom', QuizRoomSchema);
export default QuizRoom;
