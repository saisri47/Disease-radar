# Analytics Data Flow & API Reference

## Data Architecture

### Data Sources
The analytics dashboard pulls data from the Disease Radar backend API:

```
Backend API (http://localhost:8000)
    ├── /api/reports
    ├── /api/symptom_counts
    └── /api/symptom_counts_by_cell
```

## API Endpoints Used by Analytics

### 1. **GET /api/reports**
Returns recent health reports

**Query Parameters:**
- `limit`: Number of reports to return (default: 100)

**Response Example:**
```json
[
  {
    "id": 1,
    "symptoms": ["fever", "cough"],
    "cell": "cell_4_5",
    "pincode": "110001",
    "onset_date": "2024-12-21",
    "created_at": "2024-12-21T10:30:00Z"
  },
  {
    "id": 2,
    "symptoms": ["headache", "fatigue"],
    "cell": "cell_2_3",
    "pincode": "400001",
    "onset_date": "2024-12-21",
    "created_at": "2024-12-21T11:15:00Z"
  }
]
```

### 2. **GET /api/symptom_counts**
Returns frequency count of each symptom across all reports

**Response Example:**
```json
{
  "total": {
    "fever": 156,
    "cough": 142,
    "headache": 98,
    "fatigue": 87,
    "body aches": 76,
    "shortness of breath": 34,
    "sore throat": 45,
    "loss of taste": 12,
    ...
  },
  "total_reports": 527
}
```

## Chart Data Processing

### SymptomBarChart
**Input**: Raw symptom counts from `/api/symptom_counts`

**Processing**:
```javascript
const chartData = Object.entries(symptomCounts.total)
  .map(([symptom, count]) => ({
    name: symptom.charAt(0).toUpperCase() + symptom.slice(1),
    count: count
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10) // Top 10 symptoms
```

**Output**:
```javascript
[
  { name: "Fever", count: 156 },
  { name: "Cough", count: 142 },
  { name: "Headache", count: 98 },
  // ... more symptoms
]
```

### SymptomTrendChart
**Input**: All reports from `/api/reports`

**Processing**:
```javascript
const dateCounts = {}
reports.forEach(report => {
  const date = report.onset_date || report.created_at.split('T')[0]
  dateCounts[date] = (dateCounts[date] || 0) + 1
})

const trendData = Object.entries(dateCounts)
  .map(([date, count]) => ({ date, count }))
  .sort((a, b) => new Date(a.date) - new Date(b.date))
```

**Output**:
```javascript
[
  { date: "2024-12-19", count: 5 },
  { date: "2024-12-20", count: 12 },
  { date: "2024-12-21", count: 28 },
]
```

### LocationRiskChart
**Input**: All reports from `/api/reports`

**Processing**:
```javascript
const locationStats = {}
reports.forEach(report => {
  const pincode = report.pincode || 'Unknown'
  if (!locationStats[pincode]) {
    locationStats[pincode] = {
      reportCount: 0,
      symptoms: {}
    }
  }
  locationStats[pincode].reportCount += 1
  report.symptoms.forEach(symptom => {
    locationStats[pincode].symptoms[symptom.toLowerCase()] = 
      (locationStats[pincode].symptoms[symptom.toLowerCase()] || 0) + 1
  })
})

// Risk Index Calculation
const severeSymptoms = ['fever', 'shortness of breath', 'severe cough', 'chest pain']
const locationRiskData = Object.values(locationStats)
  .map(location => ({
    pincode: location.pincode,
    reportCount: location.reportCount,
    riskIndex: severeSymptoms.reduce((sum, sym) => 
      sum + (location.symptoms[sym] || 0), 0
    )
  }))
  .sort((a, b) => b.riskIndex - a.riskIndex)
```

**Output**:
```javascript
[
  { pincode: "110001", reportCount: 15, riskIndex: 8 },
  { pincode: "400001", reportCount: 12, riskIndex: 6 },
  { pincode: "560001", reportCount: 8, riskIndex: 4 },
]
```

### SymptomPieChart
**Input**: Top 10 symptoms from processed data

**Processing**: Same as SymptomBarChart but limited to top 10

**Output**: Same format as bar chart (for pie chart conversion)

## Data Update Flow

### Real-time Updates on Homepage
```
User visits homepage
    ↓
Component mounts (useEffect)
    ↓
Fetch reports from /api/reports
Fetch symptom counts from /api/symptom_counts
    ↓
Process data for charts
    ↓
Update state (symptomChartData)
    ↓
Charts re-render with new data
    ↓
30-second interval repeats
```

### Analytics Dashboard
```
User clicks Analytics in navbar
    ↓
AnalyticsPage component mounts
    ↓
fetchAnalyticsData() function runs
    ↓
Fetch reports (limit: 100)
Fetch symptom counts
    ↓
Process all 4 chart types in parallel
Calculate statistics
    ↓
Update state with all data
    ↓
All charts render simultaneously
```

## Performance Considerations

### Data Limits
- **Reports limit**: 100 (configurable in API call)
- **Top symptoms**: 15 in bar chart, 10 in pie chart
- **Chart height**: Fixed at 300px for consistency

### Caching
- Data fetched fresh every 30 seconds on homepage
- Analytics page loads data once on mount
- No explicit caching (relies on browser cache)

### Optimization
- Charts use Recharts' optimized rendering
- Responsive Container automatically handles resizing
- Tooltip and animations are GPU-accelerated

## Risk Index Formula

**Risk Score = (Report Density × Weight1) + (Severe Symptom Count × Weight2) + (Symptom Diversity × Weight3)**

Where:
- **Report Density**: Count of reports / 5 (0-3 points)
- **Severe Symptom Count**: Severe symptoms found / 3 (0-4 points)
- **Symptom Diversity**: Unique symptoms / 10 (0-2 points)
- **Total Range**: 0-10 (higher = more risky)

**Severe Symptoms Monitored:**
- Fever
- Shortness of breath
- Severe cough
- Chest pain

## Database Query Optimization

The analytics system uses:
1. **Filtering**: Only includes reports from last 7 days (REPORT_EXPIRATION_DAYS)
2. **Aggregation**: Groups by symptom and pincode at query level
3. **Sorting**: Sorts by frequency to identify top items efficiently
4. **Limiting**: Only retrieves necessary fields

## Future Data Flow Improvements

### Proposed Enhancements
1. **Real-time WebSocket Updates**: Instead of 30-second polling
2. **Data Caching Layer**: Redis for frequently accessed data
3. **Materialized Views**: Pre-calculated analytics
4. **Time-based Aggregation**: Weekly/monthly summaries
5. **Predictive Endpoints**: ML-based forecasting

### API Extensions
```
GET /api/analytics/summary
GET /api/analytics/trends?startDate=X&endDate=Y
GET /api/analytics/risk-forecast
GET /api/analytics/comparison?location1=X&location2=Y
POST /api/analytics/export (CSV/JSON)
```

## Error Handling

### Current Implementation
- Try-catch blocks in data fetching
- Fallback to empty charts if data unavailable
- Console logging for debugging
- User-friendly "Loading..." messages

### Display States
- **Loading**: "Loading analytics data..."
- **Empty**: "No data available"
- **Error**: Data not fetched (logged to console)

## Integration with Frontend Components

### App.jsx
```javascript
<Route path="/analytics" element={<AnalyticsPage />} />
```

### Navbar.jsx
```javascript
<Link to="/analytics" className="navbar-link">Analytics</Link>
```

### HomePage.jsx
```javascript
<SymptomBarChart 
  data={symptomChartData}
  title="Top 10 Symptoms by Frequency"
/>
```

---

This architecture provides a clean, scalable foundation for analytics with clear data flow and easy expansion for future features.
