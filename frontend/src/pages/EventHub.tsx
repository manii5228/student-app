import { useEffect, useMemo, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import {
  ChevronLeft,
  Clock,
  MapPin,
  Ticket,
  Users,
  Code2,
  Cpu,
  Palette,
  Radio,
  Search,
  ShieldCheck,
  ClipboardCheck,
  Headphones,
  Megaphone,
  BadgeCheck,
  Image as ImageIcon,
  Play,
  QrCode,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  ChevronRight,
  X,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';
import UpsellModal from '../components/UpsellModal';

interface Badge { 
  id: string; 
  name: string; 
  description: string | null; 
  category: string; 
  icon: string; 
  color: string; 
  criteria: string | null; 
  points: number; 
}

interface CampusEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  venue: string;
  start_date: string;
  end_date?: string | null;
  max_participants?: number | null;
  registration_count: number;
  organizer_id?: string | null;
  badge_id?: string | null;
}

const FALLBACK_EVENTS: CampusEvent[] = [
  {
    id: 'lavaza-26',
    title: "LAVAZA '26",
    description: 'Flagship cultural fest with music, dance, tech showcases, food lanes, and inter-college finals.',
    event_type: 'fest',
    venue: 'Main Auditorium',
    start_date: '2026-05-18T09:30:00+05:30',
    end_date: '2026-05-18T21:30:00+05:30',
    max_participants: 1200,
    registration_count: 846,
  },
  {
    id: 'hackgrid',
    title: 'HackGrid 36h',
    description: 'Build real campus utilities with mentors from alumni teams and industry judges.',
    event_type: 'technical',
    venue: 'CSE Block Lab 4',
    start_date: '2026-05-21T08:00:00+05:30',
    end_date: '2026-05-22T20:00:00+05:30',
    max_participants: 180,
    registration_count: 129,
  },
];

interface Club {
  id: string;
  name: string;
  description: string;
  club_type: string;
  member_count: number;
  whatsapp_link?: string;
  instagram_link?: string;
  website_url?: string;
  instagram_url?: string;
}

const FALLBACK_CLUBS: Club[] = [
  {
    id: 'lavaza',
    name: 'Lavaza Cultural Club',
    description: 'The flagship cultural club organizing LAVAZA fest, cultural nights, dance-offs, and inter-college competitions.',
    club_type: 'cultural',
    member_count: 520,
    whatsapp_link: 'https://chat.whatsapp.com/mock-lavaza',
    instagram_link: 'https://instagram.com/veltech_lavaza'
  },
  { 
    id: 'codechef', 
    name: 'CodeChef Chapter', 
    description: 'Weekly CP ladders, contest discussions, and ICPC prep.', 
    club_type: 'technical', 
    member_count: 248,
    whatsapp_link: 'https://chat.whatsapp.com/mock-codechef',
    instagram_link: 'https://instagram.com/veltech_codechef'
  },
  { 
    id: 'robotics', 
    name: 'Robotics Society', 
    description: 'Autonomous bots, drone builds, and embedded systems labs.', 
    club_type: 'technical', 
    member_count: 142,
    whatsapp_link: 'https://chat.whatsapp.com/mock-robotics',
    instagram_link: 'https://instagram.com/veltech_robotics'
  },
  { 
    id: 'finearts', 
    name: 'Fine Arts Forum', 
    description: 'Poster design, stage props, murals, and event branding.', 
    club_type: 'cultural', 
    member_count: 96,
    whatsapp_link: 'https://chat.whatsapp.com/mock-finearts',
    instagram_link: 'https://instagram.com/veltech_finearts'
  },
];

const LAVAZA_CLUB_ID = 'lavaza';
const isLavazaClub = (clubId: string) => clubId.toLowerCase().includes('lavaza');

const iconForClub = (type: string) => {
  if (type === 'cultural') return Palette;
  if (type === 'media') return Radio;
  if (type === 'technical') return Cpu;
  return Code2;
};

const COMMITTEES = [
  { id: 'stage', name: 'Stage Crew & AV Desk', icon: Headphones, slots: 12, color: 'bg-[#0080c7]/10 text-[#0080c7]' },
  { id: 'media', name: 'Media Desk & Live', icon: Megaphone, slots: 8, color: 'bg-[#c9503d]/10 text-[#c9503d]' },
  { id: 'hospitality', name: 'VIP Hospitality', icon: Users, slots: 15, color: 'bg-[#27bcd1]/15 text-[#0080c7]' },
  { id: 'security', name: 'Crowd Assist', icon: ShieldCheck, slots: 18, color: 'bg-emerald-100 text-emerald-700' },
];

const HIGHLIGHTS = [
  { id: 1, type: 'video', url: 'https://images.unsplash.com/photo-1540039155732-6761b54cb6b5?w=800&q=80', title: 'Dance Crew Finale - LAVAZA 26' },
  { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', title: 'Live Concert Stage Setup' },
  { id: 3, type: 'image', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', title: 'DJ Night Crowds' },
  { id: 4, type: 'image', url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80', title: 'Tech Expo & Drone Arena' }
];

const STORY_REELS = [
  { id: 'sr1', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80', title: 'DJ Night Live', description: 'DJ playing the hits to a packed crowd!' },
  { id: 'sr2', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80', title: 'Rock Band Jam', description: 'VelTech Rock Band wins first place in inter-college finals.' },
  { id: 'sr3', url: 'https://images.unsplash.com/photo-1481162854517-d9e353af153d?w=800&q=80', title: 'Tech Showcase', description: 'Students presenting autonomous underwater vehicle prototypes.' },
  { id: 'sr4', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', title: 'Acoustic Solo', description: 'Melodious fusion performance in the amphitheater.' }
];

interface DiscussionPost {
  id: string;
  clubId: string;
  authorName: string;
  title: string;
  content: string;
  upvotes: number;
  comments: { author: string; text: string; date: string }[];
  created_at: string;
}

const EventHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as any) || 'events';

  const [activeView, setActiveView] = useState<'events' | 'clubs' | 'volunteer' | 'highlights'>(initialTab);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Events State
  const [events, setEvents] = useState<CampusEvent[]>(FALLBACK_EVENTS);
  const [activeType, setActiveType] = useState('all');
  const [registered, setRegistered] = useState<string[]>([]);
  
  // Faculty/Admin Event CRUD States
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CampusEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'fest',
    venue: '',
    start_date: '',
    end_date: '',
    max_participants: '',
    badge_id: ''
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [savingEvent, setSavingEvent] = useState(false);
  
  // Event Registrations State
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<CampusEvent | null>(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Clubs State
  const [clubs, setClubs] = useState<Club[]>(FALLBACK_CLUBS);
  const [clubQuery, setClubQuery] = useState('');
  const [activeClubType, setActiveClubType] = useState('all');
  const [joinedClubs, setJoinedClubs] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('joined_clubs') || '[]');
  });
  const [requestedClubs, setRequestedClubs] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('requested_clubs') || '[]');
  });
  const [clubFeeds, setClubFeeds] = useState<Record<string, any[]>>({});
  const [activeClubFeed, setActiveClubFeed] = useState<string | null>(null);

  // Discussion Forums State (Club Reddit)
  const [discussions, setDiscussions] = useState<DiscussionPost[]>(() => {
    const saved = localStorage.getItem('club_discussions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'disc_1',
        clubId: 'codechef',
        authorName: 'Rohan Sharma (Sec-A)',
        title: 'Best resources to learn Segment Trees?',
        content: 'I am preparing for the upcoming codechef long challenge. Can anyone suggest clean blogs or videos on Segment Tree implementations?',
        upvotes: 18,
        comments: [
          { author: 'Aditya Raj', text: 'Check out CP-Algorithms website. They have code snippets too.', date: '2026-05-27' },
          { author: 'Meera K', text: 'Strivers playlist is awesome for visual explanation!', date: '2026-05-28' }
        ],
        created_at: '2026-05-26T14:30:00Z'
      },
      {
        id: 'disc_2',
        clubId: 'robotics',
        authorName: 'Vikram Singh (Mech)',
        title: 'Chassis material choice for Drone Arena',
        content: 'Is carbon fiber really worth the cost compared to 3D printed PLA? We want to minimize weight for the hover test.',
        upvotes: 12,
        comments: [
          { author: 'Professor K. Ram', text: 'Carbon fiber gives much higher impact absorption. Highly recommended for arena collisions.', date: '2026-05-28' }
        ],
        created_at: '2026-05-27T09:15:00Z'
      }
    ];
  });

  const [clubSubTab, setClubSubTab] = useState<'feed' | 'discussions'>('feed');
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscContent, setNewDiscContent] = useState('');
  const [activeCommentText, setActiveCommentText] = useState<Record<string, string>>({});

  // Volunteer State
  const [committee, setCommittee] = useState(COMMITTEES[0].id);
  const [shift, setShift] = useState('morning');
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(() => localStorage.getItem('volunteer_submitted') === 'true');
  const [volunteerHours, setVolunteerHours] = useState(() => Number(localStorage.getItem('volunteer_hours') || '12'));
  const [claimedDuties, setClaimedDuties] = useState<string[]>(() => JSON.parse(localStorage.getItem('claimed_duties') || '[]'));
  
  // Volunteer log records
  const [volunteerLogs, setVolunteerLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('volunteer_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'log_1', date: '2026-05-18', activity: 'LAVAZA Stage Prep', hours: 6, status: 'approved' },
      { id: 'log_2', date: '2026-05-19', activity: 'Registration Desk Duties', hours: 4, status: 'approved' },
      { id: 'log_3', date: '2026-05-20', activity: 'VIP Lounge Assistance', hours: 2, status: 'approved' }
    ];
  });

  // Shifts available for claiming
  const AVAILABLE_SHIFTS = [
    { id: 'shift_backstage', name: 'Backstage Setup & Cord management', hours: 4, venue: 'Main Auditorium', slots: 2, time: '10:00 AM - 02:00 PM' },
    { id: 'shift_decor', name: 'Stage Decor & Mural painting', hours: 5, venue: 'Open Amphitheater', slots: 4, time: '01:00 PM - 06:00 PM' },
    { id: 'shift_hospitality', name: 'VIP Hospitality & Guest escorting', hours: 6, venue: 'VelTech Guest House', slots: 1, time: '09:00 AM - 03:00 PM' },
    { id: 'shift_console', name: 'Technical Console & Audio Check', hours: 3, venue: 'Seminar Hall 2', slots: 3, time: '02:00 PM - 05:00 PM' },
  ];

  // Highlights slider state
  const [currentHighlightIdx, setCurrentHighlightIdx] = useState(0);
  const [hasClaimedVolunteerBadge, setHasClaimedVolunteerBadge] = useState(false);
  const [claimingBadge, setClaimingBadge] = useState(false);
  const [showStoryPlayer, setShowStoryPlayer] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [editingClubSocialsId, setEditingClubSocialsId] = useState<string | null>(null);
  const [socialForm, setSocialForm] = useState({ whatsapp: '', instagram: '' });


  // Scanner modal state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'volunteer' | 'club'>('volunteer');
  const [scannerTargetId, setScannerTargetId] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isGuest = user?.is_guest || user?.role === 'guest';

  useEffect(() => {
    localStorage.setItem('club_discussions', JSON.stringify(discussions));
  }, [discussions]);

  useEffect(() => {
    localStorage.setItem('volunteer_hours', String(volunteerHours));
  }, [volunteerHours]);

  useEffect(() => {
    localStorage.setItem('volunteer_logs', JSON.stringify(volunteerLogs));
  }, [volunteerLogs]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/campus/events');
        if (Array.isArray(data.events) && data.events.length > 0) setEvents(data.events);
      } catch (error) { console.warn('Offline events:', error); }
    };
    const fetchMyRegistrations = async () => {
      try {
        const { data } = await api.get('/campus/events/my-registrations');
        if (Array.isArray(data.event_ids)) setRegistered(data.event_ids);
      } catch (error) {
        const cached = localStorage.getItem('registered_events');
        if (cached) setRegistered(JSON.parse(cached));
      }
    };
    const fetchClubs = async () => {
      try {
        const { data } = await api.get('/campus/clubs');
        if (Array.isArray(data.clubs) && data.clubs.length > 0) setClubs(data.clubs);
      } catch (error) { console.warn('Offline clubs:', error); }
    };
    const fetchBadges = async () => {
      try {
        const { data } = await api.get('/career/badges');
        if (Array.isArray(data.badges)) setBadges(data.badges);
      } catch (error) { console.warn('Offline badges:', error); }
    };
    const fetchMyBadges = async () => {
      try {
        const { data } = await api.get('/career/badges/my-badges');
        if (Array.isArray(data.earned_badges)) {
          const hasVol = data.earned_badges.some((eb: any) => eb.badge?.name === "Volunteer Excellence");
          setHasClaimedVolunteerBadge(hasVol);
        }
      } catch (error) { console.warn('Offline my-badges:', error); }
    };

    fetchEvents();
    if (!isGuest) {
      fetchMyRegistrations();
      fetchClubs();
      fetchBadges();
      fetchMyBadges();
    }
  }, [isGuest]);

  // View open club feed
  useEffect(() => {
    if (activeClubFeed && !clubFeeds[activeClubFeed]) {
      api.get(`/campus/clubs/${activeClubFeed}/posts`)
        .then(res => {
          setClubFeeds(prev => ({ ...prev, [activeClubFeed]: res.data.posts }));
        })
        .catch(err => {
          console.log("Failed to fetch club feed, using mock posts", err);
          // Seed mock president posts
          setClubFeeds(prev => ({
            ...prev,
            [activeClubFeed]: [
              { id: 'p_1', content: 'URGENT: Meeting today at CSE Block seminar room. Attendance will be taken.', created_at: new Date().toISOString() },
              { id: 'p_2', content: 'Welcome to the club feed! Glad to have all coordinators aboard.', created_at: new Date(Date.now() - 86400000).toISOString() }
            ]
          }));
        });
    }
  }, [activeClubFeed, clubFeeds]);

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.start_date) return;
    setSavingEvent(true);
    try {
      const payload = {
        ...eventForm,
        max_participants: eventForm.max_participants ? parseInt(eventForm.max_participants) : null,
        badge_id: eventForm.badge_id || null
      };
      await api.post('/campus/events', payload);
      setShowCreateEvent(false);
      setEventForm({ title: '', description: '', event_type: 'fest', venue: '', start_date: '', end_date: '', max_participants: '', badge_id: '' });
      const { data } = await api.get('/campus/events');
      if (Array.isArray(data.events)) setEvents(data.events);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create event');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleEditEvent = (event: CampusEvent) => {
    setSelectedEventForEdit(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      venue: event.venue || '',
      start_date: event.start_date ? event.start_date.substring(0, 16) : '',
      end_date: event.end_date ? event.end_date.substring(0, 16) : '',
      max_participants: event.max_participants ? String(event.max_participants) : '',
      badge_id: (event as any).badge_id || ''
    });
    setShowEditEvent(true);
  };

  const handleUpdateEvent = async () => {
    if (!selectedEventForEdit || !eventForm.title.trim()) return;
    setSavingEvent(true);
    try {
      const payload = {
        ...eventForm,
        max_participants: eventForm.max_participants ? parseInt(eventForm.max_participants) : null,
        badge_id: eventForm.badge_id || null
      };
      await api.put(`/campus/events/${selectedEventForEdit.id}`, payload);
      setShowEditEvent(false);
      setSelectedEventForEdit(null);
      const { data } = await api.get('/campus/events');
      if (Array.isArray(data.events)) setEvents(data.events);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update event');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/campus/events/${eventId}`);
      const { data } = await api.get('/campus/events');
      if (Array.isArray(data.events)) setEvents(data.events);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleManageRegistrations = async (event: CampusEvent) => {
    setSelectedEventForRegistrations(event);
    setShowRegistrations(true);
    setLoadingRegistrations(true);
    try {
      const { data } = await api.get(`/campus/events/${event.id}/registrations`);
      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error("Failed to load registrations", err);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleUpdateRegistrationStatus = async (regId: string, status: string) => {
    if (!selectedEventForRegistrations) return;
    try {
      await api.put(`/campus/events/${selectedEventForRegistrations.id}/registrations/${regId}`, { status });
      // Reload registrations
      const { data } = await api.get(`/campus/events/${selectedEventForRegistrations.id}/registrations`);
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleClaimVolunteerBadge = async () => {
    alert("Claiming volunteer badge is currently disabled.");
    return;
  };

  const handleRegisterEvent = async (eventId: string) => {
    alert("Registration is currently disabled.");
    return;
  };

  // Club Direct Join Flow
  const handleRequestClubJoin = async (clubId: string) => {
    alert("Club joining is currently disabled.");
    return;
  };

  const handleJoinClub = (clubId: string) => {
    setActiveClubFeed(activeClubFeed === clubId ? null : clubId);
  };

  const handleCreatePresPost = async (clubId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await api.post(`/campus/clubs/${clubId}/posts`, { content });
      setClubFeeds(prev => ({
        ...prev,
        [clubId]: [res.data.post, ...(prev[clubId] || [])]
      }));
    } catch (err) {
      // Mock update
      const newPost = {
        id: 'p_' + Date.now(),
        content,
        created_at: new Date().toISOString()
      };
      setClubFeeds(prev => ({
        ...prev,
        [clubId]: [newPost, ...(prev[clubId] || [])]
      }));
    }
  };

  // Reddit Discussions Submit
  const handleAddDiscussion = (clubId: string) => {
    if (!newDiscTitle.trim() || !newDiscContent.trim()) return;
    const post: DiscussionPost = {
      id: 'disc_' + Date.now(),
      clubId,
      authorName: user?.full_name || 'Anonymous Student',
      title: newDiscTitle,
      content: newDiscContent,
      upvotes: 1,
      comments: [],
      created_at: new Date().toISOString()
    };
    setDiscussions([post, ...discussions]);
    setNewDiscTitle('');
    setNewDiscContent('');
  };

  const handleUpvoteDiscussion = (discId: string) => {
    setDiscussions(prev => prev.map(d => d.id === discId ? { ...d, upvotes: d.upvotes + 1 } : d));
  };

  const handleAddComment = (discId: string) => {
    const text = activeCommentText[discId];
    if (!text || !text.trim()) return;
    setDiscussions(prev => prev.map(d => {
      if (d.id === discId) {
        return {
          ...d,
          comments: [...d.comments, { author: user?.full_name || 'Student', text, date: new Date().toISOString().split('T')[0] }]
        };
      }
      return d;
    }));
    setActiveCommentText(prev => ({ ...prev, [discId]: '' }));
  };

  // Volunteer Actions
  const handleVolunteerSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGuest) { setUpsellOpen(true); return; }
    setVolunteerSubmitted(true);
    localStorage.setItem('volunteer_submitted', 'true');
    localStorage.setItem('volunteer_committee', committee);
  };

  const handleClaimDuty = (shiftId: string, shiftName: string, hours: number) => {
    if (isGuest) { setUpsellOpen(true); return; }
    if (claimedDuties.includes(shiftId)) return;

    const updatedClaimed = [...claimedDuties, shiftId];
    setClaimedDuties(updatedClaimed);
    localStorage.setItem('claimed_duties', JSON.stringify(updatedClaimed));

    const newLog = {
      id: 'log_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      activity: shiftName,
      hours: hours,
      status: 'pending',
      shiftId: shiftId
    };
    setVolunteerLogs([newLog, ...volunteerLogs]);
  };

  // QR Check-in Attendance Scan trigger
  const handleScanCheckIn = (type: 'volunteer' | 'club', targetId: string) => {
    setScannerType(type);
    setScannerTargetId(targetId);
    setShowScanner(true);
    setScanSuccessMessage(null);
  };

  // Mock Success of QR scan
  const handleMockScanSuccess = async () => {
    if (scannerType === 'volunteer') {
      // Approve the log
      setVolunteerLogs(prev => prev.map(l => {
        if (l.shiftId === scannerTargetId && l.status === 'pending') {
          // Add hours to total
          setVolunteerHours(h => h + l.hours);
          return { ...l, status: 'approved' };
        }
        return l;
      }));
      setScanSuccessMessage("Check-in successful! Hours added to your tracker.");
    } else {
      // Club Attendance
      try {
        await api.post(`/campus/clubs/${scannerTargetId}/attendance`, { event_title: "General Club Meeting", hours: 2.0 });
      } catch (e) {}

      // Add 2.0 volunteer hours for club attendance
      setVolunteerHours(h => h + 2.0);
      const newClubLog = {
        id: 'log_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        activity: `Club Meeting Attendance: ${clubs.find(c => c.id === scannerTargetId)?.name || 'Club'}`,
        hours: 2,
        status: 'approved'
      };
      setVolunteerLogs(prev => [newClubLog, ...prev]);
      setScanSuccessMessage("Attendance recorded! +2 volunteering hours added.");
    }

    setTimeout(() => {
      setShowScanner(false);
      setScanSuccessMessage(null);
    }, 1500);
  };

  // Export volunteer log as CSV
  const handleExportCSV = () => {
    if (volunteerLogs.length === 0) return;
    let csvContent = "Date,Activity/Duty,Hours,Status\n";
    volunteerLogs.forEach(l => {
      csvContent += `"${l.date}","${l.activity.replace(/"/g, '""')}",${l.hours},"${l.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "VelTech_Volunteering_Record_Log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Certificate function removed — students earn the Volunteer Excellence Skill Badge instead.

  const renderTabs = () => (
    <div className="px-5 pt-5 pb-2">
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 overflow-x-auto hide-scrollbar">
        {['events', 'clubs', 'volunteer', 'highlights'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveView(tab as any); setActiveClubFeed(null); }}
            className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
              activeView === tab ? 'bg-[#0080c7] text-white shadow-md' : 'text-slate-500'
            }`}
          >
            {tab === 'volunteer' ? 'Volunteers' : tab === 'highlights' ? 'Lavaza' : tab.replace('-', ' ')}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-[#0080c7] p-6 pt-12 rounded-b-[36px] shadow-md text-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => {
                const role = JSON.parse(localStorage.getItem('user') || '{}').role;
                if (role === 'faculty') navigate('/faculty');
                else if (role === 'admin') navigate('/admin');
                else if (window.history.length > 2) { navigate(-1); }
                else { navigate('/campus'); }
              }} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Event & Comm Hub</h1>
              <p className="text-xs text-white/75">Fests, clubs, volunteer, and highlights</p>
            </div>
          </div>
          {user && (user.role === 'faculty' || user.role === 'admin') && activeView === 'events' && (
            <button onClick={() => {
              setEventForm({ title: '', description: '', event_type: 'fest', venue: '', start_date: '', end_date: '', max_participants: '', badge_id: '' });
              setShowCreateEvent(true);
            }} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all text-white">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {renderTabs()}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5">
        {/* Events Tab */}
        {activeView === 'events' && (
          <div className="flex flex-col gap-4 pb-6 pt-4">
            {/* Event type filter pills */}
            <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
              {['all', ...Array.from(new Set(events.map(e => e.event_type)))].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold capitalize ${
                    activeType === type ? 'bg-[#0080c7] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {events.filter(e => activeType === 'all' || e.event_type === activeType).map((event) => {
              const isRegistered = registered.includes(event.id);
              const isFull = event.max_participants ? event.registration_count >= event.max_participants : false;
              const startDate = new Date(event.start_date);
              const isPast = startDate < new Date();
              const isFacOrAdmin = user && (user.role === 'faculty' || user.role === 'admin');

              return (
                <div key={event.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0080c7]/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-[#0080c7]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-black text-slate-900 leading-tight">{event.title}</h3>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-[#0080c7]/10 text-[#0080c7] shrink-0">{event.event_type}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.registration_count}{event.max_participants ? `/${event.max_participants}` : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleRegisterEvent(event.id)}
                      disabled={true}
                      className="flex-1 py-3 rounded-2xl text-xs font-black transition-all bg-slate-105 text-slate-400 cursor-not-allowed shadow-none"
                    >
                      Registration Disabled
                    </button>
                    {isFacOrAdmin && (
                      <>
                        <button onClick={() => handleEditEvent(event)} className="px-4 py-3 rounded-2xl text-xs font-black bg-slate-100 text-slate-700 transition-all active:scale-95">Edit</button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="px-4 py-3 rounded-2xl text-xs font-black bg-red-50 text-red-600 transition-all active:scale-95">Delete</button>
                      </>
                    )}
                  </div>
                  {isFacOrAdmin && (
                    <button
                      onClick={() => handleManageRegistrations(event)}
                      className="mt-2 w-full py-2.5 rounded-2xl text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-all"
                    >
                      Manage Registrations ({event.registration_count})
                    </button>
                  )}
                </div>
              );
            })}

            {events.filter(e => activeType === 'all' || e.event_type === activeType).length === 0 && (
              <div className="text-center py-16 bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h2 className="text-sm font-bold text-slate-800">No Events Found</h2>
                <p className="text-xs text-slate-400 mt-1">Try a different filter or check back later</p>
              </div>
            )}
          </div>
        )}

        {/* Clubs Tab */}
        {activeView === 'clubs' && (
          <div className="flex flex-col gap-4 pb-6">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 mt-2">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                value={clubQuery}
                onChange={(e) => setClubQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
                placeholder="Search clubs"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar">
              {['all', ...Array.from(new Set(clubs.map(c => c.club_type)))].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveClubType(type)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold capitalize ${
                    activeClubType === type ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {clubs.filter(c => 
                (activeClubType === 'all' || c.club_type === activeClubType) && 
                c.name.toLowerCase().includes(clubQuery.toLowerCase())
            ).map((club) => {
              const Icon = iconForClub(club.club_type);
              const isJoined = joinedClubs.includes(club.id);
              const isRequested = requestedClubs.includes(club.id);
              const isActiveFeed = activeClubFeed === club.id;
              const clubIsLavaza = isLavazaClub(club.id) || club.name.toLowerCase().includes('lavaza');

              return (
                <div key={club.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[#0080c7]/10 text-[#0080c7]">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-black leading-tight text-slate-900">{club.name}</h3>
                        {isJoined && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500">{club.description}</p>
                      
                      <div className="flex items-center gap-3 mt-3 text-[11px] font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {club.member_count} members</span>
                      </div>
                    </div>
                  </div>

                  {!isJoined && (
                    <button
                      onClick={() => handleRequestClubJoin(club.id)}
                      disabled={true}
                      className="mt-4 w-full py-3 rounded-2xl text-xs font-black bg-slate-100 text-slate-400 cursor-not-allowed shadow-none flex items-center justify-center gap-1.5"
                    >
                      Join Club (Disabled)
                    </button>
                  )}

                  {isJoined && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinClub(club.id)}
                          disabled={true}
                          className="flex-1 py-3 rounded-2xl text-xs font-black bg-slate-100 text-slate-400 cursor-not-allowed"
                        >
                          Club Space Disabled
                        </button>
                      </div>

                      {/* Social WhatsApp & Instagram Links Description / Editor */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
                        <div className="flex justify-between items-center mb-2.5">
                          <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Official Channels</p>
                          {user && (user.role === 'faculty' || user.role === 'admin' || user.role === 'coordinator' || user.role === 'president') && (
                            <button
                              onClick={() => {
                                setEditingClubSocialsId(editingClubSocialsId === club.id ? null : club.id);
                                setSocialForm({
                                  whatsapp: club.website_url || club.whatsapp_link || '',
                                  instagram: club.instagram_url || club.instagram_link || ''
                                });
                              }}
                              className="text-[10px] text-[#0080c7] font-black hover:underline"
                            >
                              {editingClubSocialsId === club.id ? 'Cancel' : 'Edit Channels'}
                            </button>
                          )}
                        </div>

                        {editingClubSocialsId === club.id ? (
                          <div className="flex flex-col gap-2.5 animate-fade-in pt-1">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">WhatsApp Invite URL</label>
                              <input
                                type="text"
                                value={socialForm.whatsapp}
                                onChange={(e) => setSocialForm({ ...socialForm, whatsapp: e.target.value })}
                                placeholder="https://chat.whatsapp.com/..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none text-slate-800 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Instagram Profile URL</label>
                              <input
                                type="text"
                                value={socialForm.instagram}
                                onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
                                placeholder="https://instagram.com/..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none text-slate-800 font-bold"
                              />
                            </div>
                            <div className="flex gap-2 justify-end mt-1.5">
                              <button
                                onClick={() => setEditingClubSocialsId(null)}
                                className="bg-slate-200 text-slate-700 text-[10px] font-black px-3.5 py-2 rounded-xl transition-all active:scale-95"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/campus/clubs/${club.id}`, {
                                      website_url: socialForm.whatsapp,
                                      instagram_url: socialForm.instagram
                                    });
                                    setClubs(prev => prev.map(c => c.id === club.id ? {
                                      ...c,
                                      website_url: socialForm.whatsapp,
                                      instagram_url: socialForm.instagram
                                    } : c));
                                    setEditingClubSocialsId(null);
                                    alert("🎉 Club social channels updated successfully!");
                                  } catch (e) {
                                    alert("Failed to update club social channels.");
                                  }
                                }}
                                className="bg-[#0080c7] hover:bg-[#006ca8] text-white text-[10px] font-black px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <button
                                disabled={true}
                                className="flex-1 bg-slate-100 text-slate-400 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Group (Disabled)
                              </button>
                              <button
                                disabled={true}
                                className="flex-1 bg-slate-100 text-slate-400 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <ImageIcon className="w-3.5 h-3.5" /> Instagram Page (Disabled)
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                              Join the WhatsApp group for sync and updates, and follow the Instagram channel to view active photo galleries.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {isJoined && isActiveFeed && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                       <div className="flex justify-between items-center mb-3">
                           <div className="flex bg-slate-100 rounded-lg p-0.5">
                             <button
                               onClick={() => setClubSubTab('feed')}
                               className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                 clubSubTab === 'feed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                               }`}
                             >
                               Official Feed
                             </button>
                             <button
                               onClick={() => setClubSubTab('discussions')}
                               className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                 clubSubTab === 'discussions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                               }`}
                             >
                               Discussion Forum
                             </button>
                           </div>
                           <button 
                              disabled={true}
                              className="text-[10px] bg-slate-100 text-slate-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-not-allowed"
                            >
                              <QrCode className="w-3 h-3" /> Attendance Disabled
                            </button>
                       </div>

                       {clubSubTab === 'feed' ? (
                         <div>
                           {user && (user.role === 'faculty' || user.role === 'admin' || user.role === 'coordinator' || user.role === 'president') && (
                             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 animate-fade-in">
                               <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Broadcast Club Update</p>
                               <div className="flex gap-2">
                                 <input
                                   id={`pres_post_input_${club.id}`}
                                   placeholder="Type official update to members..."
                                   disabled={true}
                                   className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none text-slate-800 font-bold cursor-not-allowed"
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter') {
                                       handleCreatePresPost(club.id, (e.target as HTMLInputElement).value);
                                       (e.target as HTMLInputElement).value = '';
                                     }
                                   }}
                                 />
                                 <button
                                   onClick={() => {
                                     const input = document.getElementById(`pres_post_input_${club.id}`) as HTMLInputElement;
                                     if (input && input.value.trim()) {
                                       handleCreatePresPost(club.id, input.value);
                                       input.value = '';
                                     }
                                   }}
                                   disabled={true}
                                   className="bg-slate-100 text-slate-400 text-[10px] font-bold px-4 py-2 rounded-lg cursor-not-allowed"
                                 >
                                   Post
                                 </button>
                               </div>
                             </div>
                           )}

                           {clubFeeds[club.id]?.length ? (
                               <div className="flex flex-col gap-3">
                                   {clubFeeds[club.id].map(post => (
                                       <div key={post.id} className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-100">
                                           <div className="flex justify-between items-center mb-1">
                                             <span className="font-black text-slate-900">Official Update</span>
                                             <span className="text-[9px] text-slate-400 font-bold">{new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                           </div>
                                           {post.content}
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <p className="text-xs text-slate-400 italic text-center py-2">No updates yet.</p>
                           )}
                         </div>
                       ) : (
                         // Reddit Discussions Forum UI
                         <div className="flex flex-col gap-3">
                           {/* Add New Discussion Form */}
                           <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                             <h5 className="text-xs font-bold text-slate-700 mb-2">Start a Thread</h5>
                             <input
                               type="text"
                               placeholder="Thread Title"
                               value={newDiscTitle}
                               onChange={(e) => setNewDiscTitle(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs mb-2 outline-none font-bold"
                             />
                             <textarea
                               placeholder="What is on your mind?"
                               value={newDiscContent}
                               onChange={(e) => setNewDiscContent(e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs h-16 resize-none mb-2 outline-none"
                             />
                             <button
                                disabled={true}
                                className="bg-slate-100 text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-lg w-full cursor-not-allowed"
                              >
                                Post Thread (Disabled)
                              </button>
                           </div>

                           {/* Threads List */}
                           {discussions.filter(d => d.clubId === club.id).map(d => (
                             <div key={d.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                               <div className="flex justify-between items-start gap-2">
                                 <div>
                                   <p className="text-[10px] text-slate-400 font-bold">Posted by {d.authorName}</p>
                                   <h6 className="text-xs font-black text-slate-950 mt-0.5">{d.title}</h6>
                                 </div>
                                 <button
                                    disabled={true}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex items-center gap-1 shrink-0 cursor-not-allowed"
                                  >
                                    <ThumbsUp className="w-3 h-3 text-slate-350" />
                                    <span className="text-[10px] font-bold text-slate-400">{d.upvotes}</span>
                                  </button>
                               </div>
                               <p className="text-[11px] text-slate-600 mt-2 leading-normal">{d.content}</p>

                               {/* Comments Section */}
                               <div className="mt-3 pt-3 border-t border-slate-200/50">
                                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">Comments ({d.comments.length})</p>
                                 <div className="flex flex-col gap-2 mb-2">
                                   {d.comments.map((c, i) => (
                                     <div key={i} className="bg-white rounded-lg p-2 border border-slate-100 text-[10px]">
                                       <span className="font-bold text-slate-800">{c.author}:</span> <span className="text-slate-600">{c.text}</span>
                                     </div>
                                   ))}
                                 </div>
                                 <div className="flex gap-2">
                                   <input
                                     type="text"
                                     placeholder="Add a comment..."
                                     disabled={true}
                                     value={activeCommentText[d.id] || ''}
                                     onChange={(e) => setActiveCommentText({ ...activeCommentText, [d.id]: e.target.value })}
                                     className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] outline-none cursor-not-allowed"
                                   />
                                   <button
                                     onClick={() => handleAddComment(d.id)}
                                     disabled={true}
                                     className="bg-slate-100 text-slate-400 text-[10px] px-3 py-1 rounded-lg cursor-not-allowed"
                                   >
                                     Comment
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Volunteer Tab */}
        {activeView === 'volunteer' && (
          <div className="flex flex-col gap-5 pb-6 pt-2 animate-fade-in">
            {volunteerSubmitted ? (
              <div className="flex flex-col gap-5">
                {/* Volunteer Status & Hours Tracker Card */}
                <div className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                    {/* SVG Circular Progress Ring */}
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          className="text-slate-100"
                          strokeWidth="6"
                          stroke="currentColor"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          className="text-[#0080c7] transition-all duration-500 ease-out"
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 34}
                          strokeDashoffset={(2 * Math.PI * 34) - (Math.min(volunteerHours, 30) / 30) * (2 * Math.PI * 34)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-slate-800">{volunteerHours}</span>
                        <span className="text-[8px] text-slate-400 font-bold">/30 hrs</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        Active Volunteer
                        {volunteerHours >= 30 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </h3>
                      <p className="text-xs text-slate-500 leading-normal mt-0.5">
                        {volunteerHours >= 30 ? 'Target achieved! Volunteer Excellence Skill Badge unlocked.' : `${30 - volunteerHours} hours remaining to unlock Skill Badge.`}
                      </p>
                      
                      {/* Excel & Record Exports */}
                      <button
                        disabled={true}
                        className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-slate-400 cursor-not-allowed"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-350" /> Export Disabled
                      </button>
                    </div>
                  </div>

                  {/* Premium Gold-Glowing Volunteer Excellence Badge Card */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className={`rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 ${
                      hasClaimedVolunteerBadge
                        ? 'bg-gradient-to-br from-amber-900/40 via-amber-950/40 to-slate-900/60 border-amber-500/30 shadow-[0_0_25px_rgba(217,119,6,0.2)] backdrop-blur-sm'
                        : volunteerHours >= 30
                          ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-amber-500/40 shadow-[0_0_20px_rgba(217,119,6,0.15)] animate-pulse'
                          : 'bg-slate-50 border-slate-100'
                    }`}>
                      {/* Decorative Gold Circles */}
                      {(hasClaimedVolunteerBadge || volunteerHours >= 30) && (
                        <div className="absolute top-[-20%] right-[-20%] w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                      )}

                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                          hasClaimedVolunteerBadge
                            ? 'bg-amber-500/20 border-amber-400/30 text-amber-400'
                            : volunteerHours >= 30
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              : 'bg-slate-200 border-slate-300 text-slate-400'
                        }`}>
                          <BadgeCheck className="w-8 h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-black leading-tight ${hasClaimedVolunteerBadge || volunteerHours >= 30 ? 'text-amber-500' : 'text-slate-700'}`}>
                            Volunteer Excellence Badge
                          </h4>
                          <p className={`text-[11px] leading-relaxed mt-0.5 ${hasClaimedVolunteerBadge || volunteerHours >= 30 ? 'text-slate-300' : 'text-slate-400'}`}>
                            Awarded to coordinators completing 30+ hours of selfless campus operations service.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/10 relative z-10 flex flex-col gap-2">
                        {hasClaimedVolunteerBadge ? (
                          <div className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-black text-amber-400">
                            <CheckCircle className="w-4 h-4" /> Earned & Added to Profile
                          </div>
                        ) : volunteerHours >= 30 ? (
                          <button
                            disabled={true}
                            className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-black cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            Claiming Disabled
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#0080c7] h-full rounded-full transition-all duration-500"
                                style={{ width: `${(volunteerHours / 30) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                              <span>Progress to Badge: {Math.round((volunteerHours / 30) * 100)}%</span>
                              <span>{volunteerHours} / 30 hrs</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claimable shifts marketplace list */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-3 px-1 uppercase tracking-wider text-slate-400">Available Coordinator Shifts</h3>
                  <div className="flex flex-col gap-3">
                    {AVAILABLE_SHIFTS.map((shift) => {
                      const isClaimed = claimedDuties.includes(shift.id);
                      const associatedLog = volunteerLogs.find(l => l.shiftId === shift.id);
                      const isPending = associatedLog?.status === 'pending';

                      return (
                        <div key={shift.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col shadow-sm">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 leading-tight">{shift.name}</h4>
                              <p className="text-[11px] text-[#0080c7] font-semibold mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {shift.time}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Venue: {shift.venue}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black px-2 py-1 rounded bg-[#0080c7]/10 text-[#0080c7] uppercase">
                                +{shift.hours} Hrs
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                            <span className="text-[10px] text-slate-400 font-bold">{shift.slots} volunteer slots remaining</span>
                            
                            {!isClaimed ? (
                              <button
                                disabled={true}
                                className="bg-slate-100 text-slate-400 text-xs font-black px-4 py-2 rounded-xl cursor-not-allowed"
                              >
                                Claim Disabled
                              </button>
                            ) : isPending ? (
                              <button
                                disabled={true}
                                className="bg-slate-100 text-slate-400 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 cursor-not-allowed"
                              >
                                <QrCode className="w-3.5 h-3.5" /> Check-In Disabled
                              </button>
                            ) : (
                              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Verified Completed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Duty Log records list */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-3 px-1 uppercase tracking-wider text-slate-400">My Activity Log</h3>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 divide-y divide-slate-100">
                    {volunteerLogs.map((log) => (
                      <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{log.activity}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{log.date}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">+{log.hours} hrs</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            log.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setVolunteerSubmitted(false);
                    localStorage.removeItem('volunteer_submitted');
                  }} 
                  className="mt-2 w-full text-slate-400 hover:text-slate-600 text-xs font-bold text-center py-2"
                >
                  Leave volunteer dashboard & apply to another committee
                </button>
              </div>
            ) : (
              <form onSubmit={handleVolunteerSubmit} className="flex flex-col gap-5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 mb-3">Choose Committee</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {COMMITTEES.map((item) => {
                      const Icon = item.icon;
                      const isActive = committee === item.id;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setCommittee(item.id)}
                          className={`bg-white rounded-[24px] p-4 text-left border shadow-sm transition-all ${
                            isActive ? 'border-[#0080c7] ring-2 ring-[#0080c7]/15' : 'border-slate-100'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${item.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">{item.slots} slots left</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                  <h2 className="text-sm font-black text-slate-900 mb-4">Application Details</h2>
                  <div className="flex flex-col gap-4">
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="morning">Morning Shift</option>
                      <option value="afternoon">Afternoon Shift</option>
                      <option value="evening">Evening Shift</option>
                    </select>
                    <textarea
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 h-28 resize-none focus:outline-none"
                      placeholder="Mention prior experience in volunteering/coordinating."
                    />
                  </div>
                </div>
                <button type="submit" disabled={true} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl text-sm font-black cursor-not-allowed">
                  Applications Disabled
                </button>
              </form>
            )}
          </div>
        )}

        {/* Highlights Tab */}
        {activeView === 'highlights' && (
          <div className="flex flex-col gap-5 pb-6 pt-2">
            {/* Immersive Instagram-Style Bubble Strip */}
            <div className="bg-white rounded-[28px] p-4 shadow-sm border border-slate-100 mt-2">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 px-1">LAVAZA Live Reels</h3>
              <div className="flex gap-4 overflow-x-auto py-2 hide-scrollbar">
                {STORY_REELS.map((story, idx) => (
                  <button
                    key={story.id}
                    onClick={() => { setStoryIndex(idx); setShowStoryPlayer(true); }}
                    className="flex flex-col items-center shrink-0 gap-1.5 focus:outline-none group"
                  >
                    <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-pink-500 via-rose-500 to-yellow-500 shadow-md group-active:scale-90 transition-all">
                      <img
                        src={story.url}
                        alt={story.title}
                        className="w-full h-full rounded-full object-cover border border-white bg-slate-900"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 max-w-[72px] truncate text-center leading-tight">
                      {story.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <h2 className="text-base font-black text-slate-900">Highlights Gallery</h2>
              <span className="text-[10px] font-black px-2.5 py-1 rounded bg-[#0080c7]/10 text-[#0080c7] uppercase">
                {currentHighlightIdx + 1} / {HIGHLIGHTS.length}
              </span>
            </div>

            {/* Horizontal Scrolling Carousel / Slider Component */}
            <div className="relative bg-slate-900 rounded-[32px] overflow-hidden shadow-xl aspect-[4/3] group">
              <div className="absolute inset-0 flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentHighlightIdx * 100}%)` }}>
                {HIGHLIGHTS.map((h) => (
                  <div key={h.id} className="min-w-full h-full relative shrink-0">
                    <img src={h.url} alt={h.title} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent pointer-events-none" />
                    {h.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="text-[10px] uppercase font-black text-yellow-400 tracking-wider">Lavaza Highlights</span>
                      <h3 className="text-white font-black text-lg mt-1 leading-tight">{h.title}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider Arrows */}
              <button
                onClick={() => setCurrentHighlightIdx(prev => Math.max(prev - 1, 0))}
                disabled={currentHighlightIdx === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white disabled:opacity-30 active:scale-95 transition-opacity z-10"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentHighlightIdx(prev => Math.min(prev + 1, HIGHLIGHTS.length - 1))}
                disabled={currentHighlightIdx === HIGHLIGHTS.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white disabled:opacity-30 active:scale-95 transition-opacity z-10"
              >
                →
              </button>

              {/* Slider dots indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {HIGHLIGHTS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentHighlightIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentHighlightIdx === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Official highlights are managed directly by the cultural board. Tap stories above to play live fests reels, or use the horizontal gallery to scroll memories.
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Simulated Attendance QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative p-6 text-center text-white animate-scale-up">
            <button 
              onClick={() => setShowScanner(false)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <QrCode className="w-12 h-12 text-[#0080c7] mx-auto mb-3" />
            <h3 className="text-lg font-black tracking-tight">QR Attendance Scanner</h3>
            <p className="text-xs text-slate-400 mt-1">Point your camera at the attendance card QR generated by the coordinator.</p>

            {/* Mock Camera Viewfinder */}
            <div className="my-6 relative w-full aspect-square bg-black border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
              {/* Scan box frame */}
              <div className="absolute w-48 h-48 border-2 border-[#0080c7] rounded-lg"></div>
              {/* Pulse Scanner Line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 opacity-80 animate-scan-pulse"></div>

              {scanSuccessMessage ? (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 z-10">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
                  <p className="text-sm font-bold text-emerald-400">{scanSuccessMessage}</p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-bold uppercase animate-pulse">Camera active...</p>
              )}
            </div>

            {!scanSuccessMessage && (
              <button
                onClick={handleMockScanSuccess}
                className="w-full bg-[#0080c7] hover:bg-[#006ca8] text-white py-3.5 rounded-2xl text-sm font-bold shadow-xl active:scale-95 transition-all"
              >
                Scan Session QR Code
              </button>
            )}
          </div>
        </div>
      )}
      {/* Immersive Vertical Reels Stories Player Modal */}
      {showStoryPlayer && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col justify-between p-4 animate-fade-in select-none">
          {/* Top Header Indicators */}
          <div className="flex flex-col gap-3.5 z-20 w-full pt-4 px-2">
            {/* Progress Bar Indicators */}
            <div className="flex gap-1.5 w-full">
              {STORY_REELS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full overflow-hidden transition-all duration-300 ${
                    idx < storyIndex
                      ? 'bg-pink-500'
                      : idx === storyIndex
                        ? 'bg-slate-350'
                        : 'bg-white/20'
                  }`}
                >
                  {idx === storyIndex && (
                    <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 animate-story-progress" />
                  )}
                </div>
              ))}
            </div>

            {/* Profile & Close Bar */}
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400">
                  <img
                    src={STORY_REELS[storyIndex].url}
                    alt="Reel Avatar"
                    className="w-full h-full rounded-full object-cover border border-black"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{STORY_REELS[storyIndex].title}</h4>
                  <p className="text-[9px] font-bold text-white/60">LAVAZA '26 Live</p>
                </div>
              </div>
              <button
                onClick={() => setShowStoryPlayer(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Reel Frame */}
          <div className="flex-1 flex items-center justify-center relative my-4 overflow-hidden rounded-[24px] border border-white/5 bg-slate-950">
            <img
              src={STORY_REELS[storyIndex].url}
              alt={STORY_REELS[storyIndex].title}
              className="w-full h-full object-cover max-h-[75vh]"
            />
            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/45 pointer-events-none" />

            {/* Tap areas to quickly navigate */}
            <div
              onClick={() => setStoryIndex(prev => Math.max(0, prev - 1))}
              className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer z-10"
            />
            <div
              onClick={() => setStoryIndex(prev => Math.min(STORY_REELS.length - 1, prev + 1))}
              className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer z-10"
            />

            {/* Vertical Controls Overlay on Right side */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-20">
              <button
                onClick={() => setStoryIndex(prev => prev === 0 ? STORY_REELS.length - 1 : prev - 1)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-sm font-bold shadow-lg hover:bg-black/60 active:scale-90 transition-all"
                title="Previous Reel"
              >
                ▲
              </button>
              <button
                onClick={() => setStoryIndex(prev => prev === STORY_REELS.length - 1 ? 0 : prev + 1)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-sm font-bold shadow-lg hover:bg-black/60 active:scale-90 transition-all"
                title="Next Reel"
              >
                ▼
              </button>
            </div>

            {/* Content Bottom Overlay */}
            <div className="absolute bottom-6 left-5 right-14 z-20 text-left pointer-events-none">
              <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest bg-pink-500/20 px-2.5 py-1 rounded-full border border-pink-500/30">🔥 Live Fest Reel</span>
              <h4 className="text-white font-black text-lg mt-2.5 leading-tight">{STORY_REELS[storyIndex].title}</h4>
              <p className="text-white/85 text-[11px] mt-1 font-medium leading-relaxed max-w-xs">{STORY_REELS[storyIndex].description}</p>
            </div>
          </div>
        </div>
      )}
      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative p-6 border border-slate-100 my-8">
            <button 
              onClick={() => setShowCreateEvent(false)} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-950 mb-4">Create Campus Event</h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Event Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. HackGrid 36h"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Event details and instructions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-20 resize-none outline-none focus:border-[#0080c7] text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-800"
                  >
                    <option value="fest">Fest</option>
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Venue</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    placeholder="e.g. Seminar Hall"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs outline-none focus:border-[#0080c7] text-slate-850"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
                  <input
                    type="datetime-local"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs outline-none focus:border-[#0080c7] text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Max Seats</label>
                  <input
                    type="number"
                    value={eventForm.max_participants}
                    onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })}
                    placeholder="e.g. 100 (Optional)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Associated Badge</label>
                  <select
                    value={eventForm.badge_id}
                    onChange={(e) => setEventForm({ ...eventForm, badge_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-800"
                  >
                    <option value="">No Badge</option>
                    {badges.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.points} pts)</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateEvent}
                disabled={savingEvent || !eventForm.title.trim() || !eventForm.start_date}
                className="w-full mt-2 bg-[#0080c7] hover:bg-[#006ca8] text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {savingEvent ? 'Saving...' : 'Publish Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative p-6 border border-slate-100 my-8">
            <button 
              onClick={() => { setShowEditEvent(false); setSelectedEventForEdit(null); }} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-950 mb-4">Edit Event Details</h3>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Event Title *</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-805"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm h-20 resize-none outline-none focus:border-[#0080c7] text-slate-805"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-805"
                  >
                    <option value="fest">Fest</option>
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Venue</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-805"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs outline-none focus:border-[#0080c7] text-slate-850"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
                  <input
                    type="datetime-local"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs outline-none focus:border-[#0080c7] text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Max Seats</label>
                  <input
                    type="number"
                    value={eventForm.max_participants}
                    onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-805"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Associated Badge</label>
                  <select
                    value={eventForm.badge_id}
                    onChange={(e) => setEventForm({ ...eventForm, badge_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm outline-none focus:border-[#0080c7] text-slate-805"
                  >
                    <option value="">No Badge</option>
                    {badges.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.points} pts)</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleUpdateEvent}
                disabled={savingEvent || !eventForm.title.trim()}
                className="w-full mt-2 bg-[#0080c7] hover:bg-[#006ca8] text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {savingEvent ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Management Modal */}
      {showRegistrations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative p-6 border border-slate-100 flex flex-col max-h-[85vh]">
            <button 
              onClick={() => { setShowRegistrations(false); setSelectedEventForRegistrations(null); }} 
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-700 z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-black text-slate-950">Manage Event Roster</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedEventForRegistrations?.title}</p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {loadingRegistrations ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="w-8 h-8 border-4 border-[#0080c7] border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-xs font-bold text-slate-400">Loading registrations...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <Users className="w-12 h-12 text-slate-200 mb-2" />
                  <p className="text-sm font-bold">No students registered yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {registrations.map((reg) => (
                    <div key={reg.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-black text-slate-900">{reg.student_name || 'Student'}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {reg.student_roll || 'N/A'} • {reg.student_email || 'N/A'}
                          </p>
                        </div>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                          reg.status === 'winner' ? 'bg-amber-100 text-amber-700' :
                          reg.status === 'attended' ? 'bg-emerald-100 text-emerald-700' :
                          reg.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          reg.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-slate-150 text-slate-650'
                        }`}>
                          {reg.status}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateRegistrationStatus(reg.id, 'attended')}
                          disabled={reg.status === 'attended'}
                          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                        >
                          Mark Attended
                        </button>
                        <button
                          onClick={() => handleUpdateRegistrationStatus(reg.id, 'winner')}
                          disabled={reg.status === 'winner'}
                          className="flex-1 py-2 bg-amber-50 hover:bg-amber-150 text-amber-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                        >
                          Mark Winner 🏆
                        </button>
                        <button
                          onClick={() => handleUpdateRegistrationStatus(reg.id, 'rejected')}
                          disabled={reg.status === 'rejected'}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-655 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      <BottomNav />
      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
};

export default EventHub;
