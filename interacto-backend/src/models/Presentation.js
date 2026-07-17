import mongoose from 'mongoose';

const PositionSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  { _id: false }
);

const ChartDataPointSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true }
  },
  { _id: false }
);

const ChartSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['bar', 'pie', 'line', 'dot'], required: true },
    data: { type: [ChartDataPointSchema], default: [] }
  },
  { _id: false }
);

const SlideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  titlePosition: { type: PositionSchema, default: () => ({ x: 8, y: 18 }) },
  contentPosition: { type: PositionSchema, default: () => ({ x: 8, y: 42 }) },
  imagePosition: { type: PositionSchema, default: () => ({ x: 58, y: 48 }) },
  imageWidth: { type: Number, default: 30 },
  imageHeight: { type: Number, default: 40 },
  chart: { type: ChartSchema, default: null },
  chartPosition: { type: PositionSchema, default: () => ({ x: 30, y: 30 }) },
  chartWidth: { type: Number, default: 40 },
  chartHeight: { type: Number, default: 40 },
  bgColor: { type: String, default: '#ffffff' }
});

const PresentationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    topic: { type: String, required: true },
    audience: { type: String, required: true },
    goal: { type: String, required: true },
    questions: { type: [String], default: [] },
    answers: { type: [String], default: [] },
    slides: { type: [SlideSchema], default: [] }
  },
  {
    timestamps: true
  }
);

const Presentation = mongoose.models.Presentation || mongoose.model('Presentation', PresentationSchema);
export default Presentation;
