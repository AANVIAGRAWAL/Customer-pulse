import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  ShieldAlert, 
  Target, 
  Database,
  ArrowRight,
  Search,
  PieChart,
  Users
} from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">CustomerPulse</div>
        <div className="landing-nav-links">
          <Link to="/dashboard" className="nav-btn primary">Dashboard</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Turn customer data into retention decisions.</h1>
          <p className="hero-subtitle">
            Analyze customer behavior, identify churn risks, understand churn drivers and prioritize retention opportunities.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="btn btn-primary">
              Explore Dashboard
              <ArrowRight size={18} />
            </Link>
            <Link to="/upload" className="btn btn-secondary">
              Analyze Customer Data
            </Link>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section className="capabilities">
        <h2>Key Capabilities</h2>
        <div className="grid-container">
          <div className="feature-card">
            <div className="icon-wrapper"><ShieldAlert size={24} /></div>
            <h3>Risk Detection</h3>
            <p>Identify customers at risk of churn based on historical patterns and behavioral signals.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><Target size={24} /></div>
            <h3>Customer Segmentation</h3>
            <p>Group customers by value and risk profiles to target interventions effectively.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><BarChart2 size={24} /></div>
            <h3>Churn Drivers</h3>
            <p>Understand the root causes of churn through detailed multi-factor analysis.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><Users size={24} /></div>
            <h3>Customer 360</h3>
            <p>Deep dive into individual customer profiles, service history, and risk factors.</p>
          </div>
        </div>
      </section>

      {/* Analytics Workflow */}
      <section className="workflow">
        <h2>Analytics Workflow</h2>
        <div className="workflow-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Ingest Data</h3>
            <p>Upload raw telecommunications customer data securely.</p>
          </div>
          <div className="step-divider"></div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Analyze</h3>
            <p>Run statistical profiling and feature engineering.</p>
          </div>
          <div className="step-divider"></div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Predict</h3>
            <p>Score customers utilizing machine learning models.</p>
          </div>
          <div className="step-divider"></div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Act</h3>
            <p>Deploy targeted retention strategies based on insights.</p>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="tech-stack">
        <h2>Technology Stack</h2>
        <div className="tech-grid">
          <div className="tech-item">
            <Database size={32} />
            <span>React & Vite</span>
          </div>
          <div className="tech-item">
            <Search size={32} />
            <span>Python & Flask</span>
          </div>
          <div className="tech-item">
            <PieChart size={32} />
            <span>Scikit-Learn & Pandas</span>
          </div>
          <div className="tech-item">
            <BarChart2 size={32} />
            <span>MySQL</span>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to reduce customer churn?</h2>
        <p>Start analyzing your data today to build effective retention strategies.</p>
        <Link to="/upload" className="btn btn-primary large">
          Upload Dataset Now
        </Link>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} CustomerPulse. Built for Data & Analytics Portfolio.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
