import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  Award, 
  Flame, 
  Activity,
  ChevronRight,
  Clock,
  Dumbbell,
  Utensils,
  Sparkles,
  Heart,
  Pill,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import axios from 'axios';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Mon', calories: 2100, weight: 75.2 },
  { name: 'Tue', calories: 1950, weight: 75.0 },
  { name: 'Wed', calories: 2300, weight: 74.8 },
  { name: 'Thu', calories: 2000, weight: 74.9 },
  { name: 'Fri', calories: 2200, weight: 74.6 },
  { name: 'Sat', calories: 2500, weight: 74.5 },
  { name: 'Sun', calories: 1800, weight: 74.3 },
];

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    const fetchPlans = async () => {
      try {
        const [wRes, nRes] = await Promise.all([
          axios.get('/api/ai/workout', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/ai/nutrition', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (wRes.data?.length > 0) setWorkoutPlan(wRes.data[0]);
        if (nRes.data?.length > 0) setNutritionPlan(nRes.data[0]);
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchPlans();
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-stone-500 mt-1">Here's your wellness overview for today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-stone-200 shadow-sm">
          <Calendar size={18} className="text-emerald-600" />
          <span className="text-sm font-medium text-stone-600">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Daily Streak', value: '12 Days', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Active Calories', value: '450 kcal', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Workouts Done', value: '8', icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Goal Progress', value: '68%', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Today</span>
            </div>
            <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
            <p className="text-sm text-stone-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-stone-900">Weight Progress</h3>
            <select className="text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-stone-900 mb-6">Today's Focus</h3>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {workoutPlan ? (
              <div className="bg-emerald-50 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <Dumbbell size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900">{workoutPlan.title}</h4>
                    <p className="text-xs text-emerald-600 font-medium">Workout Ready</p>
                  </div>
                </div>
                <Link to="/workouts" className="w-full bg-stone-900 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all text-sm">
                  Go to Workouts
                  <ChevronRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="bg-stone-50 rounded-3xl p-6 border border-dashed border-stone-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-400">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">No Workout Plan</h4>
                    <p className="text-xs text-stone-500">Generate one now</p>
                  </div>
                </div>
                <Link to="/workouts" className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all text-sm">
                  Generate Plan
                </Link>
              </div>
            )}

            {nutritionPlan ? (
              <div className="bg-orange-50 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Utensils size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-900">Meal Plan Ready</h4>
                    <p className="text-xs text-orange-600 font-medium">{nutritionPlan.meals?.length || 0} Meals Today</p>
                  </div>
                </div>
                <Link to="/nutrition" className="w-full bg-stone-900 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all text-sm">
                  Go to Nutrition
                  <ChevronRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="bg-stone-50 rounded-3xl p-6 border border-dashed border-stone-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-400">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">No Meal Plan</h4>
                    <p className="text-xs text-stone-500">Generate one now</p>
                  </div>
                </div>
                <Link to="/nutrition" className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all text-sm">
                  Generate Plan
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity / Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-6">Health & Medications</h3>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
              <AlertTriangle className="text-orange-500 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Allergies</p>
                <p className="text-sm text-orange-900 font-medium">
                  {profile?.allergies || 'No allergies listed'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
              <Heart className="text-red-500 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Conditions</p>
                <p className="text-sm text-red-900 font-medium">
                  {profile?.health_conditions || 'No conditions listed'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
              <Pill className="text-blue-500 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Medications</p>
                <p className="text-sm text-blue-900 font-medium">
                  {profile?.medications || 'No medications listed'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-6">AI Health Insight</h3>
          <div className="flex gap-4 items-start p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                "Your consistency has improved by 15% this week! Based on your sleep patterns, I recommend a slightly lighter workout tomorrow to prevent fatigue."
              </p>
              <button className="text-xs font-bold text-emerald-700 mt-3 flex items-center gap-1 hover:underline">
                View Full Analysis <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
