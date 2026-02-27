import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  ChevronRight,
  Clock,
  Zap,
  Youtube,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { generateWorkoutPlan } from '../services/geminiService';

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  intensity: string;
  youtube_search_query: string;
}

interface WorkoutDay {
  day: string;
  title: string;
  exercises: Exercise[];
}

export default function Workouts() {
  const [plan, setPlan] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const { token } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
    const fetchExistingPlan = async () => {
      try {
        const res = await axios.get('/api/ai/workout', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.length > 0) {
          setPlan(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch existing workout plan:', e);
      }
    };
    if (token) fetchExistingPlan();
  }, [token]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const userProfile = profile || {
        age: 25,
        gender: 'Male',
        weight: 70,
        height: 175,
        goal: 'General Fitness',
        activity_level: 'Moderate'
      };
      
      const generatedPlan = await generateWorkoutPlan(userProfile);
      setPlan(generatedPlan);
      
      // Save to backend
      await axios.post('/api/ai/save-workout', { plan: generatedPlan }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e: any) {
      console.error(e);
      if (e.message === "AI configuration missing") {
        alert("AI configuration is missing. Please check your environment settings.");
      } else if (e.message?.includes("Invalid API Key")) {
        alert("Invalid Gemini API Key. Please check your settings.");
      } else {
        alert('Failed to generate plan. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const syncToCalendar = () => {
    const dayPlan = plan[activeDay];
    if (!dayPlan) return;

    const details = dayPlan.exercises.map(ex => `${ex.name}: ${ex.sets}x${ex.reps} (${ex.intensity})`).join('\n');
    const title = `Workout: ${dayPlan.title}`;
    
    const date = new Date();
    date.setDate(date.getDate() + activeDay);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const start = `${dateStr}T070000Z`;
    const end = `${dateStr}T083000Z`;

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">AI Workout Engine</h1>
          <p className="text-stone-500 mt-1">Adaptive 7-day training plans tailored to your goals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={syncToCalendar}
            className="bg-white text-stone-600 border border-stone-200 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:border-emerald-300 hover:text-emerald-600 transition-all"
          >
            <Calendar size={20} />
            Sync to Calendar
          </button>
          <button
            onClick={generatePlan}
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {plan.length > 0 ? 'Regenerate Plan' : 'Generate My Plan'}
          </button>
        </div>
      </header>

      {plan.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Day Selector */}
          <div className="lg:col-span-1 space-y-2">
            {plan.map((day, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  activeDay === i 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' 
                    : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{day.day}</p>
                <p className="font-bold truncate">{day.title}</p>
              </button>
            ))}
          </div>

          {/* Workout Details */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDay}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">{plan[activeDay].title}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs font-bold text-stone-400 uppercase tracking-wider">
                        <Clock size={14} /> 45-60 MIN
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                        <Zap size={14} /> {plan[activeDay].exercises.length} Exercises
                      </span>
                    </div>
                  </div>
                  <button className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors">
                    <Play size={24} fill="currentColor" />
                  </button>
                </div>

                <div className="space-y-4">
                  {plan[activeDay].exercises.map((ex, i) => (
                    <div 
                      key={i}
                      className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center font-bold group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900">{ex.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-stone-500">{ex.sets} Sets × {ex.reps} Reps</span>
                            <span className="w-1 h-1 bg-stone-300 rounded-full" />
                            <span className="text-xs font-medium text-stone-500">{ex.rest} Rest</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          ex.intensity.toLowerCase().includes('high') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {ex.intensity}
                        </span>
                        <a 
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.youtube_search_query)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                        >
                          <Youtube size={20} />
                        </a>
                        <button className="p-2 text-stone-400 hover:text-emerald-600 transition-colors">
                          <CheckCircle2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Dumbbell size={40} />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Ready to start training?</h2>
          <p className="text-stone-500 max-w-md mx-auto mb-8">
            Click the button above and AROMI will create a personalized 7-day workout plan based on your profile and goals.
          </p>
          <button
            onClick={generatePlan}
            disabled={loading}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold inline-flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
            Generate My Plan
          </button>
        </div>
      )}
    </div>
  );
}
