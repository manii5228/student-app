import React, { useState } from 'react';
import { ChevronLeft, CheckSquare, Square, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Unit { name:string; topics:{ name:string; done:boolean }[]; }
interface SubjectSyllabus { name:string; code:string; units:Unit[]; }

const FacultySyllabusTracker = () => {
  const nav = useNavigate();
  const [subjects, setSubjects] = useState<SubjectSyllabus[]>([
    { name:'Data Structures', code:'CS304', units:[
      { name:'Unit 1: Arrays & Linked Lists', topics:[{name:'Arrays',done:true},{name:'Singly Linked List',done:true},{name:'Doubly Linked List',done:true},{name:'Circular Linked List',done:false}] },
      { name:'Unit 2: Stacks & Queues', topics:[{name:'Stack ADT',done:true},{name:'Queue ADT',done:false},{name:'Circular Queue',done:false},{name:'Priority Queue',done:false}] },
      { name:'Unit 3: Trees', topics:[{name:'Binary Trees',done:false},{name:'BST',done:false},{name:'AVL Trees',done:false},{name:'B-Trees',done:false}] },
      { name:'Unit 4: Graphs', topics:[{name:'BFS/DFS',done:false},{name:'Shortest Path',done:false},{name:'MST',done:false}] },
      { name:'Unit 5: Sorting & Hashing', topics:[{name:'Quick Sort',done:false},{name:'Merge Sort',done:false},{name:'Hash Tables',done:false}] },
    ]},
    { name:'Database Systems', code:'CS306', units:[
      { name:'Unit 1: ER Model', topics:[{name:'ER Diagrams',done:true},{name:'Relational Model',done:true}] },
      { name:'Unit 2: SQL', topics:[{name:'DDL/DML',done:true},{name:'Joins',done:false},{name:'Subqueries',done:false}] },
      { name:'Unit 3: Normalization', topics:[{name:'1NF-3NF',done:false},{name:'BCNF',done:false}] },
      { name:'Unit 4: Transactions', topics:[{name:'ACID Properties',done:false},{name:'Concurrency',done:false}] },
    ]},
  ]);
  const [activeSubject, setActiveSubject] = useState(0);

  const toggleTopic = (unitIdx:number, topicIdx:number) => {
    setSubjects(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[activeSubject].units[unitIdx].topics[topicIdx].done = !copy[activeSubject].units[unitIdx].topics[topicIdx].done;
      return copy;
    });
  };

  const sub = subjects[activeSubject];
  const totalTopics = sub.units.reduce((s,u)=>s+u.topics.length,0);
  const doneTopics = sub.units.reduce((s,u)=>s+u.topics.filter(t=>t.done).length,0);
  const progress = totalTopics ? Math.round(doneTopics/totalTopics*100) : 0;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Syllabus Tracker</h1><p className="text-xs text-emerald-200">Mark curriculum progress</p></div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 relative z-10">
          <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-emerald-100">{sub.name}</span><span className="text-xs font-black text-white">{progress}%</span></div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{width:`${progress}%`}}></div></div>
          <p className="text-[10px] text-emerald-200 mt-1">{doneTopics}/{totalTopics} topics covered</p>
        </div>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto scrollbar-hide">
        {subjects.map((s,i)=><button key={i} onClick={()=>setActiveSubject(i)} className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${activeSubject===i?'bg-emerald-600 text-white':'bg-white text-slate-600 border border-slate-200'}`}>{s.code}</button>)}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3 animate-slide-up">
          {sub.units.map((unit,ui) => {
            const unitDone = unit.topics.filter(t=>t.done).length;
            const unitTotal = unit.topics.length;
            return (
              <div key={ui} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900">{unit.name}</h3>
                  <span className="text-[9px] font-bold text-slate-400">{unitDone}/{unitTotal}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {unit.topics.map((topic,ti)=>(
                    <button key={ti} onClick={()=>toggleTopic(ui,ti)} className="flex items-center gap-2 py-1.5 hover:bg-slate-50 rounded-lg px-1 transition-colors">
                      {topic.done ? <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0"/> : <Square className="w-4 h-4 text-slate-300 shrink-0"/>}
                      <span className={`text-sm ${topic.done?'text-slate-400 line-through':'text-slate-700'}`}>{topic.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav/>
    </div>
  );
};
export default FacultySyllabusTracker;
