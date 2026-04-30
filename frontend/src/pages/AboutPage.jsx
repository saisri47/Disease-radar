import Card from '../ui/Card';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page fade-in">
      <div className="container">
        {/* Header */}
        <div className="about-header">
          <h1>About Disease Radar</h1>
          <p>AI-Powered Crowdsourced Disease Surveillance</p>
        </div>

        {/* Mission Section */}
        <Card className="mission-card" glow>
          <h2>Our Mission</h2>
          <p>
            Disease Radar is a crowdsourced health surveillance platform that harnesses the power of distributed health data
            to detect disease patterns in real-time. By collecting symptom reports from communities, we enable early warning
            systems for disease outbreaks and provide actionable insights for public health officials.
          </p>
        </Card>

        {/* Features Section */}
        <section className="features-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            <Card className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-Time Analytics</h3>
              <p>
                Visualize disease patterns as they emerge with our interactive maps and live data dashboards.
              </p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>
                Your location is discretized and anonymized. We prioritize user privacy while maintaining data accuracy.
              </p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Detection</h3>
              <p>
                Machine learning algorithms detect disease clusters and anomalies for early outbreak prediction.
              </p>
            </Card>
            <Card className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Global Reach</h3>
              <p>
                Track disease spread across regions and understand global health dynamics in real-time.
              </p>
            </Card>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="tech-section">
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            <Card className="tech-card">
              <h3>Frontend</h3>
              <ul>
                <li>React 19.2.0</li>
                <li>Vite 5.0.10</li>
                <li>React Router</li>
                <li>Leaflet 1.9.4</li>
              </ul>
            </Card>
            <Card className="tech-card">
              <h3>Backend</h3>
              <ul>
                <li>FastAPI</li>
                <li>Python 3.10+</li>
                <li>SQLite</li>
                <li>DBSCAN Clustering</li>
              </ul>
            </Card>
            <Card className="tech-card">
              <h3>Data Analysis</h3>
              <ul>
                <li>Pandas</li>
                <li>NumPy</li>
                <li>Scikit-learn</li>
                <li>Matplotlib</li>
              </ul>
            </Card>
            <Card className="tech-card">
              <h3>Deployment</h3>
              <ul>
                <li>Docker</li>
                <li>GitHub</li>
                <li>Modern Web Stack</li>
                <li>RESTful APIs</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Objectives Section */}
        <section className="objectives-section">
          <h2>Project Objectives</h2>
          <div className="objectives-list">
            <div className="objective-item">
              <div className="objective-number">1</div>
              <div className="objective-content">
                <h3>Early Detection</h3>
                <p>Identify disease clusters and potential outbreaks before they become widespread.</p>
              </div>
            </div>
            <div className="objective-item">
              <div className="objective-number">2</div>
              <div className="objective-content">
                <h3>Public Health Support</h3>
                <p>Provide actionable insights to public health agencies for resource allocation and intervention planning.</p>
              </div>
            </div>
            <div className="objective-item">
              <div className="objective-number">3</div>
              <div className="objective-content">
                <h3>Community Engagement</h3>
                <p>Empower individuals to contribute to disease surveillance and understand health dynamics in their regions.</p>
              </div>
            </div>
            <div className="objective-item">
              <div className="objective-number">4</div>
              <div className="objective-content">
                <h3>Data Privacy</h3>
                <p>Maintain the highest standards of data privacy and security while collecting valuable health information.</p>
              </div>
            </div>
            <div className="objective-item">
              <div className="objective-number">5</div>
              <div className="objective-content">
                <h3>Continuous Improvement</h3>
                <p>Leverage machine learning to improve outbreak prediction accuracy and detection algorithms.</p>
              </div>
            </div>
            <div className="objective-item">
              <div className="objective-number">6</div>
              <div className="objective-content">
                <h3>Global Collaboration</h3>
                <p>Build an open platform for researchers and public health professionals worldwide.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <Card className="cta-card" glow>
          <div className="cta-content">
            <h2>Help Save Lives</h2>
            <p>
              Every symptom report contributes to a safer, healthier world. Join thousands of contributors in our mission to detect
              and prevent disease outbreaks.
            </p>
            <a href="/report" className="cta-button">
              Submit Your First Report
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
