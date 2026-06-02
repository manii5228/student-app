import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, GraduationCap, ArrowUpRight, Flame, Target, Lock, Unlock, CheckCircle2, AlertCircle, FileText, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import BottomNav from '../components/BottomNav';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface CreditBreakdown {
  student_id: string;
  total_required: number;
  total_earned: number;
  core_earned: number;
  elective_earned: number;
  lab_earned: number;
  percentage: number;
}

interface RoadmapNode {
  subject_code: string;
  subject_name: string;
  semester: number;
  credits: number;
  category: string;
  status: 'passed' | 'in_progress' | 'failed' | 'missing' | 'not_started';
  prerequisites: string[];
  prereq_satisfied: boolean;
  missing_prerequisites: string[];
}

const CreditDashboard = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [credits, setCredits] = useState<CreditBreakdown | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapNode[]>([]);
  const [currentSem, setCurrentSem] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);

  // Confetti engine variables
  const confettiParticles = useRef<any[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Play Level-Up Sound using Web Audio API
  const playLevelUpSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Synthesize a beautiful level-up sound (C Major Arpeggio)
      playNote(261.63, now, 0.12);      // C4
      playNote(329.63, now + 0.10, 0.12); // E4
      playNote(392.00, now + 0.20, 0.12); // G4
      playNote(523.25, now + 0.30, 0.35); // C5
    } catch (e) {
      console.warn("Web Audio failed to initialize: ", e);
    }
  };

  // Launch Canvas Confetti
  const triggerConfetti = () => {
    playLevelUpSound();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    const colors = ['#a91f23', '#22346c', '#0080c7', '#c9503d', '#27bcd1', '#10b981', '#f59e0b'];
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height - 20,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 15 - 10,
        radius: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }
    confettiParticles.current = particles;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      confettiParticles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.vx *= 0.98; // air resistance
        p.opacity -= 0.015;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
          ctx.restore();
          p.rotation += p.rotationSpeed;
        }
      });

      if (alive) {
        animationFrameId.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    render();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [creditsRes, roadmapRes] = await Promise.all([
          api.get('/academic/credits'),
          api.get('/academic/credits/roadmap')
        ]);
        setCredits(creditsRes.data.credits);
        setRoadmap(roadmapRes.data.roadmap);
        setCurrentSem(roadmapRes.data.current_semester);

        // Trigger milestone celebration if degree progress > 70% or core requirements met
        if (creditsRes.data.credits.percentage >= 70) {
          setTimeout(() => {
            triggerConfetti();
          }, 800);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch academic credit progress.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const downloadAuditPDF = async () => {
    try {
      setDownloading(true);
      const response = await api.get('/academic/credits/audit/pdf', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const fileName = `Degree_Audit_Student.pdf`;
            const fileResult = await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache
            });
            await Share.share({
              title: 'Degree Audit PDF',
              text: 'VelTech University Degree Audit Report',
              url: fileResult.uri,
              dialogTitle: 'Save or Share PDF'
            });
            triggerConfetti();
          } catch (err: any) {
            console.error('Filesystem/Share error:', err);
            alert("Failed to save or share PDF: " + err.message);
          }
        };
        reader.readAsDataURL(blob);
      } else {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Degree_Audit_Student.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerConfetti();
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to download PDF Transcript. Check if you have passed all courses required.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-slate-50 flex flex-col justify-center items-center font-sans pb-24">
        <Loader2 className="w-10 h-10 text-[#a91f23] animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Compiling credit records...</p>
      </div>
    );
  }

  if (error || !credits) {
    return (
      <div className="h-full bg-slate-50 flex flex-col justify-center items-center font-sans p-6 pb-24">
        <AlertCircle className="w-12 h-12 text-[#c9503d] mb-4" />
        <p className="text-base font-bold text-slate-800 text-center">{error || "Something went wrong"}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2.5 bg-[#22346c] text-white rounded-full font-bold shadow-md hover:bg-[#1a2854] transition-all">
          Retry Connection
        </button>
      </div>
    );
  }

  // Prerequisite Roadmap Node Coordinates for Tech Tree SVG
  // Map courses dynamically by categories and levels
  const nodeLayouts: Record<string, { x: number; y: number }> = {
    "CS101": { x: 80, y: 70 },
    "CS101L": { x: 260, y: 70 },
    "MA101": { x: 440, y: 70 },
    "PH101": { x: 620, y: 70 },
    "EN101": { x: 800, y: 70 },

    "CS202": { x: 80, y: 220 },
    "CS202L": { x: 260, y: 220 },
    "MA102": { x: 440, y: 220 },
    "CS201": { x: 620, y: 220 },
    "CS201L": { x: 800, y: 220 },

    "CS301": { x: 80, y: 370 },
    "CS302": { x: 260, y: 370 },
    "CS303": { x: 440, y: 370 },
    "CS303L": { x: 620, y: 370 },
    "MA201": { x: 800, y: 370 },
    "CS399": { x: 980, y: 370 },

    "CS305": { x: 800, y: 520 },
    "CS401": { x: 440, y: 520 },
    "CS499": { x: 980, y: 520 },
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in pb-24 relative overflow-hidden">
      
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4 relative z-20">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center shadow-sm hover:bg-white transition-colors bg-slate-50">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-[#a91f23]" /> Degree Progress
        </h1>
        <button 
          onClick={triggerConfetti}
          className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center shadow-sm bg-white text-amber-500 hover:text-amber-600 active:scale-95 transition-all">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </button>
      </div>

      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar relative z-10">
        
        {/* Main circular progress card */}
        <div className="bg-white rounded-[32px] p-6 shadow-md border border-slate-100 mb-6 flex flex-col items-center relative overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#a91f23]/5 rounded-bl-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#22346c]/5 rounded-tr-[80px]"></div>
          
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Total Credits Earned</h2>
          
          <div className="relative w-44 h-44 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="88" cy="88" r="74" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
              <circle cx="88" cy="88" r="74" stroke="url(#progressGrad)" strokeWidth="12" fill="transparent" 
                strokeDasharray={464.7} 
                strokeDashoffset={464.7 - (464.7 * credits.percentage) / 100} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out" 
              />
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a91f23" />
                  <stop offset="100%" stopColor="#22346c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900">{Math.round(credits.percentage)}<span className="text-xl text-slate-400 font-medium">%</span></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Completed</span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-2">
            <div className="text-center">
              <p className="text-2xl font-black text-[#a91f23]">{credits.total_earned}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Earned</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-700">{credits.total_required}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Required</p>
            </div>
          </div>

          {/* Download Official Audit button */}
          <button
            onClick={downloadAuditPDF}
            disabled={downloading}
            className="w-full mt-6 bg-[#22346c] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1a2854] active:scale-[0.98] transition-all shadow-md">
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Download Degree Audit PDF
          </button>
        </div>

        {/* Category breakdown (Glassmorphic) */}
        <div className="mb-6">
          <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Target className="w-4 h-4 text-[#a91f23]" /> Credits by Stream
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Core', earned: credits.core_earned, required: 90, color: 'bg-[#a91f23]' },
              { label: 'Elective', earned: credits.elective_earned, required: 40, color: 'bg-[#0080c7]' },
              { label: 'Lab/Project', earned: credits.lab_earned, required: 30, color: 'bg-[#27bcd1]' }
            ].map((stream) => (
              <div key={stream.label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">{stream.label}</p>
                  <p className="text-xl font-black text-slate-800 mt-1">
                    {stream.earned}
                    <span className="text-xs text-slate-400 font-medium">/{stream.required}</span>
                  </p>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full ${stream.color} rounded-full`} style={{ width: `${Math.min(100, (stream.earned / stream.required) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prerequisite Roadmap Tech Tree */}
        <div className="mb-6 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-orange-500" /> Prerequisite Path Map
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mb-4">Click subjects to audit course eligibility and prerequisites.</p>

          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="relative" style={{ width: '1100px', height: '600px' }}>
              
              {/* Connection Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                {/* Draw prerequisite lines */}
                {roadmap.map((node) => {
                  const to = nodeLayouts[node.subject_code];
                  if (!to) return null;

                  return node.prerequisites.map((prereqCode) => {
                    const from = nodeLayouts[prereqCode];
                    if (!from) return null;

                    // Draw nice bezier curves connecting nodes
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const path = `M ${from.x + 85} ${from.y + 20} C ${from.x + 85 + dx/2} ${from.y + 20}, ${to.x - dx/2} ${to.y + 20}, ${to.x} ${to.y + 20}`;
                    
                    const isPassed = roadmap.find(n => n.subject_code === prereqCode)?.status === 'passed';
                    
                    return (
                      <path
                        key={`${prereqCode}-${node.subject_code}`}
                        d={path}
                        fill="none"
                        stroke={isPassed ? '#10b981' : '#cbd5e1'}
                        strokeWidth={isPassed ? 2.5 : 1.5}
                        strokeDasharray={isPassed ? undefined : "4,4"}
                        className="transition-all duration-300"
                      />
                    );
                  });
                })}
              </svg>

              {/* Course Nodes */}
              {roadmap.map((node) => {
                const pos = nodeLayouts[node.subject_code];
                if (!pos) return null;

                const isSelected = selectedNode?.subject_code === node.subject_code;

                // Color themes depending on status
                let borderStyles = 'border-slate-200 bg-white text-slate-700';
                let tagColor = 'bg-slate-100 text-slate-600';
                let icon = <Unlock className="w-3.5 h-3.5 text-slate-400" />;

                if (node.status === 'passed') {
                  borderStyles = 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100';
                  tagColor = 'bg-emerald-100 text-emerald-800';
                  icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
                } else if (node.status === 'in_progress') {
                  borderStyles = 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm shadow-indigo-100';
                  tagColor = 'bg-indigo-100 text-indigo-800';
                  icon = <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />;
                } else if (!node.prereq_satisfied) {
                  borderStyles = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
                  tagColor = 'bg-slate-200 text-slate-500';
                  icon = <Lock className="w-3.5 h-3.5 text-slate-400" />;
                }

                return (
                  <button
                    key={node.subject_code}
                    onClick={() => setSelectedNode(node)}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: '160px' }}
                    className={`absolute z-10 p-3 rounded-2xl border text-left flex flex-col justify-between h-[80px] hover:scale-105 active:scale-95 transition-all ${borderStyles} ${
                      isSelected ? 'ring-2 ring-[#a91f23] ring-offset-2' : ''
                    }`}>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold tracking-wider">{node.subject_code}</span>
                      {icon}
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-2 truncate-ellipsis">{node.subject_name}</span>
                    <div className="flex items-center justify-between mt-1 text-[9px] font-bold uppercase">
                      <span className={`${tagColor} px-1.5 py-0.5 rounded`}>{node.category}</span>
                      <span className="text-slate-400">{node.credits} Credits</span>
                    </div>
                  </button>
                );
              })}

            </div>
          </div>
        </div>

        {/* Selected Course Node Details Sheet */}
        {selectedNode && (
          <div className="bg-[#22346c] text-white rounded-3xl p-5 mb-6 shadow-lg animate-slide-up relative">
            <button 
              onClick={() => setSelectedNode(null)} 
              className="absolute top-4 right-4 text-white/60 hover:text-white font-bold text-sm bg-white/10 px-2.5 py-1 rounded-full">
              Close
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-[#a91f23] text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">
                {selectedNode.subject_code}
              </span>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded font-bold capitalize">
                {selectedNode.category}
              </span>
            </div>
            <h4 className="text-base font-black mb-1">{selectedNode.subject_name}</h4>
            <p className="text-xs text-white/80 font-semibold mb-4">Worth {selectedNode.credits} graduation credits.</p>
            
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Current Status:</span>
                <span className={`font-bold capitalize ${
                  selectedNode.status === 'passed' ? 'text-emerald-400' :
                  selectedNode.status === 'in_progress' ? 'text-blue-300' : 'text-amber-400'
                }`}>{selectedNode.status.replace('_', ' ')}</span>
              </div>

              <div className="flex justify-between items-start text-xs gap-4">
                <span className="text-white/60 flex-shrink-0">Prerequisites:</span>
                <span className="font-bold text-right">
                  {selectedNode.prerequisites.length > 0 
                    ? selectedNode.prerequisites.join(' & ') 
                    : 'None (Direct Entry)'}
                </span>
              </div>

              {!selectedNode.prereq_satisfied && (
                <div className="mt-3 flex items-start gap-2 bg-red-500/20 border border-red-500/30 p-3 rounded-xl">
                  <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-red-200">
                    <p className="font-bold">Subject Pathway Locked</p>
                    <p className="mt-0.5">You must first clear: {selectedNode.missing_prerequisites.join(', ')}</p>
                  </div>
                </div>
              )}

              {selectedNode.prereq_satisfied && selectedNode.status !== 'passed' && (
                <div className="mt-3 flex items-start gap-2 bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-emerald-200">
                    <p className="font-bold">Subject Pathway Cleared</p>
                    <p className="mt-0.5">Prerequisites are satisfied. You are eligible to register or attend this course.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
};

export default CreditDashboard;
