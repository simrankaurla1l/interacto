import express from 'express';
import sanitizeHtml from 'sanitize-html';
import Presentation from '../models/Presentation.js';
import { apiKey, generateText, parseJSON, looksLikeRawJson } from '../lib/gemini.js';

const router = express.Router();

const SANITIZE_OPTIONS = {
  allowedTags: ['b', 'strong', 'i', 'em', 'u', 'span', 'div', 'font', 'br', 'ul', 'ol', 'li'],
  allowedAttributes: {
    span: ['style'],
    div: ['style'],
    font: ['style', 'color', 'face', 'size']
  },
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-fA-F]{3,8}$/],
      'font-size': [/^\d+(?:px|em|rem)$/],
      'font-family': [/^[\w\s",-]+$/],
      'font-weight': [/^(?:bold|normal|\d+)$/],
      'font-style': [/^(?:italic|normal)$/]
    }
  }
};

function sanitizeSlideText(value) {
  return sanitizeHtml(String(value), SANITIZE_OPTIONS).trim();
}

function cleanQuestion(text) {
  let cleaned = String(text).trim();
  // Strip a leading JSON object/array wrapper and key (e.g. `{"questions":[`) that can leak
  // through when a truncated Gemini response falls back to line-based parsing.
  cleaned = cleaned.replace(/^\s*\{?\s*"?\w+"?\s*:\s*\[\s*/, '').trim();
  cleaned = cleaned.replace(/^"|"$/g, '').trim();
  cleaned = cleaned.replace(/,$/, '').trim();
  if (cleaned.endsWith('(') || cleaned.endsWith('[') || cleaned.endsWith('{')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  return cleaned;
}

function isValidQuestion(text) {
  return Boolean(text) && !looksLikeRawJson(text);
}

function parseQuestions(text) {
  const cleaned = String(text)
    .replace(/```(?:json)?/gi, '')
    .replace(/\r?\n/g, '\n')
    .trim();

  const parsed = parseJSON(cleaned);
  if (parsed?.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    return parsed.questions.map((question) => String(question).trim()).filter(isValidQuestion);
  }

  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((question) => String(question).trim()).filter(isValidQuestion);
  }

  const arrayMatch = cleaned.match(/"?questions"?\s*:\s*\[([\s\S]*?)\]/i) || cleaned.match(/\[([\s\S]*?)\]/);
  if (arrayMatch) {
    const items = [];
    const itemRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
    let match;
    while ((match = itemRegex.exec(arrayMatch[1])) !== null) {
      const raw = match[0];
      items.push(raw.slice(1, -1).replace(/\\"/g, '"').trim());
    }
    if (items.length) {
      const validItems = items.map((question) => String(question).trim()).filter(isValidQuestion);
      if (validItems.length) {
        return validItems;
      }
    }
  }

  const quotedItems = [];
  const globalItemRegex = /"(?:\\.|[^"\\])*"/g;
  let quotedMatch;
  while ((quotedMatch = globalItemRegex.exec(cleaned)) !== null) {
    const raw = quotedMatch[0].slice(1, -1).replace(/\\"/g, '"').trim();
    if (raw && raw.toLowerCase() !== 'questions') {
      quotedItems.push(raw);
    }
  }
  if (quotedItems.length > 1) {
    const validQuoted = quotedItems.map((question) => String(question).trim()).filter(isValidQuestion);
    if (validQuoted.length) {
      return validQuoted;
    }
  }

  return cleaned
    .split(/\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^\s*[-\d\.]+\s*/, '').replace(/^"|"$/g, '').replace(/,$/, '').trim())
    .map((line) => line.replace(/^questions\s*:\s*/i, '').trim())
    .map((line) => line.replace(/^\s*\{\s*|\s*\}\s*$/g, '').trim())
    .map((line) => line.replace(/^\[\s*|\s*\]\s*$/g, '').trim())
    .map(cleanQuestion)
    .filter(isValidQuestion);
}

function isValidParsedSlide(slide) {
  return Boolean(
    slide.title &&
      slide.content &&
      !looksLikeRawJson(slide.title) &&
      !looksLikeRawJson(slide.content)
  );
}

function parseSlides(text) {
  const parsed = parseJSON(text);
  if (parsed?.slides && Array.isArray(parsed.slides)) {
    return parsed.slides
      .map((slide) => {
        const title = String(slide.title || slide.name || '').trim();
        let content = String(slide.content || slide.body || slide.description || '').trim();
        if (!content && title) {
          content = title;
        }
        return { title, content };
      })
      .filter(isValidParsedSlide);
  }

  const lines = String(text)
    .replace(/```(?:json)?/gi, '')
    .replace(/\r?\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.match(/^\{?$|^\}?$|^\[?$|^\]?$|^"?slides"?\s*:\s*\[?$/i));

  const slides = [];
  let currentSlide = { title: '', content: '' };

  lines.forEach((line) => {
    const slideTitleMatch = line.match(/^\s*"?title"?\s*:\s*"([^"]+)"\s*[,]?$/i);
    const slideContentMatch = line.match(/^\s*"?content"?\s*:\s*"([^"]+)"\s*[,]?$/i);

    if (slideTitleMatch) {
      if (currentSlide.title || currentSlide.content) {
        slides.push({ ...currentSlide });
      }
      currentSlide = { title: slideTitleMatch[1].trim(), content: '' };
      return;
    }

    if (slideContentMatch) {
      currentSlide.content = slideContentMatch[1].trim();
      return;
    }

    const stepTitle = line.replace(/^"|"$/g, '').replace(/,$/, '').trim();
    if (!currentSlide.title) {
      currentSlide.title = stepTitle;
    } else {
      currentSlide.content += (currentSlide.content ? ' ' : '') + stepTitle;
    }
  });

  if (currentSlide.title || currentSlide.content) {
    slides.push(currentSlide);
  }

  return slides
    .map((slide) => ({
      title: slide.title,
      content: slide.content || slide.title
    }))
    .filter(isValidParsedSlide);
}

function createGenericSlides(topic, audience, goal, count) {
  return Array.from({ length: count }, (_, index) => ({
    title: `Additional slide ${index + 1}`,
    content: `More about ${topic} for ${audience}. This slide supports the goal of ${goal} by adding another practical point and a next step.`
  }));
}

async function ensureMinSlides(slides, topic, audience, goal) {
  if (slides.length >= 5) {
    return slides;
  }

  const missing = 5 - slides.length;
  const existingTitles = slides.map((slide) => slide.title).join(', ');
  const prompt = `You are a presentation assistant. Topic: ${topic}. Audience: ${audience}. Goal: ${goal}.
The presentation currently has ${slides.length} slide(s)${existingTitles ? ` (titled: ${existingTitles})` : ''}. Add ${missing} additional slides, in JSON only, that stay specific to this topic and audience.
Return a single JSON object with a field named "slides" containing only the extra slides. Each slide must include a title and content. Do not repeat any existing slides or include markdown or code fences.
Example:
{"slides":[{"title":"Additional slide","content":"..."}]}`;

  try {
    const output = await generateText(prompt, 1500);
    const extraSlides = parseSlides(output);
    if (extraSlides.length) {
      return slides.concat(extraSlides.slice(0, missing));
    }
  } catch (error) {
    console.warn('Failed to generate extra slides, falling back to generic content.', error);
  }

  return slides.concat(createGenericSlides(topic, audience, goal, missing));
}

async function generateImageForSlide(slide, topic, audience, goal) {
  if (!apiKey) {
    return '';
  }

  const prompt = `Create a clean presentation slide illustration for a talk about "${topic}" aimed at ${audience}. Slide title: "${slide.title}". Slide content: "${slide.content}". Use modern presentation visuals and keep it simple.`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/images:generate?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'image-bison-001',
        prompt,
        size: '1024x1024'
      })
    });

    const json = await response.json();
    if (!response.ok) {
      console.warn('Image generation failed:', json);
      return '';
    }

    return json?.data?.[0]?.imageUri || json?.data?.[0]?.imageUrl || '';
  } catch (error) {
    console.warn('Image generation error:', error);
    return '';
  }
}

async function generateSlideImages(slides, topic, audience, goal) {
  const slidesWithImages = [];
  for (const slide of slides) {
    const imageUrl = await generateImageForSlide(slide, topic, audience, goal);
    slidesWithImages.push({ ...slide, imageUrl });
  }
  return slidesWithImages;
}

router.get('/', async (req, res) => {
  const presentations = await Presentation.find().sort({ createdAt: -1 }).limit(20);
  res.send({ presentations });
});

router.get('/:id', async (req, res) => {
  const presentation = await Presentation.findById(req.params.id);
  if (!presentation) {
    return res.status(404).send({ error: 'Presentation not found' });
  }
  res.send({ presentation });
});

router.patch('/:id', async (req, res) => {
  const { title } = req.body;
  const presentation = await Presentation.findById(req.params.id);
  if (!presentation) {
    return res.status(404).send({ error: 'Presentation not found' });
  }

  if (typeof title === 'string') {
    const trimmed = title.trim();
    if (!trimmed) {
      return res.status(400).send({ error: 'Title cannot be empty' });
    }
    presentation.title = trimmed;
  }

  await presentation.save();
  res.send({ presentation });
});

router.delete('/:id', async (req, res) => {
  const presentation = await Presentation.findByIdAndDelete(req.params.id);
  if (!presentation) {
    return res.status(404).send({ error: 'Presentation not found' });
  }
  res.send({ success: true });
});

router.post('/:id/slides', async (req, res) => {
  const { slide } = req.body;
  if (!slide || !slide.title || !slide.content) {
    return res.status(400).send({ error: 'Slide title and content are required' });
  }

  const presentation = await Presentation.findById(req.params.id);
  if (!presentation) {
    return res.status(404).send({ error: 'Presentation not found' });
  }

  presentation.slides.push({
    title: sanitizeSlideText(slide.title),
    content: sanitizeSlideText(slide.content),
    imageUrl: String(slide.imageUrl || '').trim()
  });

  await presentation.save();
  res.send({ presentation });
});

function parsePosition(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const x = Number(value.x);
  const y = Number(value.y);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return null;
  }
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y))
  };
}

const ALLOWED_CHART_TYPES = new Set(['bar', 'pie', 'line', 'dot']);

function parseChart(value) {
  if (!value || typeof value !== 'object' || !ALLOWED_CHART_TYPES.has(value.type) || !Array.isArray(value.data)) {
    return null;
  }
  const data = value.data
    .map((point) => ({
      label: String(point?.label ?? '').trim().slice(0, 60),
      value: Number(point?.value)
    }))
    .filter((point) => point.label && !Number.isNaN(point.value))
    .slice(0, 20);

  if (!data.length) {
    return null;
  }

  return { type: value.type, data };
}

router.patch('/:id/slides/:index', async (req, res) => {
  const {
    title,
    content,
    imageUrl,
    titlePosition,
    contentPosition,
    imagePosition,
    imageWidth,
    imageHeight,
    chart,
    chartPosition,
    chartWidth,
    chartHeight,
    bgColor,
    move
  } = req.body;
  const presentation = await Presentation.findById(req.params.id);
  if (!presentation) {
    return res.status(404).send({ error: 'Presentation not found' });
  }

  const slideIndex = Number(req.params.index);
  if (Number.isNaN(slideIndex) || slideIndex < 0 || slideIndex >= presentation.slides.length) {
    return res.status(400).send({ error: 'Invalid slide index' });
  }

  if (move) {
    const targetIndex = move === 'up' ? slideIndex - 1 : move === 'down' ? slideIndex + 1 : null;
    if (targetIndex === null || targetIndex < 0 || targetIndex >= presentation.slides.length) {
      return res.status(400).send({ error: 'Invalid move direction or target position' });
    }

    const slide = presentation.slides[slideIndex];
    presentation.slides.splice(slideIndex, 1);
    presentation.slides.splice(targetIndex, 0, slide);
    await presentation.save();
    return res.send({ presentation });
  }

  const slide = presentation.slides[slideIndex];
  if (typeof title === 'string') {
    slide.title = sanitizeSlideText(title);
  }
  if (typeof content === 'string') {
    slide.content = sanitizeSlideText(content);
  }
  if (typeof imageUrl === 'string') {
    slide.imageUrl = imageUrl.trim();
  }
  const parsedTitlePosition = parsePosition(titlePosition);
  if (parsedTitlePosition) {
    slide.titlePosition = parsedTitlePosition;
  }
  const parsedContentPosition = parsePosition(contentPosition);
  if (parsedContentPosition) {
    slide.contentPosition = parsedContentPosition;
  }
  const parsedImagePosition = parsePosition(imagePosition);
  if (parsedImagePosition) {
    slide.imagePosition = parsedImagePosition;
  }
  const parsedImageWidth = Number(imageWidth);
  if (!Number.isNaN(parsedImageWidth) && imageWidth !== undefined) {
    slide.imageWidth = Math.min(95, Math.max(6, parsedImageWidth));
  }
  const parsedImageHeight = Number(imageHeight);
  if (!Number.isNaN(parsedImageHeight) && imageHeight !== undefined) {
    slide.imageHeight = Math.min(95, Math.max(6, parsedImageHeight));
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'chart')) {
    slide.chart = chart === null ? undefined : parseChart(chart) || slide.chart;
  }
  const parsedChartPosition = parsePosition(chartPosition);
  if (parsedChartPosition) {
    slide.chartPosition = parsedChartPosition;
  }
  const parsedChartWidth = Number(chartWidth);
  if (!Number.isNaN(parsedChartWidth) && chartWidth !== undefined) {
    slide.chartWidth = Math.min(95, Math.max(15, parsedChartWidth));
  }
  const parsedChartHeight = Number(chartHeight);
  if (!Number.isNaN(parsedChartHeight) && chartHeight !== undefined) {
    slide.chartHeight = Math.min(95, Math.max(15, parsedChartHeight));
  }
  if (typeof bgColor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(bgColor)) {
    slide.bgColor = bgColor;
  }
  if (!slide.title || !slide.content) {
    return res.status(400).send({ error: 'Slide title and content cannot be empty' });
  }

  await presentation.save();
  res.send({ presentation });
});

router.post('/questions', async (req, res) => {
  const { topic, audience, goal } = req.body;
  if (!topic || !audience || !goal) {
    return res.status(400).send({ error: 'Topic, audience, and goal are required' });
  }

  const prompt = `You are an assistant that generates follow-up questions to clarify a presentation request.
Topic: ${topic}
Audience: ${audience}
Goal: ${goal}
Return exactly valid JSON only. Do not add markdown, code fences, or extra commentary.
Respond with a single JSON object containing a field named \"questions\" and an array of 3 to 4 concise questions. Do not return more than 4 questions. Example:
{\"questions\":[\"Question 1\",\"Question 2\"]}`;

  try {
    let output = await generateText(prompt, 1000);
    let questions = parseQuestions(output);

    if (!questions.length) {
      console.warn('First question generation returned empty questions array, retrying. Output:', output);
      const retryPrompt = `You are an assistant that generates follow-up questions to clarify a presentation request.
Topic: ${topic}
Audience: ${audience}
Goal: ${goal}
Return exactly valid JSON only. Do not add markdown, code fences, or extra commentary.
Respond with a single JSON object containing a field named "questions" and an array of 3 to 4 concise questions. Do not return more than 4 questions. Do not return an empty array under any circumstance.
Example:
{"questions":["Question 1","Question 2"]}`;
      output = await generateText(retryPrompt, 1000);
      questions = parseQuestions(output);
    }

    if (!questions.length) {
      console.error('Question generation returned no questions after retry. Output:', output);
      return res.status(500).send({ error: 'Question generation failed: no questions were generated.' });
    }

    return res.send({ questions: questions.slice(0, 4) });
  } catch (error) {
    console.error('Question generation failed:', error);
    return res.status(500).send({ error: error?.message || 'Question generation failed' });
  }
});

router.post('/generate', async (req, res) => {
  const { topic, audience, goal, questions, answers } = req.body;
  if (!topic || !audience || !goal || !questions || !answers) {
    return res.status(400).send({ error: 'Topic, audience, goal, questions, and answers are required' });
  }

  const questionsWithAnswers = questions
    .map((question, index) => `- ${question}: ${answers[index] || 'No answer provided'}`)
    .join('\n');

  const prompt = `You are a presentation assistant. Create a short interactive presentation for the following request.
Topic: ${topic}
Audience: ${audience}
Goal: ${goal}
Clarifications:\n${questionsWithAnswers}
Return exactly valid JSON only. The response must be a single JSON object with the presentation title and an array named \"slides\". The slides array must contain at least 5 slides. Each slide must include a title and content. Do not add markdown, code fences, or extra commentary.
Example:
{
  \"title\": \"My Presentation\",
  \"slides\": [
    { \"title\": \"Intro\", \"content\": \"...\" }
  ]
}`;

  const output = await generateText(prompt, 3000);
  const parsed = parseJSON(output);
  let slides = parseSlides(output);
  const title = parsed?.title || `Presentation: ${topic}`;

  slides = await ensureMinSlides(slides, topic, audience, goal);
  slides = await generateSlideImages(slides, topic, audience, goal);

  try {
    const presentation = await Presentation.create({
      title,
      topic,
      audience,
      goal,
      questions,
      answers,
      slides
    });

    return res.send({ presentationId: presentation._id, presentation });
  } catch (error) {
    console.error('Presentation generation failed:', error);
    return res.status(500).send({ error: error?.message || 'Presentation generation failed' });
  }
});

export default router;
