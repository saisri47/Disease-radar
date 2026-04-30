import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '../styles/Charts.css';

export default function SymptomTrendChart({ data, title = 'Symptom Trend Over Time' }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p className="chart-empty">No data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="date" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00d9ff' }}
            cursor={{ stroke: '#00d9ff' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#00d9ff"
            strokeWidth={2}
            dot={{ fill: '#00d9ff', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
