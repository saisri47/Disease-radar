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

export default function LocationRiskChart({ data, title = 'Risk Index by Location' }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p className="chart-empty">No location data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="pincode" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ff6b6b' }}
            cursor={{ fill: 'rgba(255, 107, 107, 0.1)' }}
          />
          <Legend />
          <Bar dataKey="riskIndex" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
          <Bar dataKey="reportCount" fill="#00d9ff" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
