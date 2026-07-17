import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ActivityLogIcon,
  ArrowLeftIcon,
  BarChartIcon,
  ChatBubbleIcon,
  Cross2Icon,
  DotFilledIcon,
  DotsHorizontalIcon,
  DragHandleDots2Icon,
  FontFamilyIcon,
  FontSizeIcon,
  GearIcon,
  ImageIcon,
  Link2Icon,
  Pencil1Icon,
  PieChartIcon,
  PlusIcon,
  Share1Icon,
  TextIcon,
  TrashIcon
} from '@radix-ui/react-icons';
import { api } from '../lib/api.js';
import ImageSearchModal from '../components/ImageSearchModal.js';
import SlideChartView from '../components/SlideChartView.js';
import type { ChartDataPoint, ChartType, Presentation, Slide, SlideChart, SlidePosition } from '../types/presentation.d.ts';

const DEFAULT_BG_COLOR = '#ffffff';
const DEFAULT_TITLE_POSITION: SlidePosition = { x: 8, y: 18 };
const DEFAULT_CONTENT_POSITION: SlidePosition = { x: 8, y: 42 };
const DEFAULT_IMAGE_POSITION: SlidePosition = { x: 58, y: 48 };
const DEFAULT_IMAGE_WIDTH = 30;
const DEFAULT_IMAGE_HEIGHT = 40;
const DEFAULT_CHART_POSITION: SlidePosition = { x: 30, y: 30 };
const DEFAULT_CHART_WIDTH = 40;
const DEFAULT_CHART_HEIGHT = 40;
const SAMPLE_CHART_DATA: ChartDataPoint[] = [
  { label: 'A', value: 40 },
  { label: 'B', value: 25 },
  { label: 'C', value: 60 },
  { label: 'D', value: 35 }
];
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 44, 56, 64];

type DragTarget = 'title' | 'content' | 'image' | 'chart';
type ResizeTarget = 'image' | 'chart';
type EditableTarget = 'title' | 'content';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stripHtml(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent || '';
}

function RichTextToolbar({
  onBold,
  onItalic,
  onFontFamily,
  onFontSize,
  onColor,
  onBulletList,
  onNumberList
}: {
  onBold: () => void;
  onItalic: () => void;
  onFontFamily: (family: string) => void;
  onFontSize: (size: number) => void;
  onColor: (color: string) => void;
  onBulletList: () => void;
  onNumberList: () => void;
}) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-slate-500">
        Select text on the slide, then apply formatting
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={onBold}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-orange-400 hover:text-orange-600"
          title="Bold selected text"
        >
          B
        </button>
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={onItalic}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-sm italic text-slate-600 hover:border-orange-400 hover:text-orange-600"
          title="Italicize selected text"
        >
          I
        </button>
        <div className="relative">
          <FontFamilyIcon className="pointer-events-none absolute left-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) onFontFamily(event.target.value);
              event.target.value = '';
            }}
            className="h-7 rounded-md border border-slate-200 bg-white py-1 pl-6 pr-1 text-xs text-slate-700 outline-none focus:border-orange-400"
            title="Font style for selected text"
          >
            <option value="" disabled>
              Font
            </option>
            <option value="inherit">Default</option>
            <option value='"Georgia", serif'>Serif</option>
            <option value='"Courier New", monospace'>Mono</option>
            <option value="Verdana, sans-serif">Rounded</option>
          </select>
        </div>
        <div className="relative">
          <FontSizeIcon className="pointer-events-none absolute left-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) onFontSize(Number(event.target.value));
              event.target.value = '';
            }}
            className="h-7 rounded-md border border-slate-200 bg-white py-1 pl-6 pr-1 text-xs text-slate-700 outline-none focus:border-orange-400"
            title="Font size for selected text"
          >
            <option value="" disabled>
              Size
            </option>
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>
        <label
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:border-orange-400"
          title="Color for selected text"
        >
          A
          <input type="color" onChange={(event) => onColor(event.target.value)} className="h-0 w-0 opacity-0" />
        </label>
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={onBulletList}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-500 hover:border-orange-400 hover:text-orange-600"
          title="Bulleted list"
        >
          •
        </button>
        <button
          onMouseDown={(event) => event.preventDefault()}
          onClick={onNumberList}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-500 hover:border-orange-400 hover:text-orange-600"
          title="Numbered list"
        >
          1.
        </button>
      </div>
    </div>
  );
}

function getSlideIcon(slide: Slide | undefined) {
  const text = `${stripHtml(slide?.title ?? '')} ${stripHtml(slide?.content ?? '')}`.toLowerCase();
  const isQuestion = text.trim().endsWith('?');
  if (isQuestion && (text.includes('agree') || text.includes('rate') || text.includes('scale') || text.includes('rank') || text.includes('associat'))) {
    return BarChartIcon;
  }
  if (isQuestion) {
    return ChatBubbleIcon;
  }
  return TextIcon;
}

export default function PresentationEditorPage() {
  const { presentationId } = useParams();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [renamingPresentation, setRenamingPresentation] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideContent, setNewSlideContent] = useState('');
  const [addingSlide, setAddingSlide] = useState(false);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideBgColor, setSlideBgColor] = useState(DEFAULT_BG_COLOR);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [seedTitleHtml, setSeedTitleHtml] = useState('');
  const [seedContentHtml, setSeedContentHtml] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [titlePos, setTitlePos] = useState<SlidePosition>(DEFAULT_TITLE_POSITION);
  const [contentPos, setContentPos] = useState<SlidePosition>(DEFAULT_CONTENT_POSITION);
  const [imagePos, setImagePos] = useState<SlidePosition>(DEFAULT_IMAGE_POSITION);
  const [imageWidth, setImageWidth] = useState(DEFAULT_IMAGE_WIDTH);
  const [imageHeight, setImageHeight] = useState(DEFAULT_IMAGE_HEIGHT);
  const [chart, setChart] = useState<SlideChart | null>(null);
  const [chartPos, setChartPos] = useState<SlidePosition>(DEFAULT_CHART_POSITION);
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const [chartHeight, setChartHeight] = useState(DEFAULT_CHART_HEIGHT);
  const [draggingTarget, setDraggingTarget] = useState<DragTarget | null>(null);
  const [resizingTarget, setResizingTarget] = useState<ResizeTarget | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const slideAreaRef = useRef<HTMLDivElement>(null);
  const [slideSize, setSlideSize] = useState<{ width: number; height: number } | null>(null);
  const dragStateRef = useRef<{
    target: DragTarget;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null>(null);
  const resizeStateRef = useRef<{
    target: ResizeTarget;
    startX: number;
    startY: number;
    originWidth: number;
    originHeight: number;
    canvasWidth: number;
    canvasHeight: number;
  } | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<{ target: EditableTarget; range: Range } | null>(null);

  const selectedSlide = presentation?.slides[selectedSlideIndex];
  const hasCustomBg = slideBgColor !== DEFAULT_BG_COLOR;

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const anchorNode = sel.anchorNode;
      if (!anchorNode) return;
      if (titleRef.current?.contains(anchorNode)) {
        savedSelectionRef.current = { target: 'title', range: sel.getRangeAt(0).cloneRange() };
      } else if (contentRef.current?.contains(anchorNode)) {
        savedSelectionRef.current = { target: 'content', range: sel.getRangeAt(0).cloneRange() };
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const restoreSelection = (): EditableTarget | null => {
    const saved = savedSelectionRef.current;
    if (!saved) return null;
    const ref = saved.target === 'title' ? titleRef.current : contentRef.current;
    if (!ref) return null;
    ref.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(saved.range);
    return saved.target;
  };

  const syncFromDom = (target: EditableTarget) => {
    const ref = target === 'title' ? titleRef.current : contentRef.current;
    if (!ref) return;
    if (target === 'title') {
      setEditedTitle(ref.innerHTML);
    } else {
      setEditedContent(ref.innerHTML);
    }
    setDirty(true);
  };

  const applyInlineCommand = (command: string, value?: string) => {
    const target = restoreSelection();
    if (!target) return;
    document.execCommand(command, false, value);
    syncFromDom(target);
  };

  const applyFontSize = (px: number) => {
    const target = restoreSelection();
    if (!target) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${px}px`;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    syncFromDom(target);
  };

  const saveSlide = async (payload: {
    title: string;
    content: string;
    imageUrl: string;
    titlePosition: SlidePosition;
    contentPosition: SlidePosition;
    imagePosition: SlidePosition;
    imageWidth: number;
    imageHeight: number;
    chart: SlideChart | null;
    chartPosition: SlidePosition;
    chartWidth: number;
    chartHeight: number;
    bgColor: string;
  }) => {
    if (!presentationId || selectedSlide == null) return;
    try {
      const response = await api.patch(`/api/presentations/${presentationId}/slides/${selectedSlideIndex}`, payload);
      setPresentation(response.data.presentation);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save slide.');
    }
  };

  const positionFor = (target: DragTarget) =>
    target === 'title' ? titlePos : target === 'content' ? contentPos : target === 'image' ? imagePos : chartPos;

  const handleDragStart = (event: React.PointerEvent<HTMLButtonElement>, target: DragTarget) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const origin = positionFor(target);
    dragStateRef.current = {
      target,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      width: rect.width,
      height: rect.height
    };
    setDraggingTarget(target);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const dxPct = ((event.clientX - drag.startX) / drag.width) * 100;
    const dyPct = ((event.clientY - drag.startY) / drag.height) * 100;
    const next = { x: clamp(drag.originX + dxPct, 0, 92), y: clamp(drag.originY + dyPct, 0, 88) };
    if (drag.target === 'title') {
      setTitlePos(next);
    } else if (drag.target === 'content') {
      setContentPos(next);
    } else if (drag.target === 'image') {
      setImagePos(next);
    } else {
      setChartPos(next);
    }
  };

  const handleDragEnd = () => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    setDraggingTarget(null);
    setDirty(true);
  };

  const handleResizeStart = (event: React.PointerEvent<HTMLButtonElement>, target: ResizeTarget) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    resizeStateRef.current = {
      target,
      startX: event.clientX,
      startY: event.clientY,
      originWidth: target === 'image' ? imageWidth : chartWidth,
      originHeight: target === 'image' ? imageHeight : chartHeight,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    setResizingTarget(target);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizeMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const resize = resizeStateRef.current;
    if (!resize) return;
    const dxPct = ((event.clientX - resize.startX) / resize.canvasWidth) * 100;
    const dyPct = ((event.clientY - resize.startY) / resize.canvasHeight) * 100;
    const nextWidth = clamp(resize.originWidth + dxPct, 8, 90);
    const nextHeight = clamp(resize.originHeight + dyPct, 8, 90);
    if (resize.target === 'image') {
      setImageWidth(nextWidth);
      setImageHeight(nextHeight);
    } else {
      setChartWidth(nextWidth);
      setChartHeight(nextHeight);
    }
  };

  const handleResizeEnd = () => {
    if (!resizeStateRef.current) return;
    resizeStateRef.current = null;
    setResizingTarget(null);
    setDirty(true);
  };

  const addChart = (type: ChartType) => {
    setChart({ type, data: SAMPLE_CHART_DATA.map((point) => ({ ...point })) });
    setDirty(true);
  };

  const changeChartType = (type: ChartType) => {
    setChart((prev) => (prev ? { ...prev, type } : prev));
    setDirty(true);
  };

  const removeChart = () => {
    setChart(null);
    setDirty(true);
  };

  const updateChartPoint = (index: number, field: 'label' | 'value', value: string) => {
    setChart((prev) => {
      if (!prev) return prev;
      const data = prev.data.map((point, i) =>
        i === index ? { ...point, [field]: field === 'value' ? Number(value) || 0 : value } : point
      );
      return { ...prev, data };
    });
    setDirty(true);
  };

  const addChartRow = () => {
    setChart((prev) => (prev ? { ...prev, data: [...prev.data, { label: `Item ${prev.data.length + 1}`, value: 10 }] } : prev));
    setDirty(true);
  };

  const removeChartRow = (index: number) => {
    setChart((prev) => (prev ? { ...prev, data: prev.data.filter((_, i) => i !== index) } : prev));
    setDirty(true);
  };

  const startRenamePresentation = () => {
    setTitleDraft(presentation?.title || '');
    setRenamingPresentation(true);
  };

  const submitRenamePresentation = async () => {
    const trimmed = titleDraft.trim();
    if (!presentationId || !trimmed) {
      setRenamingPresentation(false);
      return;
    }
    try {
      const response = await api.patch(`/api/presentations/${presentationId}`, { title: trimmed });
      setPresentation(response.data.presentation);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to rename presentation.');
    } finally {
      setRenamingPresentation(false);
      setSettingsOpen(false);
    }
  };

  const handleDeletePresentation = async () => {
    if (!presentationId) return;
    if (!window.confirm('Delete this presentation? This cannot be undone.')) return;
    try {
      await api.delete(`/api/presentations/${presentationId}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete presentation.');
    }
  };

  const shareOnWhatsApp = () => {
    const shareUrl = window.location.href;
    const text = encodeURIComponent(`${presentation?.title || 'Check out this presentation'}: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      setError('Could not copy link.');
    }
  };

  const shareViaSystem = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: presentation?.title || 'Presentation', url: shareUrl });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      setShareOpen(false);
    } else {
      await copyShareLink();
      setShareOpen(false);
    }
  };

  const moveSlide = async (direction: 'up' | 'down') => {
    if (!presentationId || selectedSlide == null) return;
    const index = selectedSlideIndex;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || !presentation?.slides[targetIndex]) return;

    try {
      const response = await api.patch(`/api/presentations/${presentationId}/slides/${index}`, {
        move: direction
      });
      setPresentation(response.data.presentation);
      setSelectedSlideIndex(targetIndex);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to move slide.');
    }
  };

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

  useEffect(() => {
    // Deliberately keyed on slide identity, not on `selectedSlide` itself — the latter gets a
    // new object reference after every autosave round-trip, which would otherwise reset the
    // rich-text seed (and the user's cursor) mid-edit.
    if (selectedSlide) {
      setSlideImageUrl(selectedSlide.imageUrl || '');
      setEditedTitle(selectedSlide.title);
      setEditedContent(selectedSlide.content);
      setSeedTitleHtml(selectedSlide.title);
      setSeedContentHtml(selectedSlide.content);
      setTitlePos(selectedSlide.titlePosition || DEFAULT_TITLE_POSITION);
      setContentPos(selectedSlide.contentPosition || DEFAULT_CONTENT_POSITION);
      setImagePos(selectedSlide.imagePosition || DEFAULT_IMAGE_POSITION);
      setImageWidth(selectedSlide.imageWidth || DEFAULT_IMAGE_WIDTH);
      setImageHeight(selectedSlide.imageHeight || DEFAULT_IMAGE_HEIGHT);
      setChart(selectedSlide.chart || null);
      setChartPos(selectedSlide.chartPosition || DEFAULT_CHART_POSITION);
      setChartWidth(selectedSlide.chartWidth || DEFAULT_CHART_WIDTH);
      setChartHeight(selectedSlide.chartHeight || DEFAULT_CHART_HEIGHT);
      setSlideBgColor(selectedSlide.bgColor || DEFAULT_BG_COLOR);
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlideIndex, presentation?._id]);

  useLayoutEffect(() => {
    if (titleRef.current) {
      titleRef.current.innerHTML = seedTitleHtml;
    }
  }, [selectedSlideIndex, seedTitleHtml]);

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = seedContentHtml;
    }
  }, [selectedSlideIndex, seedContentHtml]);

  useEffect(() => {
    const area = slideAreaRef.current;
    if (!area) return;

    const updateSize = () => {
      const { width, height } = area.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const targetRatio = 16 / 9;
      let nextWidth = width;
      let nextHeight = width / targetRatio;
      if (nextHeight > height) {
        nextHeight = height;
        nextWidth = height * targetRatio;
      }
      setSlideSize({ width: nextWidth, height: nextHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedSlide || !dirty) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveSlide({
        title: editedTitle.trim(),
        content: editedContent.trim(),
        imageUrl: slideImageUrl,
        titlePosition: titlePos,
        contentPosition: contentPos,
        imagePosition: imagePos,
        imageWidth,
        imageHeight,
        chart,
        chartPosition: chartPos,
        chartWidth,
        chartHeight,
        bgColor: slideBgColor
      });
      setDirty(false);
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    editedTitle,
    editedContent,
    slideImageUrl,
    titlePos,
    contentPos,
    imagePos,
    imageWidth,
    imageHeight,
    chart,
    chartPos,
    chartWidth,
    chartHeight,
    slideBgColor,
    dirty,
    selectedSlide,
    selectedSlideIndex
  ]);

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background:
          'radial-gradient(circle at 8% 0%, rgba(251,146,60,0.08) 0%, transparent 40%), radial-gradient(circle at 92% 0%, rgba(251,191,36,0.08) 0%, transparent 40%), #f8fafc'
      }}
    >
      {/* Top bar */}
      <header className="flex h-16 items-center gap-4 border-b border-orange-300 bg-gradient-to-r from-orange-200 via-orange-100 to-amber-100 px-4">
        <Link to="/dashboard" className="rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold leading-tight">
            {presentation?.title || 'Untitled presentation'}
          </h1>
          <p className="flex items-center gap-1 text-xs text-slate-400">My presentations</p>
        </div>

        {(settingsOpen || shareOpen) ? (
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setSettingsOpen(false);
              setShareOpen(false);
              setRenamingPresentation(false);
            }}
          />
        ) : null}

        <div className="relative ml-2 flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => {
                setSettingsOpen(!settingsOpen);
                setShareOpen(false);
              }}
              className="relative z-20 rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600"
              title="Settings"
            >
              <GearIcon className="h-4 w-4" />
            </button>
            {settingsOpen ? (
              <div className="absolute left-0 top-full z-20 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                {renamingPresentation ? (
                  <div className="p-1.5">
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') submitRenamePresentation();
                        if (event.key === 'Escape') setRenamingPresentation(false);
                      }}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-orange-400"
                    />
                    <div className="mt-1.5 flex justify-end gap-1.5">
                      <button
                        onClick={() => setRenamingPresentation(false)}
                        className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitRenamePresentation}
                        className="rounded-md bg-gradient-to-r from-orange-500 to-amber-400 px-2 py-1 text-xs font-medium text-white transition hover:brightness-105"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={startRenamePresentation}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil1Icon className="h-3.5 w-3.5" /> Rename presentation
                    </button>
                    <button
                      onClick={handleDeletePresentation}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" /> Delete presentation
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShareOpen(!shareOpen);
                setSettingsOpen(false);
              }}
              className="relative z-20 rounded-full p-2 text-slate-900 transition hover:bg-orange-50 hover:text-orange-600"
              title="Share"
            >
              <Share1Icon className="h-4 w-4" />
            </button>
            {shareOpen ? (
              <div className="absolute left-0 top-full z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <button
                  onClick={shareOnWhatsApp}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <ChatBubbleIcon className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                </button>
                <button
                  onClick={shareViaSystem}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <DotsHorizontalIcon className="h-3.5 w-3.5" /> More apps…
                </button>
                <button
                  onClick={copyShareLink}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Link2Icon className="h-3.5 w-3.5" /> {copyFeedback ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            to={`/present/${presentationId}`}
            className="rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            Start presentation
          </Link>
        </div>
      </header>

      <div className="flex" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Slide list */}
        <aside className="w-60 shrink-0 overflow-y-auto border-r border-orange-200 bg-orange-100 px-3 py-4">
          <button
            onClick={() => setAddingSlide(!addingSlide)}
            className="mx-auto mb-4 block w-auto rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            {addingSlide ? 'Cancel' : '+ New slide'}
          </button>

          {addingSlide ? (
            <div className="mb-4 space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-3">
              <label className="block space-y-1 text-xs text-slate-500">
                <span>Title</span>
                <input
                  value={newSlideTitle}
                  onChange={(event) => setNewSlideTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400"
                  placeholder="Slide title"
                />
              </label>
              <label className="block space-y-1 text-xs text-slate-500">
                <span>Content</span>
                <textarea
                  rows={3}
                  value={newSlideContent}
                  onChange={(event) => setNewSlideContent(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-400"
                  placeholder="Slide content"
                />
              </label>
              <button
                onClick={async () => {
                  if (!presentationId || !newSlideTitle || !newSlideContent) {
                    setError('Provide both a title and content for the new slide.');
                    return;
                  }

                  setError('');
                  try {
                    const response = await api.post(`/api/presentations/${presentationId}/slides`, {
                      slide: {
                        title: newSlideTitle,
                        content: newSlideContent
                      }
                    });
                    setPresentation(response.data.presentation);
                    setNewSlideTitle('');
                    setNewSlideContent('');
                    setAddingSlide(false);
                  } catch (err: any) {
                    setError(err?.response?.data?.error || 'Failed to add slide.');
                  }
                }}
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                Add slide
              </button>
            </div>
          ) : null}

          {loading ? (
            <p className="text-sm text-slate-400">Loading slides…</p>
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : (
            <div className="space-y-2">
              {presentation?.slides.map((slide, index) => {
                const Icon = getSlideIcon(slide);
                const isSelected = index === selectedSlideIndex;
                return (
                  <div key={index} className="flex items-start gap-2">
                    <span className="w-4 shrink-0 pt-1 text-right text-xs text-slate-400">{index + 1}</span>
                    <button
                      onClick={() => setSelectedSlideIndex(index)}
                      className={`h-20 min-w-0 flex-1 overflow-hidden rounded-xl border border-orange-200 bg-white p-3 text-left shadow-sm transition ${
                        isSelected ? 'ring-2 ring-orange-500' : 'ring-1 ring-transparent hover:ring-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-2 truncate text-sm text-slate-700">
                        {stripHtml(slide.title) || `Slide ${index + 1}`}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Canvas */}
        <main className="flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 p-4">
          <div className="flex h-full w-full items-center gap-2">
            <button
              onClick={() => moveSlide('up')}
              disabled={!presentation || selectedSlideIndex === 0}
              className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-orange-600 disabled:opacity-0"
              title="Move slide up"
            >
              ‹
            </button>

            <div ref={slideAreaRef} className="flex h-full min-w-0 flex-1 items-center justify-center">
              {loading ? (
                <p className="text-slate-400">Loading presentation…</p>
              ) : error ? (
                <p className="text-rose-500">{error}</p>
              ) : presentation && selectedSlide ? (
                <div
                  ref={canvasRef}
                  className="relative shrink-0 overflow-hidden rounded-2xl text-slate-900 shadow-xl"
                  style={{
                    backgroundColor: slideBgColor,
                    width: slideSize ? `${slideSize.width}px` : '100%',
                    height: slideSize ? `${slideSize.height}px` : undefined,
                    aspectRatio: slideSize ? undefined : '16 / 9'
                  }}
                >
                <div className="absolute right-6 top-5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <span className="text-sm">◆</span> Interacto
                </div>

                <div
                  className="absolute max-w-[80%] cursor-text"
                  style={{ left: `${titlePos.x}%`, top: `${titlePos.y}%` }}
                >
                  <button
                    onPointerDown={(event) => handleDragStart(event, 'title')}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    className={`absolute -left-8 top-0 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-slate-900/5 text-slate-500 transition hover:bg-slate-900/10 hover:opacity-100 active:cursor-grabbing ${
                      draggingTarget === 'title' ? 'opacity-100' : 'opacity-50'
                    }`}
                    title="Drag to move"
                  >
                    <DragHandleDots2Icon className="h-4 w-4" />
                  </button>
                  <div
                    key={selectedSlideIndex}
                    ref={titleRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-label="Slide title"
                    onInput={(event) => {
                      setEditedTitle(event.currentTarget.innerHTML);
                      setDirty(true);
                    }}
                    className="rich-text text-4xl font-semibold leading-tight text-slate-900 outline-none"
                  />
                </div>

                <div
                  className="absolute max-w-[70%] cursor-text"
                  style={{ left: `${contentPos.x}%`, top: `${contentPos.y}%` }}
                >
                  <button
                    onPointerDown={(event) => handleDragStart(event, 'content')}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    className={`absolute -left-8 top-0 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-slate-900/5 text-slate-500 transition hover:bg-slate-900/10 hover:opacity-100 active:cursor-grabbing ${
                      draggingTarget === 'content' ? 'opacity-100' : 'opacity-50'
                    }`}
                    title="Drag to move"
                  >
                    <DragHandleDots2Icon className="h-4 w-4" />
                  </button>
                  <div
                    key={selectedSlideIndex}
                    ref={contentRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-label="Slide content"
                    onInput={(event) => {
                      setEditedContent(event.currentTarget.innerHTML);
                      setDirty(true);
                    }}
                    className="rich-text whitespace-pre-wrap text-base text-slate-600 outline-none"
                  />
                </div>

                {slideImageUrl ? (
                  <div
                    className="group absolute"
                    style={{
                      left: `${imagePos.x}%`,
                      top: `${imagePos.y}%`,
                      width: `${imageWidth}%`,
                      height: `${imageHeight}%`
                    }}
                  >
                    <button
                      onPointerDown={(event) => handleDragStart(event, 'image')}
                      onPointerMove={handleDragMove}
                      onPointerUp={handleDragEnd}
                      className={`absolute -left-8 top-0 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-slate-900/5 text-slate-500 transition hover:bg-slate-900/10 hover:opacity-100 active:cursor-grabbing ${
                        draggingTarget === 'image' ? 'opacity-100' : 'opacity-50'
                      }`}
                      title="Drag to move"
                    >
                      <DragHandleDots2Icon className="h-4 w-4" />
                    </button>

                    <img src={slideImageUrl} alt="Slide content" className="h-full w-full rounded-xl object-cover shadow-lg" />

                    <button
                      onPointerDown={(event) => handleResizeStart(event, 'image')}
                      onPointerMove={handleResizeMove}
                      onPointerUp={handleResizeEnd}
                      title="Drag to resize"
                      className={`absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-orange-500 bg-white transition ${
                        resizingTarget === 'image' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                ) : null}

                {chart ? (
                  <div
                    className="group absolute rounded-xl bg-white/95 p-2 shadow-lg"
                    style={{
                      left: `${chartPos.x}%`,
                      top: `${chartPos.y}%`,
                      width: `${chartWidth}%`,
                      height: `${chartHeight}%`
                    }}
                  >
                    <button
                      onPointerDown={(event) => handleDragStart(event, 'chart')}
                      onPointerMove={handleDragMove}
                      onPointerUp={handleDragEnd}
                      className={`absolute -left-8 top-0 flex h-7 w-7 cursor-grab items-center justify-center rounded-md bg-slate-900/5 text-slate-500 transition hover:bg-slate-900/10 hover:opacity-100 active:cursor-grabbing ${
                        draggingTarget === 'chart' ? 'opacity-100' : 'opacity-50'
                      }`}
                      title="Drag to move"
                    >
                      <DragHandleDots2Icon className="h-4 w-4" />
                    </button>

                    <SlideChartView chart={chart} />

                    <button
                      onPointerDown={(event) => handleResizeStart(event, 'chart')}
                      onPointerMove={handleResizeMove}
                      onPointerUp={handleResizeEnd}
                      title="Drag to resize"
                      className={`absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-orange-500 bg-white transition ${
                        resizingTarget === 'chart' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                ) : null}
                </div>
              ) : (
                <p className="text-slate-400">No presentation loaded.</p>
              )}
            </div>

            <button
              onClick={() => moveSlide('down')}
              disabled={!presentation || !presentation.slides[selectedSlideIndex + 1]}
              className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-orange-600 disabled:opacity-0"
              title="Move slide down"
            >
              ›
            </button>
          </div>

          {!panelOpen ? (
            <button
              onClick={() => setPanelOpen(true)}
              className="fixed right-6 top-20 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
            >
              Edit
            </button>
          ) : null}
        </main>

        {/* Edit panel */}
        {panelOpen ? (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-orange-200 bg-orange-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Edit</h2>
              <button onClick={() => setPanelOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <Cross2Icon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-500">Design</h3>

              <div className="mt-3 divide-y divide-orange-100 rounded-xl border border-orange-200 bg-white">
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    Content image
                  </div>
                  <div className="flex items-center gap-1.5">
                    {slideImageUrl ? (
                      <>
                        <button
                          onClick={() => setImageSearchOpen(true)}
                          className="h-7 w-7 overflow-hidden rounded-full border border-slate-200"
                          title="Change content image"
                        >
                          <img src={slideImageUrl} alt="" className="h-full w-full object-cover" />
                        </button>
                        <button
                          onClick={() => setSlideImageUrl('')}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-500"
                          title="Remove content image"
                        >
                          <Cross2Icon className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setImageSearchOpen(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-orange-400 hover:text-orange-500"
                        title="Search for a content image"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-4 w-4 rounded-full border border-slate-400" />
                    Background color
                    {slideBgColor !== DEFAULT_BG_COLOR ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
                  </div>
                  <label
                    className="h-7 w-7 cursor-pointer rounded-full border border-slate-200"
                    style={{ backgroundColor: slideBgColor }}
                  >
                    <input
                      type="color"
                      value={slideBgColor}
                      onChange={(event) => {
                        setSlideBgColor(event.target.value);
                        setDirty(true);
                      }}
                      className="h-0 w-0 opacity-0"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={() => {
                  setSlideBgColor(DEFAULT_BG_COLOR);
                  setDirty(true);
                }}
                disabled={!hasCustomBg}
                className="mt-3 text-xs font-medium text-slate-400 enabled:hover:text-orange-500 disabled:cursor-not-allowed"
              >
                Reset to theme colors
              </button>
            </div>

            <div className="mt-6 border-t border-orange-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-500">Text</h3>
              <RichTextToolbar
                onBold={() => applyInlineCommand('bold')}
                onItalic={() => applyInlineCommand('italic')}
                onFontFamily={(family) => applyInlineCommand('fontName', family)}
                onFontSize={applyFontSize}
                onColor={(color) => applyInlineCommand('foreColor', color)}
                onBulletList={() => applyInlineCommand('insertUnorderedList')}
                onNumberList={() => applyInlineCommand('insertOrderedList')}
              />
            </div>

            <div className="mt-6 border-t border-orange-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-500">Chart</h3>

              {!chart ? (
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => addChart('bar')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-600 hover:border-orange-400 hover:text-orange-600"
                    title="Bar chart"
                  >
                    <BarChartIcon className="h-4 w-4" />
                    <span className="text-[10px]">Bar</span>
                  </button>
                  <button
                    onClick={() => addChart('pie')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-600 hover:border-orange-400 hover:text-orange-600"
                    title="Pie chart"
                  >
                    <PieChartIcon className="h-4 w-4" />
                    <span className="text-[10px]">Pie</span>
                  </button>
                  <button
                    onClick={() => addChart('line')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-600 hover:border-orange-400 hover:text-orange-600"
                    title="Line chart"
                  >
                    <ActivityLogIcon className="h-4 w-4" />
                    <span className="text-[10px]">Line</span>
                  </button>
                  <button
                    onClick={() => addChart('dot')}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-slate-600 hover:border-orange-400 hover:text-orange-600"
                    title="Dot chart"
                  >
                    <DotFilledIcon className="h-4 w-4" />
                    <span className="text-[10px]">Dot</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { type: 'bar' as ChartType, Icon: BarChartIcon },
                        { type: 'pie' as ChartType, Icon: PieChartIcon },
                        { type: 'line' as ChartType, Icon: ActivityLogIcon },
                        { type: 'dot' as ChartType, Icon: DotFilledIcon }
                      ]
                    ).map(({ type, Icon }) => (
                      <button
                        key={type}
                        onClick={() => changeChartType(type)}
                        className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                          chart.type === type
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-orange-300'
                        }`}
                        title={type}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                    <button
                      onClick={removeChart}
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-500"
                      title="Remove chart"
                    >
                      <Cross2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {chart.data.map((point, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <input
                          value={point.label}
                          onChange={(event) => updateChartPoint(index, 'label', event.target.value)}
                          placeholder="Label"
                          className="w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 outline-none focus:border-orange-400"
                        />
                        <input
                          type="number"
                          value={point.value}
                          onChange={(event) => updateChartPoint(index, 'value', event.target.value)}
                          placeholder="Value"
                          className="w-16 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 outline-none focus:border-orange-400"
                        />
                        <button
                          onClick={() => removeChartRow(index)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-rose-500"
                          title="Remove row"
                        >
                          <Cross2Icon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={addChartRow} className="text-xs font-medium text-orange-500 hover:text-orange-600">
                    + Add row
                  </button>
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      <ImageSearchModal
        open={imageSearchOpen}
        initialQuery={selectedSlide ? stripHtml(selectedSlide.title) : undefined}
        onClose={() => setImageSearchOpen(false)}
        onSelect={(url) => {
          setSlideImageUrl(url);
          setDirty(true);
        }}
      />
    </div>
  );
}
