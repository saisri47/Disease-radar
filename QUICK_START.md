# Quick Start Guide - Disease Radar Frontend

## 📦 Installation

```bash
cd frontend
npm install
```

This will install:
- React 19.2.0
- React Router v6
- Leaflet + react-leaflet
- Vite (dev tool)

## 🚀 Running the Development Server

```bash
npm run dev
```

This starts a local dev server (typically on `http://localhost:5173`)

Open your browser and you should see:
- Dark blue-black background (#0d1117)
- Cyan accents (#00d9ff)
- Navigation bar with logo
- Hero section on the home page

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main routing component
│   ├── main.jsx             # React entry point
│   ├── App.css              # App layout styles
│   ├── ui/                  # Reusable components
│   │   ├── Button.jsx       # Variants: primary, secondary, success, danger
│   │   ├── Card.jsx         # Glass-morphism cards
│   │   ├── Navbar.jsx       # Navigation with mobile menu
│   │   └── Footer.jsx       # Multi-column footer
│   ├── pages/               # Full-page components
│   │   ├── HomePage.jsx     # Dashboard with stats & charts
│   │   ├── ReportPage.jsx   # Symptom report form
│   │   ├── MapPage.jsx      # Interactive map + controls
│   │   └── AboutPage.jsx    # Project info & mission
│   └── styles/
│       └── theme.css        # Global theme (600+ lines)
├── index.html               # HTML entry point
└── package.json             # Dependencies
```

## 🎨 Design System

### Colors
- **Primary**: `#00d9ff` (cyan) - Main accent color
- **Accent**: `#4d9cff` (blue) - Secondary accent
- **Background**: `#0d1117` (dark blue-black)
- **Text**: `#e6edf3` (off-white)
- **Danger**: `#ff6b6b` (red)
- **Success**: `#10b981` (green)

All colors are CSS variables in `theme.css` - change them in one place!

### Components to Use

#### Button
```jsx
<Button variant="primary" size="lg" glow>
  Click Me
</Button>
```
Variants: `primary`, `secondary`, `success`, `danger`
Sizes: `sm`, `md`, `lg`

#### Card
```jsx
<Card glow hover>
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

#### Navbar
Already included in App.jsx - shows navigation links to all pages

#### Footer
Already included in App.jsx - shows at bottom of every page

## 🌍 Routes Available

- `/` - Home (Dashboard with stats, charts, recent reports, alerts)
- `/report` - Report symptoms form
- `/map` - Interactive symptom map with layer controls
- `/about` - Project info, mission, tech stack, objectives

## 🔧 Customization Tips

### Add a New Page
1. Create `src/pages/NewPage.jsx`
2. Create `src/pages/NewPage.css` (import at top of jsx)
3. Add route to `App.jsx`:
```jsx
<Route path="/new-page" element={<NewPage />} />
```
4. Add link in `Navbar.jsx`

### Change Colors
Edit `src/styles/theme.css`, modify the `:root { }` section:
```css
:root {
  --primary: #00d9ff;  /* Change cyan to your color */
  --bg: #0d1117;       /* Change background */
  /* ... etc */
}
```

### Add New Button Variants
Edit `Button.css`, add to `.button.variant-yourname { }`

### Responsive Breakpoints
Defined in `theme.css`:
- Desktop: 1024px+
- Tablet: 768px - 1024px
- Mobile: < 768px

All components automatically adapt at these breakpoints.

## 📊 Sample Data

### HomePage
- Stats: 1284 total reports, 12 active clusters, 6.4 risk index, 18 symptoms
- Charts: Bar chart of top 5 symptoms + heatmap preview
- Reports: 3 sample recent reports
- Alerts: 2 sample alerts

### ReportPage
- 13 pre-defined symptoms to select from
- 15 location cells (5x3 grid)
- Validation requires at least 1 symptom
- API endpoint: `POST /api/report`

### MapPage
- 6 symptom layer toggles
- Loads map from `map_symptom_layers.html`
- Shows as iframe

## 🔌 API Integration

### Report Submission
The ReportPage automatically connects to your backend:

```
POST /api/report
{
  "symptoms": ["Fever", "Cough"],
  "cell": "cell_0_0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Backend should be running on `http://127.0.0.1:8000`

## 🎯 Key Features

✅ Dark blue-black theme with cyan accents
✅ Responsive design (works on mobile, tablet, desktop)
✅ Glass-morphism components
✅ Smooth animations
✅ Multi-page routing
✅ Form validation
✅ API integration ready
✅ No external component libraries (pure CSS)
✅ 600+ lines of design tokens in one file
✅ Mobile hamburger menu

## 🏗️ Build for Production

```bash
npm run build
```

Creates optimized `dist/` folder ready for deployment.

To preview the build:
```bash
npm run preview
```

## 🐛 Troubleshooting

**"Cannot find module react-router-dom"**
- Run `npm install` again
- Check package.json has `"react-router-dom": "^6.20.0"`

**Map not showing**
- Ensure backend serves `/maps/map_symptom_layers.html` correctly
- Check browser console for 404 errors

**Styles not loading**
- Clear browser cache (Ctrl+Shift+Delete)
- Ensure `theme.css` is imported in `main.jsx`

**Pages not routing correctly**
- Check `App.jsx` has all routes defined
- Ensure Navbar links match route paths

## 📚 Additional Resources

- React docs: https://react.dev
- React Router docs: https://reactrouter.com
- Vite docs: https://vitejs.dev
- Leaflet docs: https://leafletjs.com

## ✨ Next Steps

1. **Test locally**: `npm run dev` and navigate all pages
2. **Integrate backend**: Update API endpoints in ReportPage
3. **Customize colors**: Edit `theme.css` :root section
4. **Add more pages**: Follow the "Add a New Page" guide above
5. **Deploy**: Run `npm run build` and serve the `dist/` folder

---

**Status**: ✅ Ready to use!

All components are production-ready and styled consistently.
Start the dev server and explore the UI.
