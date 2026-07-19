import express from 'express';
import Quiz from '../models/Quiz.js';
import QuizRoom from '../models/QuizRoom.js';
import { generateText, parseJSON, looksLikeRawJson } from '../lib/gemini.js';
import { generateUniqueRoomCode, serializeRoom } from '../lib/quizRoom.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

function normalizeQuestionObjects(rawQuestions) {
  return rawQuestions
    .map((question) => {
      const questionText = String(question?.text || question?.question || '').trim();
      const options = Array.isArray(question?.options)
        ? question.options
            .map((option) => String(option).trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];
      let correctIndex = Number(question?.correctIndex);
      if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }
      return { text: questionText, options, correctIndex };
    })
    .filter((question) => question.text && question.options.length >= 2 && !looksLikeRawJson(question.text))
    .slice(0, 25);
}

// Scans for complete `{...}` objects inside the first `[...]` array in the text, even if the
// array itself never closes. This recovers whichever questions came before a truncated Gemini
// response got cut off, instead of discarding the entire batch.
function extractArrayObjects(text) {
  const content = String(text)
    .replace(/```(?:json)?/gi, '')
    .replace(/\r?\n/g, '\n');
  const arrayStart = content.indexOf('[');
  if (arrayStart === -1) {
    return [];
  }

  const objects = [];
  let depth = 0;
  let start = -1;
  for (let i = arrayStart + 1; i < content.length; i += 1) {
    const char = content[i];
    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(content.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objects;
}

function parseQuizQuestions(text) {
  const parsed = parseJSON(text);
  const rawQuestions = parsed?.questions && Array.isArray(parsed.questions) ? parsed.questions : null;
  if (rawQuestions && rawQuestions.length) {
    return normalizeQuestionObjects(rawQuestions);
  }

  const recovered = extractArrayObjects(text)
    .map((chunk) => {
      try {
        return JSON.parse(chunk);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return normalizeQuestionObjects(recovered);
}

function createGenericQuestions(topic, count, startIndex = 0) {
  return Array.from({ length: count }, (_, index) => ({
    text: `Question ${startIndex + index + 1} about ${topic}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0
  }));
}

router.get('/', requireAuth, async (req, res) => {
  const quizzes = await Quiz.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20);
  res.send({ quizzes });
});

router.get('/:id', requireAuth, async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, user: req.userId });
  if (!quiz) {
    return res.status(404).send({ error: 'Quiz not found' });
  }
  res.send({ quiz });
});

router.get('/rooms/:code', async (req, res) => {
  const room = await QuizRoom.findOne({ code: String(req.params.code).toUpperCase() });
  if (!room) {
    return res.status(404).send({ error: 'Room not found' });
  }
  const quiz = await Quiz.findById(room.quiz);
  res.send({
    room: serializeRoom(room),
    quiz: quiz ? { title: quiz.title, totalQuestions: quiz.questions.length } : null
  });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!quiz) {
    return res.status(404).send({ error: 'Quiz not found' });
  }
  await QuizRoom.deleteMany({ quiz: quiz._id });
  res.send({ success: true });
});

router.post('/generate', requireAuth, async (req, res) => {
  const { title, audience, goal, questionCount, difficulty } = req.body;
  if (!title || !audience || !goal) {
    return res.status(400).send({ error: 'Title, audience, and goal are required' });
  }

  const count = Math.min(25, Math.max(1, Number(questionCount) || 10));
  const normalizedDifficulty = ALLOWED_DIFFICULTIES.has(difficulty) ? difficulty : 'medium';

  const prompt = `You are a quiz design assistant. Create a multiple-choice quiz for the following request.
Quiz topic: ${title}
Audience: ${audience}
Goal: ${goal}
Difficulty: ${normalizedDifficulty}
Return exactly valid JSON only. Do not add markdown, code fences, or extra commentary.
Respond with a single JSON object containing a field named "questions" — an array of exactly ${count} question objects. Each question object must have:
- "text": the question text
- "options": an array of exactly 4 answer strings
- "correctIndex": the 0-based index (0-3) of the correct option in "options"
Example:
{"questions":[{"text":"What is 2+2?","options":["3","4","5","6"],"correctIndex":1}]}`;

  try {
    const output = await generateText(prompt, 4500);
    let questions = parseQuizQuestions(output);

    if (!questions.length) {
      questions = createGenericQuestions(title, count);
    } else if (questions.length < count) {
      questions = questions.concat(createGenericQuestions(title, count - questions.length, questions.length));
    } else if (questions.length > count) {
      questions = questions.slice(0, count);
    }

    const quiz = await Quiz.create({
      user: req.userId,
      title,
      audience,
      goal,
      difficulty: normalizedDifficulty,
      questions
    });

    const code = await generateUniqueRoomCode();
    await QuizRoom.create({ quiz: quiz._id, code, status: 'lobby', participants: [] });

    quiz.roomCode = code;
    await quiz.save();

    return res.send({ quizId: quiz._id, roomCode: code, quiz });
  } catch (error) {
    console.error('Quiz generation failed:', error);
    return res.status(500).send({ error: error?.message || 'Quiz generation failed' });
  }
});

export default router;
