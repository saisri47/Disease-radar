import React from 'react'
import { apiUrl } from '../config'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const documentationUrl = apiUrl('/docs')
  const apiReferenceUrl = apiUrl('/redoc')

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Disease Radar</h4>
            <p>AI-Powered Crowdsourced Health Intelligence System</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/report">Report</a></li>
              <li><a href="/map">Map</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Technology</h4>
            <ul>
              <li><a href="#tech">React.js</a></li>
              <li><a href="#tech">Leaflet Maps</a></li>
              <li><a href="#tech">FastAPI</a></li>
              <li><a href="#tech">SQLite</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href={documentationUrl} target="_blank" rel="noreferrer">Documentation</a></li>
              <li><a href={apiReferenceUrl} target="_blank" rel="noreferrer">API Reference</a></li>
              <li><a href="https://github.com/saisri47" target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href="mailto:bogapathisaisri@gmail.com">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} AI-Powered Disease Radar. All rights reserved.</p>
          <p>Built with ❤️ for public health intelligence</p>
        </div>
      </div>
    </footer>
  )
}
