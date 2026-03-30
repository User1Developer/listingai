import { useState } from "react";

// ─── FIRECRAWL CONFIG ───────────────────────────────────────────────
// To enable URL scraping, replace with your Firecrawl API key from firecrawl.dev
const FIRECRAWL_API_KEY = "YOUR_FIRECRAWL_KEY";
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// ─── COPY BUTTON ────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button className="copy-btn" onClick={() => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────
export default function ListingAIV2() {
  const [mode, setMode] = useState("mls"); // "mls" | "url"
  const [mlsText, setMlsText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [tone, setTone] = useState("professional");
  const [output, setOutput] = useState(null);
  const [activeTab, setActiveTab] = useState("listing");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);

  const tones = ["professional", "luxury", "friendly"];
  const tabs = [
    { key: "listing", label: "MLS Listing", icon: "🏠" },
    { key: "instagram", label: "Instagram", icon: "📸" },
    { key: "facebook", label: "Facebook", icon: "👥" },
    { key: "email", label: "Email", icon: "✉️" },
    { key: "sms", label: "SMS Blast", icon: "💬" },
  ];

  const scrapeUrl = async (url) => {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to scrape URL");
    return data.data?.markdown || "";
  };

  const generateCopy = async (propertyContext) => {
    const prompt = `You are an expert real estate copywriter. Based on the following property information, generate five pieces of marketing content. Return ONLY a valid JSON object with no markdown, no backticks, no explanation.

Property Information:
${propertyContext}

Tone: ${tone}

Return this exact JSON structure:
{
  "listing": "A compelling 150-200 word MLS listing description. Opens with a strong hook, highlights the best features naturally, ends with a call to action.",
  "instagram": "An engaging Instagram caption under 150 words with 8-10 relevant hashtags on a new line at the end. Use line breaks for visual rhythm.",
  "facebook": "A warm, conversational Facebook post under 120 words. Feels personal, inviting, and community-oriented.",
  "email": "A professional follow-up email to a prospective buyer under 150 words. Format exactly as: Subject: [subject line]\\n\\n[email body with greeting and sign-off]",
  "sms": "A punchy SMS blast under 160 characters. Include price if available, key feature, and a CTA like 'Reply TOUR for a showing'."
}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.map(i => i.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const handleGenerate = async () => {
    setError(null);
    setOutput(null);

    if (mode === "mls" && mlsText.trim().length < 20) {
      setError("Please paste your MLS remarks text (at least a sentence or two).");
      return;
    }
    if (mode === "url" && !urlInput.trim().startsWith("http")) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);

    try {
      let propertyContext = "";

      if (mode === "url") {
        setLoadingMsg("Reading property page...");
        const scraped = await scrapeUrl(urlInput.trim());
        propertyContext = scraped.slice(0, 3000);
      } else {
        propertyContext = mlsText.trim();
      }

      setLoadingMsg("Writing your copy...");
      const result = await generateCopy(propertyContext);
      setOutput(result);
      setActiveTab("listing");
    } catch (err) {
      if (mode === "url") {
        setError("Couldn't read that URL. Try Redfin or Realtor.com, or switch to MLS text mode.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0c0b09;
          --surface: #161412;
          --surface2: #1e1b17;
          --border: #2a2520;
          --border2: #352f28;
          --gold: #d4a853;
          --gold-dim: #8a6d35;
          --gold-glow: rgba(212,168,83,0.12);
          --text: #f0ebe2;
          --muted: #8a8070;
          --dim: #4a4438;
          --white: #ffffff;
          --error: #e07060;
        }

        .app {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'Outfit', sans-serif;
          color: var(--text);
          background-image: radial-gradient(ellipse at 20% 0%, rgba(212,168,83,0.06) 0%, transparent 60%);
        }

        .header {
          padding: 32px 48px 28px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }

        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -1px;
          line-height: 1;
        }

        .logo em {
          color: var(--gold);
          font-style: normal;
        }

        .logo-tag {
          font-size: 11px;
          font-weight: 300;
          color: var(--muted);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 6px;
        }

        .plan-badge {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .plan {
          padding: 6px 14px;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .plan-basic {
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--muted);
        }

        .plan-pro {
          background: var(--gold-glow);
          border: 1px solid var(--gold-dim);
          color: var(--gold);
        }

        .main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 48px;
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 28px;
          align-items: start;
        }

        @media (max-width: 860px) {
          .main { grid-template-columns: 1fr; padding: 24px 20px; }
          .header { padding: 24px 20px; }
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .card-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-num {
          width: 26px;
          height: 26px;
          border: 1px solid var(--gold-dim);
          color: var(--gold);
          font-size: 12px;
          font-weight: 600;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }

        .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mode-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 4px;
          gap: 4px;
        }

        .mode-btn {
          padding: 10px;
          background: none;
          border: none;
          border-radius: 3px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
          line-height: 1.4;
        }

        .mode-btn small {
          display: block;
          font-size: 10px;
          opacity: 0.7;
          margin-top: 2px;
        }

        .mode-btn.active {
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border2);
        }

        .mode-btn.pro-mode {
          position: relative;
        }

        .pro-tag {
          position: absolute;
          top: 6px;
          right: 6px;
          background: var(--gold);
          color: var(--bg);
          font-size: 8px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 2px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .field { display: flex; flex-direction: column; gap: 8px; }

        .field-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--muted);
        }

        textarea, input[type="text"], input[type="url"] {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          line-height: 1.6;
          color: var(--text);
          background: var(--bg);
          border: 1px solid var(--border2);
          border-radius: 4px;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
          resize: vertical;
        }

        textarea:focus, input:focus {
          border-color: var(--gold-dim);
          box-shadow: 0 0 0 3px var(--gold-glow);
        }

        textarea::placeholder, input::placeholder { color: var(--dim); }

        .tone-row { display: flex; gap: 8px; }

        .tone-opt { position: relative; flex: 1; }

        .tone-opt input { position: absolute; opacity: 0; width: 0; height: 0; }

        .tone-lbl {
          display: block;
          text-align: center;
          padding: 9px 4px;
          border: 1px solid var(--border2);
          border-radius: 3px;
          font-size: 12px;
          font-weight: 400;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          background: var(--bg);
        }

        .tone-opt input:checked + .tone-lbl {
          border-color: var(--gold-dim);
          background: var(--gold-glow);
          color: var(--gold);
          font-weight: 500;
        }

        .gen-btn {
          padding: 14px;
          background: var(--gold);
          color: var(--bg);
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
        }

        .gen-btn:hover:not(:disabled) {
          background: #e0b860;
          box-shadow: 0 4px 20px rgba(212,168,83,0.3);
        }

        .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .error-msg {
          font-size: 13px;
          color: var(--error);
          background: rgba(224,112,96,0.1);
          border: 1px solid rgba(224,112,96,0.25);
          border-radius: 4px;
          padding: 10px 14px;
          line-height: 1.5;
        }

        .output-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          min-height: 480px;
          display: flex;
          flex-direction: column;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          flex-shrink: 0;
        }

        .tab {
          flex: 1;
          padding: 14px 10px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: var(--muted);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          text-align: center;
        }

        .tab:hover { color: var(--text); }

        .tab.active {
          color: var(--gold);
          border-bottom-color: var(--gold);
          background: var(--gold-glow);
        }

        .output-body {
          padding: 28px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .output-text {
          font-size: 14px;
          line-height: 1.85;
          color: var(--text);
          white-space: pre-wrap;
          flex: 1;
        }

        .output-footer {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .copy-btn {
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--muted);
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 8px 18px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .copy-btn:hover {
          color: var(--gold);
          border-color: var(--gold-dim);
          background: var(--gold-glow);
        }

        .state-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 48px 32px;
          gap: 14px;
        }

        .state-icon { font-size: 40px; opacity: 0.2; }

        .state-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--muted);
        }

        .state-sub {
          font-size: 13px;
          color: var(--dim);
          line-height: 1.7;
          max-width: 300px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--border2);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-msg {
          font-size: 13px;
          color: var(--gold-dim);
          letter-spacing: 1px;
        }

        .output-header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .output-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }

        .output-meta {
          font-size: 11px;
          color: var(--muted);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .footer {
          text-align: center;
          padding: 20px;
          font-size: 10px;
          color: var(--dim);
          letter-spacing: 2px;
          text-transform: uppercase;
          border-top: 1px solid var(--border);
        }
      `}</style>

      <div className="header">
        <div>
          <div className="logo">Listing<em>AI</em></div>
          <div className="logo-tag">Real Estate Copy · Powered by Claude</div>
        </div>
        <div className="plan-badge">
          <div className="plan plan-basic">Basic</div>
          <div className="plan plan-pro">Pro ✦</div>
        </div>
      </div>

      <div className="main">
        <div className="card">
          <div className="card-header">
            <div className="step-num">1</div>
            <div className="card-title">Property Input</div>
          </div>
          <div className="card-body">
            <div>
              <div className="field-label" style={{marginBottom: 8}}>Input Method</div>
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${mode === "mls" ? "active" : ""}`}
                  onClick={() => setMode("mls")}
                >
                  Paste MLS Text
                  <small>Copy from your MLS dashboard</small>
                </button>
                <button
                  className={`mode-btn pro-mode ${mode === "url" ? "active" : ""}`}
                  onClick={() => setMode("url")}
                >
                  <span className="pro-tag">Pro</span>
                  Paste Listing URL
                  <small>Zillow, Redfin, Realtor.com</small>
                </button>
              </div>
            </div>

            {mode === "mls" ? (
              <div className="field">
                <div className="field-label">MLS Remarks / Property Notes</div>
                <textarea
                  rows={7}
                  value={mlsText}
                  onChange={e => setMlsText(e.target.value)}
                  placeholder={`Paste your MLS property description here...\n\nExample: Stunning 4BD/3BA in the heart of Brentwood. Newly renovated kitchen with quartz countertops, hardwood floors throughout, private backyard with pool and spa. Close to top-rated schools. Open Sunday 1-4pm.`}
                />
              </div>
            ) : (
              <div className="field">
                <div className="field-label">Listing URL</div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://www.redfin.com/CA/Los-Angeles/..."
                />
                <div style={{fontSize: 11, color: "var(--muted)", lineHeight: 1.5}}>
                  Works best with Redfin and Realtor.com. Requires Firecrawl API key configured.
                </div>
              </div>
            )}

            <div className="field">
              <div className="field-label">Tone</div>
              <div className="tone-row">
                {tones.map(t => (
                  <div className="tone-opt" key={t}>
                    <input type="radio" id={t} name="tone" value={t} checked={tone === t} onChange={() => setTone(t)} />
                    <label className="tone-lbl" htmlFor={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</label>
                  </div>
                ))}
              </div>
            </div>

            <button className="gen-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate All Copy →"}
            </button>

            {error && <div className="error-msg">{error}</div>}
          </div>
        </div>

        <div className="output-card">
          {!output && !loading && (
            <div className="state-center">
              <div className="state-icon">✍️</div>
              <div className="state-title">Your copy appears here</div>
              <div className="state-sub">
                Paste your MLS text or a listing URL, choose a tone, and generate five pieces of ready-to-use marketing content in seconds.
              </div>
            </div>
          )}

          {loading && (
            <div className="state-center">
              <div className="spinner" />
              <div className="loading-msg">{loadingMsg || "Working..."}</div>
            </div>
          )}

          {output && !loading && (
            <>
              <div className="output-header">
                <div className="output-header-title">Generated Copy</div>
                <div className="output-meta">{tabs.length} formats ready</div>
              </div>
              <div className="tabs">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`tab ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              <div className="output-body">
                <div className="output-text">{output[activeTab]}</div>
                <div className="output-footer">
                  <CopyBtn text={output[activeTab]} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="footer">ListingAI · For real estate professionals · Powered by Claude</div>
    </div>
  );
}
