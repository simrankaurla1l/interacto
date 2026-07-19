import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, Cross2Icon, ExternalLinkIcon, Link2Icon, PersonIcon } from '@radix-ui/react-icons';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { useAuth } from '../lib/AuthContext.js';
import type { Quiz, QuizParticipant, QuizRoomState } from '../types/quiz.d.ts';

function participantStatus(participant: QuizParticipant, room: QuizRoomState): { label: string; className: string } {
  if (!participant.connected) {
    return { label: 'Left', className: 'bg-slate-100 text-slate-500' };
  }
  if (room.status === 'lobby') {
    return { label: 'Joined', className: 'bg-emerald-50 text-emerald-600' };
  }
  if (room.status === 'finished') {
    return { label: 'Finished', className: 'bg-orange-50 text-orange-600' };
  }
  if (participant.answeredCurrent) {
    return { label: 'Answered', className: 'bg-emerald-50 text-emerald-600' };
  }
  const missedSoFar = room.currentQuestionIndex - participant.answeredCount;
  if (missedSoFar > 0) {
    return { label: `Missed ${missedSoFar}`, className: 'bg-rose-50 text-rose-600' };
  }
  return { label: 'Thinking…', className: 'bg-amber-50 text-amber-600' };
}

export default function QuizHostPage() {
  const { quizId, roomCode } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [room, setRoom] = useState<QuizRoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [mySelectedOption, setMySelectedOption] = useState<number | null>(null);
  const [hostName, setHostName] = useState<string | null>(() => user?.name || localStorage.getItem('quiz-host-name'));
  const [hostNameDraft, setHostNameDraft] = useState('');
  const [participantsOpen, setParticipantsOpen] = useState(
    () => typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches
  );
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (user?.name) {
      setHostName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (!quizId) return;
    const fetchQuiz = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/quizzes/${quizId}`);
        setQuiz(response.data.quiz);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!roomCode) return;
    const socket = socketRef.current;

    socket.emit('quiz:host-join', { roomCode }, (response: any) => {
      if (response?.error) {
        setError(response.error);
        return;
      }
      setRoom(response.room);
    });

    const handleRoomUpdate = (nextRoom: QuizRoomState) => setRoom(nextRoom);
    const handleQuestion = () => setMySelectedOption(null);
    const handleFinished = (nextRoom: QuizRoomState) => setRoom(nextRoom);

    socket.on('quiz:room-update', handleRoomUpdate);
    socket.on('quiz:question', handleQuestion);
    socket.on('quiz:finished', handleFinished);

    return () => {
      socket.off('quiz:room-update', handleRoomUpdate);
      socket.off('quiz:question', handleQuestion);
      socket.off('quiz:finished', handleFinished);
    };
  }, [roomCode]);

  useEffect(() => {
    // The host also joins as a participant, so the person running the quiz can play along too —
    // but only once we know what to call them.
    if (!roomCode || !hostName) return;
    const socket = socketRef.current;
    const storageKey = `quiz-host-participant-${roomCode}`;
    const existingId = localStorage.getItem(storageKey) || undefined;
    socket.emit('quiz:join', { roomCode, name: hostName, participantId: existingId }, (response: any) => {
      if (response?.participantId) {
        setMyParticipantId(response.participantId);
        localStorage.setItem(storageKey, response.participantId);
      }
    });
  }, [roomCode, hostName]);

  const submitHostName = () => {
    const trimmed = hostNameDraft.trim();
    if (!trimmed) return;
    localStorage.setItem('quiz-host-name', trimmed);
    setHostName(trimmed);
  };

  useEffect(() => {
    if (!room || room.status !== 'active' || !room.questionEndsAt) {
      setSecondsLeft(0);
      return;
    }
    const update = () => {
      const remaining = Math.max(0, Math.round((new Date(room.questionEndsAt!).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [room?.questionEndsAt, room?.status]);

  const joinUrl = () => `${window.location.origin}/quiz/join/${roomCode}`;

  const copyJoinLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl());
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      setError('Could not copy link.');
    }
  };

  const startQuiz = () => {
    socketRef.current.emit('quiz:start', { roomCode });
  };

  const openJoinLink = () => {
    window.open(joinUrl(), '_blank', 'noopener,noreferrer');
  };

  const submitMyAnswer = (optionIndex: number) => {
    if (!roomCode || !myParticipantId || !room || room.currentQuestionIndex < 0 || mySelectedOption !== null) return;
    setMySelectedOption(optionIndex);
    socketRef.current.emit('quiz:answer', {
      roomCode,
      participantId: myParticipantId,
      questionIndex: room.currentQuestionIndex,
      optionIndex
    });
  };

  const currentQuestion = quiz && room && room.currentQuestionIndex >= 0 ? quiz.questions[room.currentQuestionIndex] : null;
  const sortedParticipants = [...(room?.participants || [])].sort((a, b) => b.score - a.score);

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background:
          'radial-gradient(circle at 8% 0%, rgba(251,146,60,0.08) 0%, transparent 40%), radial-gradient(circle at 92% 0%, rgba(251,191,36,0.08) 0%, transparent 40%), #f8fafc'
      }}
    >
      <header className="flex h-16 items-center gap-1 border-b border-orange-300 bg-gradient-to-r from-orange-200 via-orange-100 to-amber-100 px-2 sm:gap-4 sm:px-4">
        <Link to="/dashboard" className="rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">{quiz?.title || 'Untitled quiz'}</h1>
          <p className="text-xs text-slate-400">Room {roomCode}</p>
        </div>
        <button
          onClick={() => setParticipantsOpen(true)}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600 lg:hidden"
          title="Participants"
        >
          <PersonIcon className="h-5 w-5" />
          <span className="text-xs font-medium">{room?.participants.length || 0}</span>
        </button>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
        <main
          className="flex flex-1 overflow-auto bg-gradient-to-br from-orange-100 to-amber-50 p-4 sm:p-8"
          style={{ containerType: 'size' }}
        >
          {loading ? (
            <p className="text-slate-400">Loading quiz…</p>
          ) : error ? (
            <p className="text-rose-500">{error}</p>
          ) : !room ? (
            <p className="text-slate-400">Connecting to room…</p>
          ) : !hostName ? (
            <div className="m-auto w-full max-w-sm max-h-full overflow-y-auto rounded-3xl bg-white p-5 text-center sm:p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">What should we call you?</h2>
              <p className="mt-1 text-sm text-slate-500">You're playing too — this name will show up on the leaderboard.</p>
              <input
                autoFocus
                value={hostNameDraft}
                onChange={(event) => setHostNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitHostName();
                }}
                placeholder="Your name"
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-400"
              />
              <button
                onClick={submitHostName}
                disabled={!hostNameDraft.trim()}
                className="mt-4 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          ) : room.status === 'lobby' ? (
            <div className="m-auto w-full max-w-md max-h-full overflow-y-auto rounded-3xl bg-white p-6 text-center sm:p-10 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Room code</p>
              <p className="mt-3 text-4xl font-bold tracking-widest sm:text-5xl text-orange-600">{roomCode}</p>
              <p className="mt-4 text-sm text-slate-500">Share this code, or the link below, so people can join.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={copyJoinLink}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Link2Icon className="h-3.5 w-3.5" /> {copyFeedback ? 'Copied!' : 'Copy join link'}
                </button>
                <button
                  onClick={openJoinLink}
                  title="Open the join page in a new tab — handy for testing solo"
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" /> Open join page
                </button>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                {room.participants.filter((p) => p.connected).length} joined (max 50)
              </p>
              <button
                onClick={startQuiz}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                Start quiz
              </button>
            </div>
          ) : room.status === 'active' && currentQuestion ? (
            <div
              className="m-auto w-full max-w-2xl max-h-full overflow-y-auto rounded-3xl bg-white text-center shadow-sm ring-1 ring-slate-200"
              style={{ padding: 'clamp(0.75rem, 4cqh, 2.5rem)' }}
            >
              <p className="text-sm font-medium text-slate-400">
                Question {room.currentQuestionIndex + 1} of {quiz?.questions.length}
              </p>
              <h2
                className="font-semibold text-slate-900"
                style={{ marginTop: 'clamp(0.375rem, 2cqh, 1rem)', fontSize: 'clamp(1rem, 5cqh, 1.5rem)' }}
              >
                {currentQuestion.text}
              </h2>
              <div
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{ marginTop: 'clamp(0.5rem, 3cqh, 2rem)', gap: 'clamp(0.375rem, 1.5cqh, 0.75rem)' }}
              >
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => submitMyAnswer(index)}
                    disabled={mySelectedOption !== null}
                    style={{ padding: 'clamp(0.5rem, 2cqh, 0.75rem) 1rem' }}
                    className={`rounded-xl border text-left text-sm transition ${
                      mySelectedOption === index
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-600 hover:border-orange-300 disabled:hover:border-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {mySelectedOption !== null ? (
                <p className="mt-4 text-sm text-slate-400">Answer submitted — waiting for the next question…</p>
              ) : null}
              <p
                className="font-bold text-orange-600"
                style={{ marginTop: 'clamp(0.375rem, 2cqh, 1.5rem)', fontSize: 'clamp(1.25rem, 5cqh, 2.25rem)' }}
              >
                {secondsLeft}s
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {room.participants.filter((p) => p.answeredCurrent).length} / {room.participants.filter((p) => p.connected).length}{' '}
                answered
              </p>
            </div>
          ) : room.status === 'finished' ? (
            <div className="m-auto w-full max-w-md max-h-full overflow-y-auto rounded-3xl bg-white p-5 shadow-sm sm:p-10 ring-1 ring-slate-200">
              <h2 className="text-center text-2xl font-semibold text-slate-900">Final results</h2>
              <div className="mt-6 space-y-2">
                {sortedParticipants.map((participant, index) => (
                  <div
                    key={participant.participantId}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {index + 1}. {participant.name}
                    </span>
                    <span className="text-sm font-semibold text-orange-600">
                      {participant.score} / {quiz?.questions.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </main>

        {/* Right sidebar: live participant status */}
        {participantsOpen ? (
          <>
            <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setParticipantsOpen(false)} />
            <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-xs overflow-y-auto border-l border-orange-200 bg-orange-100 px-5 py-4 shadow-2xl lg:static lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Participants</h2>
            <button onClick={() => setParticipantsOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-orange-200 lg:hidden">
              <Cross2Icon className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">{room?.participants.length || 0} / 50</p>

          <div className="mt-4 space-y-2">
            {room?.participants.length ? (
              room.participants.map((participant) => {
                const status = participantStatus(participant, room);
                return (
                  <div
                    key={participant.participantId}
                    className="flex items-center justify-between rounded-xl border border-orange-100 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">{participant.name}</p>
                      <p className="text-xs text-slate-400">Score: {participant.score}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">No one has joined yet.</p>
            )}
          </div>
            </aside>
          </>
        ) : null}
      </div>
    </div>
  );
}
