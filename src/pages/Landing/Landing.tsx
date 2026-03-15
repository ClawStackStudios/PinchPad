import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { InteractiveBrand } from '../../components/Branding/InteractiveBrand';
import {
  Zap,
  ArrowRight,
  Code2,
  Archive,
  Fingerprint,
  Layout,
  Key,
  ShieldCheck,
  Bot,
  Users,
  Database,
  CheckCircle2,
  AlertCircle,
  Lock,
  Terminal,
  ChevronRight,
  FolderTree,
  Globe
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const { isClawSigned, shellKey } = useAuth();

  // Set page title
  React.useEffect(() => {
    document.title = 'PinchPad — Sovereign Notes';
  }, []);

  // Redirect if fully signed in (token + encryption key)
  React.useEffect(() => {
    if (isClawSigned && shellKey) {
      navigate('/notes');
    }
  }, [isClawSigned, shellKey, navigate]);

  // ── States ────────────────────────────────────────────────────────────────
  const [keyInfoVisible, setKeyInfoVisible] = useState(false);
  const [gatewayMode, setGatewayMode] = useState<'human' | 'agent'>('human');
  const [agentTab, setAgentTab] = useState<'botkit' | 'manual'>('botkit');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen font-sans selection:bg-amber-500/30 transition-colors duration-500">
      
      {/* ── Background Glow ───────────────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 w-screen h-screen pointer-events-none flex items-center justify-center -z-10"
        style={{
          background: `
            radial-gradient(circle at 50% -20%, rgba(217,119,6,0.1), transparent 70%),
            radial-gradient(circle at 0% 100%, rgba(239,68,68,0.03), transparent 50%)
          `,
        }}
      />

      <main className="relative">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="pt-8 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Logo Placeholder */}
              <img 
                src="/assets/logo.png" 
                alt="PinchPad Logo" 
                className="w-72 h-72 object-contain mx-auto -mb-12 mix-blend-multiply dark:mix-blend-screen dark:invert dark:brightness-[1.2] dark:contrast-[1.1]" 
              />
              
              <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
                <Zap className="w-4 h-4" />
                Local-First Sovereign Pinching©™
              </div>

              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
                <InteractiveBrand variant="prominent" />
              </h1>

              <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 font-medium mb-4 max-w-3xl mx-auto leading-relaxed">
                Your sovereign <span className="text-red-500 font-bold italic">Pearl</span> library where Humans and AI Lobsters collaborate to <span className="text-amber-500 font-semibold italic">molt</span> your notes.
              </p>

              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Snap out of the generic SaaS trap. <span className="text-amber-500 font-semibold">PinchPad©™</span> secures your notes with <span className="text-amber-500 font-semibold">ShellCryption©™</span> and <span className="text-amber-500 font-semibold">Armor Plated Authentication</span>. <span className="italic">Clutch your Pearls</span> while your sovereign AI agents <span className="text-amber-600 font-semibold">scuttle</span> your thoughts and capture the catch! 🦞
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 rounded-md bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-lg px-8 py-6 shadow-xl shadow-amber-200 dark:shadow-amber-900/40 text-white"
                >
                  Hatch Your PinchPad
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <button 
                  onClick={() => setKeyInfoVisible(!keyInfoVisible)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 h-10 rounded-md text-lg px-8 py-6 border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:text-white"
                >
                  <Key className="w-5 h-5 mr-2" />
                  How Keys Work
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Key Info Panel ────────────────────────────────────────────────── */}
        {keyInfoVisible && (
          <section className="py-16 px-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="max-w-3xl mx-auto">
              <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-500/30 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-xl">
                <div className="flex gap-6 mb-10">
                  <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">Your Key is Your Identity</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">PinchPad uses a new key-based authentication system. No passwords to remember.</p>
                  </div>
                </div>

                <div className="grid gap-6 mb-10">
                  {[
                    { n: 1, t: "Generate Your Unique Key", d: "When you hatch a pad, we generate a cryptographic key pair specifically for you." },
                    { n: 2, t: "Download & Store Safely", d: "You'll receive a key file. Save it securely—this is your ONLY way to access your pad." },
                    { n: 3, t: "Login with Your Key", d: "Simply upload your key file to access your library. No passwords, no hassle." }
                  ].map(step => (
                    <div key={step.n} className="flex gap-5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 text-xl shadow-md">{step.n}</div>
                      <div>
                        <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">{step.t}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{step.d}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-4 p-5 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-900 dark:text-amber-200 font-semibold leading-relaxed shadow-sm">
                  <AlertCircle size={24} className="shrink-0" />
                  <p>Important: Never lose your key file! It cannot be recovered. Store it in multiple secure locations.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Gateway ───────────────────────────────────────────────────────── */}
        <section className="py-12 px-6 flex justify-center overflow-hidden">
          <div className="w-full max-w-md space-y-6">
            
            {/* Top Human/Agent Toggles — Matches .mode-switcher exact pill style */}
            <div className="flex justify-center gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full backdrop-blur-sm shadow-inner transition-colors duration-300">
              <button 
                onClick={() => setGatewayMode('human')}
                className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-full transition-all uppercase tracking-widest ${
                  gatewayMode === 'human' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                👤 I'm a Human
              </button>
              <button 
                onClick={() => setGatewayMode('agent')}
                className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-full transition-all uppercase tracking-widest ${
                  gatewayMode === 'agent' 
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                🤖 I'm an Agent
              </button>
            </div>

            {/* Main Content Card — Matches .gateway-card exact styles */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden transition-colors duration-300">
              
              {/* Human Mode */}
              {gatewayMode === 'human' && (
                <div key="human-content" className="animate-in flex flex-col items-center">
                  <h3 className="text-slate-900 dark:text-white font-bold mb-6 text-center text-xs uppercase tracking-widest leading-relaxed">
                    Join the <br /> <span className="text-amber-500">Reef</span> 🌊
                  </h3>
                  <div className="w-full text-sm text-slate-500 dark:text-slate-400 space-y-4 px-1">
                    {[
                      { n: 1, t: "Generate your unguessable Identity Key" },
                      { n: 2, t: "Store it somewhere safe (Offline)" },
                      { n: 3, t: "Drag & Drop to authenticate anywhere" }
                    ].map(s => (
                      <p key={s.n} className="flex items-center">
                        <span className="w-6 h-6 flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md font-black mr-3 text-xs flex-shrink-0">{s.n}</span> 
                        {s.t}
                      </p>
                    ))}
                  </div>
                  <button 
                    onClick={() => navigate('/register')}
                    className="w-full mt-8 rounded-md text-sm font-medium h-9 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-95"
                  >
                    Create Human Identity
                  </button>
                </div>
              )}

              {/* Agent Mode */}
              {gatewayMode === 'agent' && (
                <div key="agent-content" className="animate-in">
                  <h3 className="text-slate-900 dark:text-white font-bold mb-6 text-center text-xs uppercase tracking-widest leading-relaxed">
                    Integrate your <br /> <span className="text-red-500">Lobsters</span> 🦞
                  </h3>
                  
                  <div className="flex mb-6 bg-slate-100 dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => setAgentTab('botkit')}
                      className={`flex-1 px-3 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                        agentTab === 'botkit' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      BotKit
                    </button>
                    <button 
                      onClick={() => setAgentTab('manual')}
                      className={`flex-1 px-3 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                        agentTab === 'manual' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      Manual
                    </button>
                  </div>

                  {/* BotKit Content */}
                  {agentTab === 'botkit' && (
                    <div key="botkit-subtab" className="animate-in">
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center group relative overflow-hidden transition-colors">
                        <code className="text-amber-600 dark:text-amber-400 text-xs font-mono break-all leading-relaxed text-center relative z-10 selection:bg-amber-200 dark:selection:bg-amber-900/50">
                          npx pinchpad-botkit init
                        </code>
                        <div className="absolute inset-0 bg-amber-50 dark:bg-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-3 px-1">
                        {[
                          { n: 1, t: "Initialize the BotKit Toolkit in your project" },
                          { n: 2, t: "Generate Key natively inside Settings" },
                          { n: 3, t: "Assign granular permissions to limit blast radius" }
                        ].map(s => (
                          <p key={s.n} className="flex items-center">
                            <span className="w-5 h-5 flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md font-black mr-3 text-[10px] flex-shrink-0">{s.n}</span> 
                            {s.t}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Content */}
                  {agentTab === 'manual' && (
                    <div key="manual-subtab" className="animate-in">
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center transition-colors">
                        <code className="text-amber-600 dark:text-amber-400 text-[10px] font-mono whitespace-pre text-left leading-relaxed">
                          {`POST /api/auth/token\n{\n  "type": "agent",\n  "keyHash": "<SHA-256>"\n}`}
                        </code>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-3 px-1">
                        {[
                          { n: 1, t: "Manually create a key via settings" },
                          { n: 2, t: "Exchange hashed lb- key for API token" },
                          { n: 3, t: "Pass Bearer token in Authorization header" }
                        ].map(s => (
                          <p key={s.n} className="flex items-center">
                            <span className="w-5 h-5 flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md font-black mr-3 text-[10px] flex-shrink-0">{s.n}</span> 
                            {s.t}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => navigate('/register')}
                    className="w-full mt-8 rounded-md text-sm font-medium h-9 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-95"
                  >
                    Secure Agent Identity
                  </button>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-5xl sm:text-7xl font-black mb-8 tracking-tighter">Human + <span className="text-amber-500">Agent</span></h2>
              <p className="text-xl max-w-3xl mx-auto leading-relaxed dark:text-slate-400 text-slate-600 font-medium">
                PinchPad allows you to <span className="text-amber-500 font-semibold italic underline decoration-amber-500/30">pinch</span> away the tediousness of organizing your notes. 
                Let your agents help you scuttle through the noise!
                Parsed and converted to markdown for a more <span className="text-amber-500 font-semibold italic">traversable format</span>.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                ico={<Users className="w-7 h-7" />} 
                hov="hover:border-amber-300"
                iconBg="bg-amber-100 dark:bg-amber-900/30"
                iconCol="text-amber-700 dark:text-amber-400"
                h="Human Curated" 
                d={<>Cast your own net and haul in the links yourself. Pinch URLs with precision, tag your catch, and sort your shell collection exactly your way.</>} 
              />
              <FeatureCard 
                ico={<Bot className="w-7 h-7" />} 
                hov="hover:border-amber-300"
                iconBg="bg-amber-100 dark:bg-amber-900/30"
                iconCol="text-amber-700 dark:text-amber-400"
                h={<><span className="text-red-500">Lobster</span> Powered</>} 
                d={<>Unleash your <span className="text-red-500 font-semibold">Lobsters</span> to scuttle the seafloor of the web. They'll pinch links, research topics, and pack your shell full of curated catches.</>} 
              />
              <FeatureCard 
                ico={<FolderTree className="w-7 h-7" />} 
                hov="hover:border-green-300"
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconCol="text-green-700 dark:text-green-400"
                h="Shared Tide Pool" 
                d={<>Humans and <span className="text-red-500 font-semibold">Lobsters</span> share the same reef. Both species sort the catch into the same folders, tags, and burrows — no territorial disputes.</>} 
              />
              <FeatureCard 
                ico={<Database className="w-7 h-7" />} 
                hov="hover:border-purple-300"
                iconBg="bg-purple-100 dark:bg-purple-900/30"
                iconCol="text-purple-700 dark:text-purple-400"
                h="Your Own Shell" 
                d={<>Your Pearls live in your own shell — no landlords, no cloud tanks. IndexedDB or SQLite, your burrow, your rules. No evictions.</>} 
              />
              <FeatureCard 
                ico={<ShieldCheck className="w-7 h-7" />}
                h="Secure Vault"
                hov="hover:border-green-500 dark:hover:border-green-500"
                iconBg="bg-green-100 dark:bg-green-900/30"
                iconCol="text-green-700 dark:text-green-400"
                d={<>Every Pearl is locked in <span className="text-red-500 font-bold uppercase text-[10px] tracking-widest">ShellCryption©™</span> armor. Nobody cracks your stash without the right key. Not even us.</>} 
              />
              <FeatureCard 
                ico={<Globe className="w-7 h-7" />} 
                hov="hover:border-rose-300"
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                iconCol="text-rose-700 dark:text-rose-400"
                h={<><span className="text-red-500">Lobster</span> Permits</>} 
                d={<>You decide which <span className="text-red-500 font-semibold">Lobsters</span> get the master claw and which only browse the reef. Granular read/write/delete permits, per crustacean. You're the Captain.</>} 
              />
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-600 to-amber-800 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <span className="text-5xl">🦞</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Build Your PinchPad?</h2>
            <p className="text-xl text-amber-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join the Reef. Let your <span className="text-red-500 font-bold">Lobsters</span> keep your <span className="text-amber-400 font-bold">shell-stash</span> sleek and streamlined.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 rounded-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg px-8 py-6 shadow-xl shadow-red-900/20"
              >
                Hatch Your PinchPad
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 rounded-md bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-900 font-medium text-lg px-8 py-6 shadow-xl shadow-amber-900/20"
              >
                Login with Key
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <footer className="py-12 px-6 bg-slate-900 text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-white text-sm select-none">🦞</div>
              <InteractiveBrand className="text-lg font-bold" showCopyright={false} />
            </div>
            <p className="text-sm">© {new Date().getFullYear()} PinchPad. Your Sovereign <span className="text-red-400 font-semibold">Pearl</span> Library.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function AgentStep({ n, t }: { n: number, t: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-black text-amber-500 uppercase tracking-tight">
      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">{n}</div>
      <span>{t}</span>
    </div>
  );
}

function FeatureCard({ ico, h, d, hov, iconBg, iconCol }: { ico: React.ReactNode, h: React.ReactNode, d: React.ReactNode, hov: string, iconBg: string, iconCol: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all ${hov}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-black/5 ${iconBg} ${iconCol}`}>
        {ico}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">{h}</h3>
      <div className="text-slate-600 dark:text-slate-400 leading-relaxed">{d}</div>
    </div>
  );
}
