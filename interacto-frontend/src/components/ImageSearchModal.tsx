import { useState } from 'react';
import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { api } from '../lib/api.js';

interface ImageResult {
  id: number;
  thumbnailUrl: string;
  fullUrl: string;
  photographer: string;
  pageUrl: string;
}

interface ImageSearchModalProps {
  open: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function ImageSearchModal({ open, initialQuery, onClose, onSelect }: ImageSearchModalProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  if (!open) {
    return null;
  }

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/images/search', { params: { query: trimmed } });
      setResults(response.data.results || []);
      setSearched(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Image search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Search photos</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
          className="flex items-center gap-2 px-5 py-4"
        >
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for an image, e.g. flowers"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Search
          </button>
        </form>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Searching…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-rose-500">{error}</p>
          ) : searched && results.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No photos found. Try a different search.</p>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {results.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    onSelect(photo.fullUrl);
                    onClose();
                  }}
                  title={`Photo by ${photo.photographer} on Pexels`}
                  className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-slate-200 hover:ring-2 hover:ring-indigo-500"
                >
                  <img src={photo.thumbnailUrl} alt={`Photo by ${photo.photographer}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">Search for a photo to use on this slide.</p>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-400">Photos provided by Pexels</div>
      </div>
    </div>
  );
}
