import { useState } from "react";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ACCESS_CODE = "listing2024";

const PROPERTY_TYPES = [
  { id: "family", label: "Family Home", icon: "🏡", desc: "Emphasizes schools, space & neighborhood" },
  { id: "luxury", label: "Luxury", icon: "✦", desc: "Leads with finishes, views & lifestyle" },
  { id: "investment", label: "Investment", icon: "📈", desc: "Surfaces cash flow, cap rate & upside" },
  { id: "fixer", label: "Fixer / Opportunity", icon: "🔨", desc: "Frames potential, location & land value" },
];

const TONES = ["Professional", "Premium", "Personal"];

const TABS = [
  { key: "mls", label: "MLS Listing", icon: "🏠" },
  { key: "instagram", label: "Instagram", icon: "📸" },
  { key: "facebook", label: "Facebook", icon: "👥" },
  { key: "email", label: "Email", icon: "✉️" },
  { key: "zillow", label: "Zillow", icon: "🔍" },
];

const getSystemPrompt = (propertyType, tone) => {
  const toneGuide = {
    Professional: "authoritative, precise, and confident — like a top-producing agent who knows their market",
    Premium: "refined, aspirational, and evocative — paint a lifestyle, not just a property",
    Personal: "warm, conversational, and inviting — like a trusted friend describing a home they love",
  }[tone];

  const typeGuide = {
    family: `You are writing for a FAMILY HOME listing. Your priorities in order:
1. Lead with the neighborhood lifestyle and school district if mentioned — this is what family buyers decide on first
2. Emphasize space: bedrooms, yard, garage, storage — families need room
3. Highlight safety, walkability, proximity to parks, schools, and community
4. Feature practical upgrades: new roof, HVAC, updated kitchen — things that reduce buyer anxiety
5. Close with the school district name if available, or walkability/commute
NEVER lead with the address. NEVER use "motivated seller", "priced to sell", "don't miss out", or "gem".
Power phrases to use when applicable: "top-rated schools", "cul-de-sac", "entertainer's backyard", "move-in ready", "walkable to".`,

    luxury: `You are writing for a LUXURY property listing. Your priorities in order:
1. Open with the most distinctive feature — the view, the architecture, the location — in evocative language
2. Emphasize quality of finishes: materials, brands, craftsmanship — be specific not generic
3. Create lifestyle imagery: morning coffee with canyon views, hosting in the chef's kitchen
4. Privacy, exclusivity, and prestige — who is this home for and how will it make them feel
5. Close with a lifestyle statement, never a price pitch
NEVER use "cozy", "cute", "nice", "great", "motivated seller", or any generic filler.
Power phrases: "bespoke", "resort-style", "curated", "panoramic", "chef-caliber", "statement", "rare offering", "discerning buyer".`,

    investment: `You are writing for an INVESTMENT PROPERTY listing. Your priorities in order:
1. Lead with the financial story — if rent, price, or cap rate data is present, calculate and surface it immediately
2. If monthly rent is mentioned: calculate annual gross income, estimate cap rate if price given
3. Highlight tenant situation: occupied/vacant, lease terms, rent control status if mentioned
4. Location drivers: job centers, transit, rental demand indicators
5. Value-add upside: what can be improved, added, or repositioned
6. Close with the investment thesis in one sentence
NEVER bury the numbers. NEVER write like a retail home listing — investors think in returns, not feelings.`,

    fixer: `You are writing for a FIXER-UPPER / OPPORTUNITY listing. Your priorities in order:
1. Lead with location and land value — that's what survives the renovation
2. Frame the condition as opportunity, not liability — "blank canvas", "priced for the work"
3. Highlight the bones: lot size, layout, square footage, structural positives
4. Mention the neighborhood trajectory — is it improving? What's nearby that's already great?
5. Target the right buyer: investor, owner-occupant builder, developer
6. Be honest but optimistic — sophisticated buyers see through spin, but respond to upside framing
NEVER hide the condition. NEVER oversell.
Power phrases: "priced to reflect condition", "exceptional bones", "prime lot", "emerging neighborhood", "investor's canvas".`,
  }[propertyType];

  return `You are an elite real estate copywriter with 20 years of experience writing listing copy that sells homes faster and for more money. You write with precision, never padding, never filler.

${typeGuide}

TONE: Write in a ${toneGuide} voice.

UNIVERSAL RULES:
- Never start with "Welcome to" or "Introducing"
- Never use: "don't miss", "motivated seller", "priced to sell", "gem", "must see", "nestled", "boasts"
- Every sentence must earn its place — cut anything that doesn't add information or emotion
- Be specific: "quartz waterfall island" not "updated kitchen"; "top-rated Arcadia USD" not "good schools"
- MLS copy: 150-180 words maximum, hard limit
- Instagram: under 150 words, line breaks for rhythm, 8-10 hashtags on final line
- Facebook: under 120 words, conversational, community-focused
- Email: under 150 words, include subject line formatted as "Subject: [line]" then double line break then body
- Zillow: 100-130 words, optimized for search, lead with bedroom/bathroom count and key features

Return ONLY valid JSON, no markdown, no backticks, no explanation whatsoever.`;
};

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

const PasswordGate = ({ onUnlock }) => {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const attempt = () => {
    if (pw === ACCESS_CODE) { onUnlock(); }
    else { setError(true); setTimeout(() => setError(false), 2000); setPw(""); }
  };
  return (
    <div className="gate">
      <div className="gate-inner">
        <div className="gate-logo">Listing<em>AI</em></div>
        <div className="gate-sub">Real Estate Copy Platform</div>
        <div className="gate-form">
          <input type="password" className={`gate-input ${error ? "gate-error" : ""}`}
            placeholder={error ? "Incorrect code" : "Enter access code"}
            value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && attempt()} autoFocus />
          <button className="gate-btn" onClick={attempt}>Enter →</button>
        </div>
      </div>
    </div>
  );
};

export default function ListingAI() {
  const [unlocked, setUnlocked] = useState(false);
  const [propertyType, setPropertyType] = useState("family");
  const [mlsText, setMlsText] = useState("");
  const [tone, setTone] = useState("Professional");
  const [output, setOutput] = useState(null);
  const [activeTab, setActiveTab] = useState("mls");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  const generate = async () => {
    if (mlsText.trim().length < 20) { setError("Please paste your property details first."); return; }
    setError(null); setOutput(null); setLoading(true);

    const userPrompt = `Property details:
${mlsText.trim()}

Generate all five content pieces for this ${PROPERTY_TYPES.find(p => p.id === propertyType)?.label} listing.

Return this exact JSON:
{
  "mls": "[150-180 word MLS listing description]",
  "instagram": "[Instagram caption with hashtags]",
  "facebook": "[Facebook post]",
  "email": "[Subject line then email body]",
  "zillow": "[Zillow optimized description]"
}`;

    try {
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
          max_tokens: 1500,
          system: getSystemPrompt(propertyType, tone),
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      if (data.error) { setError("API error: " + data.error.message); return; }
      const text = data.content?.map(i => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setOutput(JSON.parse(clean));
      setActiveTab("mls");
    } catch (err) {
      setError("Something went wrong. Check your API key and credits, then try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0908; --surface: #131110; --surface2: #1a1714; --surface3: #221f1b;
          --border: #252018; --border2: #302a22;
          --gold: #c9a84c; --gold-light: #e8d5a3; --gold-dim: #7a6530;
          --gold-glow: rgba(201,168,76,0.1); --gold-glow2: rgba(201,168,76,0.05);
          --text: #ede8df; --text2: #a89880; --muted: #6a6055; --dim: #3a3530;
          --error: #c0604a;
        }
        .app { min-height: 100vh; background: var(--bg); font-family: 'Outfit', sans-serif; color: var(--text); background-image: radial-gradient(ellipse at 15% 0%, rgba(201,168,76,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(201,168,76,0.04) 0%, transparent 45%); }
        .gate { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); background-image: radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.08) 0%, transparent 60%); }
        .gate-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; }
        .gate-logo { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 700; color: var(--text); letter-spacing: -2px; line-height: 1; }
        .gate-logo em { color: var(--gold); font-style: normal; }
        .gate-sub { font-size: 11px; font-weight: 300; color: var(--muted); letter-spacing: 4px; text-transform: uppercase; margin-bottom: 24px; }
        .gate-form { display: flex; flex-direction: column; gap: 12px; width: 280px; }
        .gate-input { font-family: 'Outfit', sans-serif; font-size: 14px; color: var(--text); background: var(--surface); border: 1px solid var(--border2); border-radius: 4px; padding: 13px 16px; outline: none; text-align: center; letter-spacing: 2px; transition: border-color 0.15s; width: 100%; }
        .gate-input:focus { border-color: var(--gold-dim); }
        .gate-input.gate-error { border-color: var(--error); color: var(--error); }
        .gate-input::placeholder { letter-spacing: 1px; color: var(--muted); }
        .gate-btn { padding: 13px; background: var(--gold); color: var(--bg); font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border: none; border-radius: 4px; cursor: pointer; transition: all 0.15s; }
        .gate-btn:hover { background: var(--gold-light); }
        .header { padding: 28px 48px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; color: var(--text); letter-spacing: -1px; line-height: 1; }
        .logo em { color: var(--gold); font-style: normal; }
        .header-right { font-size: 11px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; }
        .main { max-width: 1140px; margin: 0 auto; padding: 36px 48px 48px; display: grid; grid-template-columns: 400px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 880px) { .main { grid-template-columns: 1fr; padding: 24px 20px; } .header { padding: 22px 20px; } }
        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
        .panel-head { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .panel-num { width: 24px; height: 24px; border: 1px solid var(--gold-dim); color: var(--gold); font-size: 11px; font-weight: 600; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .panel-title { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 600; }
        .panel-body { padding: 22px; display: flex; flex-direction: column; gap: 20px; }
        .sect-label { font-size: 10px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
        .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .type-card { position: relative; background: var(--bg); border: 1px solid var(--border2); border-radius: 5px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; }
        .type-card:hover { border-color: var(--gold-dim); }
        .type-card.active { border-color: var(--gold); background: var(--gold-glow); }
        .type-card input { position: absolute; opacity: 0; width: 0; height: 0; }
        .type-icon { font-size: 18px; margin-bottom: 6px; display: block; }
        .type-name { font-size: 13px; font-weight: 500; color: var(--text); display: block; margin-bottom: 3px; }
        .type-desc { font-size: 10px; color: var(--muted); line-height: 1.4; }
        .type-card.active .type-name { color: var(--gold); }
        .type-card.active .type-desc { color: var(--text2); }
        .field { display: flex; flex-direction: column; }
        textarea { font-family: 'Outfit', sans-serif; font-size: 13px; line-height: 1.65; color: var(--text); background: var(--bg); border: 1px solid var(--border2); border-radius: 4px; padding: 13px 14px; outline: none; resize: vertical; min-height: 130px; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; }
        textarea:focus { border-color: var(--gold-dim); box-shadow: 0 0 0 3px var(--gold-glow2); }
        textarea::placeholder { color: var(--dim); }
        .tone-row { display: flex; gap: 8px; }
        .tone-opt { position: relative; flex: 1; }
        .tone-opt input { position: absolute; opacity: 0; width: 0; height: 0; }
        .tone-lbl { display: block; text-align: center; padding: 9px 4px; border: 1px solid var(--border2); border-radius: 3px; font-size: 12px; font-weight: 400; color: var(--muted); cursor: pointer; transition: all 0.15s; background: var(--bg); }
        .tone-opt input:checked + .tone-lbl { border-color: var(--gold-dim); background: var(--gold-glow); color: var(--gold); font-weight: 500; }
        .gen-btn { padding: 14px; background: var(--gold); color: var(--bg); font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; border: none; border-radius: 4px; cursor: pointer; transition: all 0.2s; width: 100%; }
        .gen-btn:hover:not(:disabled) { background: var(--gold-light); box-shadow: 0 6px 24px rgba(201,168,76,0.25); transform: translateY(-1px); }
        .gen-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .error-msg { font-size: 12px; color: var(--error); background: rgba(192,96,74,0.08); border: 1px solid rgba(192,96,74,0.2); border-radius: 4px; padding: 10px 14px; line-height: 1.5; }
        .output-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; min-height: 520px; display: flex; flex-direction: column; }
        .tabs { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; overflow-x: auto; }
        .tab { flex: 1; padding: 14px 8px; font-size: 11px; font-weight: 500; color: var(--muted); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.15s; font-family: 'Outfit', sans-serif; text-align: center; }
        .tab:hover { color: var(--text2); }
        .tab.active { color: var(--gold); border-bottom-color: var(--gold); background: var(--gold-glow2); }
        .output-body { padding: 28px; flex: 1; display: flex; flex-direction: column; }
        .output-text { font-size: 14px; line-height: 1.9; color: var(--text); white-space: pre-wrap; flex: 1; }
        .output-footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .output-meta { font-size: 10px; color: var(--dim); letter-spacing: 1px; text-transform: uppercase; }
        .copy-btn { background: var(--surface2); border: 1px solid var(--border2); color: var(--muted); font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; padding: 8px 18px; border-radius: 3px; cursor: pointer; transition: all 0.15s; }
        .copy-btn:hover { color: var(--gold); border-color: var(--gold-dim); background: var(--gold-glow); }
        .state-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px 32px; gap: 14px; }
        .state-icon { font-size: 36px; opacity: 0.15; }
        .state-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--muted); }
        .state-sub { font-size: 13px; color: var(--dim); line-height: 1.7; max-width: 280px; }
        .spinner { width: 30px; height: 30px; border: 2px solid var(--border2); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-label { font-size: 12px; color: var(--gold-dim); letter-spacing: 2px; text-transform: uppercase; }
        .output-head { padding: 16px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .output-head-title { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 600; }
        .type-pill { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gold); background: var(--gold-glow); border: 1px solid var(--gold-dim); padding: 4px 10px; border-radius: 2px; }
        .divider { height: 1px; background: var(--border); margin: 4px 0; }
      `}</style>

      <div className="header">
        <div className="logo">Listing<em>AI</em></div>
        <div className="header-right">For Real Estate Professionals</div>
      </div>

      <div className="main">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-num">1</div>
            <div className="panel-title">Property Details</div>
          </div>
          <div className="panel-body">
            <div>
              <div className="sect-label">Property Type</div>
              <div className="type-grid">
                {PROPERTY_TYPES.map(pt => (
                  <label key={pt.id} className={`type-card ${propertyType === pt.id ? "active" : ""}`}>
                    <input type="radio" name="propertyType" value={pt.id} checked={propertyType === pt.id} onChange={() => setPropertyType(pt.id)} />
                    <span className="type-icon">{pt.icon}</span>
                    <span className="type-name">{pt.label}</span>
                    <span className="type-desc">{pt.desc}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="divider" />
            <div className="field">
              <div className="sect-label">MLS Remarks / Property Notes</div>
              <textarea value={mlsText} onChange={e => setMlsText(e.target.value)}
                placeholder={`Paste your MLS description or property notes here...\n\nInclude: address, price, beds/baths, sqft, key features, school district, recent upgrades, anything notable.`} />
            </div>
            <div>
              <div className="sect-label">Tone</div>
              <div className="tone-row">
                {TONES.map(t => (
                  <div className="tone-opt" key={t}>
                    <input type="radio" id={`tone-${t}`} name="tone" value={t} checked={tone === t} onChange={() => setTone(t)} />
                    <label className="tone-lbl" htmlFor={`tone-${t}`}>{t}</label>
                  </div>
                ))}
              </div>
            </div>
            <button className="gen-btn" onClick={generate} disabled={loading}>
              {loading ? "Writing Your Copy..." : "Generate All Copy →"}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </div>
        </div>

        <div className="output-panel">
          {!output && !loading && (
            <div className="state-center">
              <div className="state-icon">✍️</div>
              <div className="state-title">Ready to write</div>
              <div className="state-sub">Select your property type, paste your MLS notes, choose a tone — get five platform-ready pieces of copy in seconds.</div>
            </div>
          )}
          {loading && (
            <div className="state-center">
              <div className="spinner" />
              <div className="loading-label">Writing expert copy...</div>
            </div>
          )}
          {output && !loading && (
            <>
              <div className="output-head">
                <div className="output-head-title">Generated Copy</div>
                <div className="type-pill">{PROPERTY_TYPES.find(p => p.id === propertyType)?.icon} {PROPERTY_TYPES.find(p => p.id === propertyType)?.label}</div>
              </div>
              <div className="tabs">
                {TABS.map(tab => (
                  <button key={tab.key} className={`tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              <div className="output-body">
                <div className="output-text">{output[activeTab]}</div>
                <div className="output-footer">
                  <div className="output-meta">{TABS.find(t => t.key === activeTab)?.label} · {tone}</div>
                  <CopyBtn text={output[activeTab]} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
