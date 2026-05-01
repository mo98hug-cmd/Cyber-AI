import React from "react";
import { motion } from "framer-motion";
import { Moon, Sun, ShieldAlert, Bug, KeyRound, Globe, Fish, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

interface WelcomeScreenProps {
  onInitialize: () => void;
}

const KNOWLEDGE_AREAS = [
  { icon: Bug,         label: "SQL Injection",    description: "Detect & prevent database injection attacks",    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/25" },
  { icon: ShieldAlert, label: "XSS Protection",   description: "Cross-site scripting defense strategies",       color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/25" },
  { icon: KeyRound,    label: "Password Hashing", description: "Secure credential storage best practices",      color: "text-blue-300",    bg: "bg-blue-400/10 border-blue-400/25" },
  { icon: Globe,       label: "API Security",     description: "Authenticate, authorize & protect APIs",        color: "text-cyan-300",    bg: "bg-cyan-400/10 border-cyan-400/25" },
  { icon: Fish,        label: "Phishing Attacks", description: "Recognize & defend against social engineering", color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/25" },
  { icon: Network,     label: "Network Security", description: "Firewalls, VPNs & intrusion detection",        color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/25" },
];

function CyberOrb() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="60%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="coreGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id="scanClip">
          <circle cx="120" cy="120" r="54" />
        </clipPath>
      </defs>

      <circle cx="120" cy="120" r="110" fill="url(#orbGrad)" />
      <ellipse cx="120" cy="120" rx="100" ry="30" fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3"
        style={{ transformOrigin: "120px 120px", animation: "wSpin1 8s linear infinite" }} />
      <ellipse cx="120" cy="120" rx="100" ry="30" fill="none" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.25"
        style={{ transformOrigin: "120px 120px", animation: "wSpin2 12s linear infinite" }} />
      <ellipse cx="120" cy="120" rx="84" ry="84" fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.2"
        strokeDasharray="8 6" style={{ transformOrigin: "120px 120px", animation: "wSpin3 18s linear infinite" }} />

      <circle r="4" fill="#60a5fa" filter="url(#glow)">
        <animateMotion dur="8s" repeatCount="indefinite" path="M 120 90 a 30 100 0 1 1 0 0.01" />
      </circle>
      <circle r="3" fill="#93c5fd" filter="url(#glow)">
        <animateMotion dur="8s" begin="-4s" repeatCount="indefinite" path="M 120 90 a 30 100 0 1 1 0 0.01" />
      </circle>

      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 120 + Math.cos(rad) * 58, y1 = 120 + Math.sin(rad) * 58;
        const x2 = 120 + Math.cos(rad) * 88, y2 = 120 + Math.sin(rad) * 88;
        return (
          <g key={angle}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.6" />
            <circle cx={x2} cy={y2} r="2.5" fill="#3b82f6" fillOpacity="0.8"
              style={{ animation: `wPulse ${1.2 + i * 0.15}s ease-in-out infinite alternate` }} />
          </g>
        );
      })}

      <circle cx="120" cy="120" r="54" fill="url(#coreGrad)" filter="url(#coreGlow)" />
      <g clipPath="url(#scanClip)" opacity="0.35">
        <line x1="80" y1="110" x2="160" y2="110" stroke="#e0f2fe" strokeWidth="1" />
        <line x1="80" y1="120" x2="160" y2="120" stroke="#e0f2fe" strokeWidth="1" />
        <line x1="80" y1="130" x2="160" y2="130" stroke="#e0f2fe" strokeWidth="1" />
        <line x1="110" y1="80" x2="110" y2="160" stroke="#e0f2fe" strokeWidth="1" />
        <line x1="120" y1="80" x2="120" y2="160" stroke="#e0f2fe" strokeWidth="1" />
        <line x1="130" y1="80" x2="130" y2="160" stroke="#e0f2fe" strokeWidth="1" />
      </g>
      <path d="M120 95 L138 103 L138 120 Q138 134 120 142 Q102 134 102 120 L102 103 Z"
        fill="none" stroke="#e0f2fe" strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow)" opacity="0.9" />
      <rect x="113" y="118" width="14" height="11" rx="2" fill="#e0f2fe" opacity="0.9" />
      <path d="M113 118 Q113 111 120 111 Q127 111 127 118" fill="none" stroke="#e0f2fe" strokeWidth="2.5" />
      <circle cx="120" cy="123" r="2" fill="#1e40af" />
      <rect clipPath="url(#scanClip)" x="66" y="0" width="108" height="2.5" rx="1"
        fill="#7dd3fc" opacity="0.7" filter="url(#glow)"
        style={{ animation: "wScanline 2.4s ease-in-out infinite" }} />

      <style>{`
        @keyframes wSpin1 { from { transform: rotateX(72deg) rotateZ(0deg); } to { transform: rotateX(72deg) rotateZ(360deg); } }
        @keyframes wSpin2 { from { transform: rotateX(60deg) rotateY(20deg) rotateZ(0deg); } to { transform: rotateX(60deg) rotateY(20deg) rotateZ(-360deg); } }
        @keyframes wSpin3 { from { transform: rotateZ(0deg); } to { transform: rotateZ(-360deg); } }
        @keyframes wPulse { from { opacity: 0.4; } to { opacity: 1; } }
        @keyframes wScanline {
          0%   { transform: translateY(66px);  opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(174px); opacity: 0; }
        }
      `}</style>
    </svg>
  );
}

export function WelcomeScreen({ onInitialize }: WelcomeScreenProps) {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div
      className="relative h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button variant="ghost" size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl text-center px-6">

        {/* Orb */}
        <motion.div
          className="w-32 h-32 mb-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [-5, 5, -5] }}
          transition={{
            opacity: { duration: 0.7, ease: "easeOut" },
            scale:   { duration: 0.7, ease: "easeOut" },
            y:       { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.7 },
          }}
        >
          <CyberOrb />
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-1 text-foreground"
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        >
          System <span className="text-primary">Ready</span>
        </motion.h1>

        <motion.p
          className="text-[11px] text-muted-foreground mb-4 font-medium tracking-widest uppercase"
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        >
          Evolved Intelligence. Emotional Core Online.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="mb-5"
        >
          <Button
            onClick={onInitialize}
            className="relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-wider transition-all duration-300"
          >
            <span className="relative z-10">Initialize Connection</span>
            <div className="absolute inset-0 h-full w-full transform -skew-x-12 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </Button>
        </motion.div>

        {/* Knowledge Base — compact, no-scroll */}
        <motion.div
          className="w-full"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.48 }}
        >
          <div className="flex items-center gap-3 mb-2.5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2">Knowledge Base</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {KNOWLEDGE_AREAS.map((area, i) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={area.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.52 + i * 0.04 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-300 hover:brightness-125 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] ${area.bg}`}
                >
                  <div className={`shrink-0 ${area.color}`}><Icon className="h-3.5 w-3.5" /></div>
                  <div>
                    <div className={`text-xs font-semibold leading-tight ${area.color}`}>{area.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">{area.description}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </motion.div>
  );
}
