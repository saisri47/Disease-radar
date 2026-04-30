# 📊 Charts & Analytics - Quick Reference Guide

## 🎯 Quick Start (30 seconds)

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start the app
npm run dev

# 3. Open browser
http://localhost:5173

# 4. Click "Analytics" in navbar
✨ See your charts!
```

## 📍 Where to Find Things

| Feature | Location | How to Access |
|---------|----------|--------------|
| Analytics Dashboard | `/analytics` page | Click "Analytics" in navbar |
| Homepage Chart | `/` home page | View top symptoms immediately |
| Bar Chart Component | `src/ui/SymptomBarChart.jsx` | Frequency analysis |
| Trend Chart Component | `src/ui/SymptomTrendChart.jsx` | Temporal analysis |
| Pie Chart Component | `src/ui/SymptomPieChart.jsx` | Distribution analysis |
| Risk Chart Component | `src/ui/LocationRiskChart.jsx` | Geographic analysis |
| Chart Styles | `src/styles/Charts.css` | All chart styling |

## 🔧 Configuration Files

| File | Purpose | Edit to... |
|------|---------|-----------|
| `package.json` | Dependencies | Add/remove packages |
| `App.jsx` | Routing | Add new routes |
| `Navbar.jsx` | Navigation | Add new nav links |
| `AnalyticsPage.jsx` | Dashboard | Modify dashboard layout |

## 📊 Available Charts

### 1. SymptomBarChart
```jsx
<SymptomBarChart 
  data={chartData}
  title="Custom Title"
/>
```
**Data Format**:
```javascript
[
  { name: "Fever", count: 156 },
  { name: "Cough", count: 142 }
]
```

### 2. SymptomTrendChart
```jsx
<SymptomTrendChart 
  data={trendData}
  title="Custom Title"
/>
```
**Data Format**:
```javascript
[
  { date: "2024-12-21", count: 15 },
  { date: "2024-12-22", count: 18 }
]
```

### 3. SymptomPieChart
```jsx
<SymptomPieChart 
  data={pieData}
  title="Custom Title"
/>
```
**Data Format**: Same as BarChart

### 4. LocationRiskChart
```jsx
<LocationRiskChart 
  data={locationData}
  title="Custom Title"
/>
```
**Data Format**:
```javascript
[
  { pincode: "110001", reportCount: 15, riskIndex: 8 },
  { pincode: "400001", reportCount: 12, riskIndex: 6 }
]
```

## 🌐 API Endpoints

```
GET /api/reports           → Returns all reports
GET /api/symptom_counts    → Returns symptom frequencies
```

**Endpoint**: `http://localhost:8000`

## 🎨 Customization Quick Tips

### Change Chart Colors
Edit `Charts.css`:
```css
/* Find and modify these colors */
#00d9ff   /* Cyan - primary */
#ff6b6b   /* Red - risk/alert */
#51cf66   /* Green - success */
```

### Change Chart Size
Edit individual chart components:
```javascript
<ResponsiveContainer width="100%" height={300}>
                                    /* ↑ Change this */
```

### Modify Top Symptoms Count
Edit `AnalyticsPage.jsx`:
```javascript
.slice(0, 10)  // Change 10 to desired number
```

### Change Refresh Rate
Edit `HomePage.jsx`:
```javascript
setInterval(() => { ... }, 30000)  // 30000ms = 30 seconds
```

## 🚀 Common Tasks

### Add a New Chart to Analytics Page
```jsx
// 1. Import the chart component
import MyChart from '../ui/MyChart';

// 2. Add to render
<div className="charts-grid">
  <MyChart data={myData} title="My Chart" />
</div>
```

### Add a New Navigation Link
```jsx
// Edit Navbar.jsx
<Link to="/my-page" className="navbar-link">My Page</Link>
```

### Add a New Route
```jsx
// Edit App.jsx
import MyPage from './pages/MyPage';

<Route path="/my-page" element={<MyPage />} />
```

### Fetch Custom Data
```jsx
const fetchData = async () => {
  const response = await fetch('http://localhost:8000/api/reports');
  const data = await response.json();
  setData(data);
};
```

## ⚠️ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Charts not showing | Check backend is running, check console for errors |
| CORS errors | Backend CORS is enabled, check API URL |
| Data not updating | Check data fetch interval, refresh browser |
| Mobile layout broken | Check responsive CSS in Charts.css |
| Colors look wrong | Clear browser cache (Ctrl+Shift+Delete) |

## 📱 Responsive Breakpoints

```css
Desktop:  1024px+   → Full 2-column layout
Tablet:   768-1024  → 1 column
Mobile:   <768px    → Optimized single column
```

## 🎓 File Size Reference

| File | Size | Type |
|------|------|------|
| recharts | ~200KB | Library |
| Charts.css | ~3KB | Styling |
| AnalyticsPage.jsx | ~8KB | Component |
| AnalyticsPage.css | ~4KB | Styling |
| Bar/Pie/Trend/Risk Chart | ~1KB each | Components |

## 🔗 Important Links

```
Frontend Dev Server:  http://localhost:5173
Backend API:          http://localhost:8000
Analytics Page:       http://localhost:5173/analytics
Reports API:          http://localhost:8000/api/reports
Symptom Counts:       http://localhost:8000/api/symptom_counts
```

## 📚 Documentation Files

| Document | Purpose | Audience |
|----------|---------|----------|
| GRAPHS_ANALYTICS_SUMMARY.md | Technical overview | Developers |
| ANALYTICS_QUICK_START.md | Installation guide | Everyone |
| ANALYTICS_DATA_FLOW.md | Architecture details | Developers |
| ANALYTICS_VISUAL_OVERVIEW.md | Visual guide | Non-technical |
| IMPLEMENTATION_CHANGELOG.md | What changed | Developers |
| THIS FILE | Quick reference | Everyone |

## 💡 Pro Tips

1. **For Local Testing**: Submit test reports via `/report` to populate charts
2. **For Performance**: Check browser DevTools (F12) Network tab
3. **For Debugging**: Look at browser console for error messages
4. **For Customization**: Use browser DevTools inspect element to find class names
5. **For Styling**: Use `!important` flag if CSS isn't applying

## 🆘 Getting Help

1. **Console Errors**: Open F12 → Console → Check error messages
2. **Missing Data**: Submit reports via Report page
3. **API Issues**: Check if backend is running (`python run_backend.py`)
4. **Styling Issues**: Check Charts.css and AnalyticsPage.css
5. **Import Errors**: Verify all import paths are correct

## 📊 Example: Adding Your Own Chart

```jsx
// Step 1: Create new file
// frontend/src/ui/MyCustomChart.jsx

import { BarChart, Bar, ... } from 'recharts';
import '../styles/Charts.css';

export default function MyCustomChart({ data, title }) {
  return (
    <div className="chart-container">
      <h3>{title}</h3>
      {/* Your chart here */}
    </div>
  );
}

// Step 2: Import in AnalyticsPage.jsx
import MyCustomChart from '../ui/MyCustomChart';

// Step 3: Add to dashboard
<MyCustomChart data={myData} title="My Chart" />
```

## 🎯 Learning Path

1. **Beginner**: Read ANALYTICS_QUICK_START.md
2. **Intermediate**: Review ANALYTICS_VISUAL_OVERVIEW.md
3. **Advanced**: Study ANALYTICS_DATA_FLOW.md
4. **Developer**: Reference IMPLEMENTATION_CHANGELOG.md
5. **Expert**: Customize code in components

## ✨ Next Steps

After setup:
1. ✅ Verify charts load
2. ✅ Submit test data
3. ✅ Explore all pages
4. ✅ Customize colors/styling
5. ✅ Add custom charts
6. ✅ Export data
7. ✅ Share with team

---

**Need more info?** Check the detailed documentation files in the root directory! 📚

**Ready to start?** Run `npm install` and `npm run dev` in the frontend folder! 🚀
