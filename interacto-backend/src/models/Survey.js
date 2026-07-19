import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['short_text', 'long_text', 'multiple_choice', 'rating'],
    default: 'short_text'
  },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: true }
});

const ResponseSchema = new mongoose.Schema(
  {
    answers: { type: [String], default: [] },
    submittedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const SurveySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    audience: { type: String, required: true },
    goal: { type: String, required: true },
    questions: { type: [QuestionSchema], default: [] },
    responses: { type: [ResponseSchema], default: [] }
  },
  {
    timestamps: true
  }
);

const Survey = mongoose.models.Survey || mongoose.model('Survey', SurveySchema);
export default Survey;
