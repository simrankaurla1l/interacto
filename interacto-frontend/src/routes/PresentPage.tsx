import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, Cross2Icon } from '@radix-ui/react-icons';
import { api } from '../lib/api.js';
import SlideView from '../components/SlideView.js';
import type { Presentation } from '../types/presentation.d.ts';

export default function PresentPage() {
  const { presentationId } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!presentationId) return;
    const fetchPresentation = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/presentations/${presentationId}`);
        setPresentation(response.data.presentation);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load presentation.');
      } finally {
        setLoading(false);
      }
    };
    fetchPresentation();
  }, [presentationId]);

  const slideCount = presentation?.slides.length || 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        setIndex((prev) => Math.min(prev + 1, slideCount - 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        setIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === 'Escape') {
        navigate(`/editor/${presentationId}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideCount, navigate, presentationId]);

  const slide = presentation?.slides[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <button
        onClick={() => navigate(`/editor/${presentationId}`)}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        title="Exit presentation"
      >
        <Cross2Icon className="h-4 w-4" />
      </button>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-10">
        {loading ? (
          <p className="text-slate-400">Loading presentation…</p>
        ) : error ? (
          <p className="text-rose-400">{error}</p>
        ) : slide ? (
          <div className="w-full max-w-6xl">
            <SlideView slide={slide} />
          </div>
        ) : (
          <p className="text-slate-400">This presentation has no slides.</p>
        )}
      </div>

      {slideCount > 0 ? (
        <div className="flex items-center justify-center gap-6 pb-8">
          <button
            onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
            disabled={index === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
            title="Previous slide"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="text-sm text-slate-400">
            {index + 1} / {slideCount}
          </span>
          <button
            onClick={() => setIndex((prev) => Math.min(prev + 1, slideCount - 1))}
            disabled={index === slideCount - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30"
            title="Next slide"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
