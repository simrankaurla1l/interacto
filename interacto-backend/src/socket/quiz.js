import Quiz from '../models/Quiz.js';
import QuizRoom from '../models/QuizRoom.js';
import { QUESTION_DURATION_MS, MAX_PARTICIPANTS, serializeRoom } from '../lib/quizRoom.js';

const timers = new Map();

function clearTimer(roomCode) {
  const existing = timers.get(roomCode);
  if (existing) {
    clearTimeout(existing);
    timers.delete(roomCode);
  }
}

function scheduleAdvance(io, roomCode) {
  clearTimer(roomCode);
  const timeout = setTimeout(() => {
    advanceQuestion(io, roomCode).catch((error) => console.error('Failed to advance quiz question:', error));
  }, QUESTION_DURATION_MS);
  timers.set(roomCode, timeout);
}

function broadcastQuestion(io, room, quiz) {
  const question = quiz.questions[room.currentQuestionIndex];
  io.to(room.code).emit('quiz:question', {
    index: room.currentQuestionIndex,
    total: quiz.questions.length,
    text: question.text,
    options: question.options,
    endsAt: room.questionEndsAt
  });
  io.to(room.code).emit('quiz:room-update', serializeRoom(room));
}

async function advanceQuestion(io, roomCode) {
  clearTimer(roomCode);
  const room = await QuizRoom.findOne({ code: roomCode });
  if (!room || room.status !== 'active') {
    return;
  }

  const quiz = await Quiz.findById(room.quiz);
  if (!quiz) {
    return;
  }

  const nextIndex = room.currentQuestionIndex + 1;
  if (nextIndex >= quiz.questions.length) {
    room.status = 'finished';
    room.questionEndsAt = null;
    await room.save();
    io.to(roomCode).emit('quiz:finished', serializeRoom(room));
    return;
  }

  room.currentQuestionIndex = nextIndex;
  room.questionEndsAt = new Date(Date.now() + QUESTION_DURATION_MS);
  await room.save();
  broadcastQuestion(io, room, quiz);
  scheduleAdvance(io, roomCode);
}

export function attachQuizSocket(io) {
  io.on('connection', (socket) => {
    socket.on('quiz:join', async ({ roomCode, name, participantId }, callback) => {
      try {
        const code = String(roomCode || '').toUpperCase();
        const room = await QuizRoom.findOne({ code });
        if (!room) {
          return callback?.({ error: 'Room not found' });
        }
        if (room.status === 'finished') {
          return callback?.({ error: 'This quiz has already finished' });
        }

        let participant = participantId ? room.participants.find((p) => p.participantId === participantId) : null;
        if (!participant) {
          if (room.participants.length >= MAX_PARTICIPANTS) {
            return callback?.({ error: `This room is full (${MAX_PARTICIPANTS} participants max)` });
          }
          const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          participant = {
            participantId: newId,
            name: String(name || 'Guest').trim().slice(0, 40) || 'Guest',
            connected: true,
            score: 0,
            answers: []
          };
          room.participants.push(participant);
        } else {
          participant.connected = true;
          if (name) {
            participant.name = String(name).trim().slice(0, 40) || participant.name;
          }
        }

        await room.save();

        socket.data.roomCode = code;
        socket.data.participantId = participant.participantId;
        socket.join(code);

        callback?.({ participantId: participant.participantId, room: serializeRoom(room) });
        io.to(code).emit('quiz:room-update', serializeRoom(room));
      } catch (error) {
        callback?.({ error: error?.message || 'Failed to join room' });
      }
    });

    socket.on('quiz:host-join', async ({ roomCode }, callback) => {
      try {
        const code = String(roomCode || '').toUpperCase();
        const room = await QuizRoom.findOne({ code });
        if (!room) {
          return callback?.({ error: 'Room not found' });
        }
        socket.join(code);
        socket.data.roomCode = code;
        socket.data.isHost = true;
        callback?.({ room: serializeRoom(room) });
      } catch (error) {
        callback?.({ error: error?.message || 'Failed to join as host' });
      }
    });

    socket.on('quiz:start', async ({ roomCode }) => {
      try {
        const code = String(roomCode || '').toUpperCase();
        const room = await QuizRoom.findOne({ code });
        if (!room || room.status !== 'lobby') {
          return;
        }
        const quiz = await Quiz.findById(room.quiz);
        if (!quiz || !quiz.questions.length) {
          return;
        }

        room.status = 'active';
        room.currentQuestionIndex = 0;
        room.questionEndsAt = new Date(Date.now() + QUESTION_DURATION_MS);
        await room.save();

        broadcastQuestion(io, room, quiz);
        scheduleAdvance(io, code);
      } catch (error) {
        console.error('Failed to start quiz:', error);
      }
    });

    socket.on('quiz:answer', async ({ roomCode, participantId, questionIndex, optionIndex }) => {
      try {
        const code = String(roomCode || '').toUpperCase();
        const room = await QuizRoom.findOne({ code });
        if (!room || room.status !== 'active' || room.currentQuestionIndex !== questionIndex) {
          return;
        }

        const participant = room.participants.find((p) => p.participantId === participantId);
        if (!participant || participant.answers.some((answer) => answer.questionIndex === questionIndex)) {
          return;
        }

        const quiz = await Quiz.findById(room.quiz);
        const question = quiz?.questions[questionIndex];
        const correct = Boolean(question && question.correctIndex === optionIndex);
        participant.answers.push({ questionIndex, optionIndex, correct });
        if (correct) {
          participant.score += 1;
        }
        await room.save();

        io.to(code).emit('quiz:room-update', serializeRoom(room));

        const connectedParticipants = room.participants.filter((p) => p.connected);
        const allAnswered =
          connectedParticipants.length > 0 &&
          connectedParticipants.every((p) => p.answers.some((answer) => answer.questionIndex === questionIndex));
        if (allAnswered) {
          advanceQuestion(io, code).catch((error) => console.error('Failed to advance quiz question:', error));
        }
      } catch (error) {
        console.error('Failed to record quiz answer:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const { roomCode, participantId, isHost } = socket.data || {};
        if (!roomCode || isHost || !participantId) {
          return;
        }
        const room = await QuizRoom.findOne({ code: roomCode });
        if (!room) {
          return;
        }
        const participant = room.participants.find((p) => p.participantId === participantId);
        if (participant) {
          participant.connected = false;
          await room.save();
          io.to(roomCode).emit('quiz:room-update', serializeRoom(room));
        }
      } catch (error) {
        console.error('Failed to handle quiz participant disconnect:', error);
      }
    });
  });
}
