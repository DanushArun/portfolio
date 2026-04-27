'use client';

import { useScene } from '@/lib/scene-state';

export default function Overlays() {
  const phase = useScene((s) => s.phase);

  return (
    <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 10 }}>
      
      {/* 00: COVER */}
      <div className={`stage ${phase === 'COVER' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h1 className="voice-director text-center" style={{ fontSize: 'clamp(4rem, 10vw, 8rem)', color: 'var(--color-paper)' }}>DANUSH ARUN</h1>
        <div className="voice-composer text-center" style={{ position: 'absolute', bottom: '12vh', fontSize: '10px', color: 'var(--color-lead)', animation: 'blink 2s infinite' }}>[ SCROLL TO CROSS THE EVENT HORIZON ]</div>
      </div>

      {/* 01: APPROACH */}
      <div className={`stage ${phase === 'APPROACH' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        {/* Can put "A six-year fall through engineering." here if desired */}
      </div>

      {/* 02: CROSSING */}
      {/* Handled mostly by WebGL, no specific overlay */}

      {/* 03: BOSON_STAR (Quantum Lab) */}
      <div className={`stage ${phase === 'BOSON_STAR' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', alignItems: 'center', paddingLeft: '10vw', height: '100%' }}>
        <div style={{ maxWidth: '400px' }}>
          <span className="voice-composer eyebrow" style={{ color: 'var(--color-lead)', marginBottom: '1rem', display: 'block' }}>ANOMALY 03 // INVISIBLE OBJECT</span>
          <h2 className="voice-director title-serif" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-paper)', marginBottom: '1.5rem' }}>Quantum Lab</h2>
          <ul className="voice-composer data-list" style={{ listStyle: 'none', lineHeight: 2, color: 'var(--color-bone)' }}>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>PROJECT</span> LATTICE GAUGE SIMULATION</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>ROLE</span> RESEARCH ENGINEER</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>OUTCOME</span> 3.4x SPEED-UP ON SU(3)</li>
          </ul>
        </div>
      </div>

      {/* 04: STRANGEON (MIRA) */}
      <div className={`stage ${phase === 'STRANGEON' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', alignItems: 'center', paddingLeft: '10vw', height: '100%' }}>
        <div style={{ maxWidth: '400px' }}>
          <span className="voice-composer eyebrow" style={{ color: 'var(--color-lead)', marginBottom: '1rem', display: 'block' }}>ANOMALY 04 // MAGNETAR EMISSION</span>
          <h2 className="voice-director title-serif" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-paper)', marginBottom: '1.5rem' }}>Voice AI Agent</h2>
          <ul className="voice-composer data-list" style={{ listStyle: 'none', lineHeight: 2, color: 'var(--color-bone)' }}>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>LATENCY</span> &lt; 100ms END-TO-END</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>STACK</span> PIPECAT · WEBSOCKETS</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>DEPLOYED</span> DRIVEX PRODUCTION</li>
          </ul>
        </div>
      </div>

      {/* 05: BINARY_MERGER (DriveX) */}
      <div className={`stage ${phase === 'BINARY_MERGER' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12vh 10vw', height: '100%' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: '350px' }}>
            <span className="voice-composer eyebrow" style={{ color: 'var(--color-lead)', marginBottom: '1rem', display: 'block' }}>JET ALPHA // ARCHITECTURE</span>
            <h2 className="voice-director title-serif" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-paper)', marginBottom: '1.5rem' }}>Agentic<br/>Systems</h2>
            <ul className="voice-composer data-list" style={{ listStyle: 'none', lineHeight: 2, color: 'var(--color-bone)' }}>
              <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>ROLE</span> TECHNICAL APM</li>
              <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>FOCUS</span> HIGH-SCALE AUTOMATION</li>
            </ul>
          </div>
          <div style={{ maxWidth: '350px', textAlign: 'right' }}>
            <span className="voice-composer eyebrow" style={{ color: 'var(--color-lead)', marginBottom: '1rem', display: 'block' }}>JET BETA // ENGINEERING</span>
            <h2 className="voice-director title-serif" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-paper)', marginBottom: '1.5rem' }}>Conversion<br/>Pipelines</h2>
            <ul className="voice-composer data-list" style={{ listStyle: 'none', lineHeight: 2, color: 'var(--color-bone)', textAlign: 'left', display: 'inline-block' }}>
              <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>ROLE</span> SOFTWARE ENGINEER</li>
              <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px' }}>FOCUS</span> WEBHOOK ORCHESTRATION</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 06: EINSTEIN_CROSS (FuryX x Veronica) */}
      <div className={`stage ${phase === 'EINSTEIN_CROSS' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '3rem', textAlign: 'center', maxWidth: '600px' }}>
          <span className="voice-composer eyebrow" style={{ color: 'var(--color-lead)', marginBottom: '1rem', display: 'block' }}>BINARY MERGER // MASS TRANSFER</span>
          <h2 className="voice-director title-serif" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-paper)', marginBottom: '2rem' }}>Twin Build Architecture</h2>
          <ul className="voice-composer data-list" style={{ listStyle: 'none', lineHeight: 2, color: 'var(--color-bone)', textAlign: 'left', display: 'inline-block' }}>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', marginRight: '10px' }}>CORE A</span> EYRX (PRIMARY PRODUCT)</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', marginRight: '10px' }}>CORE B</span> VERONICA (COMPANION)</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', marginRight: '10px' }}>BRIDGE</span> SHARED AUTH & DATA PLANE</li>
          </ul>
        </div>
      </div>

      {/* 07: HAUMEA (Formula Manipal) */}
      <div className={`stage ${phase === 'HAUMEA' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10vw', height: '100%' }}>
        <div style={{ textAlign: 'right', transform: 'skewX(-10deg)' }}>
          <span className="voice-composer eyebrow" style={{ color: 'var(--color-lead)', marginBottom: '1rem', display: 'block' }}>VELOCITY // 120 KM/H</span>
          <h2 className="voice-director title-serif" style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', color: 'var(--color-paper)', marginBottom: '1.5rem' }}>Race Trajectory</h2>
          <ul className="voice-composer data-list" style={{ listStyle: 'none', lineHeight: 2, color: 'var(--color-bone)' }}>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px', textAlign: 'left' }}>TEAM</span> FORMULA MANIPAL</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px', textAlign: 'left' }}>DOMAIN</span> TELEMETRY & CONTROL</li>
            <li><span style={{ color: 'var(--color-lead)', display: 'inline-block', width: '80px', textAlign: 'left' }}>LIMIT</span> ENGINEERING AT TERMINAL VELOCITY</li>
          </ul>
        </div>
      </div>

      {/* 08: MANIFEST (Logbook) */}
      <div className={`stage ${phase === 'MANIFEST' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ maxWidth: '800px', width: '100%', padding: '2rem', border: '1px solid var(--color-lead)', background: 'var(--color-ink)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-lead)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h2 className="voice-director" style={{ fontSize: '2rem', color: 'var(--color-paper)' }}>Manifest of Danush Arun</h2>
            <div className="voice-composer" style={{ fontSize: '10px', color: 'var(--color-lead)', textAlign: 'right' }}>
              DOC. NO. 2026/PM-DA<br/>
              FILED · BENGALURU · IST
            </div>
          </div>
          <ul className="voice-dop" style={{ listStyle: 'none', fontSize: '1.2rem', lineHeight: '2' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--color-lead)' }}><span>Electrical Engineering, Manipal.</span> <span className="voice-composer" style={{ fontSize: '10px', color: 'var(--color-lead)' }}>2021—2025</span></li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--color-lead)' }}><span>Executive PG Full Stack, IIT Roorkee.</span> <span className="voice-composer" style={{ fontSize: '10px', color: 'var(--color-lead)' }}>2025</span></li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--color-lead)' }}><span>Software/TPM, DriveX.</span> <span className="voice-composer" style={{ fontSize: '10px', color: 'var(--color-lead)' }}>2025—NOW</span></li>
            <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted var(--color-lead)' }}><span>Operations Lead, Formula Manipal.</span> <span className="voice-composer" style={{ fontSize: '10px', color: 'var(--color-lead)' }}>2022—2024</span></li>
          </ul>
        </div>
      </div>

      {/* 09: CYGNUS_LOOP (Contact) */}
      <div className={`stage ${phase === 'CYGNUS_LOOP' ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} style={{ transition: 'opacity 0.8s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '20vh', height: '100%' }}>
        <div className="voice-composer" style={{ fontSize: '12px', letterSpacing: '0.3em', color: 'var(--color-bone)', marginBottom: '3rem' }}>&gt; INITIATING CONTACT PROTOCOL_</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <a href="mailto:danusharun999@gmail.com" className="voice-composer" style={{ color: 'var(--color-sodium)', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.2em' }}>EMAIL // DANUSHARUN999@GMAIL.COM</a>
          <a href="https://github.com/DanushArun" target="_blank" rel="noreferrer" className="voice-composer" style={{ color: 'var(--color-sodium)', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.2em' }}>GITHUB // DANUSHARUN</a>
          <a href="https://linkedin.com/in/danush-arun-5aa762267" target="_blank" rel="noreferrer" className="voice-composer" style={{ color: 'var(--color-sodium)', textDecoration: 'none', fontSize: '11px', letterSpacing: '0.2em' }}>LINKEDIN // DANUSH-ARUN</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}} />
    </div>
  );
}
