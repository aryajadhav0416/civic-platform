import React from 'react';
import { Globe, User, Shield } from 'lucide-react';

export default function Header() {
  return (
    <header className="header">
      <div className="logo-section">
        <div className="logo-icon">
          <Shield size={24} color="#1E3A8A" />
        </div>
        <div className="logo-text">
          <h1>Smart Bharat</h1>
          <p>AI-Powered Civic Companion</p>
        </div>
      </div>

      <nav className="nav-links">
        <a href="#" className="nav-link active">Home</a>
        <a href="#" className="nav-link">Services</a>
        <a href="#" className="nav-link">My Complaints</a>
        <a href="#" className="nav-link">Resources</a>
      </nav>

      <div className="header-actions">
        <div className="language-selector">
          <Globe size={18} />
          <span>English</span>
        </div>
        <div className="profile-avatar">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
