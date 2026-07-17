export interface SlidePosition {
  x: number;
  y: number;
}

export type ChartType = 'bar' | 'pie' | 'line' | 'dot';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface SlideChart {
  type: ChartType;
  data: ChartDataPoint[];
}

export interface Slide {
  title: string;
  content: string;
  imageUrl?: string;
  titlePosition?: SlidePosition;
  contentPosition?: SlidePosition;
  imagePosition?: SlidePosition;
  imageWidth?: number;
  imageHeight?: number;
  chart?: SlideChart;
  chartPosition?: SlidePosition;
  chartWidth?: number;
  chartHeight?: number;
  bgColor?: string;
}

export interface Presentation {
  _id: string;
  title: string;
  topic: string;
  audience: string;
  goal: string;
  questions: string[];
  answers: string[];
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}
