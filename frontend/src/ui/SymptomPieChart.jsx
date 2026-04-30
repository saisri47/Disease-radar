import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import '../styles/Charts.css';

export default function SymptomPieChart({ data, title = 'Symptom Distribution' }) {
  const COLORS = [
    '#00d9ff', '#ff6b6b', '#51cf66', '#ffd93d',
    '#a78bfa', '#f472b6', '#14b8a6', '#f97316',
    '#06b6d4', '#ec4899'
  ];

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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #00d9ff' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
