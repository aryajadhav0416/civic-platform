'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Send, Landmark, AlertCircle, ClipboardList, Users, Loader2, Shield, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { translations } from '../lib/translations';

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showSchemesModal, setShowSchemesModal] = useState(false);

  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueAddress, setIssueAddress] = useState('');
  const [issueMedia, setIssueMedia] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Smart Draft State
  const [draftInput, setDraftInput] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [issueDepartment, setIssueDepartment] = useState('');

  // Complaints State
  const [showMyComplaintsModal, setShowMyComplaintsModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [myComplaints, setMyComplaints] = useState<{ id: string, title: string, description: string, status: string, address?: string, image_url?: string, upvotes?: number }[]>([]);
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<string | null>(null);

  // AI Document Verification State
  const [docMedia, setDocMedia] = useState<File | null>(null);
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false);
  const [docResult, setDocResult] = useState<{isValid: boolean, documentType: string, feedback: string} | null>(null);

  // New Feature States
  const [isListening, setIsListening] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Auth & Profile State
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<{ age: number, gender?: string, points?: number } | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupGender, setSignupGender] = useState('Male');
  const [isSignup, setIsSignup] = useState(false);
  const [language, setLanguage] = useState('English');
  const t = translations[language as keyof typeof translations] || translations.English;

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchComplaints = async () => {
    const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setMyComplaints(data || []);
    }
  };

  const handleUpvote = async (issueId: string) => {
    if (!user) {
      alert("Please login to upvote.");
      return;
    }
    const issue = myComplaints.find(c => c.id === issueId);
    if (!issue) return;
    const currentUpvotes = issue.upvotes || 0;
    
    const { error } = await supabase.from('issues').update({ upvotes: currentUpvotes + 1 }).eq('id', issueId);
    if (!error) {
      setMyComplaints(prev => prev.map(c => c.id === issueId ? { ...c, upvotes: currentUpvotes + 1 } : c));
    }
  };

  const handleVerifyDocument = async () => {
    if (!docMedia) return alert("Please select a document image.");
    setIsVerifyingDoc(true);
    setDocResult(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/ai-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, mimeType: docMedia.type, language })
        });
        const data = await res.json();
        setDocResult(data);
        setIsVerifyingDoc(false);
      };
      reader.readAsDataURL(docMedia);
    } catch {
      alert("Error verifying document");
      setIsVerifyingDoc(false);
    }
  };

  const handleListen = () => {
    const win = window as unknown as { SpeechRecognition: new () => unknown; webkitSpeechRecognition: new () => unknown };
    const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionConstructor as any)();
    let langCode = 'en-US';
    if (language === 'Hindi') langCode = 'hi-IN';
    else if (language === 'Marathi') langCode = 'mr-IN';
    
    recognition.lang = langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: { results: { transcript: string }[][] }) => setQuery(event.results[0][0].transcript);
    recognition.onerror = (event: { error: string }) => { console.error(event.error); setIsListening(false); };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIssueAddress(`Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)}`);
        setIsFetchingLocation(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location");
        setIsFetchingLocation(false);
      }
    );
  };

  const handleTrack = async () => {
    if (!trackId.trim()) return;
    const { data, error } = await supabase.from('issues').select('status').eq('id', trackId.trim()).single();
    if (error || !data) {
      setTrackResult(t.trackNotFound);
    } else {
      setTrackResult(t.trackFound.replace('{status}', data.status));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert([{ id: data.user.id, age: parseInt(signupAge, 10) || 0, gender: signupGender }]);
          if (profileError) console.error('Profile Upsert Error:', profileError);
          alert(t.alertSignup);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        alert('Login successful!');
      }
      setShowAuthModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Auth Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      const { error } = await supabase.from('profiles').upsert([{ id: user.id, age: parseInt(editAge, 10) || 0, gender: editGender, points: profile?.points || 0 }]);
      if (error) throw error;
      alert("Profile updated successfully!");
      setShowEditProfileModal(false);
      fetchProfile(user.id);
    } catch {
      alert("Error updating profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setQuery('');
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('/api/ai-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language })
      });

      const data = await res.json();
      if (data.text) {
        setResponse(data.text);
      } else {
        setResponse(`Sorry, I encountered an error: ${data.error || 'Please try again.'}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setResponse(`Failed to connect to the AI service. Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceQuery: string) => {
    setShowServicesModal(false);
    handleSend(serviceQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDraft = async () => {
    if (!draftInput.trim()) return;
    setIsDrafting(true);
    try {
      const res = await fetch('/api/ai-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: draftInput, language })
      });
      const data = await res.json();
      if (data.title && data.description) {
        setIssueTitle(data.title);
        setIssueDesc(data.description);
        setIssueDepartment(data.department || '');
        setDraftInput('');
      } else {
        alert("Draft generation failed. Please try again.");
      }
    } catch {
      alert("Error generating draft.");
    } finally {
      setIsDrafting(false);
    }
  };

  const submitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle || !issueDesc) return alert("Please fill out all fields.");
    
    setSubmitting(true);
    try {
      let imageUrl = null;
      if (issueMedia) {
        const fileExt = issueMedia.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('issue-media').upload(fileName, issueMedia);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('issue-media').getPublicUrl(fileName).data.publicUrl;
      }

      const { data, error } = await supabase.from('issues').insert([
        { title: issueTitle, description: issueDesc, address: issueAddress, status: 'Open', image_url: imageUrl, department: issueDepartment }
      ]).select();

      if (error) throw error;
      
      const newId = data && data.length > 0 ? data[0].id : 'Unknown';
      alert(t.alertSuccess.replace('{id}', newId));
      setShowIssueModal(false);
      setIssueTitle('');
      setIssueDesc('');
      setIssueDepartment('');
      setIssueMedia(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(t.alertFail.replace('{error}', errorMessage));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="main-content">
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

        <nav className="nav-links" aria-label="Main Navigation">
          <a href="#" className="nav-link active" aria-current="page">{t.navHome}</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowServicesModal(true); }}>{t.navServices}</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowMyComplaintsModal(true); fetchComplaints(); }}>{t.navComplaints}</a>
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowResourcesModal(true); }}>{t.navResources}</a>
        </nav>

        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', padding: '0.25rem 0.75rem', borderRadius: '8px', marginRight: '1rem' }}>
            <Globe size={18} color="#475569" aria-hidden="true" />
            <select aria-label="Language selection" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#475569', fontWeight: 500, cursor: 'pointer', appearance: 'none', paddingRight: '1rem' }}>
              <option>English</option>
              <option>Hindi</option>
              <option>Marathi</option>
            </select>
          </div>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                🏆 Score: {profile?.points || 0}
              </div>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => { setEditAge(profile?.age?.toString() || ''); setEditGender(profile?.gender || 'Male'); setShowEditProfileModal(true); }}>Edit Profile</button>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => supabase.auth.signOut()}>{t.signOut}</button>
            </div>
          ) : (
            <button className="btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setShowAuthModal(true)}>{t.loginSignup}</button>
          )}
        </div>
      </header>
      <div className="hero-grid">
        {/* Left Column: Chat Section */}
        <section className="chat-section">
          <h2>
            <span>{t.heroGreeting}</span><br/>
            <span className="highlight">{t.heroHelp}</span>
          </h2>
          <p>{t.heroSubtext}</p>
          
          <div className="input-wrapper">
            <input 
              type="text" 
              className="input-field" 
              placeholder={t.placeholderQuery} 
              aria-label={t.placeholderQuery}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(query)}
            />
            <button aria-label="Start Voice Input" className="chat-voice-btn" onClick={handleListen} style={{ position: 'absolute', right: '3.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', opacity: isListening ? 1 : 0.7, color: isListening ? '#ef4444' : 'inherit' }} title={isListening ? t.btnVoiceListening : t.btnVoiceStart}>
              {isListening ? '🛑' : '🎤'}
            </button>
            <button aria-label="Send Message" className="send-button" onClick={() => handleSend(query)} disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>

          {response && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#EEF2FF', borderRadius: '12px', border: '1px solid #C7D2FE', maxHeight: '350px', overflowY: 'auto' }}>
              <strong style={{ color: '#1E3A8A', display: 'block', marginBottom: '0.5rem' }}>{t.aiTitle}</strong>
              <div style={{ color: '#1E293B', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>
              <button className="btn-secondary" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setResponse('')}>{t.clearBtn}</button>
            </div>
          )}

          {!response && !loading && (
            <div className="suggestions">
              <h4 className="suggestions-title">{t.tryAsking}</h4>
              <div className="suggestions-list">
                <button className="suggestion-pill" onClick={() => handleSend(t.sugBirth)}>
                  {t.sugBirth}
                </button>
                <button className="suggestion-pill" onClick={() => handleSend(t.sugAwas)}>
                  {t.sugAwas}
                </button>
                <button className="suggestion-pill" onClick={() => handleSend(t.sugLight)}>
                  {t.sugLight}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Banner Section */}
        <section className="banner-section">
          <div className="banner-content">
            <h3>{t.bannerTitle1}<br/>{t.bannerTitle2}</h3>
            <p>{t.bannerSub}</p>
          </div>
          <svg className="banner-image" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="80" width="100" height="120" rx="4" fill="#d97757" />
            <rect x="60" y="100" width="80" height="100" rx="40" fill="#E0F2FE" />
            <rect x="40" y="60" width="120" height="20" rx="2" fill="#d97757" />
            <rect x="75" y="40" width="50" height="20" rx="2" fill="#d97757" />
            <circle cx="30" cy="170" r="15" fill="#4ade80" />
            <circle cx="170" cy="160" r="20" fill="#22c55e" />
          </svg>
        </section>
      </div>

      {/* Services Grid */}
      <section className="services-grid">
        <div className="service-card" onClick={() => setShowServicesModal(true)}>
          <div className="service-icon green">
            <Landmark size={32} />
          </div>
          <h4>{t.cardServices}</h4>
          <p>{t.cardServicesDesc}</p>
        </div>
        
        <div className="service-card" onClick={() => setShowIssueModal(true)}>
          <div className="service-icon orange">
            <AlertCircle size={32} />
          </div>
          <h4>{t.cardIssue}</h4>
          <p>{t.cardIssueDesc}</p>
        </div>

        <div className="service-card" onClick={() => setShowTrackModal(true)}>
          <div className="service-icon blue">
            <ClipboardList size={32} />
          </div>
          <h4>{t.cardTrack}</h4>
          <p>{t.cardTrackDesc}</p>
        </div>

        <div className="service-card" onClick={() => setShowSchemesModal(true)}>
          <div className="service-icon purple">
            <Users size={32} />
          </div>
          <h4>{t.cardSchemes}</h4>
          <p>{t.cardSchemesDesc}</p>
        </div>
      </section>

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>{t.modalIssueTitle}</h3>
            
            <div className="smart-draft-section" style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #E2E8F0' }}>
              <label className="form-label">{t.lblDraft}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t.phDraft} 
                  value={draftInput}
                  onChange={(e) => setDraftInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDraft()}
                />
                <button type="button" className="btn-primary" onClick={handleDraft} disabled={isDrafting} style={{ whiteSpace: 'nowrap' }}>
                  {isDrafting ? <Loader2 size={16} className="animate-spin" /> : '✨ ' + t.btnDraft}
                </button>
              </div>
            </div>

            <form onSubmit={submitIssue}>
              <div className="form-group">
                <label className="form-label">{t.lblTitle}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t.phTitle} 
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  required
                />
              </div>
              
              {issueDepartment && (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#059669', fontWeight: 600 }}>✨ {t.lblDept}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={issueDepartment}
                    readOnly
                    style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #34D399' }}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t.lblDesc}</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  placeholder={t.phDesc} 
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>{t.lblAddress}</label>
                  <button type="button" onClick={handleGetLocation} disabled={isFetchingLocation} style={{ fontSize: '0.8rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isFetchingLocation ? t.btnLocationLoading : t.btnLocation}
                  </button>
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={t.phAddress} 
                  value={issueAddress}
                  onChange={(e) => setIssueAddress(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.lblMedia}</label>
                <input 
                  type="file" 
                  className="form-input"
                  onChange={(e) => setIssueMedia(e.target.files ? e.target.files[0] : null)}
                  accept="image/*,video/*" 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowIssueModal(false)} disabled={submitting}>{t.cancelBtn}</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? t.submittingBtn : t.submitBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {showServicesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>{t.cardServices}</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li 
                style={{ padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => handleServiceClick(t.sugBirth)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t.srvBirth}
              </li>
              <li 
                style={{ padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => handleServiceClick(t.srvPan.replace('💳 ', 'How do I register for a '))}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t.srvPan}
              </li>
              <li 
                style={{ padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => handleServiceClick(t.srvPassport.replace('🛂 ', 'What is the process for a '))}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t.srvPassport}
              </li>
              <li 
                style={{ padding: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => handleServiceClick(t.srvLicense.replace('🚗 ', 'How do I '))}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t.srvLicense}
              </li>
            </ul>
            
            <div className="doc-verify-section" style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', border: '1px solid #BBF7D0' }}>
              <h4 style={{ color: '#166534', marginBottom: '0.5rem' }}>📄 AI Document Verification</h4>
              <p style={{ fontSize: '0.85rem', color: '#15803D', marginBottom: '0.5rem' }}>Upload your ID or Income certificate to verify its validity before applying for schemes.</p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={(e) => setDocMedia(e.target.files ? e.target.files[0] : null)} style={{ fontSize: '0.8rem' }} />
                <button type="button" className="btn-primary" onClick={handleVerifyDocument} disabled={isVerifyingDoc || !docMedia} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                  {isVerifyingDoc ? 'Verifying...' : 'Verify Now'}
                </button>
              </div>
              {docResult && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '4px', background: docResult.isValid ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${docResult.isValid ? '#86EFAC' : '#FCA5A5'}` }}>
                  <p style={{ fontWeight: 'bold', color: docResult.isValid ? '#166534' : '#991B1B', marginBottom: '0.25rem' }}>
                    {docResult.isValid ? '✅ Valid Document' : '❌ Invalid/Unreadable'} ({docResult.documentType})
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>{docResult.feedback}</p>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowServicesModal(false)}>{t.closeBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* Resources Modal */}
      {showResourcesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>{t.modalResTitle}</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => window.open('https://www.mygov.in/', '_blank')}>
                🌐 {t.resMyGov}
              </li>
              <li style={{ padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => window.open('https://uidai.gov.in/', '_blank')}>
                🆔 {t.resUidai}
              </li>
              <li style={{ padding: '1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => window.open('https://parivahan.gov.in/', '_blank')}>
                🚗 {t.resParivahan}
              </li>
              <li style={{ padding: '1rem', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => window.open('https://www.nvsp.in/', '_blank')}>
                🗳️ {t.resNvsp}
              </li>
            </ul>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowResourcesModal(false)}>{t.closeBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* Track Complaints Modal */}
      {showTrackModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>{t.modalTrackTitle}</h3>
            <div className="form-group">
              <label className="form-label">{t.lblTrackId}</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={t.phTrackId} 
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
            </div>
            {trackResult && <p style={{ marginTop: '1rem', color: '#1E3A8A', fontWeight: 500 }}>{trackResult}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowTrackModal(false); setTrackResult(null); }}>{t.closeBtn}</button>
              <button type="button" className="btn-primary" onClick={handleTrack}>{t.trackBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* My Complaints Modal */}
      {showMyComplaintsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>{t.modalMyComplaintsTitle}</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {myComplaints.length === 0 ? (
                <p className="text-muted">{t.noComplaints}</p>
              ) : (
                myComplaints.map(complaint => (
                  <div key={complaint.id} style={{ padding: '1rem', borderBottom: '1px solid #E2E8F0', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#1E3A8A', marginBottom: '0.25rem' }}>{complaint.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'monospace' }}>ID: {complaint.id}</p>
                    <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>{complaint.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: complaint.status === 'Open' ? '#EAB308' : '#22C55E' }}>
                        {t.statusLabel} {complaint.status}
                      </span>
                      {complaint.address && <span>📍 {complaint.address}</span>}
                      <button onClick={() => handleUpvote(complaint.id)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⬆️ {complaint.upvotes || 0} Upvotes
                      </button>
                    </div>
                    {complaint.image_url && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <Image src={complaint.image_url} alt="Issue Media" width={100} height={100} style={{ borderRadius: '4px', objectFit: 'cover' }} unoptimized />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowMyComplaintsModal(false)}>{t.closeBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* Schemes Modal */}
      {showSchemesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>{t.modalSchemesTitle}</h3>
            {!user ? (
              <p style={{ color: '#64748B' }}>{t.schemesLogin}</p>
            ) : (
              <div>
                <p style={{ marginBottom: '1rem', color: '#475569' }}>
                  {t.schemesProfile.replace('{age}', profile?.age?.toString() || '0')} - {profile?.gender === 'Female' ? t.genFemale : profile?.gender === 'Male' ? t.genMale : profile?.gender || ''}
                </p>
                {profile && (profile.age ?? 0) <= 10 && profile.gender === 'Female' ? (
                  <div style={{ backgroundColor: '#FDF2F8', padding: '1rem', borderRadius: '8px', border: '1px solid #FBCFE8' }}>
                    <h4 style={{ color: '#BE185D', marginBottom: '0.5rem' }}>👧 {t.schGirlTitle}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>{t.schGirlDesc}</p>
                  </div>
                ) : profile && (profile.age ?? 0) > 18 && profile.gender === 'Female' ? (
                  <div style={{ backgroundColor: '#FAF5FF', padding: '1rem', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
                    <h4 style={{ color: '#7E22CE', marginBottom: '0.5rem' }}>👩 {t.schWomenTitle}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>{t.schWomenDesc}</p>
                  </div>
                ) : profile && (profile.age ?? 0) >= 60 ? (
                  <div style={{ backgroundColor: '#EEF2FF', padding: '1rem', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                    <h4 style={{ color: '#1E3A8A', marginBottom: '0.5rem' }}>👴 {t.schOldTitle}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>{t.schOldDesc}</p>
                  </div>
                ) : profile && (profile.age ?? 0) <= 18 ? (
                  <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    <h4 style={{ color: '#166534', marginBottom: '0.5rem' }}>🎓 {t.schStudentTitle}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>{t.schStudentDesc}</p>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#FEF3C7', padding: '1rem', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                    <h4 style={{ color: '#92400E', marginBottom: '0.5rem' }}>🏠 {t.schDefaultTitle}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>{t.schDefaultDesc}</p>
                  </div>
                )}
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowSchemesModal(false)}>{t.closeBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>{isSignup ? t.modalAuthSignup : t.modalAuthLogin}</h3>
            <form onSubmit={handleAuth}>
              <div className="form-group">
                <label className="form-label">{t.lblEmail}</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.lblPassword}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              {isSignup && (
                <>
                  <div className="form-group">
                    <label className="form-label">{t.lblAge}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={signupAge}
                      onChange={(e) => setSignupAge(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.lblGender}</label>
                    <select 
                      className="form-input"
                      value={signupGender}
                      onChange={(e) => setSignupGender(e.target.value)}
                    >
                      <option value="Male">{t.genMale}</option>
                      <option value="Female">{t.genFemale}</option>
                      <option value="Other">{t.genOther}</option>
                    </select>
                  </div>
                </>
              )}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? t.btnPleaseWait : (isSignup ? t.modalAuthSignup : t.modalAuthLogin)}
                </button>
                <button type="button" style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setIsSignup(!isSignup)}>
                  {isSignup ? t.btnAlready : t.btnDont}
                </button>
              </div>
            </form>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAuthModal(false)}>{t.closeBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>Edit Profile</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">{t.lblAge}</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.lblGender}</label>
                <select 
                  className="form-input"
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                >
                  <option value="Male">{t.genMale}</option>
                  <option value="Female">{t.genFemale}</option>
                  <option value="Other">{t.genOther}</option>
                </select>
              </div>
              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditProfileModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={updatingProfile}>
                  {updatingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
