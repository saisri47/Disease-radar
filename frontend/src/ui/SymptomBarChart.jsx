import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '../styles/Charts.css';

export default function SymptomBarChart({ data, title = 'Symptom Frequency' }) {
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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#888" angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00d9ff' }}
            cursor={{ fill: 'rgba(0, 217, 255, 0.1)' }}
          />
          <Legend />
          <Bar dataKey="count" fill="#00d9ff" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
