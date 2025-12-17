'use client';  // ← これを追加！

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Clock, Play, Pause, Edit2, Plus, Trash2, CheckCircle, Circle, 
  ChevronDown, ChevronUp, Award, X, Zap, Layers, History, LayoutDashboard, 
  TrendingUp, Calendar as CalendarIcon, Filter, PieChart as PieChartIcon, BarChart2,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';

// ==========================================
// 1. Type Definitions & Constants
// ==========================================

type Subject = 'math' | 'japanese' | 'science' | 'social';

interface SubjectConfig {
  id: Subject;
  label: string;
  short: string;
  color: string;
  bg: string;
  lightBg: string;
  border: string;
  hex: string;
}

interface Task {
  id: string;
  unit: string;
  subject: Subject;
  category: string;
  title: string;
  materialName: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentDuration: number;
  currentMemo: string;
  history: { id: string; date: string; duration: number; memo: string }[];
  createdAt: string;
}

interface TestResult {
  id: string;
  date: string;
  name: string;
  type: string;
  subjects: Record<Subject, { score: number; avg: number; dev: number; rank?: string }>;
  total4: { score: number; avg: number; dev: number; rank: string };
}

const SUBJECT_CONFIG: Record<Subject, SubjectConfig> = {
  math: { 
    id: 'math', label: '算数', short: '算', 
    color: 'text-blue-600', bg: 'bg-blue-500',
    lightBg: 'bg-blue-50', border: 'border-blue-200',
    hex: '#2563eb',
  },
  japanese: { 
    id: 'japanese', label: '国語', short: '国', 
    color: 'text-rose-600', bg: 'bg-rose-500',
    lightBg: 'bg-rose-50', border: 'border-rose-200',
    hex: '#e11d48',
  },
  science: { 
    id: 'science', label: '理科', short: '理', 
    color: 'text-amber-600', bg: 'bg-amber-500',
    lightBg: 'bg-amber-50', border: 'border-amber-200',
    hex: '#d97706',
  },
  social: { 
    id: 'social', label: '社会', short: '社', 
    color: 'text-emerald-600', bg: 'bg-emerald-500',
    lightBg: 'bg-emerald-50', border: 'border-emerald-200',
    hex: '#059669',
  },
};

const TEST_TYPE_CONFIG: Record<string, { label: string; color: string; activeClass: string }> = {
  kumiwake: { label: '組分け', color: 'text-purple-700', activeClass: 'bg-purple-600 text-white border-purple-600' },
  curriculum: { label: 'カリテ', color: 'text-slate-700', activeClass: 'bg-slate-600 text-white border-slate-600' },
  hantei: { label: '判定', color: 'text-orange-700', activeClass: 'bg-orange-600 text-white border-orange-600' },
};

const CURRICULUM_PRESETS: Record<Subject, { category: string; items: string[] }[]> = {
  math: [
    { category: '予習シリーズ', items: ['類題', '基本問題', '練習問題'] },
    { category: '演習問題集', items: ['基本問題', '練習問題', 'トレーニング', '実戦演習'] },
    { category: '計算', items: ['①', '②', '③', '④', '⑤', '⑥', '⑦'] },
    { category: 'プリント', items: ['ミニテスト STANDARD', 'ミニテスト ADVANCE', '基礎力強化プリント'] },
  ],
  japanese: [
    { category: '予習シリーズ', items: ['基本問題', '発展問題', '言語知識'] },
    { category: '漢字とことば', items: ['漢字練習', '漢字確認', 'ことば'] },
    { category: '演習問題集', items: ['演習問題集'] },
    { category: 'プリント', items: ['漢字', 'ことば'] },
  ],
  science: [
    { category: '予習シリーズ', items: ['要点チェック'] },
    { category: '演習問題集', items: ['まとめてみよう', '練習問題', '発展問題'] },
    { category: '練成問題集', items: ['トレーニング', '基本問題', '練習問題'] },
    { category: 'プリント', items: ['確認テスト', 'まとめプリント 穴埋め編', 'まとめプリント まとめプリント'] },
  ],
  social: [
    { category: '予習シリーズ', items: ['要点チェック'] },
    { category: '演習問題集', items: ['まとめてみよう', '練習問題', '発展問題'] },
    { category: '練成問題集', items: ['トレーニング', '基本問題', '練習問題'] },
    { category: 'プリント', items: ['確認テスト', 'ジャンプアップ問題'] },
  ]
};

// Helper: Format Seconds
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m}m`;
  return `${m}m${s}s`;
};

// Helper: Generate Dummy Data
const generateDummyTasks = (): Task[] => {
  const tasks: Task[] = [];
  const subjects: Subject[] = ['math', 'japanese', 'science', 'social'];
  const today = new Date();
  
  // Create tasks for Unit 14 and 13
  [14, 13].forEach(unitNum => {
    const unit = `第${unitNum}回`;
    subjects.forEach(subj => {
      const presets = CURRICULUM_PRESETS[subj];
      presets.forEach(cat => {
        cat.items.forEach((item, idx) => {
          // Determine random status and history
          const hasHistory = Math.random() > 0.3; // 70% chance of having history
          const history = [];
          
          if (hasHistory) {
            // Generate 1-3 history entries within last 30 days
            const entries = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < entries; i++) {
              const daysAgo = Math.floor(Math.random() * 30);
              const date = new Date(today);
              date.setDate(today.getDate() - daysAgo);
              const duration = (Math.floor(Math.random() * 40) + 10) * 60; // 10-50 mins
              history.push({
                id: Math.random().toString(36).substr(2, 9),
                date: `${date.getMonth() + 1}/${date.getDate()}`,
                duration,
                memo: Math.random() > 0.7 ? '難しかった' : ''
              });
            }
            history.sort((a, b) => { // sort by date string (simple logic for dummy)
               const [ma, da] = a.date.split('/').map(Number);
               const [mb, db] = b.date.split('/').map(Number);
               return (ma * 31 + da) - (mb * 31 + db);
            });
          }

          tasks.push({
            id: `${unitNum}-${subj}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            unit,
            subject: subj,
            category: cat.category,
            title: item,
            materialName: `${cat.category} - ${item}`,
            status: hasHistory ? (Math.random() > 0.5 ? 'completed' : 'in_progress') : 'not_started',
            currentDuration: 0,
            currentMemo: '',
            history,
            createdAt: `${today.getMonth() + 1}/${today.getDate()}`
          });
        });
      });
    });
  });
  return tasks;
};

// --- Initial Data (used only if localStorage is empty) ---
const INITIAL_TASKS: Task[] = generateDummyTasks();

const INITIAL_TESTS: TestResult[] = [
  // --- カリキュラムテスト（下） ---
  {
    id: 't20251206', date: '2025/12/06', name: 'カリ下13-14', type: 'curriculum',
    subjects: {
      math: { score: 46, avg: 57.6, dev: 42.2, rank: '1665/2216' },
      japanese: { score: 76, avg: 73.6, dev: 51.7, rank: '1019/2216' },
      science: { score: 34, avg: 37.3, dev: 45.4, rank: '1537/2216' },
      social: { score: 38, avg: 40.9, dev: 44.4, rank: '1602/2216' },
    },
    total4: { score: 194, avg: 209.6, dev: 44.2, rank: '1615/2216' }
  },
  {
    id: 't20251122', date: '2025/11/22', name: 'カリ下11-12', type: 'curriculum',
    subjects: {
      math: { score: 46, avg: 54.5, dev: 44.8, rank: '1416/2133' },
      japanese: { score: 75, avg: 65.9, dev: 57.2, rank: '488/2133' },
      science: { score: 38, avg: 41.6, dev: 44.5, rank: '1574/2133' },
      social: { score: 46, avg: 41.0, dev: 58.8, rank: '225/2133' },
    },
    total4: { score: 205, avg: 203.2, dev: 50.6, rank: '1036/2133' }
  },
  {
    id: 't20251101', date: '2025/11/01', name: 'カリ下8-9', type: 'curriculum',
    subjects: {
      math: { score: 69, avg: 55.3, dev: 58.5, rank: '349/2281' },
      japanese: { score: 77, avg: 70.0, dev: 55.8, rank: '652/2281' },
      science: { score: 50, avg: 42.5, dev: 62.7, rank: '1/2281' },
      social: { score: 38, avg: 38.3, dev: 49.3, rank: '1140/2281' },
    },
    total4: { score: 234, avg: 206.3, dev: 60.1, rank: '329/2281' }
  },
  {
    id: 't20251018', date: '2025/10/18', name: 'カリ下6-7', type: 'curriculum',
    subjects: {
      math: { score: 90, avg: 65.4, dev: 67.1, rank: '28/2329' },
      japanese: { score: 75, avg: 64.5, dev: 57.6, rank: '502/2329' },
      science: { score: 40, avg: 35.1, dev: 56.2, rank: '637/2329' },
      social: { score: 48, avg: 43.7, dev: 58.0, rank: '261/2329' },
    },
    total4: { score: 253, avg: 208.9, dev: 66.7, rank: '80/2329' }
  },
  {
    id: 't20250927', date: '2025/09/27', name: 'カリ下3-4', type: 'curriculum',
    subjects: {
      math: { score: 73, avg: 62.6, dev: 57.1, rank: '514/2161' },
      japanese: { score: 61, avg: 71.1, dev: 42.4, rank: '1659/2161' },
      science: { score: 36, avg: 41.7, dev: 41.2, rank: '1770/2161' },
      social: { score: 46, avg: 40.9, dev: 58.5, rank: '250/2161' },
    },
    total4: { score: 216, avg: 216.5, dev: 49.7, rank: '1108/2161' }
  },
  {
    id: 't20250913', date: '2025/09/13', name: 'カリ下1-2', type: 'curriculum',
    subjects: {
      math: { score: 69, avg: 67.0, dev: 51.3, rank: '907/2150' },
      japanese: { score: 77, avg: 69.6, dev: 56.5, rank: '530/2150' },
      science: { score: 43, avg: 41.3, dev: 52.7, rank: '862/2150' },
      social: { score: 48, avg: 44.0, dev: 58.0, rank: '221/2150' },
    },
    total4: { score: 237, avg: 222.0, dev: 56.4, rank: '559/2150' }
  },

  // --- カリキュラムテスト（上） ---
  {
    id: 't20250705', date: '2025/07/05', name: 'カリ上18-19', type: 'curriculum',
    subjects: {
      math: { score: 74, avg: 68.3, dev: 53.9, rank: '753/2185' },
      japanese: { score: 88, avg: 82.1, dev: 54.7, rank: '770/2185' },
      science: { score: 38, avg: 35.8, dev: 52.9, rank: '829/2185' },
      social: { score: 40, avg: 38.1, dev: 53.0, rank: '761/2185' },
    },
    total4: { score: 240, avg: 224.5, dev: 55.9, rank: '622/2185' }
  },
  {
    id: 't20250621', date: '2025/06/21', name: 'カリ上16-17', type: 'curriculum',
    subjects: {
      math: { score: 74, avg: 65.0, dev: 56.0, rank: '535/2147' },
      japanese: { score: 47, avg: 66.6, dev: 34.1, rank: '1982/2147' },
      science: { score: 36, avg: 35.9, dev: 50.0, rank: '1085/2147' },
      social: { score: 40, avg: 39.6, dev: 50.5, rank: '993/2147' },
    },
    total4: { score: 197, avg: 207.4, dev: 45.9, rank: '1417/2147' }
  },
  {
    id: 't20250531', date: '2025/05/31', name: 'カリ上13-14', type: 'curriculum',
    subjects: {
      math: { score: 80, avg: 61.7, dev: 62.5, rank: '156/2131' },
      japanese: { score: 62, avg: 59.6, dev: 51.8, rank: '899/2131' },
      science: { score: 37, avg: 37.9, dev: 48.5, rank: '1205/2131' },
      social: { score: 46, avg: 37.7, dev: 62.2, rank: '106/2131' },
    },
    total4: { score: 225, avg: 197.0, dev: 60.5, rank: '277/2131' }
  },
  {
    id: 't20250517', date: '2025/05/17', name: 'カリ上11-12', type: 'curriculum',
    subjects: {
      math: { score: 69, avg: 60.3, dev: 56.0, rank: '534/2175' },
      japanese: { score: 39, avg: 63.8, dev: 32.1, rank: '2055/2175' },
      science: { score: 41, avg: 29.5, dev: 65.2, rank: '105/2175' },
      social: { score: 32, avg: 35.4, dev: 44.7, rank: '1462/2175' },
    },
    total4: { score: 181, avg: 189.1, dev: 47.0, rank: '1344/2175' }
  },
  {
    id: 't20250419', date: '2025/04/19', name: 'カリ上8-9', type: 'curriculum',
    subjects: {
      math: { score: 83, avg: 61.9, dev: 64.3, rank: '178/2159' },
      japanese: { score: 96, avg: 78.2, dev: 63.8, rank: '83/2159' },
      science: { score: 37, avg: 36.7, dev: 50.3, rank: '1031/2159' },
      social: { score: 48, avg: 42.1, dev: 59.5, rank: '156/2159' },
    },
    total4: { score: 264, avg: 219.1, dev: 65.6, rank: '84/2159' }
  },
  {
    id: 't20250322', date: '2025/03/22', name: 'カリ上6-7', type: 'curriculum',
    subjects: {
      math: { score: 88, avg: 70.8, dev: 61.1, rank: '295/2010' },
      japanese: { score: 84, avg: 63.7, dev: 62.5, rank: '183/2010' },
      science: { score: 29, avg: 31.9, dev: 45.2, rank: '1332/2010' },
      social: { score: 46, avg: 37.2, dev: 63.2, rank: '55/2010' },
    },
    total4: { score: 247, avg: 203.8, dev: 65.4, rank: '102/2010' }
  },
  {
    id: 't20250301', date: '2025/03/01', name: 'カリ上3-4', type: 'curriculum',
    subjects: {
      math: { score: 94, avg: 75.5, dev: 62.1, rank: '166/1937' },
      japanese: { score: 71, avg: 70.1, dev: 50.5, rank: '986/1937' },
      science: { score: 42, avg: 37.1, dev: 55.8, rank: '538/1937' },
      social: { score: 46, avg: 40.2, dev: 58.0, rank: '261/1937' },
    },
    total4: { score: 253, avg: 223.0, dev: 58.9, rank: '341/1937' }
  },
  {
    id: 't20250215', date: '2025/02/15', name: 'カリ上1-2', type: 'curriculum',
    subjects: {
      math: { score: 88, avg: 69.8, dev: 61.1, rank: '233/1934' },
      japanese: { score: 88, avg: 79.3, dev: 56.5, rank: '486/1934' },
      science: { score: 47, avg: 37.0, dev: 64.2, rank: '63/1934' },
      social: { score: 50, avg: 38.7, dev: 65.4, rank: '1/1934' },
    },
    total4: { score: 273, avg: 224.9, dev: 65.2, rank: '46/1934' }
  },

  // --- 公開組分けテスト ---
  {
    id: 't20251109', date: '2025/11/09', name: '4年公開組分-07', type: 'kumiwake',
    subjects: {
      math: { score: 90, avg: 97.1, dev: 48.1, rank: '6082/10342' },
      japanese: { score: 75, avg: 69.4, dev: 52.3, rank: '4080/10342' },
      science: { score: 70, avg: 62.9, dev: 53.8, rank: '3805/10069' },
      social: { score: 87, avg: 60.7, dev: 61.4, rank: '1279/10001' },
    },
    total4: { score: 322, avg: 290.7, dev: 53.4, rank: '3844/10001' }
  },
  {
    id: 't20251005', date: '2025/10/05', name: '4年公開組分-06', type: 'kumiwake',
    subjects: {
      math: { score: 72, avg: 90.9, dev: 44.6, rank: '7317/10413' },
      japanese: { score: 98, avg: 85.8, dev: 54.8, rank: '3473/10413' },
      science: { score: 76, avg: 77.8, dev: 48.9, rank: '6301/10152' },
      social: { score: 81, avg: 66.8, dev: 55.9, rank: '3457/10075' },
    },
    total4: { score: 327, avg: 322.1, dev: 50.5, rank: '5210/10075' }
  },
  {
    id: 't20250831', date: '2025/08/31', name: '4年公開組分-05', type: 'kumiwake',
    subjects: {
      math: { score: 108, avg: 102.9, dev: 51.1, rank: '4812/10431' },
      japanese: { score: 95, avg: 81.0, dev: 55.1, rank: '3397/10431' },
      science: { score: 66, avg: 58.3, dev: 54.2, rank: '3497/10172' },
      social: { score: 84, avg: 60.8, dev: 59.2, rank: '2048/10095' },
    },
    total4: { score: 353, avg: 303.7, dev: 55.0, rank: '3370/10095' }
  },
  {
    id: 't20250712', date: '2025/07/12', name: '4年公開組分-04', type: 'kumiwake',
    subjects: {
      math: { score: 98, avg: 111.1, dev: 46.3, rank: '6478/10008' },
      japanese: { score: 92, avg: 84.0, dev: 53.1, rank: '3945/10008' },
      science: { score: 62, avg: 65.1, dev: 48.4, rank: '5732/9754' },
      social: { score: 73, avg: 58.5, dev: 56.8, rank: '2624/9691' },
    },
    total4: { score: 325, avg: 319.1, dev: 50.6, rank: '4922/9691' }
  },
  {
    id: 't20250426', date: '2025/04/26', name: '4年公開組分-02', type: 'kumiwake',
    subjects: {
      math: { score: 108, avg: 104.3, dev: 51.0, rank: '4593/9951' },
      japanese: { score: 95, avg: 93.7, dev: 50.5, rank: '5057/9951' },
      science: { score: 63, avg: 62.5, dev: 50.2, rank: '5024/9702' },
      social: { score: 50, avg: 61.3, dev: 44.7, rank: '6766/9632' },
    },
    total4: { score: 316, avg: 322.4, dev: 49.2, rank: '5367/9632' }
  },
  {
    id: 't20250308', date: '2025/03/08', name: '4年公開組分-01', type: 'kumiwake',
    subjects: {
      math: { score: 104, avg: 111.4, dev: 47.9, rank: '5673/9334' },
      japanese: { score: 81, avg: 79.0, dev: 50.7, rank: '4463/9334' },
      science: { score: 86, avg: 69.7, dev: 59.6, rank: '1386/9112' },
      social: { score: 77, avg: 66.2, dev: 55.7, rank: '2859/9057' },
    },
    total4: { score: 348, avg: 326.7, dev: 52.5, rank: '3946/9057' }
  },
];

const Stopwatch = React.memo(({ 
  time, onChange, onStartStop, variant = 'modal' 
}: { 
  time: number; onChange: (t: number) => void; onStartStop: (running: boolean) => void; variant?: 'modal' | 'card' 
}) => {
  const [running, setRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  
  const timeRef = useRef(time);
  useEffect(() => {
    if (!running) timeRef.current = time;
  }, [time, running]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running) {
      interval = setInterval(() => {
        const next = timeRef.current + 1;
        timeRef.current = next;
        onChange(next);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, onChange]);

  const toggleTimer = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextState = !running;
    setRunning(nextState);
    onStartStop(nextState);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditVal(Math.floor(timeRef.current / 60).toString());
    setRunning(false);
    onStartStop(false);
  };

  const saveEdit = () => {
    const val = parseInt(editVal) || 0;
    const newTime = val * 60;
    timeRef.current = newTime;
    onChange(newTime);
    setIsEditing(false);
  };

  if (variant === 'card') {
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {timeRef.current > 0 && (
          <span className={`font-mono text-xs font-bold ${running ? 'text-blue-600' : 'text-slate-400'}`}>
            {formatTime(timeRef.current)}
          </span>
        )}
        <button 
          onClick={toggleTimer}
          className={`p-1.5 rounded-full transition-all ${
            running ? 'bg-red-50 text-red-500 ring-2 ring-red-100' : 'bg-slate-50 text-blue-500 hover:bg-blue-50'
          }`}
        >
          {running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center justify-center bg-slate-100 rounded-2xl py-2 px-4 w-full h-16">
        <input 
          type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)}
          className="w-20 text-center bg-transparent text-3xl font-black text-slate-800 focus:outline-none"
          autoFocus
        />
        <span className="text-sm font-bold text-slate-500 mr-4 mt-2">分</span>
        <button onClick={saveEdit} className="bg-green-500 text-white p-2 rounded-full active:scale-95"><CheckCircle size={20} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 pr-4 w-full h-16 border border-slate-100 shadow-inner">
      <div className="flex-1 text-center">
        <span className={`font-mono text-3xl font-black tracking-widest ${running ? 'text-blue-600' : 'text-slate-700'}`}>
          {formatTime(timeRef.current)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleEdit} className="text-slate-300 hover:text-slate-500 p-2"><Edit2 size={18} /></button>
        <button 
          onClick={toggleTimer}
          className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-all ${
            running ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
});
Stopwatch.displayName = 'Stopwatch';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm whitespace-pre-wrap">{message}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            キャンセル
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateUnitOverlay = ({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (n: number) => void }) => {
  const [unitNumber, setUnitNumber] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center"><Layers className="mr-2 text-blue-600" /> 新しい回を追加</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Unit Number</label>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-black text-slate-300">第</span>
            <input
              type="number" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="?"
              className="w-24 bg-white border-2 border-blue-100 rounded-xl px-2 py-3 text-3xl font-black text-center text-blue-600 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <span className="text-2xl font-black text-slate-300">回</span>
          </div>
        </div>
        <button
          onClick={() => { if (parseInt(unitNumber) > 0) { onCreate(parseInt(unitNumber)); setUnitNumber(''); onClose(); } }}
          disabled={!unitNumber}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Zap size={20} fill="currentColor"/> カリキュラムを作成
        </button>
      </div>
    </div>
  );
};

const AddCustomTaskModal = ({ isOpen, onClose, onAdd, unit, subject }: any) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('その他');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-800">タスクを追加</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">カテゴリ</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold">
              <option value="予習シリーズ">予習シリーズ</option>
              <option value="演習問題集">演習問題集</option>
              <option value="練成問題集">練成問題集</option>
              <option value="プリント">プリント</option>
              <option value="その他">その他</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">タイトル</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 追加問題..." className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold" autoFocus />
          </div>
          <button
            onClick={() => { if (title) { onAdd(title, category); setTitle(''); setCategory('その他'); onClose(); } }}
            disabled={!title}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg mt-2"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskDetailModal = ({ task, isOpen, onClose, onUpdate, onSaveHistory, onDelete, setDeleteConfirmation }: any) => {
  if (!isOpen || !task) return null;
  const conf = SUBJECT_CONFIG[task.subject as Subject];
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500 text-white border-green-500';
      case 'in_progress': return 'bg-blue-500 text-white border-blue-500';
      default: return 'bg-white text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-[92vh] sm:h-[85vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${conf.lightBg} ${conf.color} border ${conf.border}`}>{conf.label}</span>
              <span className="text-xs font-bold text-slate-400">{task.unit} - {task.category}</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 leading-tight pr-4">{task.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-smooth">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">状態</label>
            <div className="flex gap-2">
              {[
                { id: 'not_started', label: '未着手', icon: Circle },
                { id: 'in_progress', label: '勉強中', icon: Zap },
                { id: 'completed', label: '完了', icon: CheckCircle },
              ].map(s => (
                <button key={s.id} onClick={() => onUpdate({ status: s.id })}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                    task.status === s.id ? getStatusColor(s.id) : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <s.icon size={20} />{s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1"><Clock size={12} /> タイマー</label>
            <Stopwatch time={task.currentDuration} onChange={(t) => onUpdate({ currentDuration: t })} onStartStop={(running) => { if (running && task.status === 'not_started') onUpdate({ status: 'in_progress' }); }} />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">メモ</label>
            <textarea
              value={task.currentMemo} onChange={(e) => onUpdate({ currentMemo: e.target.value })}
              placeholder="ここにつまづいた、次はこうする..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 resize-none h-24"
            />
          </div>

          <button onClick={onSaveHistory} disabled={task.currentDuration === 0} className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <History size={20} /> 記録を保存
          </button>
          
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">学習履歴 ({task.history.length})</label>
            {task.history.length === 0 ? (
              <div className="text-center py-8 text-slate-300 text-sm font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">まだ記録がありません</div>
            ) : (
              <div className="space-y-3">
                {[...task.history].reverse().map((h: any, i: number) => (
                  <div key={h.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex gap-4">
                    <div className="flex flex-col items-center justify-center px-2 border-r border-slate-100 min-w-[3.5rem]">
                      <span className="text-[10px] font-bold text-slate-400">回目</span>
                      <span className="text-xl font-black text-slate-700">{task.history.length - i}</span>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{h.date}</span>
                        <span className="text-sm font-bold text-blue-600 font-mono flex items-center gap-1"><Clock size={12} />{formatTime(h.duration)}</span>
                      </div>
                      {h.memo && <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">{h.memo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="h-4"></div>
        </div>

        <div className="p-4 border-t border-slate-50 bg-white sm:rounded-b-3xl shrink-0 flex gap-3 pb-safe-bottom">
           <button 
             onClick={() => {
               setDeleteConfirmation({
                 title: 'タスクの削除',
                 message: '本当にこのタスクを削除しますか？',
                 onConfirm: () => {
                   onDelete();
                   onClose();
                 }
               });
             }} 
             className="text-red-400 hover:bg-red-50 p-3 rounded-xl flex-1 border border-transparent hover:border-red-100 font-bold text-xs flex items-center justify-center gap-2"
           >
             <Trash2 size={16} /> 削除
           </button>
           <button onClick={onClose} className="bg-slate-100 text-slate-500 font-bold py-3 rounded-xl flex-1">閉じる</button>
        </div>
      </div>
    </div>
  );
};

const AddTestResultOverlay = ({ isOpen, onClose, onAdd }: any) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [type, setType] = useState('curriculum');
  const [devs, setDevs] = useState({ math: '', japanese: '', science: '', social: '' });
  const [totalDev, setTotalDev] = useState('');
  const [totalRank, setTotalRank] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newTest: TestResult = {
      id: Date.now().toString(),
      date: date.replace(/-/g, '/'),
      name,
      type,
      subjects: {
        math: { score: 0, avg: 0, dev: Number(devs.math) },
        japanese: { score: 0, avg: 0, dev: Number(devs.japanese) },
        science: { score: 0, avg: 0, dev: Number(devs.science) },
        social: { score: 0, avg: 0, dev: Number(devs.social) },
      },
      total4: { score: 0, avg: 0, dev: Number(totalDev), rank: totalRank }
    };
    onAdd(newTest);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-slate-800">テスト結果を追加</h3>
          <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">実施日</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">種類</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold">
                {Object.entries(TEST_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">テスト名</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold" />
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-bold text-slate-600 mb-3 text-sm">各教科の偏差値</h4>
            <div className="grid grid-cols-2 gap-4">
              {(['math', 'japanese', 'science', 'social'] as Subject[]).map(subj => (
                <div key={subj}>
                  <label className={`block text-xs font-bold ${SUBJECT_CONFIG[subj].color} mb-1`}>{SUBJECT_CONFIG[subj].label}</label>
                  <input 
                    type="number" 
                    placeholder="偏差値"
                    value={devs[subj]} 
                    onChange={e => setDevs({...devs, [subj]: e.target.value})} 
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold" 
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
             <h4 className="font-bold text-slate-600 mb-2 text-sm">4科合計</h4>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">偏差値</label>
                  <input type="number" value={totalDev} onChange={e => setTotalDev(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">順位</label>
                  <input type="text" value={totalRank} onChange={e => setTotalRank(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold" />
               </div>
             </div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4">追加する</button>
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, updateTask, cycleStatus, setDetailTaskId }: { task: Task; updateTask: any; cycleStatus: any; setDetailTaskId: any }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  return (
    <div className={`group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md relative overflow-hidden flex flex-col gap-3 ${task.status === 'completed' ? 'opacity-60 bg-slate-50' : 'hover:border-blue-200'}`}>
      <div className="flex items-center justify-between gap-3">
        <button onClick={(e) => { e.stopPropagation(); cycleStatus(task); }} className="p-2 -ml-1 rounded-full active:scale-90 transition-transform flex-shrink-0">
          {task.status === 'completed' ? <CheckCircle size={24} className="text-green-500" fill="#f0fdf4" /> : task.status === 'in_progress' ? <Zap size={24} className="text-blue-500" fill="currentColor" /> : <Circle size={24} className="text-slate-200" />}
        </button>
        <div className="flex-1 min-w-0 py-1 cursor-pointer" onClick={() => setDetailTaskId(task.id)}>
          <h4 className={`font-bold text-base text-slate-800 leading-tight ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>{task.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            {task.currentDuration > 0 && <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 font-mono"><Clock size={10} /> {formatTime(task.currentDuration)}</span>}
          </div>
        </div>
        <div className="flex items-center">
          <Stopwatch time={task.currentDuration} onChange={(t) => updateTask(task.id, { currentDuration: t })} onStartStop={(running) => { if (running && task.status === 'not_started') updateTask(task.id, { status: 'in_progress' }); }} variant="card" />
        </div>
      </div>

      <div className="border-t border-slate-50 pt-2">
        <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors mb-2">
          <History size={10} /> 履歴 ({task.history.length})
          {isHistoryOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        
        {isHistoryOpen && task.history.length > 0 && (
           <div className="space-y-2 pl-2 border-l-2 border-slate-100">
             {[...task.history].reverse().map((h) => (
                <div key={h.id} className="text-xs flex gap-2 items-baseline">
                   <span className="text-slate-400 font-mono min-w-[3rem]">{h.date}</span>
                   <span className="text-blue-600 font-bold font-mono">{formatTime(h.duration)}</span>
                   {h.memo && <span className="text-slate-500 truncate flex-1">- {h.memo}</span>}
                </div>
             ))}
           </div>
        )}
        {isHistoryOpen && task.history.length === 0 && (
           <div className="pl-2 text-[10px] text-slate-300">履歴なし</div>
        )}
      </div>
    </div>
  );
};

const SubjectSection = ({ unit, subject, tasks, updateTask, cycleStatus, setDetailTaskId, onAddTask }: any) => {
  const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const subjTasks = tasks.filter((t: Task) => t.unit === unit && t.subject === subject);
  
  if (subjTasks.length === 0 && filter === 'all') return null;

  const totalDuration = subjTasks.reduce((acc: number, curr: Task) => acc + curr.currentDuration + curr.history.reduce((hAcc, h) => hAcc + h.duration, 0), 0);
  const conf = SUBJECT_CONFIG[subject as Subject];

  const filteredTasks = subjTasks.filter((t: Task) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const tasksByCategory: Record<string, Task[]> = {};
  filteredTasks.forEach((task: Task) => {
     if (!tasksByCategory[task.category]) tasksByCategory[task.category] = [];
     tasksByCategory[task.category].push(task);
  });

  return (
    <div className="relative">
       <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-end justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-8 rounded-full ${conf.bg}`} />
                <h3 className={`font-black text-2xl ${conf.color}`}>{conf.label}</h3>
              </div>
              <div className="text-sm font-bold text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-lg">
                Total: {Math.floor(totalDuration / 60)}m
              </div>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {(['all', 'not_started', 'in_progress', 'completed'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {f === 'all' ? '全て' : f === 'not_started' ? '未着手' : f === 'in_progress' ? '勉強中' : '完了'}
                  </button>
                ))}
            </div>
            <button 
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Plus size={14} /> 追加
            </button>
          </div>
       </div>

       <div className="space-y-6">
         {Object.keys(tasksByCategory).length === 0 ? (
           <div className="text-center py-8 text-slate-400 text-xs font-bold border-2 border-dashed border-slate-100 rounded-2xl">
             タスクがありません
           </div>
         ) : (
           Object.keys(tasksByCategory).map(cat => (
              <div key={cat} className="pl-2">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pl-2 border-l-2 border-slate-200">{cat}</h4>
                 <div className="grid grid-cols-1 gap-3">
                   {tasksByCategory[cat].map((task: Task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        updateTask={updateTask} 
                        cycleStatus={cycleStatus} 
                        setDetailTaskId={setDetailTaskId} 
                      />
                   ))}
                 </div>
              </div>
           ))
         )}
       </div>

       <AddCustomTaskModal 
         isOpen={isAddModalOpen} 
         onClose={() => setAddModalOpen(false)} 
         unit={unit} 
         subject={subject}
         onAdd={(title: string, category: string) => onAddTask(unit, subject, title, category)}
       />
    </div>
  );
};

const DailyView = ({ 
  tasks, updateTask, cycleStatus, saveHistory, deleteTask, deleteUnit, 
  setTasks, setAddModalOpen, selectedUnit, setSelectedUnit, unitsWithTasks, onAddTask, setDeleteConfirmation
}: any) => {
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  const getStats = (targetTasks: Task[]) => {
    if (targetTasks.length === 0) return { progress: 0, totalTime: 0 };
    const completed = targetTasks.filter(t => t.status === 'completed').length;
    const progress = Math.round((completed / targetTasks.length) * 100);
    const totalTime = targetTasks.reduce((acc, curr) => {
      return acc + curr.history.reduce((hAcc, h) => hAcc + h.duration, 0) + curr.currentDuration;
    }, 0);
    return { progress, totalTime };
  };

  const getSubjectStats = (targetTasks: Task[], subject: Subject) => {
    return getStats(targetTasks.filter(t => t.subject === subject));
  };

  const allStats = useMemo(() => {
      const total = getStats(tasks);
      const subjects = (Object.keys(SUBJECT_CONFIG) as Subject[]).map(subj => ({
        id: subj,
        ...getSubjectStats(tasks, subj)
      }));
      return { total, subjects };
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-20 px-4 py-3 border-b border-slate-100 shadow-sm">
        <div className="flex gap-3">
          <button onClick={() => setSelectedUnit(null)} className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${!selectedUnit ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
            <LayoutDashboard size={18} /> 全体サマリー
          </button>
          <div className="flex-1 relative">
            <select
              value={selectedUnit || ''}
              onChange={(e) => e.target.value === 'NEW' ? setAddModalOpen(true) : setSelectedUnit(e.target.value)}
              className={`w-full h-full appearance-none rounded-2xl font-black text-sm pl-4 pr-10 focus:outline-none transition-all cursor-pointer ${selectedUnit ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-slate-100 text-slate-400'}`}
            >
              <option value="" disabled>回を選択...</option>
              <optgroup label="学習中の回">
                  {unitsWithTasks.map((w: string) => <option key={w} value={w} className="text-slate-800 bg-white">{w}</option>)}
              </optgroup>
              <optgroup label="アクション"><option value="NEW" className="text-blue-600 bg-white">+ 新しい回を追加</option></optgroup>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${selectedUnit ? 'text-white' : 'text-slate-300'}`} size={18} strokeWidth={3} />
          </div>
        </div>
      </div>

      <div className="pb-28 pt-4 px-4 space-y-6 flex-1">
        {selectedUnit ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              {(Object.keys(SUBJECT_CONFIG) as Subject[]).map(subj => (
                <SubjectSection 
                  key={subj}
                  unit={selectedUnit}
                  subject={subj}
                  tasks={tasks}
                  updateTask={updateTask}
                  cycleStatus={cycleStatus}
                  setDetailTaskId={setDetailTaskId}
                  onAddTask={onAddTask}
                />
              ))}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-blue-100 border border-blue-50">
                 <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Award className="text-blue-500" /> 全期間のサマリー</h2>
                 <div className="flex justify-between items-end mb-6 pb-6 border-b border-slate-100">
                     <div>
                         <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">全体進捗</div>
                         <div className="text-4xl font-black text-slate-800 tracking-tight">{allStats.total.progress}<span className="text-lg font-bold text-slate-400 ml-1">%</span></div>
                     </div>
                     <div className="text-right">
                         <div className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">総勉強時間</div>
                         <div className="text-2xl font-black text-blue-600 font-mono">
                            {Math.floor(allStats.total.totalTime / 3600)}<span className="text-sm text-slate-400 mx-1">h</span>
                            {Math.floor((allStats.total.totalTime % 3600) / 60)}<span className="text-sm text-slate-400 ml-1">m</span>
                         </div>
                     </div>
                 </div>
                 <div className="space-y-3">
                    {allStats.subjects.map(s => {
                       const conf = SUBJECT_CONFIG[s.id as Subject];
                       return (
                          <div key={s.id} className="flex items-center gap-3">
                             <span className={`text-xs font-bold w-8 ${conf.color}`}>{conf.short}</span>
                             <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${conf.bg}`} style={{ width: `${s.progress}%` }} />
                             </div>
                             <span className="text-xs font-bold text-slate-400 w-16 text-right font-mono">
                                {Math.floor(s.totalTime / 3600)}h {Math.floor((s.totalTime % 3600) / 60)}m
                             </span>
                          </div>
                       )
                    })}
                 </div>
              </div>

              <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider pl-2">学習回ごとの詳細</h3>

              {unitsWithTasks.map((unit: string) => {
                const unitTasks = tasks.filter((t: Task) => t.unit === unit);
                const { progress, totalTime } = getStats(unitTasks);
                return (
                  <div key={unit} onClick={() => setSelectedUnit(unit)} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 active:scale-[0.98] transition-all cursor-pointer hover:border-blue-200 group relative">
                     <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           setDeleteConfirmation({
                             title: `「${unit}」の削除`,
                             message: `本当に「${unit}」を削除しますか？\n含まれる全てのタスクと学習履歴が消去されます。`,
                             onConfirm: () => deleteUnit(unit)
                           });
                         }} 
                         className="absolute top-4 right-4 p-2 text-slate-200 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors z-10"
                     >
                         <Trash2 size={18} />
                     </button>
                     <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                           <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Layers size={24} className="text-slate-400 group-hover:text-blue-500" /></div>
                           <div className="font-black text-xl text-slate-800">{unit}</div>
                        </div>
                        <div className="text-xs font-bold text-slate-400 font-mono mr-8">{Math.floor(totalTime / 3600)}h {Math.floor((totalTime % 3600) / 60)}m</div>
                     </div>
                     <div className="mb-6"><div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-sm" style={{ width: `${progress}%` }} /></div></div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <TaskDetailModal 
        task={tasks.find((t: Task) => t.id === detailTaskId) || null}
        isOpen={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onUpdate={(updates: any) => updateTask(detailTaskId, updates)}
        onSaveHistory={() => { const t = tasks.find((t: Task) => t.id === detailTaskId); if (t) saveHistory(t); }}
        onDelete={() => { 
            setDeleteConfirmation({
                title: 'タスクの削除',
                message: '本当にこのタスクを削除しますか？',
                onConfirm: () => {
                    deleteTask(detailTaskId);
                    setDetailTaskId(null);
                }
            });
        }}
        setDeleteConfirmation={setDeleteConfirmation}
      />
    </div>
  );
};

const TestsView = ({ tests, onAddTest }: any) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['4ko']);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const toggleSubject = (subj: string) => {
    setSelectedSubjects(prev => prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]);
  };

  const chartData = useMemo(() => {
    let filtered = [...tests];
    if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType);
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => {
       const dp: any = { name: t.date.slice(5), testName: t.name };
       if (selectedSubjects.includes('4ko')) dp['4ko'] = t.total4.dev;
       ['math', 'japanese', 'science', 'social'].forEach(s => { if (selectedSubjects.includes(s)) dp[s] = t.subjects[s as Subject].dev; });
       return dp;
    });
  }, [tests, selectedSubjects, filterType]);

  const tableData = [...tests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
       <div className="bg-white/90 backdrop-blur-md sticky top-0 z-20 px-4 py-3 border-b border-slate-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center gap-2">
             <div className="flex gap-2">
               <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${filterType === 'all' ? 'bg-slate-800 text-white' : 'bg-white'}`}>全て</button>
               {Object.entries(TEST_TYPE_CONFIG).map(([k, v]) => <button key={k} onClick={() => setFilterType(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${filterType === k ? v.activeClass : 'bg-white'}`}>{v.label}</button>)}
             </div>
             <button onClick={() => setAddModalOpen(true)} className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Plus size={20} /></button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
             <button onClick={() => toggleSubject('4ko')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${selectedSubjects.includes('4ko') ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>4科</button>
             {(['math', 'japanese', 'science', 'social'] as Subject[]).map(s => <button key={s} onClick={() => toggleSubject(s)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap ${selectedSubjects.includes(s) ? `${SUBJECT_CONFIG[s].bg} text-white` : 'bg-white text-slate-500'}`}>{SUBJECT_CONFIG[s].short}</button>)}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scroll-smooth pb-28">
          <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 h-64 shrink-0">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                   <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                   <Tooltip contentStyle={{borderRadius: '12px'}} />
                   <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" />
                   {selectedSubjects.includes('4ko') && <Line type="monotone" dataKey="4ko" name="4科" stroke="#334155" strokeWidth={3} dot={{r:4}} />}
                   {selectedSubjects.includes('math') && <Line type="monotone" dataKey="math" name={SUBJECT_CONFIG.math.label} stroke={SUBJECT_CONFIG.math.hex} strokeWidth={2} dot={false} />}
                   {selectedSubjects.includes('japanese') && <Line type="monotone" dataKey="japanese" name={SUBJECT_CONFIG.japanese.label} stroke={SUBJECT_CONFIG.japanese.hex} strokeWidth={2} dot={false} />}
                   {selectedSubjects.includes('science') && <Line type="monotone" dataKey="science" name={SUBJECT_CONFIG.science.label} stroke={SUBJECT_CONFIG.science.hex} strokeWidth={2} dot={false} />}
                   {selectedSubjects.includes('social') && <Line type="monotone" dataKey="social" name={SUBJECT_CONFIG.social.label} stroke={SUBJECT_CONFIG.social.hex} strokeWidth={2} dot={false} />}
                </LineChart>
             </ResponsiveContainer>
          </div>

          <div>
             <h3 className="font-black text-slate-700 flex items-center gap-2 mb-3 px-1"><TrendingUp className="text-blue-500" size={20}/> テスト偏差値履歴</h3>
             <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-center text-xs">
                   <thead className="text-slate-400 bg-slate-50/50"><tr><th className="py-3 pl-3 text-left font-bold">テスト名</th><th className="py-3 font-bold">4科</th>{(['math', 'japanese', 'science', 'social'] as Subject[]).map(s => <th key={s} className={`py-3 font-bold ${SUBJECT_CONFIG[s].color}`}>{SUBJECT_CONFIG[s].short}</th>)}</tr></thead>
                   <tbody>
                      {tableData.map(t => (
                         <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 pl-3 text-left"><div className="text-[9px] text-slate-400 font-bold">{t.date}</div><div className="font-bold text-slate-700">{t.name}</div></td>
                            <td className="py-3 font-black text-slate-700 bg-slate-50/30">{t.total4.dev}</td>
                            {(['math', 'japanese', 'science', 'social'] as Subject[]).map(s => <td key={s} className={`py-3 font-bold ${t.subjects[s].dev >= 60 ? 'text-rose-500' : 'text-slate-500'}`}>{t.subjects[s].dev}</td>)}
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
       <AddTestResultOverlay isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onAdd={onAddTest} />
    </div>
  );
};

const AchievementsView = ({ tasks }: { tasks: Task[] }) => {
  // Format Date for Input: YYYY-MM-DD
  const formatDateForInput = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  const today = new Date();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(today.getDate() - 14);

  const [dateRange, setDateRange] = useState({
    start: formatDateForInput(twoWeeksAgo),
    end: formatDateForInput(today)
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['math', 'japanese', 'science', 'social']);

  const toggleSubject = (subj: string) => {
    setSelectedSubjects(prev => prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]);
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({
      start: formatDateForInput(start),
      end: formatDateForInput(end)
    });
  };

  // Process data based on dateRange
  const { chartData, pieData, maxStats } = useMemo(() => {
    // Parse input dates
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    // Adjust end date to include the full day
    end.setHours(23, 59, 59, 999);

    const dateMap = new Map<string, any>();
    const totalBySubject: Record<string, number> = { math: 0, japanese: 0, science: 0, social: 0 };
    
    // Helper to add minutes
    const addMinutes = (dateStr: string, subj: string, mins: number) => {
       // dateStr is 'M/D', need to handle year. Assuming current or previous year relative to today.
       const [m, d] = dateStr.split('/').map(Number);
       const todayYear = new Date().getFullYear();
       let hDate = new Date(todayYear, m - 1, d);
       
       // Simple year logic: if month is > today's month + buffer, maybe last year. 
       // For dummy data generated relative to today, year should be correct.
       // However, for generic robust handling we might need tasks to store full ISO date.
       // Here we assume tasks are within reasonable range relative to today.
       
       const dateKey = `${m}/${d}`; // Use M/D as key for chart
       
       if (!dateMap.has(dateKey)) {
         dateMap.set(dateKey, { name: dateKey, math: 0, japanese: 0, science: 0, social: 0, total: 0 });
       }
       const entry = dateMap.get(dateKey);
       entry[subj] += mins;
       entry.total += mins;
       totalBySubject[subj] += mins;
    };

    tasks.forEach(task => {
       task.history.forEach(h => {
          const [m, d] = h.date.split('/').map(Number);
          const hDate = new Date(new Date().getFullYear(), m - 1, d);
          
          // Year rollover check
          if (new Date().getMonth() < 3 && m > 9) hDate.setFullYear(hDate.getFullYear() - 1);

          if (hDate >= start && hDate <= end) {
             addMinutes(h.date, task.subject, Math.floor(h.duration / 60));
          }
       });
    });

    // Fill missing dates in range for chart continuity (limit to 31 days to prevent UI overload if range is huge)
    const data = [];
    const loopDate = new Date(start);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Limit displaying daily bars if range is too wide, but for now calculate all
    for(let i = 0; i <= diffDays; i++) {
       const key = `${loopDate.getMonth() + 1}/${loopDate.getDate()}`;
       if (dateMap.has(key)) {
         data.push(dateMap.get(key));
       } else {
         data.push({ name: key, math: 0, japanese: 0, science: 0, social: 0, total: 0 });
       }
       loopDate.setDate(loopDate.getDate() + 1);
    }

    // Pie Data
    const totalMinutes = Object.values(totalBySubject).reduce((a, b) => a + b, 0);
    const pData = Object.entries(totalBySubject)
       .filter(([k, v]) => selectedSubjects.includes(k) && v > 0)
       .map(([k, v]) => ({ 
         name: SUBJECT_CONFIG[k as Subject].label, 
         value: v, 
         color: SUBJECT_CONFIG[k as Subject].hex,
         percent: totalMinutes > 0 ? Math.round((v / totalMinutes) * 100) : 0
       }));

    // Max Stats
    let maxTotal = { val: 0, date: '-' };
    const maxSubj = { math: {val:0, date:'-'}, japanese: {val:0, date:'-'}, science: {val:0, date:'-'}, social: {val:0, date:'-'} };

    // We scan dateMap directly to find maxes (ignoring empty filled days for efficiency)
    for (const d of dateMap.values()) {
       if (d.total > maxTotal.val) maxTotal = { val: d.total, date: d.name };
       (['math', 'japanese', 'science', 'social'] as Subject[]).forEach(s => {
          if (d[s] > maxSubj[s].val) maxSubj[s] = { val: d[s], date: d.name };
       });
    }

    return { chartData: data, pieData: pData, maxStats: { total: maxTotal, subjects: maxSubj } };

  }, [tasks, dateRange, selectedSubjects]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
       <div className="bg-white/90 backdrop-blur-md sticky top-0 z-20 px-4 py-3 border-b border-slate-100 shadow-sm space-y-3">
          {/* Date Picker & Presets */}
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex gap-2 items-center">
                   <CalendarIcon size={16} className="text-slate-400" />
                   <input 
                     type="date" 
                     value={dateRange.start} 
                     onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                     className="bg-transparent text-xs font-bold text-slate-600 outline-none w-24"
                   />
                   <span className="text-slate-300">-</span>
                   <input 
                     type="date" 
                     value={dateRange.end} 
                     onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                     className="bg-transparent text-xs font-bold text-slate-600 outline-none w-24"
                   />
                </div>
             </div>
             
             <div className="flex gap-2">
                {[
                  { l: '1週間', d: 7 }, 
                  { l: '2週間', d: 14 }, 
                  { l: '1ヶ月', d: 30 }
                ].map(r => (
                  <button 
                    key={r.l} 
                    onClick={() => setPresetRange(r.d)} 
                    className="flex-1 py-1.5 bg-white border border-slate-100 text-xs font-bold rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
                  >
                    {r.l}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
             {(['math', 'japanese', 'science', 'social'] as Subject[]).map(s => (
               <button key={s} onClick={() => toggleSubject(s)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedSubjects.includes(s) ? `${SUBJECT_CONFIG[s].bg} text-white` : 'bg-white text-slate-300'}`}>
                 {SUBJECT_CONFIG[s].short}
               </button>
             ))}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scroll-smooth pb-28">
          {/* Main Chart */}
          <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-100 h-64 shrink-0">
             <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><BarChart2 size={14}/> 学習時間の推移 (分)</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={15} />
                   <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px'}} />
                   {selectedSubjects.includes('math') && <Bar dataKey="math" name={SUBJECT_CONFIG.math.label} stackId="a" fill={SUBJECT_CONFIG.math.hex} />}
                   {selectedSubjects.includes('japanese') && <Bar dataKey="japanese" name={SUBJECT_CONFIG.japanese.label} stackId="a" fill={SUBJECT_CONFIG.japanese.hex} />}
                   {selectedSubjects.includes('science') && <Bar dataKey="science" name={SUBJECT_CONFIG.science.label} stackId="a" fill={SUBJECT_CONFIG.science.hex} />}
                   {selectedSubjects.includes('social') && <Bar dataKey="social" name={SUBJECT_CONFIG.social.label} stackId="a" fill={SUBJECT_CONFIG.social.hex} />}
                </BarChart>
             </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Pie Chart with Details */}
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 min-h-[14rem] flex flex-col items-center">
                <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1 w-full"><PieChartIcon size={14}/> 科目比率</h3>
                {pieData.length > 0 ? (
                  <>
                    <div className="flex-1 w-full h-32 relative mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '8px', fontSize: '10px'}} itemStyle={{padding: 0}} />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full flex flex-col gap-1.5">
                        {pieData.map(d => (
                            <div key={d.name} className="flex items-center justify-between text-[10px] w-full">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="font-bold text-slate-600 truncate max-w-[3rem]">{d.name}</span>
                                </div>
                                <div className="text-right whitespace-nowrap">
                                    <span className="font-mono font-bold text-slate-700">{Math.floor(d.value / 60)}h{d.value % 60}m</span>
                                    <span className="text-slate-400 ml-1 font-bold">({d.percent}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                  </>
                ) : <div className="text-xs text-slate-300 mt-8">データなし</div>}
             </div>

             {/* Stats */}
             <div className="space-y-3">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg">
                   <div className="text-[10px] text-slate-300 font-bold mb-1">期間内ベスト(1日)</div>
                   <div className="text-2xl font-black">{Math.floor(maxStats.total.val / 60)}<span className="text-xs font-normal opacity-70">h</span>{maxStats.total.val % 60}<span className="text-xs font-normal opacity-70">m</span></div>
                   <div className="text-xs text-slate-400 text-right mt-1">{maxStats.total.date}</div>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
                   <div className="text-[10px] text-slate-400 font-bold mb-2">科目別ベスト</div>
                   <div className="space-y-1">
                      {(['math', 'japanese', 'science', 'social'] as Subject[]).map(s => (
                         selectedSubjects.includes(s) && maxStats.subjects[s].val > 0 && (
                            <div key={s} className="flex justify-between items-center text-xs">
                               <span className={`font-bold ${SUBJECT_CONFIG[s].color}`}>{SUBJECT_CONFIG[s].short}</span>
                               <span className="font-mono">{maxStats.subjects[s].val}m <span className="text-[9px] text-slate-300">({maxStats.subjects[s].date})</span></span>
                            </div>
                         )
                      ))}
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default function StudyApp() {
  const [activeTab, setActiveTab] = useState('daily');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{title: string, message: string, onConfirm: () => void} | null>(null);

  // Persistence: Load
  useEffect(() => {
    const loadedTasks = localStorage.getItem('studyapp_tasks');
    const loadedTests = localStorage.getItem('studyapp_tests');
    
    if (loadedTasks && JSON.parse(loadedTasks).length > 0) {
      setTasks(JSON.parse(loadedTasks));
    } else {
      setTasks(INITIAL_TASKS);
    }

    if (loadedTests && JSON.parse(loadedTests).length > 0) {
      setTests(JSON.parse(loadedTests));
    } else {
      setTests(INITIAL_TESTS); // Use the fully populated INITIAL_TESTS
    }
    setIsLoaded(true);
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('studyapp_tasks', JSON.stringify(tasks));
      localStorage.setItem('studyapp_tests', JSON.stringify(tests));
    }
  }, [tasks, tests, isLoaded]);

  const unitsWithTasks = Array.from(new Set(tasks.map(t => t.unit))).sort((a, b) => {
    const numA = parseInt(a.replace('第', '').replace('回', '')) || 0;
    const numB = parseInt(b.replace('第', '').replace('回', '')) || 0;
    return numB - numA;
  });

  const addUnitWithPresets = (unitNumber: number) => {
    const unitName = `第${unitNumber}回`;
    const newTasks: Task[] = [];
    (Object.keys(SUBJECT_CONFIG) as Subject[]).forEach(subject => {
        CURRICULUM_PRESETS[subject].forEach(preset => {
            preset.items.forEach((item, index) => {
                newTasks.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
                    unit: unitName,
                    subject: subject,
                    category: preset.category,
                    title: item,
                    materialName: `${preset.category} - ${item}`,
                    status: 'not_started',
                    currentDuration: 0,
                    currentMemo: '',
                    history: [],
                    createdAt: new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                });
            });
        });
    });
    setTasks(prev => [...newTasks, ...prev]);
    setSelectedUnit(unitName);
  };

  const deleteUnit = (unit: string) => {
    setTasks(prev => prev.filter(t => t.unit !== unit));
    if (selectedUnit === unit) setSelectedUnit(null);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const cycleStatus = (task: Task) => {
    const next = task.status === 'not_started' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'not_started';
    updateTask(task.id, { status: next });
  };

  const saveHistory = (task: Task) => {
    if (task.currentDuration === 0) return;
    const newHistory = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
      duration: task.currentDuration,
      memo: task.currentMemo
    };
    updateTask(task.id, { history: [...task.history, newHistory], currentDuration: 0, currentMemo: '' });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const onAddTask = (unit: string, subject: Subject, title: string, category: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      unit,
      subject,
      category,
      title,
      materialName: `${category} - ${title}`,
      status: 'not_started',
      currentDuration: 0,
      currentMemo: '',
      history: [],
      createdAt: new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    };
    setTasks(prev => [...prev, newTask]);
  };

  const addTestResult = (test: TestResult) => {
    setTests(prev => [test, ...prev]);
  };

  if (!isLoaded) return <div className="flex h-screen items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <header className="bg-white/80 backdrop-blur-xl pt-4 sticky top-0 z-30">
        <div className="h-16 flex items-center justify-between px-6">
          <h1 className="font-black text-xl text-slate-800 tracking-tight">Level Up Study<span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold align-middle">4年生</span></h1>
          <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">{new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' })}</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain no-scrollbar flex flex-col">
        {activeTab === 'daily' ? (
          <DailyView 
            tasks={tasks} updateTask={updateTask} cycleStatus={cycleStatus} saveHistory={saveHistory} 
            deleteTask={deleteTask} deleteUnit={deleteUnit} setTasks={setTasks} setAddModalOpen={setAddModalOpen} 
            selectedUnit={selectedUnit} setSelectedUnit={setSelectedUnit} unitsWithTasks={unitsWithTasks} onAddTask={onAddTask}
            setDeleteConfirmation={setDeleteConfirmation}
          />
        ) : activeTab === 'tests' ? (
          <TestsView tests={tests} onAddTest={addTestResult} />
        ) : (
          <AchievementsView tasks={tasks} />
        )}
      </main>

      <nav className="bg-white/90 backdrop-blur-lg border-t border-slate-100 fixed bottom-0 left-0 right-0 z-40 pb-6 max-w-md mx-auto rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <div className="h-20 flex justify-around items-center px-4">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 flex flex-col items-center justify-center h-full space-y-1 transition-all duration-300 ${activeTab === 'daily' ? 'text-blue-600 -translate-y-1' : 'text-slate-300 hover:text-slate-400'}`}>
            <div className={`p-1.5 rounded-xl ${activeTab === 'daily' ? 'bg-blue-50' : ''}`}><Zap size={26} strokeWidth={activeTab === 'daily' ? 3 : 2.5} fill={activeTab === 'daily' ? "currentColor" : "none"} /></div><span className="text-[10px] font-black">学習</span>
          </button>
          <button onClick={() => setActiveTab('achievements')} className={`flex-1 flex flex-col items-center justify-center h-full space-y-1 transition-all duration-300 ${activeTab === 'achievements' ? 'text-blue-600 -translate-y-1' : 'text-slate-300 hover:text-slate-400'}`}>
             <div className={`p-1.5 rounded-xl ${activeTab === 'achievements' ? 'bg-blue-50' : ''}`}><BarChart2 size={26} strokeWidth={activeTab === 'achievements' ? 3 : 2.5} /></div><span className="text-[10px] font-black">実績</span>
          </button>
          <button onClick={() => setActiveTab('tests')} className={`flex-1 flex flex-col items-center justify-center h-full space-y-1 transition-all duration-300 ${activeTab === 'tests' ? 'text-blue-600 -translate-y-1' : 'text-slate-300 hover:text-slate-400'}`}>
             <div className={`p-1.5 rounded-xl ${activeTab === 'tests' ? 'bg-blue-50' : ''}`}><Award size={26} strokeWidth={activeTab === 'tests' ? 3 : 2.5} /></div><span className="text-[10px] font-black">成績</span>
          </button>
        </div>
      </nav>

      <CreateUnitOverlay isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} onCreate={addUnitWithPresets} />
      
      <DeleteConfirmModal 
        isOpen={!!deleteConfirmation} 
        onClose={() => setDeleteConfirmation(null)} 
        onConfirm={deleteConfirmation?.onConfirm || (() => {})} 
        title={deleteConfirmation?.title} 
        message={deleteConfirmation?.message} 
      />
    </div>
  );
}