import React, { useState } from 'react';
import { ChevronLeft, FileText, Download, Edit3, Award, Code, CheckCircle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const PortfolioBuilder = () => {
  const navigate = useNavigate();
  
  const [portfolio, setPortfolio] = useState({
    name: 'Mani Manjunath',
    role: 'Fullstack Developer',
    bio: 'A passionate developer building scalable apps with React and Node.js. Hackathon enthusiast.',
    education: 'B.Tech CSE - Veltech University (2026)',
    cgpa: '8.5',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    projects: [
      { title: 'University Super-App', desc: 'A comprehensive campus management system.' },
      { title: 'AI Portfolio Builder', desc: 'Auto-generates CVs from student data.' }
    ]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    setSuccess(false);
    
    setTimeout(() => {
      // Create a simple HTML document that acts as the CV
      const cvHtml = `
        <html>
          <head>
            <title>${portfolio.name} - CV</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #333; line-height: 1.6; }
              h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
              h2 { color: #2563eb; margin-top: 30px; }
              .header { text-align: center; margin-bottom: 40px; }
              .skills { display: flex; flex-wrap: wrap; gap: 10px; }
              .skill { background: #eff6ff; color: #1d4ed8; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px; }
              .project { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${portfolio.name}</h1>
              <p><strong>${portfolio.role}</strong></p>
              <p>${portfolio.bio}</p>
            </div>
            
            <h2>Education</h2>
            <p><strong>${portfolio.education}</strong> - CGPA: ${portfolio.cgpa}</p>
            
            <h2>Core Skills</h2>
            <div class="skills">
              ${portfolio.skills.map(s => `<span class="skill">${s}</span>`).join('')}
            </div>
            
            <h2>Top Projects</h2>
            ${portfolio.projects.map(p => `
              <div class="project">
                <h3>${p.title}</h3>
                <p>${p.desc}</p>
              </div>
            `).join('')}
          </body>
        </html>
      `;

      // Trigger actual download
      const blob = new Blob([cvHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${portfolio.name.replace(/\s+/g, '_')}_CV.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Real implementation would send to backend here
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in pb-10 relative">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4 relative z-20">
        <button onClick={() => navigate('/')} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center shadow-sm hover:bg-white transition-colors bg-slate-50">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Portfolio Builder</h1>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-sm hover:opacity-80 transition-colors ${isEditing ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-app-accent'}`}
        >
          {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
        </button>
      </div>

      <div className="px-6 flex-1 overflow-y-auto custom-scrollbar">
        
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-[24px] p-4 flex items-start gap-3 shadow-sm animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
               <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">CV Downloaded Successfully!</p>
              <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                Check your device's downloads folder.
              </p>
            </div>
          </div>
        )}

        {/* Live Preview CV Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100 mb-8 relative overflow-hidden transition-all duration-300">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-app-blue rounded-bl-[100px] opacity-50"></div>
          
          <div className="relative z-10">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[20px] bg-app-dark flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                   {portfolio.name.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                   {isEditing ? (
                     <>
                       <input value={portfolio.name} onChange={e => setPortfolio({...portfolio, name: e.target.value})} className="w-full text-xl font-bold text-slate-900 border-b border-slate-200 focus:border-app-accent outline-none mb-1 pb-1 bg-transparent" placeholder="Your Name" />
                       <input value={portfolio.role} onChange={e => setPortfolio({...portfolio, role: e.target.value})} className="w-full text-sm font-semibold text-app-accent border-b border-slate-200 focus:border-app-accent outline-none pb-1 bg-transparent" placeholder="Your Role" />
                     </>
                   ) : (
                     <>
                       <h2 className="text-xl font-bold text-slate-900 leading-tight">{portfolio.name}</h2>
                       <p className="text-sm font-semibold text-app-accent">{portfolio.role}</p>
                     </>
                   )}
                </div>
             </div>

             {isEditing ? (
               <textarea 
                 value={portfolio.bio} 
                 onChange={e => setPortfolio({...portfolio, bio: e.target.value})}
                 className="w-full text-sm text-slate-600 font-medium leading-relaxed mb-6 border border-slate-200 rounded-[12px] p-3 focus:border-app-accent outline-none resize-none h-24"
                 placeholder="Short bio about yourself..."
               />
             ) : (
               <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                 {portfolio.bio}
               </p>
             )}

             {/* Sections */}
             <div className="space-y-5">
               <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                   <Award className="w-3.5 h-3.5" /> Education
                 </h3>
                 {isEditing ? (
                   <div className="flex gap-2">
                     <input value={portfolio.education} onChange={e => setPortfolio({...portfolio, education: e.target.value})} className="flex-1 text-sm font-bold text-slate-800 border-b border-slate-200 focus:border-app-accent outline-none pb-1 bg-transparent" placeholder="University Details" />
                     <input value={portfolio.cgpa} onChange={e => setPortfolio({...portfolio, cgpa: e.target.value})} className="w-20 text-xs font-medium text-slate-500 border-b border-slate-200 focus:border-app-accent outline-none pb-1 bg-transparent" placeholder="CGPA" />
                   </div>
                 ) : (
                   <>
                     <p className="text-sm font-bold text-slate-800">{portfolio.education}</p>
                     <p className="text-xs font-medium text-slate-500 mt-0.5">CGPA: {portfolio.cgpa}</p>
                   </>
                 )}
               </div>

               <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                   <Code className="w-3.5 h-3.5" /> Core Skills
                 </h3>
                 {isEditing ? (
                   <input 
                     value={portfolio.skills.join(', ')} 
                     onChange={e => setPortfolio({...portfolio, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                     className="w-full text-xs font-medium text-slate-700 border border-slate-200 rounded-[12px] p-3 focus:border-app-accent outline-none bg-transparent" 
                     placeholder="Comma separated skills (e.g., React, Node.js)" 
                   />
                 ) : (
                   <div className="flex flex-wrap gap-1.5">
                     {portfolio.skills.map((s, i) => (
                       <span key={i} className="bg-app-blue/30 text-app-accent px-3 py-1 rounded-[10px] text-[10px] font-black tracking-wide">
                         {s}
                       </span>
                     ))}
                   </div>
                 )}
               </div>

               <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                   <FileText className="w-3.5 h-3.5" /> Top Projects
                 </h3>
                 <div className="space-y-3">
                   {portfolio.projects.map((p, idx) => (
                     <div key={idx} className={`border-l-2 ${isEditing ? 'border-slate-300' : 'border-app-accent'} pl-3 flex flex-col gap-1`}>
                       {isEditing ? (
                         <>
                           <input value={p.title} onChange={e => {
                             const newProjects = [...portfolio.projects];
                             newProjects[idx].title = e.target.value;
                             setPortfolio({...portfolio, projects: newProjects});
                           }} className="w-full text-sm font-bold text-slate-800 border-b border-slate-200 focus:border-app-accent outline-none bg-transparent" placeholder="Project Title" />
                           <input value={p.desc} onChange={e => {
                             const newProjects = [...portfolio.projects];
                             newProjects[idx].desc = e.target.value;
                             setPortfolio({...portfolio, projects: newProjects});
                           }} className="w-full text-xs text-slate-500 border-b border-slate-200 focus:border-app-accent outline-none bg-transparent" placeholder="Short description" />
                         </>
                       ) : (
                         <>
                           <p className="text-sm font-bold text-slate-800">{p.title}</p>
                           <p className="text-xs text-slate-500 mt-0.5 leading-tight">{p.desc}</p>
                         </>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Generate Button */}
        {!isEditing && (
          <button 
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full bg-app-dark text-white py-4 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100"
          >
            {isGenerating ? (
               <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Compiling File...</>
            ) : (
               <><Download className="w-5 h-5" /> Download ATS-Friendly CV</>
            )}
          </button>
        )}
      </div>

    </div>
  );
};

export default PortfolioBuilder;
