# Disease Radar Frontend - Architecture & Structure

## 📐 Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              App.jsx (Main Router)                    │  │
│  │              BrowserRouter + Routes                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                  │
│        ┌───────────────────┼───────────────────┐            │
│        │                   │                   │            │
│    ┌───▼────────┐  ┌──────▼──────┐  ┌────────▼────┐        │
│    │  Navbar    │  │  main       │  │   Footer    │        │
│    │            │  │  Routes     │  │             │        │
│    │ (Sticky)   │  │             │  │  (4 columns)│        │
│    └────────────┘  └──────┬──────┘  └─────────────┘        │
│                           │                                  │
│        ┌──────────────────┼──────────────────┐             │
│        │                  │                  │             │
│    ┌───▼────────┐  ┌─────▼─────┐  ┌────────▼─────┐  ┌──▼──┐
│    │ HomePage   │  │ReportPage │  │  MapPage    │  │About │
│    │            │  │           │  │             │  │Page  │
│    │ Dashboard  │  │   Form    │  │   Iframe    │  │Info  │
│    └────────────┘  └───────────┘  └─────────────┘  └──────┘
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ File Organization

```
frontend/
│
├── src/
│   │
│   ├── App.jsx                 ← Main routing component
│   ├── App.css
│   ├── main.jsx                ← React entry point
│   │
│   ├── ui/                     ← Reusable Components
│   │   ├── Button.jsx / .css   (4 variants × 3 sizes)
│   │   ├── Card.jsx / .css     (glass-morphism)
│   │   ├── Navbar.jsx / .css   (sticky, responsive)
│   │   └── Footer.jsx / .css   (4-column layout)
│   │
│   ├── pages/                  ← Full Page Components
│   │   ├── HomePage.jsx / .css         (Dashboard)
│   │   ├── ReportPage.jsx / .css       (Form + API)
│   │   ├── MapPage.jsx / .css          (Map + Controls)
│   │   └── AboutPage.jsx / .css        (Project Info)
│   │
│   └── styles/
│       └── theme.css           ← Global Design System
│           (600+ lines)
│           - 40+ CSS variables
│           - 7 animations
│           - Utilities
│           - Responsive breakpoints
│
├── index.html                  ← HTML entry point
├── package.json                ← Dependencies
└── README.md                   ← Project documentation
```

## 🎯 Component Hierarchy

```
App
├── Navbar
│   ├── Logo (Link to /)
│   ├── NavLinks
│   │   ├── Link to /
│   │   ├── Link to /report
│   │   ├── Link to /map
│   │   └── Link to /about
│   └── HamburgerMenu (Mobile)
│
├── Routes
│   ├── Route / → HomePage
│   │   ├── HeroSection
│   │   ├── StatsGrid
│   │   │   └── 4 × Card (with stats)
│   │   ├── ChartsSection
│   │   │   ├── BarChartCard
│   │   │   └── HeatmapCard
│   │   ├── ReportsTable
│   │   └── AlertsSection
│   │       └── 2 × Card (alerts)
│   │
│   ├── Route /report → ReportPage
│   │   ├── Header
│   │   ├── Card (Form)
│   │   │   ├── SymptomChips (13 options)
│   │   │   ├── CellSelect (15 options)
│   │   │   └── SubmitButton
│   │   ├── SuccessPopup
│   │   └── ErrorPopup
│   │
│   ├── Route /map → MapPage
│   │   ├── MapContainer
│   │   │   ├── MapIframe
│   │   │   └── Sidebar
│   │   │       ├── Card
│   │   │       │   ├── SymptomToggles (6 items)
│   │   │       │   ├── ShowAll/HideAll
│   │   │       │   └── MapInfo
│   │   │       └── InfoCards (4 cards)
│   │   │
│   │   └── InfoSection
│   │       └── 4 × Card (info)
│   │
│   └── Route /about → AboutPage
│       ├── Header
│       ├── MissionCard
│       ├── FeaturesSection
│       │   └── 4 × FeatureCard
│       ├── TechSection
│       │   └── 4 × TechCard
│       ├── ObjectivesSection
│       │   └── 6 × ObjectiveItem
│       └── CTACard
│
└── Footer
    ├── CompanyColumn
    ├── QuickLinksColumn
    ├── TechnologyColumn
    └── ResourcesColumn
```

## 🎨 Design System Flow

```
theme.css (Global)
    │
    ├── CSS Variables
    │   ├── Colors (7 colors)
    │   ├── Spacing (12 scale levels)
    │   ├── Shadows (3 shadow variations)
    │   ├── Borders (2 border styles)
    │   └── Z-index (4 layers)
    │
    ├── Animation Keyframes (7)
    │   ├── fadeIn
    │   ├── slideUp / slideDown
    │   ├── slideInLeft / slideInRight
    │   ├── glow (pulse shadow)
    │   ├── pulse (opacity)
    │   ├── float
    │   └── shimmer
    │
    ├── Utility Classes
    │   ├── Layout (.container, .grid, .flex)
    │   ├── Spacing (.gap-*, .p-*, .m-*)
    │   ├── Text (.text-*, .text-muted)
    │   └── Animation (.fade-in, .slide-up, .float)
    │
    └── Responsive Breakpoints
        ├── 1024px (Desktop ↔ Tablet)
        └── 768px (Tablet ↔ Mobile)
    │
    ↓ Used by all components
    │
    ├── UI Components
    │   ├── Button (variant + size)
    │   ├── Card (glow + hover)
    │   ├── Navbar (sticky)
    │   └── Footer (responsive)
    │
    └── Pages
        ├── HomePage (dashboard)
        ├── ReportPage (form)
        ├── MapPage (map)
        └── AboutPage (info)
```

## 🔄 Data Flow

```
User Browser
    │
    ├─→ index.html
    │   └─→ React mounts to #root
    │
    ├─→ main.jsx
    │   └─→ Renders App
    │
    └─→ App.jsx
        ├─→ Navbar (navigation)
        │
        ├─→ Routes (based on URL)
        │   │
        │   ├─ /          → HomePage
        │   │              └─ Displays sample data
        │   │
        │   ├─ /report    → ReportPage
        │   │              └─ Form → POST /api/report
        │   │
        │   ├─ /map       → MapPage
        │   │              └─ Loads iframe + controls
        │   │
        │   └─ /about     → AboutPage
        │                   └─ Shows static content
        │
        └─→ Footer (always visible)

Styling:
    All pages / components
        └─→ Import theme.css
            └─→ Use CSS variables
                └─→ Apply responsive styles
```

## 📱 Responsive Behavior

```
┌──────────────────────────────────────────────────────────┐
│  Desktop (1024px+)       │ Tablet (768-1024px) │ Mobile  │
├──────────────────────────┼─────────────────────┼─────────┤
│                          │                     │         │
│  4-column grid           │ 2-column grid       │ 1 col   │
│  Sidebar visible         │ Sidebar top/bottom  │ Stacked │
│  Full spacing            │ Adjusted spacing    │ Compact │
│  Desktop nav             │ Desktop nav         │ Burger  │
│  No hamburger            │ No hamburger        │ Active  │
│                          │                     │         │
│  Font: 1rem              │ Font: 0.95rem       │ 0.9rem  │
│  Padding: 24px           │ Padding: 18px       │ 12px    │
│  Gap: 24px               │ Gap: 16px           │ 12px    │
│                          │                     │         │
└──────────────────────────┴─────────────────────┴─────────┘
```

## 🔌 API Integration Points

```
ReportPage
    │
    └─→ Form Submission
        │
        └─→ POST /api/report
            └─→ Backend (FastAPI)
                ├─→ Save to database
                ├─→ Trigger clustering
                └─→ Update map

MapPage
    │
    └─→ Load iframe
        │
        └─→ GET /maps/map_symptom_layers.html
            └─→ Displays interactive map
                ├─→ Shows layer data
                └─→ Responds to controls
```

## 🎨 Color Application

```
Header/Logo Areas:
    Primary color (#00d9ff - Cyan)
        ├─→ Logo gradient text
        ├─→ Link underlines
        └─→ Section titles

Button/CTA Areas:
    Primary gradient (#00d9ff → #4d9cff)
        ├─→ Submit buttons
        ├─→ CTA buttons
        └─→ Primary actions

Card/Container Areas:
    Accent color (#4d9cff - Blue)
        ├─→ Card borders
        ├─→ Hover effects
        └─→ Secondary highlights

Alert/Status Areas:
    Danger red (#ff6b6b)
        └─→ Error states, warnings
    
    Success green (#10b981)
        └─→ Success states, confirmations

Text Areas:
    Primary text (#e6edf3 - Off-white)
        └─→ Headlines, main content
    
    Muted text (#8a9ab0 - Gray)
        └─→ Helper text, descriptions
    
    Dim text (#5a6b80 - Dark gray)
        └─→ Subtle, tertiary content
```

## 📊 Animation Application

```
Page Load:
    fadeIn (200ms)
    slideUp (400ms, 100ms delay per item)
    └─→ Content appears smoothly

Hover States:
    glow (continuous pulse)
    └─→ Primary elements pulse softly
    
    float (3s loop)
    └─→ Logo floats gently
    
    scale (200ms)
    └─→ Buttons scale on hover

Transitions:
    Smooth 200-400ms transitions
    └─→ All state changes
    
Focus States:
    glow effect
    └─→ Accessible focus indicators
```

## 🚀 Performance Optimization

```
Code Splitting:
    ├─→ React Router splits per page
    └─→ Lazy load as needed

CSS Optimization:
    ├─→ Variables reduce duplication
    ├─→ Utility classes reusable
    └─→ Responsive media queries

Animation Optimization:
    ├─→ Only transform + opacity
    ├─→ GPU acceleration
    └─→ No layout thrashing

Image/Asset Optimization:
    ├─→ Lazy load iframe
    └─→ No external dependencies

Build Output:
    └─→ Vite optimizes bundle
        ├─→ Minified CSS
        ├─→ Minified JavaScript
        └─→ Optimized for production
```

---

This architecture provides:
✅ Clear separation of concerns
✅ Easy to maintain and extend
✅ Performance optimized
✅ Responsive and accessible
✅ Fully documented
✅ Production-ready
