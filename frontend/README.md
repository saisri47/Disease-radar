# Disease Radar - Frontend

A modern, responsive React-based frontend for the AI-Powered Crowdsourced Disease Radar application.

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                 # Main app component with routing
│   ├── App.css                 # App layout styles
│   ├── main.jsx                # React entry point
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.jsx          # Multi-variant button component
│   │   ├── Button.css
│   │   ├── Card.jsx            # Glass-morphism card component
│   │   ├── Card.css
│   │   ├── Navbar.jsx          # Responsive navigation bar
│   │   ├── Navbar.css
│   │   ├── Footer.jsx          # Multi-column footer
│   │   └── Footer.css
│   ├── pages/                  # Page components
│   │   ├── HomePage.jsx        # Dashboard with stats, charts, reports, alerts
│   │   ├── HomePage.css
│   │   ├── ReportPage.jsx      # Symptom reporting form
│   │   ├── ReportPage.css
│   │   ├── MapPage.jsx         # Interactive map with symptom layers
│   │   ├── MapPage.css
│   │   ├── AboutPage.jsx       # Project info and mission
│   │   └── AboutPage.css
│   └── styles/
│       └── theme.css           # Global theme, CSS variables, animations, utilities
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
└── vite.config.js             # Vite configuration (if present)
```

## Technology Stack

- **Framework**: React 19.2.0
- **Build Tool**: Vite 5.0.10
- **Routing**: React Router v6
- **Maps**: Leaflet 1.9.4 + react-leaflet 5.0.0
- **Styling**: Pure CSS with CSS variables and animations
- **Icons**: React Icons 4.11.0

## Color Scheme

- **Background**: Dark Blue-Black (#0d1117)
- **Primary**: Cyan (#00d9ff)
- **Accent**: Blue (#4d9cff)
- **Text**: Off-white (#e6edf3)
- **Text Muted**: Gray (#8a9ab0)
- **Danger**: Red (#ff6b6b)
- **Success**: Green (#10b981)

## Design System

### CSS Variables
All components use CSS variables defined in `theme.css`:
- Color variables: `--bg`, `--card`, `--primary`, `--accent`, `--text`, `--text-muted`, `--text-dim`
- Shadow variables: `--shadow`, `--shadow-glow`
- Spacing scale: `--spacing-xs` through `--spacing-2xl`
- Border radius: `--radius` (8px)
- Z-index scale: `--z-*`

### Animation Keyframes
Pre-defined animations in `theme.css`:
- `fadeIn` - Opacity transition
- `slideUp` - Bottom to top slide
- `slideDown` - Top to bottom slide
- `slideInLeft` / `slideInRight` - Directional slides
- `glow` - Pulsing shadow effect
- `pulse` - Opacity pulse
- `float` - Gentle vertical float
- `shimmer` - Shimmer effect

### Utility Classes
- Layout: `.container`, `.grid`, `.flex`, `.gap-*`
- Text: `.text-*`, `.text-muted`, `.text-dim`
- Spacing: `.p-*`, `.m-*`, `.gap-*`
- Animations: `.fade-in`, `.slide-up`, `.float`
- Responsive breakpoints: 1024px (desktop to tablet), 768px (tablet to mobile)

## Components

### UI Components

#### Button
Multi-variant button component with four styles:
- `primary`: Cyan gradient with neon glow
- `secondary`: Transparent with border
- `success`: Green gradient
- `danger`: Red gradient

Sizes: `sm`, `md` (default), `lg`

```jsx
<Button variant="primary" size="lg" glow>
  Submit Report
</Button>
```

#### Card
Glass-morphism card with optional glow and hover effects:
```jsx
<Card glow hover>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</Card>
```

#### Navbar
Sticky navigation with:
- Animated gradient logo
- Desktop navigation menu with animated underlines
- Mobile hamburger menu
- Links to all pages

#### Footer
Four-column footer with:
- Company info
- Quick links
- Technology stack
- Resources
- Copyright and tagline

### Pages

#### HomePage
Dashboard with:
- Hero section with CTA buttons
- Statistics cards (Total Reports, Active Clusters, Risk Index, Symptoms)
- Charts preview (Bar chart + Heatmap)
- Recent reports table
- Alerts section

#### ReportPage
Symptom reporting form with:
- Multi-select symptom chips (13 common symptoms)
- Location cell dropdown (15 cells across 5x3 grid)
- Submit button with validation
- Success/Error popups
- API integration with `/api/report` endpoint

#### MapPage
Interactive map view with:
- Embedded iframe for `map_symptom_layers.html`
- Left sidebar with symptom layer toggles
- "Show All" / "Hide All" button
- Map information and legend
- Info cards below map

#### AboutPage
Project information with:
- Mission statement
- Key features (4 feature cards)
- Technology stack (4 tech cards)
- Project objectives (6 numbered objectives)
- Call-to-action card

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend FastAPI server running on `http://127.0.0.1:8000`

### Install Dependencies
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Starts Vite dev server on `http://localhost:5173` (or next available port)

### Build for Production
```bash
npm run build
```
Creates optimized build in `dist/` directory

### Preview Production Build
```bash
npm run preview
```

## Styling Guidelines

### CSS Organization
1. **Global Theme**: `src/styles/theme.css` (600+ lines)
   - CSS variables
   - Animation keyframes
   - Utility classes
   - Responsive breakpoints

2. **Component Styles**: Each component has dedicated CSS file
   - Scoped to component classes
   - Uses CSS variables for consistency
   - Mobile-first responsive design

### Responsive Design
- **Desktop**: 1024px+
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

All grid layouts adjust automatically:
- 4 cols → 2 cols → 1 col

### Adding New Pages
1. Create `src/pages/NewPage.jsx`
2. Create `src/pages/NewPage.css`
3. Add route to `App.jsx`:
```jsx
<Route path="/new-page" element={<NewPage />} />
```
4. Add nav link to `Navbar.jsx`

## API Integration

### Report Submission
POST `/api/report`
```json
{
  "symptoms": ["Fever", "Cough"],
  "cell": "cell_0_0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Map Data
Loads from `/maps/map_symptom_layers.html` iframe

## Performance Optimizations

- CSS variables for efficient theme switching
- Keyframe animations use GPU-accelerated properties (transform, opacity)
- Lazy iframe loading for map
- React Router code splitting ready
- No external component libraries (pure CSS UI system)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

- Dark/Light theme toggle
- Advanced filtering on map
- Data export functionality
- Real-time notification system
- User authentication
- Historical data analysis
- Mobile app version

## License

Part of Disease Radar project
