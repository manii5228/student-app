import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Bot, User, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

interface Message { role:'user'|'assistant'; content:string; timestamp:Date; }

const AIStudyAssistant = () => {
  const nav = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role:'assistant', content:'Hi! I\'m your AI Study Assistant 🎓\n\nI can help you with:\n• Syllabus explanations\n• Concept breakdowns\n• Exam prep tips\n• Formula references\n\nWhat topic would you like to study?', timestamp:new Date() }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatRef.current?.scrollTo({top:chatRef.current.scrollHeight, behavior:'smooth'}); }, [messages, thinking]);

  const suggestedTopics = ['Data Structures', 'OS Scheduling', 'DBMS Normalization', 'Network Protocols'];

  // Simulated AI response engine with knowledge base
  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('data structure')) return '📊 **Data Structures Overview**\n\nData structures organize and store data efficiently. Key types:\n\n**Linear:** Arrays, Linked Lists, Stacks, Queues\n**Non-Linear:** Trees, Graphs, Heaps\n**Hash-Based:** Hash Tables, Hash Maps\n\n**Time Complexity Cheat Sheet:**\n• Array access: O(1)\n• Linked list search: O(n)\n• Binary search: O(log n)\n• Hash table lookup: O(1) avg\n\nWould you like me to explain any specific data structure in detail?';
    if (q.includes('normalization') || q.includes('dbms')) return '🗃️ **Database Normalization**\n\nNormalization eliminates redundancy and ensures data integrity.\n\n**1NF:** Atomic values, no repeating groups\n**2NF:** 1NF + no partial dependencies\n**3NF:** 2NF + no transitive dependencies\n**BCNF:** Every determinant is a candidate key\n\n**Example:** A table with (StudentID, Name, CourseID, CourseName) violates 2NF because CourseName depends only on CourseID, not the full key.\n\nShall I walk through a specific normalization example?';
    if (q.includes('os') || q.includes('scheduling')) return '⚙️ **OS CPU Scheduling Algorithms**\n\n**Non-Preemptive:**\n• FCFS — First Come First Served (simple, convoy effect)\n• SJF — Shortest Job First (optimal avg wait time)\n\n**Preemptive:**\n• SRTF — Shortest Remaining Time First\n• Round Robin — Time quantum based (fairness)\n• Priority — Based on priority values\n\n**Key Metrics:** Turnaround Time, Waiting Time, Response Time\n\n**Gantt Chart tip:** Always draw the timeline for scheduling problems!';
    if (q.includes('network') || q.includes('protocol') || q.includes('osi')) return '🌐 **Network Protocols & OSI Model**\n\n**7 Layers (top-down):**\n7. Application (HTTP, FTP, DNS)\n6. Presentation (SSL, encryption)\n5. Session (session management)\n4. Transport (TCP, UDP)\n3. Network (IP, ICMP, routing)\n2. Data Link (MAC, switching)\n1. Physical (cables, signals)\n\n**TCP vs UDP:**\n• TCP: Reliable, ordered, connection-oriented\n• UDP: Fast, connectionless, no guarantee\n\nRemember: "**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing"';
    if (q.includes('sort') || q.includes('algorithm')) return '🔄 **Sorting Algorithms Comparison**\n\n| Algorithm | Best | Average | Worst | Space |\n|-----------|------|---------|-------|-------|\n| Bubble | O(n) | O(n²) | O(n²) | O(1) |\n| Selection | O(n²) | O(n²) | O(n²) | O(1) |\n| Insertion | O(n) | O(n²) | O(n²) | O(1) |\n| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) |\n| Quick | O(n log n) | O(n log n) | O(n²) | O(log n) |\n| Heap | O(n log n) | O(n log n) | O(n log n) | O(1) |\n\n**Quick Sort** is preferred in practice due to cache efficiency!';
    if (q.includes('exam') || q.includes('tips') || q.includes('prepare')) return '📝 **Exam Preparation Tips**\n\n1. **Active Recall:** Test yourself instead of re-reading\n2. **Spaced Repetition:** Review at increasing intervals\n3. **Pomodoro Technique:** 25 min study + 5 min break\n4. **Past Papers:** Solve at least 5 years of previous papers\n5. **Teach Back:** Explain concepts to a friend\n6. **Mind Maps:** Visualize connections between topics\n7. **Sleep Well:** 7-8 hours before exam day!\n\n**80/20 Rule:** Focus on the 20% of topics that cover 80% of marks.';
    if (q.includes('tree') || q.includes('bst') || q.includes('binary')) return '🌳 **Binary Trees & BST**\n\n**Binary Tree:** Each node has at most 2 children\n**BST Property:** Left < Root < Right\n\n**Traversals:**\n• Inorder (L-Root-R): Sorted order for BST\n• Preorder (Root-L-R): Copy/serialize tree\n• Postorder (L-R-Root): Delete tree\n• Level order: BFS using queue\n\n**Operations on BST:**\n• Search: O(log n) avg, O(n) worst\n• Insert: O(log n) avg\n• Delete: 3 cases (leaf, 1 child, 2 children)\n\n**AVL Trees** maintain balance with rotations (LL, RR, LR, RL).';
    return `🤔 Great question about "${query}"!\n\nHere's what I can tell you:\n\n1. **Key Concepts:** This is an important topic in your curriculum. Focus on understanding the fundamentals first.\n\n2. **Study Strategy:** Break it down into smaller sub-topics and tackle them one by one.\n\n3. **Practice:** Try solving related problems from your textbook or previous year papers.\n\n4. **Resources:** Check your syllabus viewer for the detailed curriculum breakdown.\n\nWould you like me to explain a specific aspect of this topic in more detail?`;
  };

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', content:msg, timestamp:new Date() }]);
    setThinking(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const response = generateResponse(msg);
    setMessages(prev => [...prev, { role:'assistant', content:response, timestamp:new Date() }]);
    setThinking(false);
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-4 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white"/></div>
            <div><h1 className="text-base font-bold text-white">AI Study Assistant</h1><p className="text-[10px] text-violet-200">Powered by knowledge base</p></div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 pb-32">
        {/* Suggested topics */}
        {messages.length <= 1 && <div className="mb-4"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Quick Topics</p><div className="flex flex-wrap gap-2">{suggestedTopics.map(t=><button key={t} onClick={()=>send(t)} className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-xl text-[11px] font-bold hover:bg-violet-200 transition-all active:scale-95">{t}</button>)}</div></div>}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 mb-4 ${msg.role==='user'?'justify-end':''}`}>
            {msg.role==='assistant' && <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-1"><Bot className="w-3.5 h-3.5 text-violet-600"/></div>}
            <div className={`max-w-[80%] rounded-[20px] px-4 py-3 ${msg.role==='user'?'bg-violet-600 text-white':'bg-white shadow-sm border border-slate-100 text-slate-800'}`}>
              <div className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</div>
              <p className={`text-[9px] mt-1 ${msg.role==='user'?'text-violet-200':'text-slate-400'}`}>{msg.timestamp.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
            </div>
            {msg.role==='user' && <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1"><User className="w-3.5 h-3.5 text-slate-600"/></div>}
          </div>
        ))}

        {thinking && <div className="flex gap-2 mb-4"><div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-violet-600"/></div><div className="bg-white shadow-sm border border-slate-100 rounded-[20px] px-4 py-3"><div className="flex gap-1"><span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span><span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span><span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span></div></div></div>}
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 pb-4">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask me anything..." className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-violet-400"/>
          <button onClick={()=>send()} disabled={!input.trim()||thinking} className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 disabled:opacity-30 active:scale-95 transition-all shrink-0"><Send className="w-4 h-4"/></button>
        </div>
      </div>
    </div>
  );
};
export default AIStudyAssistant;
