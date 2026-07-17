import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { SlideChart } from '../types/presentation.d.ts';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#a855f7', '#14b8a6'];

export default function SlideChartView({ chart }: { chart: SlideChart }) {
  if (chart.type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chart.data} dataKey="value" nameKey="label" outerRadius="80%">
            {chart.data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === 'line' || chart.type === 'dot') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart.data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={11} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={chart.type === 'line' ? '#6366f1' : 'none'}
            strokeWidth={2}
            dot={{ r: 5, fill: '#6366f1' }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chart.data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
        <YAxis stroke="#94a3b8" fontSize={11} />
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
