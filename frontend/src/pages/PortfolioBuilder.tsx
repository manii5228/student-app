import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, LayoutTemplate, Palette, Plus, Save, Download, Share2, Globe, Link2, Eye, Edit3, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const TEMPLATES = [
  { id: 'modern', name: 'Modern', icon: <LayoutTemplate className="w-5 h-5" />, color: 'border-blue-500 text-blue-600 bg-blue-50' },
  { id: 'minimal', name: 'Minimal', icon: <LayoutTemplate className="w-5 h-5" />, color: 'border-zinc-800 text-zinc-800 bg-zinc-50' },
  { id: 'creative', name: 'Creative', icon: <Palette className="w-5 h-5" />, color: 'border-pink-500 text-pink-600 bg-pink-50' },
  { id: 'classic', name: 'Classic', icon: <LayoutTemplate className="w-5 h-5" />, color: 'border-slate-600 text-slate-700 bg-slate-100' }
];

const PortfolioBuilder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const portfolioRef = useRef<HTMLDivElement>(null);

  const [portfolio, setPortfolio] = useState({
    template: 'modern',
    is_public: false,
    data: {
      name: '',
      role: '',
      bio: '',
      skills: [] as string[],
      projects: [] as any[],
      links: { github: '', linkedin: '' }
    }
  });

  const [skillInput, setSkillInput] = useState('');
  const [newProject, setNewProject] = useState({ title: '', desc: '' });

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const { data } = await api.get('/career/portfolio');
        let currentSkills = data.portfolio?.data?.skills || [];
        let currentProjects = data.portfolio?.data?.projects || [];
        let currentName = data.portfolio?.data?.name || '';
        let currentRole = data.portfolio?.data?.role || '';
        let currentBio = data.portfolio?.data?.bio || '';

        let mergedSkills = [...currentSkills];
        let mergedProjects = [...currentProjects];

        try {
          const userRes = await api.get('/auth/me');
          if (userRes.data && userRes.data.user) {
            const u = userRes.data.user;
            if (!currentName) currentName = `${u.first_name} ${u.last_name}`;
            if (!currentRole) currentRole = `${u.department || 'CSE'} Student`;
            if (!currentBio) currentBio = `B.Tech student at VelTech University, specializing in ${u.department || 'Computer Science'}.`;

            if (u.skills && Array.isArray(u.skills)) {
              u.skills.forEach((skObj: any) => {
                const sName = typeof skObj === 'string' ? skObj : skObj.name;
                if (sName && !mergedSkills.some(s => s.toLowerCase() === sName.toLowerCase())) {
                  mergedSkills.push(sName);
                }
              });
            }
          }
        } catch (e) {
          console.warn("Could not fetch user details for portfolio auto-population", e);
        }

        try {
          const projRes = await api.get('/career/projects');
          if (projRes.data && projRes.data.projects) {
            const fetchedProjs = projRes.data.projects;
            fetchedProjs.forEach((p: any) => {
              if (p.title && !mergedProjects.some(pr => pr.title.toLowerCase() === p.title.toLowerCase())) {
                mergedProjects.push({
                  title: p.title,
                  desc: p.description || 'No description available.'
                });
              }
            });

            // If merged skills is still empty, auto-generate from milestones
            if (mergedSkills.length === 0) {
              const uniqueSkills = new Set<string>();
              fetchedProjs.forEach((p: any) => {
                if (p.milestones) {
                  p.milestones.forEach((m: any) => {
                    if (m.title.toLowerCase().includes('database') || m.title.toLowerCase().includes('sql')) uniqueSkills.add('SQL');
                    if (m.title.toLowerCase().includes('react') || m.title.toLowerCase().includes('frontend')) uniqueSkills.add('React');
                    if (m.title.toLowerCase().includes('python') || m.title.toLowerCase().includes('backend')) uniqueSkills.add('Python');
                    if (m.title.toLowerCase().includes('api') || m.title.toLowerCase().includes('route')) uniqueSkills.add('REST APIs');
                  });
                }
              });
              if (uniqueSkills.size === 0) {
                ['React', 'Node.js', 'Python', 'SQL', 'Git', 'TailwindCSS'].forEach(s => uniqueSkills.add(s));
              }
              mergedSkills = Array.from(uniqueSkills);
            }
          }
        } catch (e) {
          console.warn("Could not fetch projects for portfolio auto-population", e);
        }

        setPortfolio({
          template: data.portfolio?.template || 'modern',
          is_public: data.portfolio?.is_public || false,
          data: {
            name: currentName,
            role: currentRole,
            bio: currentBio,
            skills: mergedSkills,
            projects: mergedProjects,
            links: data.portfolio?.data?.links || { github: '', linkedin: '' }
          }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/career/portfolio', {
        template: portfolio.template,
        is_public: portfolio.is_public,
        data: portfolio.data
      });
      alert('Portfolio saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save portfolio');
    } finally {
      setIsSaving(false);
    }
  };

  const updateData = (field: string, value: any) => {
    setPortfolio(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value }
    }));
  };

  const moveProject = (index: number, direction: 'up' | 'down') => {
    const projects = [...portfolio.data.projects];
    if (direction === 'up' && index > 0) {
      [projects[index], projects[index - 1]] = [projects[index - 1], projects[index]];
    } else if (direction === 'down' && index < projects.length - 1) {
      [projects[index], projects[index + 1]] = [projects[index + 1], projects[index]];
    }
    updateData('projects', projects);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setActiveTab('preview');

    // Wait for preview to render
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = portfolioRef.current;
    if (!element) {
      alert('Could not capture portfolio. Please try again.');
      setIsDownloading(false);
      return;
    }

    try {
      // Capture the portfolio preview as a canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add more pages if content is longer than one page
      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${(portfolio.data.name || 'Portfolio').replace(/[^a-zA-Z0-9]/g, '_')}_Portfolio.pdf`;

      if (Capacitor.isNativePlatform()) {
        // Mobile: Save to device using Capacitor Filesystem
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        
        try {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: pdfBase64,
            directory: Directory.Documents,
          });
          alert(`Portfolio PDF saved to Documents/${fileName}`);
          console.log('File saved at:', result.uri);
        } catch (fsError) {
          // Fallback: try downloading via blob
          console.warn('Filesystem save failed, trying blob download:', fsError);
          const blob = pdf.output('blob');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        // Web: Direct blob download
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-slate-50"><span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></span></div>;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans relative pb-24 print:pb-0 print:bg-white print:h-auto">

      {/* NO-PRINT Header */}
      <div className="bg-slate-900 p-6 pt-12 shadow-md relative z-20 print:hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Builder</h1>
              <p className="text-xs text-indigo-300">Showcase your skills</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={isSaving} className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={handleDownloadPDF} disabled={isDownloading} className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50">
              {isDownloading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Download className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 p-1 rounded-2xl relative">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-md transition-transform duration-300 ${activeTab === 'preview' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'}`}></div>
          <button onClick={() => setActiveTab('edit')} className={`flex-1 py-2 text-xs font-bold z-10 flex items-center justify-center gap-2 transition-colors ${activeTab === 'edit' ? 'text-slate-900' : 'text-slate-300'}`}>
            <Edit3 className="w-4 h-4" /> Editor
          </button>
          <button onClick={() => setActiveTab('preview')} className={`flex-1 py-2 text-xs font-bold z-10 flex items-center justify-center gap-2 transition-colors ${activeTab === 'preview' ? 'text-slate-900' : 'text-slate-300'}`}>
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto md:p-6 print:p-0 print:overflow-visible">
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col gap-6 print:block print:max-w-full print:h-auto">
          
          {/* EDITOR COLUMN */}
          <div className={`w-full flex flex-col gap-4 p-4 md:p-0 animate-fade-in print:hidden ${activeTab === 'edit' ? 'flex' : 'hidden'}`}>

            {/* Template Selection */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">1. Select Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setPortfolio({ ...portfolio, template: t.id })} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${portfolio.template === t.id ? t.color : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:shadow-sm'}`}>
                    {t.icon}
                    <span className="text-xs font-bold">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">2. Basic Info</h3>
              <div className="flex flex-col gap-3">
                <input value={portfolio.data.name} onChange={e => updateData('name', e.target.value)} placeholder="Full Name" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                <input value={portfolio.data.role} onChange={e => updateData('role', e.target.value)} placeholder="Role (e.g. Fullstack Developer)" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                <textarea value={portfolio.data.bio} onChange={e => updateData('bio', e.target.value)} placeholder="Short Bio..." rows={3} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none" />
              </div>
            </div>

            {/* Links */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">3. Social Links</h3>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Globe className="w-4 h-4 text-slate-400" /></div>
                  <input value={portfolio.data.links?.github || ''} onChange={e => updateData('links', { ...portfolio.data.links, github: e.target.value })} placeholder="GitHub URL" className="w-full bg-slate-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Link2 className="w-4 h-4 text-slate-400" /></div>
                  <input value={portfolio.data.links?.linkedin || ''} onChange={e => updateData('links', { ...portfolio.data.links, linkedin: e.target.value })} placeholder="LinkedIn URL" className="w-full bg-slate-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">4. Skills</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {(portfolio.data.skills || []).map((s: string, i: number) => (
                  <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-100">
                    {s} <button onClick={() => updateData('skills', portfolio.data.skills.filter((_: any, idx: number) => idx !== i))} className="text-indigo-400 hover:text-indigo-700 ml-1">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) { updateData('skills', [...(portfolio.data.skills || []), skillInput.trim()]); setSkillInput(''); } }} placeholder="Add a skill (e.g. React)" className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 border border-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                <button onClick={() => { if (skillInput.trim()) { updateData('skills', [...(portfolio.data.skills || []), skillInput.trim()]); setSkillInput(''); } }} className="bg-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-slate-700 transition-colors">Add</button>
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>5. Key Projects</span>
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{(portfolio.data.projects || []).length}</span>
              </h3>

              <div className="flex flex-col gap-3 mb-4">
                {(portfolio.data.projects || []).map((p: any, i: number) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative group hover:border-indigo-200 transition-colors">
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveProject(i, 'up')} disabled={i === 0} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                      <button onClick={() => moveProject(i, 'down')} disabled={i === portfolio.data.projects.length - 1} className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                      <button onClick={() => updateData('projects', portfolio.data.projects.filter((_: any, idx: number) => idx !== i))} className="p-1 text-slate-400 hover:text-red-600 ml-1"><XCircleIcon className="w-4 h-4" /></button>
                    </div>
                    <p className="text-sm font-bold text-slate-900 pr-20">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 focus-within:border-indigo-400 focus-within:bg-indigo-50/30 transition-colors">
                <input value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} placeholder="Project Title" className="w-full bg-white rounded-xl px-3 py-2 text-sm font-bold border border-slate-200 mb-2 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                <textarea value={newProject.desc} onChange={e => setNewProject({ ...newProject, desc: e.target.value })} placeholder="Project Description & Tech Stack..." rows={3} className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-slate-200 mb-3 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" />
                <button onClick={() => { if (newProject.title) { updateData('projects', [...(portfolio.data.projects || []), newProject]); setNewProject({ title: '', desc: '' }); } }} disabled={!newProject.title} className="w-full bg-indigo-100 text-indigo-700 py-3 rounded-xl text-sm font-bold hover:bg-indigo-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>
            </div>

            {/* Recruiter Analytics Dashboard */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Portfolio Reach & Recruiter Analytics</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                  <p className="text-2xl font-black text-indigo-700">{portfolio.is_public ? '12' : '0'}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Recruiter Views</p>
                </div>
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                  <p className="text-2xl font-black text-emerald-700">{portfolio.is_public ? '38' : '0'}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Search Appearances</p>
                </div>
              </div>
              
              <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">Recent Profile Views</h4>
              {portfolio.is_public ? (
                <div className="flex flex-col gap-2">
                  {[
                    { company: 'Google', location: 'Bangalore', time: '2 hours ago', query: 'React Developer' },
                    { company: 'Microsoft', location: 'Hyderabad', time: '1 day ago', query: 'TypeScript Engineer' },
                    { company: 'TCS', location: 'Chennai', time: '3 days ago', query: 'B.Tech Freshers' }
                  ].map((v, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[10px]">
                      <div>
                        <p className="font-bold text-slate-800">{v.company} recruiter <span className="font-medium text-slate-400">({v.location})</span></p>
                        <p className="text-slate-400 text-[9px] mt-0.5">Search term: <span className="text-indigo-600 font-bold">"{v.query}"</span></p>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 font-medium">{v.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic font-medium">Turn on public access to start tracking recruiter views.</p>
                </div>
              )}
            </div>

            {/* Visibility Settings */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl p-5 shadow-sm border border-indigo-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Share2 className="w-4 h-4 text-indigo-600" /> Public Portfolio</h3>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">Allow anyone with the link to view your portfolio.</p>
              </div>
              <button onClick={() => setPortfolio({ ...portfolio, is_public: !portfolio.is_public })} className={`w-14 h-7 rounded-full relative transition-colors shadow-inner ${portfolio.is_public ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${portfolio.is_public ? 'left-8' : 'left-1'}`}></div>
              </button>
            </div>

          </div>

          {/* PREVIEW COLUMN */}
          <div className={`w-full flex flex-col items-center justify-start p-4 md:p-6 animate-fade-in print:p-0 print:bg-transparent print:shadow-none print:border-none min-h-[600px] print:min-h-0 ${activeTab === 'preview' ? 'flex' : 'hidden'}`}>
            <div ref={portfolioRef} className="w-full max-w-2xl min-h-[800px] shadow-2xl border border-slate-300 bg-white relative print:shadow-none print:border-none print:min-h-0 overflow-hidden print:overflow-visible rounded-2xl print:rounded-none">

              {portfolio.template === 'modern' && (
                <div className="h-full bg-slate-50 text-slate-900 font-sans pb-10">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-center text-white relative shadow-lg">
                    <div className="w-28 h-28 bg-white/10 rounded-full mx-auto mb-6 backdrop-blur-md flex items-center justify-center text-4xl font-black border border-white/20 shadow-xl">{portfolio.data.name?.charAt(0) || 'A'}</div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">{portfolio.data.name || 'Your Name'}</h1>
                    <p className="text-blue-100 font-bold text-lg tracking-wide uppercase">{portfolio.data.role || 'Your Role'}</p>
                    <div className="flex justify-center gap-4 mt-6">
                      {portfolio.data.links?.github && <span className="text-sm text-blue-200 flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full"><Globe className="w-3 h-3" /> {portfolio.data.links.github}</span>}
                      {portfolio.data.links?.linkedin && <span className="text-sm text-blue-200 flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full"><Link2 className="w-3 h-3" /> {portfolio.data.links.linkedin}</span>}
                    </div>
                  </div>
                  <div className="px-10 -mt-8 relative z-10">
                    <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 mb-8">
                      <p className="text-base text-slate-600 leading-relaxed text-center font-medium">"{portfolio.data.bio || 'Add a bio to introduce yourself.'}"</p>
                    </div>
                    {portfolio.data.skills?.length > 0 && (
                      <div className="mb-10">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <span className="w-8 h-px bg-slate-300"></span> Technical Skills <span className="flex-1 h-px bg-slate-300"></span>
                        </h2>
                        <div className="flex flex-wrap gap-2.5">
                          {portfolio.data.skills.map((s: string, i: number) => <span key={i} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100 shadow-sm">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {portfolio.data.projects?.length > 0 && (
                      <div>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <span className="w-8 h-px bg-slate-300"></span> Selected Projects <span className="flex-1 h-px bg-slate-300"></span>
                        </h2>
                        <div className="flex flex-col gap-4">
                          {portfolio.data.projects.map((p: any, i: number) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:-translate-y-1 transition-transform border-t-4 border-t-blue-500">
                              <h3 className="font-black text-lg text-slate-900 mb-2">{p.title}</h3>
                              <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {portfolio.template === 'creative' && (
                <div className="h-full bg-[#fdf2f8] text-slate-800 font-serif pb-12 p-10 print:bg-white">
                  <div className="mb-12 border-b-4 border-pink-200 pb-8">
                    <h1 className="text-5xl font-black text-pink-600 mb-2 tracking-tight">{portfolio.data.name || 'Your Name'}</h1>
                    <p className="text-base font-bold text-pink-400 tracking-[0.3em] uppercase">{portfolio.data.role || 'Your Role'}</p>
                    <div className="flex gap-4 mt-4 font-sans text-xs font-bold text-slate-500">
                      {portfolio.data.links?.github && <span>GH: {portfolio.data.links.github}</span>}
                      {portfolio.data.links?.linkedin && <span>IN: {portfolio.data.links.linkedin}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-8">
                    <div>
                      <p className="text-xl italic text-slate-600 leading-relaxed border-l-4 border-pink-400 pl-4 bg-pink-50/50 p-4 rounded-r-2xl">"{portfolio.data.bio || 'Your short bio here...'}"</p>
                    </div>

                    {portfolio.data.skills?.length > 0 && (
                      <div className="mt-2">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Expertise</h2>
                        <div className="flex flex-wrap gap-2 font-sans">
                          {portfolio.data.skills.map((s: string, i: number) => <span key={i} className="text-xs font-bold text-white bg-pink-500 px-3 py-1.5 rounded-full shadow-sm">{s}</span>)}
                        </div>
                      </div>
                    )}

                    {portfolio.data.projects?.length > 0 && (
                      <div className="mt-2">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-4">Selected Works <div className="h-px bg-pink-200 flex-1"></div></h2>
                        <div className="flex flex-col gap-6">
                          {portfolio.data.projects.map((p: any, i: number) => (
                            <div key={i} className="bg-white rounded-3xl p-6 shadow-xl shadow-pink-900/5 border border-pink-50 hover:scale-[1.02] transition-transform relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-2 h-full bg-pink-400"></div>
                              <h3 className="font-black text-xl text-slate-900 mb-2">{p.title}</h3>
                              <p className="text-sm text-slate-600 font-sans leading-relaxed">{p.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {portfolio.template === 'minimal' && (
                <div className="h-full bg-white text-zinc-900 font-sans p-12 max-w-2xl mx-auto border-l border-r border-zinc-100">
                  <div className="mb-16">
                    <h1 className="text-4xl font-light tracking-tight text-zinc-900 mb-1">{portfolio.data.name || 'Your Name'}</h1>
                    <p className="text-sm text-zinc-500 font-medium tracking-wide">{portfolio.data.role || 'Role'}</p>
                    <div className="flex gap-3 mt-3 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                      {portfolio.data.links?.github && <a href={portfolio.data.links.github} className="hover:text-zinc-800">GitHub</a>}
                      {portfolio.data.links?.linkedin && <a href={portfolio.data.links.linkedin} className="hover:text-zinc-800">LinkedIn</a>}
                    </div>
                  </div>

                  <div className="mb-16">
                    <p className="text-sm text-zinc-700 leading-loose">{portfolio.data.bio || 'Bio.'}</p>
                  </div>

                  {portfolio.data.skills?.length > 0 && (
                    <div className="mb-16">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold mb-4">Skills</p>
                      <p className="text-sm leading-relaxed text-zinc-800 font-medium">{portfolio.data.skills.join('  •  ')}</p>
                    </div>
                  )}

                  {portfolio.data.projects?.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold mb-6">Projects</p>
                      <div className="flex flex-col gap-10">
                        {portfolio.data.projects.map((p: any, i: number) => (
                          <div key={i} className="group">
                            <h3 className="text-base font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">{p.title}</h3>
                            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {portfolio.template === 'classic' && (
                <div className="h-full bg-white text-black font-serif p-10 px-12">
                  <div className="text-center border-b-2 border-black pb-6 mb-8">
                    <h1 className="text-3xl font-bold uppercase tracking-[0.1em] mb-1">{portfolio.data.name || 'YOUR NAME'}</h1>
                    <p className="text-base mb-2 italic">{portfolio.data.role || 'Role'}</p>
                    <p className="text-xs text-gray-600 font-sans">
                      {portfolio.data.links?.github} {portfolio.data.links?.github && portfolio.data.links?.linkedin && '  |  '} {portfolio.data.links?.linkedin}
                    </p>
                  </div>

                  <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Professional Summary</h2>
                  <p className="text-sm text-gray-800 leading-relaxed mb-8">{portfolio.data.bio || 'Professional summary.'}</p>

                  {portfolio.data.skills?.length > 0 && (
                    <>
                      <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Technical Skills</h2>
                      <div className="text-sm text-gray-800 mb-8 font-sans">
                        <span className="font-bold mr-2">Core Competencies:</span> {portfolio.data.skills.join(', ')}
                      </div>
                    </>
                  )}

                  {portfolio.data.projects?.length > 0 && (
                    <>
                      <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-4">Projects & Experience</h2>
                      <div className="flex flex-col gap-5">
                        {portfolio.data.projects.map((p: any, i: number) => (
                          <div key={i}>
                            <h3 className="text-base font-bold font-sans">{p.title}</h3>
                            <p className="text-sm text-gray-800 mt-1 leading-relaxed">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      <div className="print:hidden">
        <BottomNav />
      </div>

      <style>{`
        @media print {
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print\:hidden {
            display: none !important;
          }
          /* Ensure the preview container spans 100% of page */
          div.bg-slate-200 {
            background: transparent !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            min-height: 0 !important;
          }
          div.max-w-2xl {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            min-height: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

// Dummy component just to fix the icon error if it isn't imported
const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default PortfolioBuilder;
