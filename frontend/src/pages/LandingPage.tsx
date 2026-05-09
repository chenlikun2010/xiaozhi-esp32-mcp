import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ─── CSS injection ────────────────────────────────────────────────
const LANDING_CSS = `
  .lp { margin:0; padding:0; background:#030610; color:#e8f4ff; font-family:'Noto Sans SC',sans-serif; overflow-x:hidden; min-height:100vh; }
  .lp *{ box-sizing:border-box; }
  .lp a { text-decoration:none; }

  .lp-grid-bg { position:fixed;inset:0;pointer-events:none;z-index:0;
    background-image:linear-gradient(rgba(0,200,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.03) 1px,transparent 1px);
    background-size:60px 60px;animation:lp-gridDrift 40s linear infinite; }
  @keyframes lp-gridDrift { 0%{background-position:0 0} 100%{background-position:60px 60px} }

  .lp-noise { position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.025;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:200px 200px; }

  .lp-scan { position:fixed;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(0,200,255,0.06),transparent);
    pointer-events:none;z-index:9999;animation:lp-scan 8s linear infinite; }
  @keyframes lp-scan { 0%{transform:translateY(-100vh)} 100%{transform:translateY(100vh)} }

  /* NAV */
  .lp-nav { position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;
    padding:0 48px;height:64px;background:rgba(3,6,16,0.88);backdrop-filter:blur(20px);
    border-bottom:1px solid rgba(0,200,255,0.12); }
  .lp-logo { display:flex;align-items:center;gap:12px;text-decoration:none; }
  .lp-logo-text { font-family:'Share Tech Mono',monospace;font-size:16px;color:#00c8ff;letter-spacing:.08em; }
  .lp-logo-sub { font-size:11px;color:#3d5a7a;letter-spacing:.15em;text-transform:uppercase;font-family:'Share Tech Mono',monospace; }
  .lp-nav-links { display:flex;align-items:center;gap:36px;list-style:none;margin:0;padding:0; }
  .lp-nav-links a { font-size:13px;color:#7ba3c8;letter-spacing:.06em;font-family:'Share Tech Mono',monospace;transition:color .2s;position:relative; }
  .lp-nav-links a:hover { color:#00c8ff; }
  .lp-nav-links a::after { content:'';position:absolute;bottom:-4px;left:0;right:100%;height:1px;background:#00c8ff;transition:right .25s; }
  .lp-nav-links a:hover::after { right:0; }
  .lp-nav-cta { font-family:'Share Tech Mono',monospace!important;font-size:12px!important;color:#030610!important;
    background:#00c8ff!important;padding:8px 20px!important;border-radius:2px!important;letter-spacing:.08em!important;
    transition:box-shadow .2s,transform .1s!important; }
  .lp-nav-cta:hover { box-shadow:0 0 20px rgba(0,200,255,0.5)!important;transform:translateY(-1px)!important; }
  .lp-nav-cta::after { display:none!important; }
  .lp-nav-right { display:flex;align-items:center;gap:20px; }
  .lp-nav-status { display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:11px;color:rgba(0,255,157,0.6); }
  .lp-status-dot { width:6px;height:6px;border-radius:50%;background:#00ff9d;box-shadow:0 0 8px #00ff9d;animation:lp-pulse 2s infinite; }
  @keyframes lp-pulse { 0%,100%{opacity:1;box-shadow:0 0 8px #00ff9d} 50%{opacity:.6;box-shadow:0 0 4px #00ff9d} }
  .lp-login-btn { display:flex;align-items:center;gap:7px;font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:.08em;
    color:#00c8ff;background:transparent;border:1px solid rgba(0,200,255,0.4);padding:7px 18px;border-radius:2px;cursor:pointer;
    transition:background .2s,box-shadow .2s; }
  .lp-login-btn:hover { background:rgba(0,200,255,0.12);box-shadow:0 0 16px rgba(0,200,255,0.2); }

  /* MAIN */
  .lp-main { position:relative;z-index:1; }

  /* HERO */
  .lp-hero { min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
    text-align:center;padding:120px 48px 80px;position:relative;overflow:hidden; }
  .lp-hero-glow { position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:600px;
    background:radial-gradient(ellipse,rgba(0,200,255,0.08) 0%,transparent 70%);pointer-events:none; }
  .lp-hero-badge { display:inline-flex;align-items:center;gap:8px;background:rgba(0,200,255,0.07);
    border:1px solid rgba(0,200,255,0.4);padding:6px 16px;border-radius:2px;font-family:'Share Tech Mono',monospace;
    font-size:11px;color:#00c8ff;letter-spacing:.12em;text-transform:uppercase;margin-bottom:40px;
    animation:lp-fadeInDown .8s ease both; }
  .lp-hero-title { font-size:clamp(48px,8vw,96px);font-weight:700;line-height:1.05;letter-spacing:-.02em;
    margin-bottom:12px;animation:lp-fadeInUp .9s .1s ease both; }
  .lp-hero-title-cn { display:block;background:linear-gradient(135deg,#fff 30%,#00c8ff 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  .lp-hero-title-en { display:block;font-family:'Share Tech Mono',monospace;font-size:clamp(18px,2.5vw,32px);
    font-weight:400;color:rgba(0,200,255,0.6);letter-spacing:.25em;margin-top:8px;
    -webkit-text-fill-color:unset;background:none; }
  .lp-hero-desc { font-size:17px;color:#7ba3c8;max-width:560px;line-height:1.75;margin:28px auto 48px;
    font-weight:300;animation:lp-fadeInUp 1s .25s ease both; }
  .lp-hero-desc strong { color:#00c8ff;font-weight:500; }
  .lp-hero-actions { display:flex;align-items:center;gap:20px;animation:lp-fadeInUp 1s .4s ease both; }
  .lp-btn-primary { font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:.1em;color:#030610;
    background:#00c8ff;border:none;padding:14px 36px;cursor:pointer;border-radius:2px;transition:box-shadow .2s,transform .1s;
    text-decoration:none;display:inline-block; }
  .lp-btn-primary:hover { box-shadow:0 0 30px rgba(0,200,255,0.5),0 0 60px rgba(0,200,255,0.2);transform:translateY(-2px); }
  .lp-btn-ghost { font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:.1em;color:#00c8ff;
    background:transparent;border:1px solid rgba(0,200,255,0.4);padding:13px 32px;cursor:pointer;border-radius:2px;
    transition:background .2s,box-shadow .2s;text-decoration:none;display:inline-block; }
  .lp-btn-ghost:hover { background:rgba(0,200,255,0.12);box-shadow:0 0 20px rgba(0,200,255,0.15); }
  .lp-hero-stats { display:flex;gap:60px;margin-top:80px;animation:lp-fadeInUp 1s .55s ease both; }
  .lp-stat-num { font-family:'Share Tech Mono',monospace;font-size:36px;color:#00c8ff;display:block;text-shadow:0 0 20px rgba(0,200,255,0.4); }
  .lp-stat-label { font-size:12px;color:#3d5a7a;letter-spacing:.12em;text-transform:uppercase;margin-top:4px;display:block;font-family:'Share Tech Mono',monospace; }

  /* DIVIDER */
  .lp-divider { height:1px;background:linear-gradient(90deg,transparent,rgba(0,200,255,0.4),transparent);margin:0 48px;position:relative;z-index:1; }

  /* FEATURES */
  .lp-features { padding:100px 48px;max-width:1200px;margin:0 auto; }
  .lp-section-header { text-align:center;margin-bottom:64px; }
  .lp-section-tag { font-family:'Share Tech Mono',monospace;font-size:11px;color:#00c8ff;letter-spacing:.2em;text-transform:uppercase;margin-bottom:16px;display:block; }
  .lp-section-title { font-size:clamp(28px,4vw,44px);font-weight:700;line-height:1.2;margin-bottom:16px; }
  .lp-section-sub { font-size:15px;color:#7ba3c8;max-width:500px;margin:0 auto;line-height:1.7;font-weight:300; }
  .lp-features-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:rgba(0,200,255,0.12);border:1px solid rgba(0,200,255,0.12); }
  .lp-feature-cell { background:#060d1f;padding:40px 36px;position:relative;overflow:hidden;transition:background .3s; }
  .lp-feature-cell::before { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00c8ff,transparent);opacity:0;transition:opacity .3s; }
  .lp-feature-cell:hover { background:#0f1e38; }
  .lp-feature-cell:hover::before { opacity:1; }
  .lp-feature-icon { width:40px;height:40px;margin-bottom:20px;color:#00c8ff; }
  .lp-feature-num { font-family:'Share Tech Mono',monospace;font-size:11px;color:#3d5a7a;letter-spacing:.15em;margin-bottom:12px;display:block; }
  .lp-feature-name { font-size:18px;font-weight:600;margin-bottom:10px;color:#e8f4ff; }
  .lp-feature-desc { font-size:13px;color:#7ba3c8;line-height:1.65;font-weight:300; }

  /* SERVICES */
  .lp-services { padding:100px 48px;background:linear-gradient(180deg,transparent,rgba(0,200,255,0.02),transparent); }
  .lp-services-inner { max-width:1200px;margin:0 auto; }
  .lp-services-filter { display:flex;gap:8px;margin-bottom:40px;flex-wrap:wrap;justify-content:center; }
  .lp-filter-btn { font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.1em;padding:7px 18px;
    background:transparent;border:1px solid rgba(0,200,255,0.12);color:#3d5a7a;cursor:pointer;border-radius:2px;transition:all .2s; }
  .lp-filter-btn.active,.lp-filter-btn:hover { border-color:#00c8ff;color:#00c8ff;background:rgba(0,200,255,0.12); }
  .lp-services-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
  .lp-service-card { background:#0a1428;border:1px solid rgba(0,200,255,0.12);border-radius:4px;padding:28px;position:relative;
    overflow:hidden;transition:border-color .3s,background .3s,transform .2s;display:flex;flex-direction:column;gap:12px; }
  .lp-service-card:hover { border-color:rgba(0,200,255,0.4);background:#0f1e38;transform:translateY(-2px); }
  .lp-service-card-top { display:flex;align-items:flex-start;justify-content:space-between;gap:12px; }
  .lp-service-icon { width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;
    background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.15);flex-shrink:0; }
  .lp-badge { font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.12em;padding:3px 8px;border-radius:2px;text-transform:uppercase; }
  .lp-badge-free { background:rgba(0,255,157,0.08);border:1px solid rgba(0,255,157,0.25);color:#00ff9d; }
  .lp-badge-new { background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.25);color:#00c8ff; }
  .lp-service-name { font-size:16px;font-weight:600;color:#e8f4ff;line-height:1.3; }
  .lp-service-desc { font-size:12px;color:#7ba3c8;line-height:1.65;font-weight:300;flex:1; }
  .lp-install-btn { font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.12em;width:100%;padding:10px;
    background:transparent;border:1px solid rgba(0,200,255,0.12);color:#7ba3c8;cursor:pointer;border-radius:2px;transition:all .2s;
    text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:auto; }
  .lp-install-btn:hover { background:#00c8ff;border-color:#00c8ff;color:#030610;box-shadow:0 0 20px rgba(0,200,255,0.3); }
  .lp-install-btn.installed { background:rgba(0,255,157,0.08);border-color:rgba(0,255,157,0.3);color:#00ff9d; }

  /* HOW */
  .lp-how { padding:100px 48px;max-width:1200px;margin:0 auto; }
  .lp-steps { display:grid;grid-template-columns:repeat(4,1fr);gap:0;position:relative; }
  .lp-steps::before { content:'';position:absolute;top:36px;left:12.5%;right:12.5%;height:1px;
    background:linear-gradient(90deg,transparent,rgba(0,200,255,0.4),#00c8ff,rgba(0,200,255,0.4),transparent); }
  .lp-step { display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px; }
  .lp-step-num { width:72px;height:72px;border-radius:50%;border:1px solid rgba(0,200,255,0.4);display:flex;align-items:center;justify-content:center;
    font-family:'Share Tech Mono',monospace;font-size:20px;color:#00c8ff;background:#060d1f;position:relative;z-index:1;
    margin-bottom:28px;box-shadow:0 0 30px rgba(0,200,255,0.1);transition:box-shadow .3s,border-color .3s; }
  .lp-step:hover .lp-step-num { box-shadow:0 0 40px rgba(0,200,255,0.3);border-color:#00c8ff; }
  .lp-step-title { font-size:15px;font-weight:600;margin-bottom:10px; }
  .lp-step-desc { font-size:12px;color:#7ba3c8;line-height:1.65;font-weight:300; }

  /* TERMINAL */
  .lp-terminal-section { padding:60px 48px;background:rgba(0,200,255,0.02);border-top:1px solid rgba(0,200,255,0.12);border-bottom:1px solid rgba(0,200,255,0.12); }
  .lp-terminal-wrapper { max-width:800px;margin:0 auto; }
  .lp-terminal-box { background:#020915;border:1px solid rgba(0,200,255,0.4);border-radius:6px;overflow:hidden;box-shadow:0 0 60px rgba(0,200,255,0.08); }
  .lp-terminal-bar { background:rgba(0,200,255,0.05);padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(0,200,255,0.12); }
  .lp-terminal-dot { width:10px;height:10px;border-radius:50%; }
  .lp-terminal-title { font-family:'Share Tech Mono',monospace;font-size:11px;color:#3d5a7a;letter-spacing:.1em;margin-left:8px; }
  .lp-terminal-body { padding:24px;font-family:'Share Tech Mono',monospace;font-size:13px;line-height:2; }
  .lp-t-line { display:block; }
  .lp-t-prompt { color:#00ff9d; }
  .lp-t-cmd { color:#e8f4ff; }
  .lp-t-comment { color:#3d5a7a; }
  .lp-t-output { color:rgba(0,200,255,0.6); }
  .lp-t-success { color:#00ff9d; }

  /* FOOTER */
  .lp-footer { padding:60px 48px 40px;border-top:1px solid rgba(0,200,255,0.12);position:relative;z-index:1; }
  .lp-footer-inner { max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:60px;margin-bottom:60px; }
  .lp-footer-brand-name { font-family:'Share Tech Mono',monospace;font-size:18px;color:#00c8ff;margin-bottom:12px; }
  .lp-footer-brand-desc { font-size:13px;color:#3d5a7a;line-height:1.7;font-weight:300;max-width:260px; }
  .lp-footer-col-title { font-family:'Share Tech Mono',monospace;font-size:11px;color:#7ba3c8;letter-spacing:.15em;text-transform:uppercase;margin-bottom:20px; }
  .lp-footer-links { list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px; }
  .lp-footer-links a { font-size:13px;color:#3d5a7a;transition:color .2s; }
  .lp-footer-links a:hover { color:#00c8ff; }
  .lp-footer-bottom { max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding-top:24px;border-top:1px solid rgba(0,200,255,0.12); }
  .lp-footer-copy { font-family:'Share Tech Mono',monospace;font-size:11px;color:#3d5a7a;letter-spacing:.08em; }
  .lp-footer-gh { display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:11px;color:rgba(0,255,157,0.6); }

  /* ANIMATIONS */
  @keyframes lp-fadeInDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes lp-glitch {
    0%,95%,100%{clip-path:none;transform:none}
    96%{clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);transform:translateX(-3px)}
    97%{clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%);transform:translateX(3px)}
    98%{clip-path:none;transform:none}
  }
  .lp-glitch { animation:lp-glitch 6s infinite; }

  /* ── DEFINITIONS ── */
  .lp-defs { padding:80px 48px; max-width:1200px; margin:0 auto; }
  .lp-defs-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:rgba(0,200,255,0.08); border:1px solid rgba(0,200,255,0.1); }
  .lp-def-card { background:#060d1f; padding:36px 32px; }
  .lp-def-term { font-family:'Share Tech Mono',monospace; font-size:10px; color:#00c8ff; letter-spacing:.18em; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .lp-def-term::before { content:'DEF'; font-size:8px; background:rgba(0,200,255,0.1); border:1px solid rgba(0,200,255,0.2); padding:1px 5px; border-radius:1px; }
  .lp-def-title { font-size:18px; font-weight:700; color:#e8f4ff; margin-bottom:12px; }
  .lp-def-body { font-size:13px; color:#7ba3c8; line-height:1.8; font-weight:300; }
  .lp-def-body strong { color:#e8f4ff; font-weight:500; }
  .lp-def-stat { display:flex; gap:24px; margin-top:16px; flex-wrap:wrap; }
  .lp-def-stat-item { }
  .lp-def-stat-val { font-family:'Share Tech Mono',monospace; font-size:20px; color:#00c8ff; display:block; }
  .lp-def-stat-lbl { font-size:10px; color:#3d5a7a; font-family:'Share Tech Mono',monospace; letter-spacing:.08em; }

  /* ── TECH SPECS ── */
  .lp-specs { padding:80px 48px; max-width:1200px; margin:0 auto; }
  .lp-specs-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .lp-spec-block { background:#060d1f; border:1px solid rgba(0,200,255,0.1); padding:28px 32px; }
  .lp-spec-block-title { font-family:'Share Tech Mono',monospace; font-size:11px; color:#00c8ff; letter-spacing:.15em; text-transform:uppercase; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
  .lp-spec-block-title::before { content:''; width:20px; height:1px; background:#00c8ff; opacity:.4; }
  .lp-spec-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(0,200,255,0.06); }
  .lp-spec-row:last-child { border-bottom:none; }
  .lp-spec-key { font-size:12px; color:#7ba3c8; }
  .lp-spec-val { font-family:'Share Tech Mono',monospace; font-size:12px; color:#e8f4ff; text-align:right; }
  .lp-spec-val.green { color:#00ff9d; }
  .lp-spec-val.cyan { color:#00c8ff; }

  /* ── COMPARISON ── */
  .lp-compare { padding:80px 48px; background:linear-gradient(180deg,transparent,rgba(0,200,255,0.02),transparent); }
  .lp-compare-inner { max-width:1200px; margin:0 auto; }
  .lp-compare-table { width:100%; border-collapse:collapse; background:#060d1f; border:1px solid rgba(0,200,255,0.1); }
  .lp-compare-table th { font-family:'Share Tech Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; padding:16px 20px; text-align:left; border-bottom:1px solid rgba(0,200,255,0.12); }
  .lp-compare-table th:first-child { color:#3d5a7a; }
  .lp-compare-table th.hl { color:#00c8ff; background:rgba(0,200,255,0.05); }
  .lp-compare-table td { padding:14px 20px; font-size:12px; color:#7ba3c8; border-bottom:1px solid rgba(0,200,255,0.05); vertical-align:middle; }
  .lp-compare-table td.hl { background:rgba(0,200,255,0.04); color:#e8f4ff; }
  .lp-compare-table td.row-label { color:#e8f4ff; font-weight:500; font-size:13px; }
  .lp-compare-table tr:last-child td { border-bottom:none; }
  .lp-compare-table tr:hover td { background:rgba(0,200,255,0.03); }
  .lp-compare-table tr:hover td.hl { background:rgba(0,200,255,0.07); }
  .lp-yes { color:#00ff9d; font-family:'Share Tech Mono',monospace; }
  .lp-no { color:#3d5a7a; font-family:'Share Tech Mono',monospace; }
  .lp-partial { color:#ffc800; font-family:'Share Tech Mono',monospace; }

  /* ── FAQ ── */
  .lp-faq { padding:80px 48px; max-width:900px; margin:0 auto; }
  .lp-faq-list { display:flex; flex-direction:column; gap:2px; background:rgba(0,200,255,0.08); border:1px solid rgba(0,200,255,0.1); }
  .lp-faq-item { background:#060d1f; padding:28px 32px; position:relative; }
  .lp-faq-item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:transparent; transition:background .2s; }
  .lp-faq-item:hover::before { background:#00c8ff; }
  .lp-faq-q { font-size:15px; font-weight:600; color:#e8f4ff; margin-bottom:10px; display:flex; align-items:flex-start; gap:12px; }
  .lp-faq-q-num { font-family:'Share Tech Mono',monospace; font-size:10px; color:#00c8ff; opacity:.6; margin-top:3px; flex-shrink:0; }
  .lp-faq-a { font-size:13px; color:#7ba3c8; line-height:1.8; font-weight:300; padding-left:30px; }
  .lp-faq-a strong { color:#e8f4ff; font-weight:500; }
  .lp-faq-a code { font-family:'Share Tech Mono',monospace; font-size:11px; color:#00c8ff; background:rgba(0,200,255,0.07); padding:1px 6px; border-radius:2px; }

  @media(max-width:900px){
    .lp-nav{padding:0 24px}
    .lp-nav-links{display:none}
    .lp-nav-status{display:none}
    .lp-features-grid{grid-template-columns:1fr}
    .lp-services-grid{grid-template-columns:1fr}
    .lp-steps{grid-template-columns:repeat(2,1fr);gap:40px}
    .lp-steps::before{display:none}
    .lp-hero-stats{gap:30px;flex-wrap:wrap;justify-content:center}
    .lp-footer-inner{grid-template-columns:1fr 1fr;gap:40px}
    .lp-features,.lp-how,.lp-defs,.lp-specs,.lp-faq{padding:60px 24px}
    .lp-services,.lp-compare{padding:60px 24px}
    .lp-specs-grid{grid-template-columns:1fr}
    .lp-defs-grid{grid-template-columns:1fr}
    .lp-compare-table th,.lp-compare-table td{padding:10px 12px;font-size:11px}
  }
`;

// ─── DATA ─────────────────────────────────────────────────────────
const SERVICES = [
  { id: 'search', icon: '🔍', name: '联网搜索', desc: '使用阿里云 Qwen Search 进行实时联网搜索，获取最新网络信息。', tag: 'AI', badge: 'free' },
  { id: 'recipe', icon: '🍳', name: '菜谱查询', desc: '不知道吃什么？让 AI 帮你推荐！智能菜谱推荐与食材建议。', tag: '生活', badge: 'free' },
  { id: 'mbti', icon: '🧠', name: 'MBTI 性格测试', desc: '基于开源项目的 MBTI 性格测试服务。通过对话了解你的性格类型。', tag: '测试', badge: 'new' },
  { id: 'stock', icon: '📈', name: '股票分析助手', desc: '基于 Yahoo Finance 的实时股票行情与历史数据查询，支持美股、港股等全球市场。', tag: '金融', badge: 'free' },
  { id: 'forex', icon: '💱', name: '汇率查询助手', desc: '基于 Frankfurter API 的实时汇率查询与货币转换，支持 USD, CNY, EUR, JPY 等货币。', tag: '金融', badge: 'free' },
  { id: 'train', icon: '🚄', name: '12306 火车票助手', desc: '基于官方数据的实时火车票余票查询，支持查询全国主要城市的车次、时刻与票务状态。', tag: '出行', badge: 'free' },
  { id: 'gold', icon: '🥇', name: '黄金价格查询', desc: '基于实时市场数据的黄金价格查询助手，支持查询国际金价 (XAU/USD)。', tag: '金融', badge: 'free' },
  { id: 'report', icon: '📊', name: '行业报告专家', desc: '专业的行业报告分析助手，内置 2026 年最新行业趋势报告库，支持语义检索与深度问答。', tag: 'AI', badge: 'new' },
  { id: 'express', icon: '📦', name: '快递查询助手', desc: '支持顺丰、圆通、中通、申通、韵达等全网快递物流轨迹实时查询。', tag: '生活', badge: 'free' },
  { id: 'flight', icon: '✈️', name: '飞常准航班服务', desc: '全面的航班信息查询，支持按航班号、起降地查询航班状态、时刻表，以及机场天气查询。', tag: '出行', badge: 'free' },
  { id: 'news', icon: '📰', name: '新闻查询服务', desc: '获取 The Verge 等媒体的最新科技新闻，支持今日新闻、周报摘要与关键词搜索。', tag: 'AI', badge: 'free' },
];

const FEATURES = [
  { num: '01', name: '免费开源', desc: 'MIT 协议完全开源，所有 MCP 服务永久免费，无任何隐藏收费。' },
  { num: '02', name: 'ESP32 原生支持', desc: '专为小智开源硬件设计，一键安装即可在 ESP32 上运行各类 AI 服务。' },
  { num: '03', name: 'MCP 标准协议', desc: '基于 Model Context Protocol 标准，兼容所有支持 MCP 的 AI 框架和工具链。' },
  { num: '04', name: '实时数据接入', desc: '股票、汇率、火车票、航班等多类实时数据源，AI 助手随时掌握最新动态。' },
  { num: '05', name: '语义搜索引擎', desc: '集成阿里云 Qwen 搜索，支持自然语言查询，精准理解用户意图。' },
  { num: '06', name: '社区驱动', desc: '活跃的开源社区持续贡献新服务，任何人都可以提交自己的 MCP 工具。' },
];

const STEPS = [
  { n: '01', t: '获取硬件', d: '准备一块小智 ESP32 开源硬件，或使用兼容的 ESP32 开发板。' },
  { n: '02', t: '连接平台', d: '将设备接入小智 ESP32的 MCP 平台，完成 Wi-Fi 配置和设备注册。' },
  { n: '03', t: '选择服务', d: '在服务市场浏览并安装您需要的 MCP 工具，支持多服务同时运行。' },
  { n: '04', t: '开始对话', d: '通过语音或文字与小智交互，AI 助手自动调用已安装的 MCP 服务。' },
];

const TERMINAL_LINES = [
  { type: 'comment', text: '# 为您的小智 ESP32 安装 MCP 服务' },
  { type: 'prompt', text: '$ ', cmd: 'xiaozhi install mcp-search' },
  { type: 'output', text: '  → 正在连接服务器...' },
  { type: 'output', text: '  → 下载 mcp-search@2.1.0...' },
  { type: 'success', text: '  ✓ 安装完成！联网搜索服务已激活' },
  { type: 'prompt', text: '$ ', cmd: 'xiaozhi install mcp-stock' },
  { type: 'output', text: '  → 正在连接服务器...' },
  { type: 'success', text: '  ✓ 安装完成！股票分析助手已激活' },
  { type: 'prompt', text: '$ ', cmd: 'xiaozhi list --installed' },
  { type: 'output', text: '  已安装服务: mcp-search, mcp-stock' },
  { type: 'success', text: '  ESP32 设备状态: 在线 ✓' },
];

// ─── Counter ──────────────────────────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const step = Math.ceil(target / (1800 / 16));
        const t = setInterval(() => {
          cur = Math.min(cur + step, target);
          setCount(cur);
          if (cur >= target) clearInterval(t);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── ParticleCanvas ───────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let W = 0, H = 0;

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * 1920, y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3, a: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,200,255,${p.a})`; ctx.fill();
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,200,255,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

// ─── TerminalTypewriter ───────────────────────────────────────────
function TerminalTypewriter() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(v => { if (v >= TERMINAL_LINES.length) { clearInterval(t); return v; } return v + 1; });
    }, 350);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="lp-terminal-body">
      {TERMINAL_LINES.slice(0, visible).map((line, i) => (
        <span key={i} className="lp-t-line">
          {line.type === 'prompt' && <><span className="lp-t-prompt">{line.text}</span><span className="lp-t-cmd">{line.cmd}</span></>}
          {line.type === 'comment' && <span className="lp-t-comment">{line.text}</span>}
          {line.type === 'output' && <span className="lp-t-output">{line.text}</span>}
          {line.type === 'success' && <span className="lp-t-success">{line.text}</span>}
        </span>
      ))}
      {visible < TERMINAL_LINES.length && (
        <span className="lp-t-line">
          <span className="lp-t-prompt">$ </span>
          <span className="lp-t-cmd" style={{ borderRight: '2px solid #00c8ff', paddingRight: 2, animation: 'lp-pulse 1s infinite' }} />
        </span>
      )}
    </div>
  );
}

// ─── ServiceCard ──────────────────────────────────────────────────
function ServiceCard({ service }: { service: typeof SERVICES[0] }) {
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstall = () => {
    if (installed) return;
    setInstalling(true);
    setTimeout(() => { setInstalling(false); setInstalled(true); }, 1200);
  };

  return (
    <div className="lp-service-card" style={installed ? { borderColor: 'rgba(0,255,157,0.25)' } : {}}>
      <div className="lp-service-card-top">
        <div className="lp-service-icon">{service.icon}</div>
        <span className={`lp-badge ${service.badge === 'new' ? 'lp-badge-new' : 'lp-badge-free'}`}>
          {service.badge === 'new' ? 'NEW' : 'FREE'}
        </span>
      </div>
      <div className="lp-service-name">{service.name}</div>
      <div className="lp-service-desc">{service.desc}</div>
      <button className={`lp-install-btn ${installed ? 'installed' : ''}`} onClick={handleInstall}>
        {installing ? (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'lp-spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" /></svg>安装中...</>
        ) : installed ? (
          <><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8 3.5 3.5L13 5" /></svg>已安装</>
        ) : (
          <><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10" /></svg>安装</>
        )}
      </button>
    </div>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────
export default function LandingPage() {
  const [filter, setFilter] = useState('全部');
  const tags = ['全部', 'AI', '金融', '生活', '出行', '测试'];
  const filtered = filter === '全部' ? SERVICES : SERVICES.filter(s => s.tag === filter);

  // Inject page CSS
  useEffect((): (() => void) | void => {
    const el = document.createElement('style');
    el.textContent = LANDING_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  return (
    <div className="lp">
      <div className="lp-grid-bg" />
      <div className="lp-noise" />
      <div className="lp-scan" />

      {/* NAV */}
      <nav className="lp-nav">
        <a href="#" className="lp-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="4" stroke="rgba(0,200,255,0.4)" strokeWidth="1" />
            <rect x="8" y="8" width="16" height="16" rx="2" fill="rgba(0,200,255,0.1)" stroke="rgba(0,200,255,0.6)" strokeWidth="1" />
            <circle cx="16" cy="16" r="4" fill="rgba(0,200,255,0.8)" />
            <line x1="2" y1="16" x2="6" y2="16" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
            <line x1="26" y1="16" x2="30" y2="16" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
            <line x1="16" y1="26" x2="16" y2="30" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
          </svg>
          <div>
            <div className="lp-logo-text">小智 ESP32的 MCP 平台</div>
            <div className="lp-logo-sub">ESP32 · Open Source</div>
          </div>
        </a>

        <ul className="lp-nav-links">
          <li><a href="#about">平台简介</a></li>
          <li><a href="#features">特性</a></li>
          <li><a href="#services">服务市场</a></li>
          <li><a href="#compare">方案对比</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="https://github.com" className="lp-nav-cta" target="_blank" rel="noreferrer">开源社区</a></li>
        </ul>

        <div className="lp-nav-right">
          <div className="lp-nav-status">
            <span className="lp-status-dot" />
            <span>系统运行中</span>
          </div>
          <Link to="/login" className="lp-login-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            登录
          </Link>
        </div>
      </nav>

      <main className="lp-main">
        {/* HERO */}
        <section id="hero" className="lp-hero">
          <ParticleCanvas />
          <div className="lp-hero-glow" />
          <div className="lp-hero-badge">
            <span className="lp-status-dot" />
            开源 · 免费 · ESP32 专属 MCP 平台
          </div>
          <h1 className="lp-hero-title lp-glitch">
            <span className="lp-hero-title-cn">小智 ESP32的 MCP 平台</span>
            <span className="lp-hero-title-en">XIAOZHI MCP PLATFORM</span>
          </h1>
          <p className="lp-hero-desc">
            为 <strong>ESP32 小智</strong> 开源硬件免费提供各类 AI 服务。
            联网搜索、股票分析、航班查询、新闻查询……
            一句话安装，即刻赋能您的智能硬件。
          </p>
          <div className="lp-hero-actions">
            <a href="#services" className="lp-btn-primary">浏览服务市场</a>
            <a href="#how" className="lp-btn-ghost">快速开始 →</a>
          </div>
          <div className="lp-hero-stats">
            {[
              { target: 12, suffix: '+', label: 'MCP 服务' },
              { target: 100, suffix: '%', label: '完全免费' },
              { target: 3200, suffix: '+', label: '开发者' },
              { target: 18600, suffix: '+', label: 'GitHub Stars' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <span className="lp-stat-num"><Counter target={s.target} suffix={s.suffix} /></span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── DEFINITIONS ── */}
        <section id="about">
          <div className="lp-defs">
            <div className="lp-section-header">
              <span className="lp-section-tag">// CORE CONCEPTS</span>
              <h2 className="lp-section-title">核心概念定义</h2>
              <p className="lp-section-sub">理解小智 ESP32的 MCP 平台的三个关键技术概念</p>
            </div>
            <div className="lp-defs-grid">
              <div className="lp-def-card">
                <div className="lp-def-term">MCP 协议</div>
                <div className="lp-def-title">什么是 MCP？</div>
                <div className="lp-def-body">
                  <strong>MCP（Model Context Protocol，模型上下文协议）</strong>是由 Anthropic 于 2024 年 11 月发布的开放标准协议。其核心设计目标是在 <strong>AI 大语言模型</strong>与<strong>外部数据源、工具、服务</strong>之间建立安全、标准化的双向连接通道。
                  <br /><br />
                  MCP 采用 JSON-RPC 2.0 作为底层通信格式，通过 WebSocket 或 SSE（Server-Sent Events）实现实时数据推送。协议定义了三类核心原语：<strong>Resources（资源）</strong>、<strong>Tools（工具调用）</strong>、<strong>Prompts（提示模板）</strong>，覆盖 AI 应用的完整交互场景。
                </div>
                <div className="lp-def-stat">
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">2024.11</span><span className="lp-def-stat-lbl">发布时间</span></div>
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">开放</span><span className="lp-def-stat-lbl">协议类型</span></div>
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">JSON-RPC</span><span className="lp-def-stat-lbl">底层格式</span></div>
                </div>
              </div>
              <div className="lp-def-card">
                <div className="lp-def-term">ESP32 硬件</div>
                <div className="lp-def-title">什么是小智 ESP32？</div>
                <div className="lp-def-body">
                  <strong>小智（XiaoZhi）</strong>是基于乐鑫（Espressif）<strong>ESP32-S3 芯片</strong>构建的开源 AI 语音助手硬件项目，在 GitHub 上拥有超过 <strong>18,600 个 Star</strong>，是目前最活跃的开源嵌入式 AI 项目之一。
                  <br /><br />
                  ESP32-S3 采用 <strong>Xtensa LX7 双核处理器，主频 240MHz</strong>，内置 Wi-Fi 802.11 b/g/n 和蓝牙 5.0，配备 512KB SRAM 与最高 16MB 外部 Flash，足以在本地运行轻量级语音识别与 AI 推理任务。
                </div>
                <div className="lp-def-stat">
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">240MHz</span><span className="lp-def-stat-lbl">处理器主频</span></div>
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">512KB</span><span className="lp-def-stat-lbl">内置 SRAM</span></div>
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">Wi-Fi+BT</span><span className="lp-def-stat-lbl">无线连接</span></div>
                </div>
              </div>
              <div className="lp-def-card">
                <div className="lp-def-term">本平台</div>
                <div className="lp-def-title">什么是小智 ESP32的 MCP 平台？</div>
                <div className="lp-def-body">
                  <strong>小智 ESP32的 MCP 平台</strong>是面向 ESP32 小智开源硬件的 <strong>MCP 服务托管与分发系统</strong>，以 MIT 协议完全开源。平台负责将各类云端 AI 能力（联网搜索、金融数据、出行信息、新闻资讯等）封装为标准 MCP 服务，通过 WebSocket 实时推送至小智设备。
                  <br /><br />
                  开发者无需自建服务器，只需在平台选择所需服务并配置设备 WSS 地址，即可在 <strong>5 分钟内</strong>完成从零到 AI 助手的全流程部署。
                </div>
                <div className="lp-def-stat">
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">12+</span><span className="lp-def-stat-lbl">可用服务</span></div>
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">5 分钟</span><span className="lp-def-stat-lbl">部署时长</span></div>
                  <div className="lp-def-stat-item"><span className="lp-def-stat-val">MIT</span><span className="lp-def-stat-lbl">开源协议</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* FEATURES */}
        <section id="features">
          <div className="lp-features">
            <div className="lp-section-header">
              <span className="lp-section-tag">// CORE FEATURES</span>
              <h2 className="lp-section-title">为什么选择小智 ESP32的 MCP 平台？</h2>
              <p className="lp-section-sub">开源、免费、专为嵌入式 AI 硬件设计的 MCP 服务生态</p>
            </div>
            <div className="lp-features-grid">
              {FEATURES.map(f => (
                <div className="lp-feature-cell" key={f.num}>
                  <span className="lp-feature-num">[ {f.num} ]</span>
                  <div className="lp-feature-name">{f.name}</div>
                  <div className="lp-feature-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── TECH SPECS ── */}
        <section id="specs">
          <div className="lp-specs">
            <div className="lp-section-header">
              <span className="lp-section-tag">// TECHNICAL SPECIFICATIONS</span>
              <h2 className="lp-section-title">技术规格</h2>
              <p className="lp-section-sub">小智 ESP32的 MCP 平台的硬件要求、接入规范与性能基准</p>
            </div>
            <div className="lp-specs-grid">
              <div className="lp-spec-block">
                <div className="lp-spec-block-title">硬件最低要求</div>
                {[
                  { k: '处理器', v: 'ESP32 / ESP32-S2 / ESP32-S3 / ESP32-C3' },
                  { k: '主频', v: '≥ 80MHz（推荐 240MHz）' },
                  { k: '内置 SRAM', v: '≥ 512KB' },
                  { k: 'Flash 存储', v: '≥ 4MB' },
                  { k: '无线连接', v: 'Wi-Fi 2.4GHz（802.11 b/g/n）' },
                  { k: '开发框架', v: 'Arduino IDE / ESP-IDF / PlatformIO' },
                ].map(r => (
                  <div className="lp-spec-row" key={r.k}>
                    <span className="lp-spec-key">{r.k}</span>
                    <span className="lp-spec-val">{r.v}</span>
                  </div>
                ))}
              </div>
              <div className="lp-spec-block">
                <div className="lp-spec-block-title">平台性能基准</div>
                {[
                  { k: '服务响应时间（P50）', v: '< 200ms', c: 'green' },
                  { k: '服务响应时间（P95）', v: '< 800ms', c: 'green' },
                  { k: '并发连接支持', v: '≥ 10,000 设备', c: 'cyan' },
                  { k: 'WebSocket 心跳间隔', v: '30 秒', c: '' },
                  { k: '平均服务安装耗时', v: '< 20 秒', c: 'green' },
                  { k: '服务可用性 SLA', v: '99.5%（月度统计）', c: 'cyan' },
                ].map(r => (
                  <div className="lp-spec-row" key={r.k}>
                    <span className="lp-spec-key">{r.k}</span>
                    <span className={`lp-spec-val ${r.c}`}>{r.v}</span>
                  </div>
                ))}
              </div>
              <div className="lp-spec-block">
                <div className="lp-spec-block-title">接入协议规范</div>
                {[
                  { k: '通信协议', v: 'WebSocket（WSS 加密）' },
                  { k: '消息格式', v: 'JSON-RPC 2.0' },
                  { k: 'MCP 版本', v: '2024-11-05 (latest)' },
                  { k: '认证方式', v: 'Bearer Token（JWT）' },
                  { k: '高级扩展能力', v: '商业版支持多模态企业知识库 / RAG 混合检索' },
                  { k: '数据传输加密', v: 'TLS 1.2 / TLS 1.3' },
                ].map(r => (
                  <div className="lp-spec-row" key={r.k}>
                    <span className="lp-spec-key">{r.k}</span>
                    <span className="lp-spec-val">{r.v}</span>
                  </div>
                ))}
              </div>
              <div className="lp-spec-block">
                <div className="lp-spec-block-title">服务数据来源</div>
                {[
                  { k: '联网搜索', v: '阿里云 Qwen Search API' },
                  { k: '股票行情', v: 'Yahoo Finance API（实时）' },
                  { k: '汇率数据', v: 'Frankfurter API（每日更新）' },
                  { k: '火车票', v: '12306 官方数据接口' },
                  { k: '航班信息', v: '飞常准 OpenAPI' },
                  { k: '新闻数据', v: 'The Verge / 科技资讯源' },
                ].map(r => (
                  <div className="lp-spec-row" key={r.k}>
                    <span className="lp-spec-key">{r.k}</span>
                    <span className="lp-spec-val cyan">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* SERVICES */}
        <section id="services" className="lp-services">
          <div className="lp-services-inner">
            <div className="lp-section-header">
              <span className="lp-section-tag">// SERVICE MARKETPLACE</span>
              <h2 className="lp-section-title">服务市场</h2>
              <p className="lp-section-sub">选择并一键安装您需要的 MCP 服务，即刻扩展小智的 AI 能力</p>
            </div>
            <div className="lp-services-filter">
              {tags.map(tag => (
                <button key={tag} className={`lp-filter-btn ${filter === tag ? 'active' : ''}`} onClick={() => setFilter(tag)}>{tag}</button>
              ))}
            </div>
            <div className="lp-services-grid">
              {filtered.map(s => <ServiceCard key={s.id} service={s} />)}
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── COMPARISON ── */}
        <section id="compare" className="lp-compare">
          <div className="lp-compare-inner">
            <div className="lp-section-header">
              <span className="lp-section-tag">// COMPARISON</span>
              <h2 className="lp-section-title">方案对比</h2>
              <p className="lp-section-sub">小智 ESP32的 MCP 平台与其他 ESP32 AI 接入方案的客观对比</p>
            </div>
            <table className="lp-compare-table">
              <thead>
                <tr>
                  <th>对比维度</th>
                  <th className="hl">小智 ESP32的 MCP 平台</th>
                  <th>商业 AI API 直连</th>
                  <th>本地部署模型</th>
                  <th>自建 MCP 服务</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['使用成本', '完全免费（MIT 开源）', '按调用量付费，通常 $10–$100/月', '硬件+维护成本高昂', '需自行承担服务器费用'],
                  ['部署难度', '5 分钟，无需编程', '需要 API 密钥管理与代码集成', '需要 GPU 服务器，难度极高', '需具备后端开发能力'],
                  ['数据实时性', '实时（股票、汇率、搜索、航班）', '取决于具体 API，部分实时', '完全离线，无实时数据', '取决于自建质量'],
                  ['ESP32 原生支持', '✓ 专为 ESP32 小智设计', '△ 需手动适配嵌入式环境', '✗ 资源需求远超 ESP32', '△ 需自行适配'],
                  ['MCP 协议标准', '✓ 完整实现 MCP 2024-11-05', '✗ 多数 API 不支持 MCP', '△ 需额外封装', '✓ 可自定义'],
                  ['服务数量', '12+ 现成服务，持续增加', '单一 API 专注特定场景', '模型本身能力上限', '取决于开发投入'],
                  ['企业知识库扩展', '商业版支持（多模态/RAG）', '△ 需自行开发集成', '✗ 无法联网检索', '✓ 可自定义'],
                  ['开源程度', '100%（MIT 协议）', '闭源商业服务', '部分开源（模型权重）', '自有代码可开源'],
                ].map(([dim, a, b, c, d]) => (
                  <tr key={dim}>
                    <td className="row-label">{dim}</td>
                    <td className="hl">{a.startsWith('✓') ? <span className="lp-yes">{a}</span> : a.startsWith('✗') ? <span className="lp-no">{a}</span> : a.startsWith('△') ? <span className="lp-partial">{a}</span> : a}</td>
                    <td>{b.startsWith('✓') ? <span className="lp-yes">{b}</span> : b.startsWith('✗') ? <span className="lp-no">{b}</span> : b.startsWith('△') ? <span className="lp-partial">{b}</span> : b}</td>
                    <td>{c.startsWith('✓') ? <span className="lp-yes">{c}</span> : c.startsWith('✗') ? <span className="lp-no">{c}</span> : c.startsWith('△') ? <span className="lp-partial">{c}</span> : c}</td>
                    <td>{d.startsWith('✓') ? <span className="lp-yes">{d}</span> : d.startsWith('✗') ? <span className="lp-no">{d}</span> : d.startsWith('△') ? <span className="lp-partial">{d}</span> : d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="lp-divider" />

        {/* HOW */}
        <section id="how">
          <div className="lp-how">
            <div className="lp-section-header">
              <span className="lp-section-tag">// QUICK START</span>
              <h2 className="lp-section-title">四步开始使用</h2>
              <p className="lp-section-sub">从零到 AI 助手，只需几分钟</p>
            </div>
            <div className="lp-steps">
              {STEPS.map(s => (
                <div className="lp-step" key={s.n}>
                  <div className="lp-step-num">{s.n}</div>
                  <div className="lp-step-title">{s.t}</div>
                  <div className="lp-step-desc">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── FAQ ── */}
        <section id="faq">
          <div className="lp-faq">
            <div className="lp-section-header">
              <span className="lp-section-tag">// FAQ</span>
              <h2 className="lp-section-title">常见问题</h2>
              <p className="lp-section-sub">关于小智 ESP32的 MCP 平台最常被问到的技术与使用问题</p>
            </div>
            <div className="lp-faq-list">
              {[
                {
                  q: '开源版是否收费？',
                  a: '开源版完全免费。<strong>小智 ESP32的 MCP 平台</strong>由【独立 AI 空间】主理人（微软认证 AI 工程师）开源，旨在提供最轻量、高效的 MCP 管理框架。',
                },
                {
                  q: '支持哪些 ESP32 型号？',
                  a: '平台支持乐鑫全系 ESP32 芯片，包括原版 <code>ESP32</code>、<code>ESP32-S2</code>、<code>ESP32-S3</code>（推荐）、<code>ESP32-C3</code>。最低硬件要求为 <strong>512KB SRAM、4MB Flash、Wi-Fi 2.4GHz</strong>。不支持 ESP8266（缺少足够内存）。',
                },
                {
                  q: 'MCP 服务的数据是实时的吗？',
                  a: '是的。股票行情、汇率、火车票余票、航班状态、联网搜索均为<strong>实时数据</strong>，延迟通常在 200–800ms 以内（P50/P95）。黄金价格数据通过交易所 API 每分钟刷新。',
                },
                {
                  q: '为什么开源版没有知识库功能？',
                  a: '本开源版本聚焦 MCP 管理核心框架，已移除知识库功能。若你在企业级应用中需要 <strong>多模态企业知识库</strong>、<strong>RAG 混合检索引擎</strong> 等高级能力，请关注微信公众号【独立 AI 空间】，后台回复「商业合作」获取商业版/企业服务。',
                },
                {
                  q: '如何保证数据传输安全？',
                  a: '所有设备与平台之间的通信均通过 <code>WSS</code>（WebSocket Secure）加密传输，底层采用 <strong>TLS 1.2 / TLS 1.3</strong> 协议。用户认证使用 <strong>JWT Bearer Token</strong>。',
                },
                {
                  q: '如何向平台贡献新的 MCP 服务？',
                  a: '在 GitHub 上 Fork 本项目仓库，参照 <code>docs/CONTRIBUTING.md</code> 贡献指南编写服务接口代码（Node.js / Python 均支持），提交 Pull Request 后由社区审核合并。贡献服务无需具备 MCP 协议底层知识，只需按模板实现 <code>listTools</code> 和 <code>callTool</code> 两个方法。',
                },
                {
                  q: '平台的可用性承诺是多少？',
                  a: '平台对外承诺月度可用性 SLA <strong>≥ 99.5%</strong>，即每月计划外中断时间不超过 3.6 小时。核心服务部署于多可用区冗余架构，支持自动故障切换。状态页实时公示各服务运行状态与历史 SLA 数据。',
                },
                {
                  q: '与其他 MCP 客户端（如 Claude Desktop）兼容吗？',
                  a: '是的。小智 ESP32的 MCP 平台完整实现 MCP 规范 <strong>2024-11-05 版本</strong>，理论上兼容所有支持 MCP 协议的客户端，包括 Claude Desktop、Continue（VSCode 插件）等。但平台的优化重点是 ESP32 嵌入式场景，WebSocket 传输为主，部分桌面客户端使用 stdio 传输时需额外配置适配层。',
                },
              ].map((item, i) => (
                <div className="lp-faq-item" key={i}>
                  <div className="lp-faq-q">
                    <span className="lp-faq-q-num">Q{String(i + 1).padStart(2, '0')}</span>
                    {item.q}
                  </div>
                  <div className="lp-faq-a" dangerouslySetInnerHTML={{ __html: item.a }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TERMINAL */}
        <section id="terminal" className="lp-terminal-section">
          <div className="lp-terminal-wrapper">
            <div className="lp-section-header" style={{ marginBottom: 40 }}>
              <span className="lp-section-tag">// CLI INSTALLATION</span>
              <h2 className="lp-section-title" style={{ fontSize: 32 }}>命令行一键安装</h2>
            </div>
            <div className="lp-terminal-box">
              <div className="lp-terminal-bar">
                <div className="lp-terminal-dot" style={{ background: '#ff5f57' }} />
                <div className="lp-terminal-dot" style={{ background: '#febc2e' }} />
                <div className="lp-terminal-dot" style={{ background: '#28c840' }} />
                <span className="lp-terminal-title">xiaozhi-cli · bash</span>
              </div>
              <TerminalTypewriter />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-footer-brand-name">小智 ESP32的 MCP 平台</div>
            <div className="lp-footer-brand-desc">开源 ESP32 智能硬件 MCP 服务平台，免费为所有开发者提供丰富的 AI 能力接入。</div>
          </div>
          <div>
            <div className="lp-footer-col-title">平台</div>
            <ul className="lp-footer-links">
              {['服务市场', '开发文档', 'API 参考', '更新日志'].map(t => <li key={t}><a href="#">{t}</a></li>)}
            </ul>
          </div>
          <div>
            <div className="lp-footer-col-title">社区</div>
            <ul className="lp-footer-links">
              {['GitHub', '论坛', 'Discord', '贡献指南'].map(t => <li key={t}><a href="#">{t}</a></li>)}
            </ul>
          </div>
          <div>
            <div className="lp-footer-col-title">关于</div>
            <ul className="lp-footer-links">
              {['项目介绍', '开源协议', '联系我们', '隐私政策'].map(t => <li key={t}><a href="#">{t}</a></li>)}
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span className="lp-footer-copy">© 2026 小智 ESP32的 MCP 平台 · Open Source · MIT License</span>
          <a href="https://github.com/chenlikun2010/xiaozhi-esp32-mcp" className="lp-footer-gh" target="_blank" rel="noreferrer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg>
            Star on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
