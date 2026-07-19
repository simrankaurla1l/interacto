import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSocket } from '../lib/socket.js';
import type { QuizQuestionBroadcast, QuizRoomState } from '../types/quiz.d.ts';

type Phase = 'name' | 'lobby' | 'question' | 'waiting' | 'finished';

export default function QuizJoinPage() {
  const { roomCode } = useParams();
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<Phase>('name');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuizQuestionBroadcast | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finalRoom, setFinalRoom] = useState<QuizRoomState | null>(null);
  const socketRef = useRef(getSocket());
  const storageKey = `quiz-participant-${roomCode}`;

  const joinRoom = (participantName: string) => {
    if (!roomCode) return;
    setError('');
    setJoining(true);
    const existingId = localStorage.getItem(storageKey) || undefined;
    socketRef.current.emit(
      'quiz:join',
      { roomCode, name: participantName, participantId: existingId },
      (response: any) => {
        setJoining(false);
        if (response?.error) {
          setError(response.error);
          return;
        }
        setParticipantId(response.participantId);
        localStorage.setItem(storageKey, response.participantId);
        if (response.room?.status === 'active') {
          setPhase('waiting');
        } else if (response.room?.status === 'finished') {
          setFinalRoom(response.room);
          setPhase('finished');
        } else {
          setPhase('lobby');
        }
      }
    );
  };

  useEffect(() => {
    const existingId = roomCode ? localStorage.getItem(storageKey) : null;
    if (existingId) {
      joinRoom('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  useEffect(() => {
    const socket = socketRef.current;

    const handleQuestion = (nextQuestion: QuizQuestionBroadcast) => {
      setQuestion(nextQuestion);
      setSelectedOption(null);
      setPhase('question');
    };

    const handleFinished = (nextRoom: QuizRoomState) => {
      setFinalRoom(nextRoom);
      setPhase('finished');
    };

    socket.on('quiz:question', handleQuestion);
    socket.on('quiz:finished', handleFinished);

    return () => {
      socket.off('quiz:question', handleQuestion);
      socket.off('quiz:finished', handleFinished);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'question' || !question) {
      return;
    }
    const update = () => {
      const remaining = Math.max(0, Math.round((new Date(question.endsAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [phase, question]);

  const submitAnswer = (optionIndex: number) => {
    if (!roomCode || !participantId || !question || selectedOption !== null) return;
    setSelectedOption(optionIndex);
    setPhase('waiting');
    socketRef.current.emit('quiz:answer', {
      roomCode,
      participantId,
      questionIndex: question.index,
      optionIndex
    });
  };

  if (phase === 'name') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Room {roomCode}</p>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">Join the quiz</h1>
          {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && name.trim()) joinRoom(name.trim());
            }}
            placeholder="Your name"
            className="mt-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-400"
          />
          <button
            onClick={() => name.trim() && joinRoom(name.trim())}
            disabled={joining || !name.trim()}
            className="mt-4 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {joining ? 'Joining…' : 'Join'}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'lobby') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="text-xl font-semibold text-slate-900">You're in!</h1>
          <p className="mt-2 text-sm text-slate-500">Waiting for the host to start the quiz…</p>
        </div>
      </div>
    );
  }

  if ((phase === 'question' || phase === 'waiting') && question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-sm font-medium text-slate-400">
            Question {question.index + 1} of {question.total}
          </p>
          <h1 className="mt-2 text-lg font-semibold text-slate-900">{question.text}</h1>
          <p className="mt-2 text-2xl font-bold text-orange-600">{secondsLeft}s</p>

          <div className="mt-6 space-y-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => submitAnswer(index)}
                disabled={selectedOption !== null}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedOption === index
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 disabled:hover:border-slate-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {selectedOption !== null ? (
            <p className="mt-4 text-center text-sm text-slate-400">Answer submitted — waiting for the next question…</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (phase === 'finished') {
    const me = finalRoom?.participants.find((p) => p.participantId === participantId);
    const sorted = [...(finalRoom?.participants || [])].sort((a, b) => b.score - a.score);
    const rank = me ? sorted.findIndex((p) => p.participantId === me.participantId) + 1 : null;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="text-xl font-semibold text-slate-900">Quiz finished!</h1>
          {me ? (
            <>
              <p className="mt-4 text-4xl font-bold text-orange-600">{me.score}</p>
              <p className="mt-1 text-sm text-slate-500">points{rank ? ` · rank #${rank}` : ''}</p>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-400">Loading…</p>
    </div>
  );
}
