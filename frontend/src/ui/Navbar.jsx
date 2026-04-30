import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🦠</span>
          <span className="logo-text">Disease Radar</span>
        </Link>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/report" className="navbar-link">Report</Link>
          <Link to="/map" className="navbar-link">Map</Link>
          <Link to="/analytics" className="navbar-link">Analytics</Link>
          <Link to="/admin" className="navbar-link">Admin</Link>
          <Link to="/about" className="navbar-link">About</Link>
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>
      </div>
    </nav>
  )
}
