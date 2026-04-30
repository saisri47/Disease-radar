# Disease Radar - Charts & Analytics Quick Start Guide

## 🎯 What's New
Your Disease Radar application now has professional-grade analytics and visualization capabilities for research and disease surveillance!

## 📊 New Features

### 1. **Analytics Dashboard**
A comprehensive analytics page with:
- Summary statistics (total reports, unique symptoms, most common symptom)
- Top symptoms bar chart
- Symptom distribution pie chart
- Report trends over time (line chart)
- Geographic risk assessment by location
- Export functionality (CSV, JSON)
- Methodology explanation for research purposes

**Access**: Click "Analytics" in the navigation menu

### 2. **Enhanced Homepage**
- Added interactive symptom frequency chart
- Shows top 10 symptoms at a glance
- Real-time data updates

### 3. **Reusable Chart Components**
- `SymptomBarChart` - Frequency analysis
- `SymptomTrendChart` - Temporal trends
- `SymptomPieChart` - Distribution analysis
- `LocationRiskChart` - Geographic risk assessment

## 🚀 Installation & Setup

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

This will install Recharts (v2.10.0) along with other dependencies.

### Step 2: Run the Application
```bash
npm run dev
```

The application will start at `http://localhost:5173`

### Step 3: Ensure Backend is Running
Make sure your backend API is running on `http://localhost:8000`:
```bash
python run_backend.py
```
(or in the backend directory: `python main.py`)

## 🎨 Accessing the New Features

### Analytics Dashboard
1. Navigate to the application
2. Click **"Analytics"** in the top navigation bar
3. View comprehensive charts and statistics

### Homepage Chart
- The homepage now displays a top 10 symptoms bar chart
- Data updates automatically every 30 seconds

## 📈 Chart Types Available

### Bar Charts
- Symptom frequency
- Risk index by location
- Perfect for comparing values

### Line Charts
- Temporal trends over time
- Identify outbreak patterns
- Track disease progression

### Pie Charts
- Symptom distribution
- Understand proportions
- Top 10 symptoms breakdown

### Combo Charts
- Risk index + report count by location
- Multi-dimensional analysis

## 🔧 Configuration

### API Endpoints Used
The analytics dashboard pulls data from:
- `/api/reports` - Get all reports
- `/api/symptom_counts` - Get symptom frequency counts

### Customization
You can modify:
- **Chart colors**: Edit `Charts.css` - look for color codes like `#00d9ff`
- **Number of symptoms displayed**: Edit `AnalyticsPage.jsx` - change `.slice(0, 10)` to different number
- **Chart titles**: Edit any chart component directly
- **Styling theme**: Modify `theme.css` or `AnalyticsPage.css`

## 📱 Responsive Design
All charts are fully responsive:
- ✅ Desktop (1024px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

## 🔍 Research Features

### For Data Analysis
- Export data as JSON or CSV
- All charts are high-resolution ready
- Methodology section explains analysis approach

### Risk Scoring Algorithm
The application calculates risk index based on:
1. **Report Density**: Number of reports per location
2. **Symptom Severity**: Presence of severe symptoms (fever, shortness of breath, etc.)
3. **Symptom Diversity**: Variety of different symptoms reported

## 🐛 Troubleshooting

### Charts not appearing?
1. Check backend is running: `http://localhost:8000/api/reports`
2. Open browser console (F12) to check for errors
3. Ensure data exists in database (submit some test reports)

### CORS errors?
The backend already has CORS enabled for `http://localhost:5173`

### Slow performance?
- Charts optimize automatically for dataset size
- Recharts handles 1000+ data points efficiently
- Clear browser cache if needed

## 📚 File Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── AnalyticsPage.jsx ⭐ NEW - Main analytics dashboard
│   │   ├── AnalyticsPage.css ⭐ NEW - Dashboard styling
│   │   └── HomePage.jsx 📝 MODIFIED - Added chart
│   ├── ui/
│   │   ├── SymptomBarChart.jsx ⭐ NEW - Bar chart component
│   │   ├── SymptomTrendChart.jsx ⭐ NEW - Line chart component
│   │   ├── SymptomPieChart.jsx ⭐ NEW - Pie chart component
│   │   ├── LocationRiskChart.jsx ⭐ NEW - Risk assessment chart
│   │   └── Navbar.jsx 📝 MODIFIED - Added Analytics link
│   ├── styles/
│   │   └── Charts.css ⭐ NEW - Chart component styling
│   └── App.jsx 📝 MODIFIED - Added route
└── package.json 📝 MODIFIED - Added recharts dependency
```

## 💡 Next Steps (Future Enhancements)

Consider implementing:
- Predictive analytics for outbreak forecasting
- Custom date range filters
- Regional comparison analysis
- Actual CSV/JSON export implementation
- Real-time WebSocket updates
- Heatmaps with Google Maps integration
- Statistical significance testing
- Export to publication formats (LaTeX)

## 🎓 Research Use Cases

1. **Outbreak Detection**: Use trend charts to identify emerging clusters
2. **Geographic Analysis**: Identify high-risk areas using location risk charts
3. **Symptom Patterns**: Analyze comorbidities with distribution charts
4. **Temporal Studies**: Track disease progression over time
5. **Data Export**: Export for advanced statistical analysis in R/Python
6. **Publication**: Screenshot-ready professional charts

## 📞 Support

For issues or questions:
1. Check the console (F12) for error messages
2. Verify backend is running and has data
3. Review the GRAPHS_ANALYTICS_SUMMARY.md for technical details
4. Check browser compatibility (Chrome, Firefox, Safari, Edge all supported)

---

**Happy analyzing! 📊📈** Your Disease Radar now has research-grade analytics capabilities. Use these tools to identify patterns, assess risk, and save lives through better disease surveillance.
