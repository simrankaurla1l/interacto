import QuizRoom from '../models/QuizRoom.js';

export const QUESTION_DURATION_MS = 60_000;
export const MAX_PARTICIPANTS = 50;

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomRoomCode();
    const exists = await QuizRoom.findOne({ code });
    if (!exists) {
      return code;
    }
  }
  throw new Error('Could not generate a unique room code, please try again');
}

export function serializeRoom(room) {
  return {
    code: room.code,
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    questionEndsAt: room.questionEndsAt,
    participants: room.participants.map((participant) => ({
      participantId: participant.participantId,
      name: participant.name,
      connected: participant.connected,
      score: participant.score,
      answeredCount: participant.answers.length,
      answeredCurrent:
        room.currentQuestionIndex >= 0 &&
        participant.answers.some((answer) => answer.questionIndex === room.currentQuestionIndex)
    }))
  };
}
