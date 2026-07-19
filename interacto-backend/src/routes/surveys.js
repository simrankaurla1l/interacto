import express from 'express';
import Survey from '../models/Survey.js';
import { generateText, parseJSON, looksLikeRawJson } from '../lib/gemini.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

const ALLOWED_QUESTION_TYPES = new Set(['short_text', 'long_text', 'multiple_choice', 'rating']);

function normalizeQuestionType(type) {
  const normalized = String(type || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return ALLOWED_QUESTION_TYPES.has(normalized) ? normalized : 'short_text';
}

function parseSurveyQuestions(text) {
  const parsed = parseJSON(text);
  const rawQuestions = parsed?.questions && Array.isArray(parsed.questions) ? parsed.questions : null;
  if (!rawQuestions) {
    return [];
  }

  return rawQuestions
    .map((question) => {
      if (typeof question === 'string') {
        return { text: question.trim(), type: 'short_text', options: [], required: true };
      }
      const text = String(question?.text || question?.question || '').trim();
      const type = normalizeQuestionType(question?.type);
      const options =
        type === 'multiple_choice' && Array.isArray(question?.options)
          ? question.options
              .map((option) => String(option).trim())
              .filter(Boolean)
              .slice(0, 8)
          : [];
      return { text, type, options, required: true };
    })
    .filter((question) => question.text && !looksLikeRawJson(question.text))
    .slice(0, 20);
}

router.get('/', requireAuth, async (req, res) => {
  const surveys = await Survey.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20);
  res.send({ surveys });
});

router.get('/:id', async (req, res) => {
  const survey = await Survey.findById(req.params.id);
  if (!survey) {
    return res.status(404).send({ error: 'Survey not found' });
  }
  res.send({ survey });
});

router.post('/generate', requireAuth, async (req, res) => {
  const { title, audience, goal, questionCount } = req.body;
  if (!title || !audience || !goal) {
    return res.status(400).send({ error: 'Title, audience, and goal are required' });
  }

  const count = Math.min(20, Math.max(1, Number(questionCount) || 5));

  const prompt = `You are a survey design assistant. Create a feedback survey for the following request.
Survey title: ${title}
Audience: ${audience}
Goal: ${goal}
Return exactly valid JSON only. Do not add markdown, code fences, or extra commentary.
Respond with a single JSON object containing a field named "questions" — an array of exactly ${count} question objects. Each question object must have:
- "text": the question text
- "type": one of "short_text", "long_text", "multiple_choice", "rating"
- "options": an array of 3-5 short option strings, ONLY when type is "multiple_choice" (otherwise an empty array)
Do not add markdown or commentary. Example:
{"questions":[{"text":"How satisfied are you overall?","type":"rating","options":[]},{"text":"What could we improve?","type":"long_text","options":[]}]}`;

  try {
    const output = await generateText(prompt, 1500);
    let questions = parseSurveyQuestions(output);

    if (!questions.length) {
      questions = Array.from({ length: count }, (_, index) => ({
        text: `Question ${index + 1} about ${title}`,
        type: 'short_text',
        options: [],
        required: true
      }));
    } else if (questions.length < count) {
      const missing = count - questions.length;
      for (let index = 0; index < missing; index += 1) {
        questions.push({
          text: `Additional question ${index + 1} about ${title}`,
          type: 'short_text',
          options: [],
          required: true
        });
      }
    } else if (questions.length > count) {
      questions = questions.slice(0, count);
    }

    const survey = await Survey.create({ user: req.userId, title, audience, goal, questions });
    return res.send({ surveyId: survey._id, survey });
  } catch (error) {
    console.error('Survey generation failed:', error);
    return res.status(500).send({ error: error?.message || 'Survey generation failed' });
  }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const { title, audience, goal } = req.body;
  const survey = await Survey.findOne({ _id: req.params.id, user: req.userId });
  if (!survey) {
    return res.status(404).send({ error: 'Survey not found' });
  }

  if (typeof title === 'string') {
    const trimmed = title.trim();
    if (!trimmed) {
      return res.status(400).send({ error: 'Title cannot be empty' });
    }
    survey.title = trimmed;
  }
  if (typeof audience === 'string') {
    survey.audience = audience.trim();
  }
  if (typeof goal === 'string') {
    survey.goal = goal.trim();
  }

  await survey.save();
  res.send({ survey });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const survey = await Survey.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!survey) {
    return res.status(404).send({ error: 'Survey not found' });
  }
  res.send({ success: true });
});

router.post('/:id/questions', requireAuth, async (req, res) => {
  const survey = await Survey.findOne({ _id: req.params.id, user: req.userId });
  if (!survey) {
    return res.status(404).send({ error: 'Survey not found' });
  }
  survey.questions.push({ text: 'New question', type: 'short_text', options: [], required: true });
  await survey.save();
  res.send({ survey });
});

router.patch('/:id/questions/:index', requireAuth, async (req, res) => {
  const { text, type, options, required, move } = req.body;
  const survey = await Survey.findOne({ _id: req.params.id, user: req.userId });
  if (!survey) {
    return res.status(404).send({ error: 'Survey not found' });
  }

  const index = Number(req.params.index);
  if (Number.isNaN(index) || index < 0 || index >= survey.questions.length) {
    return res.status(400).send({ error: 'Invalid question index' });
  }

  if (move) {
    const targetIndex = move === 'up' ? index - 1 : move === 'down' ? index + 1 : null;
    if (targetIndex === null || targetIndex < 0 || targetIndex >= survey.questions.length) {
      return res.status(400).send({ error: 'Invalid move direction or target position' });
    }
    const question = survey.questions[index];
    survey.questions.splice(index, 1);
    survey.questions.splice(targetIndex, 0, question);
    await survey.save();
    return res.send({ survey });
  }

  const question = survey.questions[index];
  if (typeof text === 'string') {
    const trimmed = text.trim();
    if (!trimmed) {
      return res.status(400).send({ error: 'Question text cannot be empty' });
    }
    question.text = trimmed;
  }
  if (typeof type === 'string' && ALLOWED_QUESTION_TYPES.has(type)) {
    question.type = type;
  }
  if (Array.isArray(options)) {
    question.options = options
      .map((option) => String(option).trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  if (typeof required === 'boolean') {
    question.required = required;
  }

  await survey.save();
  res.send({ survey });
});

router.delete('/:id/questions/:index', requireAuth, async (req, res) => {
  const survey = await Survey.findOne({ _id: req.params.id, user: req.userId });
  if (!survey) {
    return res.status(404).send({ error: 'Survey not found' });
  }

  const index = Number(req.params.index);
  if (Number.isNaN(index) || index < 0 || index >= survey.questions.length) {
    return res.status(400).send({ error: 'Invalid question index' });
  }

  survey.questions.splice(index, 1);
  await survey.save();
  res.send({ survey });
});

router.post('/:id/responses', async (req, res) => {
  const { answers } = req.body;
  const survey = await Survey.findById(req.params.id);
  if (!survey) {
    return res.status(404).send({ error: 'Survey not found' });
  }

  if (!Array.isArray(answers)) {
    return res.status(400).send({ error: 'Answers must be an array' });
  }

  const normalizedAnswers = survey.questions.map((question, index) => String(answers[index] ?? '').trim());
  const missingRequired = survey.questions.some((question, index) => question.required && !normalizedAnswers[index]);
  if (missingRequired) {
    return res.status(400).send({ error: 'Please answer all required questions.' });
  }

  survey.responses.push({ answers: normalizedAnswers, submittedAt: new Date() });
  await survey.save();
  res.send({ success: true });
});

export default router;
