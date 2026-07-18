import { useEffect, useRef, useState } from 'react';
import SlideChartView from './SlideChartView.js';
import type { Slide } from '../types/presentation.d.ts';

const DEFAULT_BG_COLOR = '#ffffff';
const DEFAULT_TITLE_POSITION = { x: 8, y: 18 };
const DEFAULT_CONTENT_POSITION = { x: 8, y: 42 };
const DEFAULT_IMAGE_POSITION = { x: 58, y: 48 };
const DEFAULT_CHART_POSITION = { x: 30, y: 30 };

export default function SlideView({ slide }: { slide: Slide }) {
  const titlePos = slide.titlePosition || DEFAULT_TITLE_POSITION;
  const contentPos = slide.contentPosition || DEFAULT_CONTENT_POSITION;
  const imagePos = slide.imagePosition || DEFAULT_IMAGE_POSITION;
  const imageWidth = slide.imageWidth || 30;
  const imageHeight = slide.imageHeight || 40;
  const chartPos = slide.chartPosition || DEFAULT_CHART_POSITION;
  const chartWidth = slide.chartWidth || 40;
  const chartHeight = slide.chartHeight || 40;

  const canvasRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [contentAutoTop, setContentAutoTop] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const title = titleRef.current;
    if (!canvas || !title) {
      setContentAutoTop(null);
      return;
    }

    const updateAutoTop = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      if (canvasRect.height <= 0) return;
      const titleBottomPercent = ((titleRect.bottom - canvasRect.top) / canvasRect.height) * 100 + 4;
      setContentAutoTop(titleBottomPercent > contentPos.y ? titleBottomPercent : null);
    };

    updateAutoTop();
    const observer = new ResizeObserver(updateAutoTop);
    observer.observe(title);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [slide.title, titlePos.x, titlePos.y, contentPos.y]);

  return (
    <div
      ref={canvasRef}
      className="relative aspect-video w-full overflow-hidden rounded-2xl text-slate-900 shadow-2xl"
      style={{ backgroundColor: slide.bgColor || DEFAULT_BG_COLOR, containerType: 'inline-size' }}
    >
      <div className="absolute right-6 top-5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <span className="text-sm">◆</span> Interacto
      </div>

      <div
        ref={titleRef}
        className="rich-text absolute max-w-[80%] text-[clamp(1.1rem,6cqw,2.25rem)] font-semibold leading-tight text-slate-900"
        style={{ left: `${titlePos.x}%`, top: `${titlePos.y}%` }}
        dangerouslySetInnerHTML={{ __html: slide.title }}
      />

      <div
        className="rich-text absolute max-w-[70%] whitespace-pre-wrap text-[clamp(0.8rem,3cqw,1rem)] text-slate-600"
        style={{ left: `${contentPos.x}%`, top: `${contentAutoTop ?? contentPos.y}%` }}
        dangerouslySetInnerHTML={{ __html: slide.content }}
      />

      {slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt="Slide content"
          className="absolute rounded-xl object-cover shadow-lg"
          style={{
            left: `${imagePos.x}%`,
            top: `${imagePos.y}%`,
            width: `${imageWidth}%`,
            height: `${imageHeight}%`
          }}
        />
      ) : null}

      {slide.chart ? (
        <div
          className="absolute rounded-xl bg-white/95 p-2 shadow-lg"
          style={{
            left: `${chartPos.x}%`,
            top: `${chartPos.y}%`,
            width: `${chartWidth}%`,
            height: `${chartHeight}%`
          }}
        >
          <SlideChartView chart={slide.chart} />
        </div>
      ) : null}
    </div>
  );
}
