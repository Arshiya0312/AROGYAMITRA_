import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Utensils, 
  Sparkles, 
  RefreshCw, 
  Apple, 
  Coffee, 
  Flame, 
  Droplets, 
  ShoppingBag,
  ChevronRight,
  PieChart as PieChartIcon,
  Calendar,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { generateNutritionPlan } from '../services/geminiService';

interface Meal {
  type: string;
  name: string;
  calories: number;
  protein: string;
  carbs: string;
  fats: string;
  ingredients: string[];
}

interface NutritionDay {
  day: string;
  meals: Meal[];
}

export default function Nutrition() {
  const [plan, setPlan] = useState<NutritionDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [cuisine, setCuisine] = useState<'Global' | 'Indian'>('Global');
  const { token } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
    const fetchExistingPlan = async () => {
      try {
        const res = await axios.get('/api/ai/nutrition', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.length > 0) {
          setPlan(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch existing nutrition plan:', e);
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
        dietary_preferences: 'None'
      };

      const generatedPlan = await generateNutritionPlan(userProfile, cuisine);
      setPlan(generatedPlan);

      // Save to backend
      await axios.post('/api/ai/save-nutrition', { plan: generatedPlan }, {
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

  const totalCals = plan[activeDay]?.meals?.reduce((acc, m) => acc + m.calories, 0) || 0;

  const syncToCalendar = () => {
    const dayPlan = plan[activeDay];
    if (!dayPlan) return;

    const details = dayPlan.meals.map(m => `${m.type}: ${m.name} (${m.calories} kcal)`).join('\n');
    const title = `Nutrition Plan: ${dayPlan.day}`;
    
    // Create a date for today + activeDay
    const date = new Date();
    date.setDate(date.getDate() + activeDay);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const start = `${dateStr}T080000Z`;
    const end = `${dateStr}T200000Z`;

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}`;
    window.open(url, '_blank');
  };

  const getBigBasketLink = (ingredient: string) => {
    return `https://www.bigbasket.com/ps/?q=${encodeURIComponent(ingredient)}`;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">AI Nutrition Planner</h1>
          <p className="text-stone-500 mt-1">Personalized meal plans with macro tracking and grocery integration.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => setCuisine('Global')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${cuisine === 'Global' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Global
            </button>
            <button
              onClick={() => setCuisine('Indian')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${cuisine === 'Indian' ? 'bg-white text-emerald-600 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Indian
            </button>
          </div>
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
                <p className="font-bold">Meal Plan</p>
              </button>
            ))}
            
            <div className="mt-8 p-6 bg-stone-900 rounded-3xl text-white">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-emerald-400" />
                Grocery List
              </h4>
              <p className="text-xs text-stone-400 mb-4">Auto-generated based on your weekly plan.</p>
              <button className="w-full bg-emerald-600 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all">
                Export to Instamart
              </button>
            </div>
          </div>

          {/* Nutrition Details */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                  <Flame size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Calories</p>
                  <p className="text-xl font-bold text-stone-900">{totalCals} kcal</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                  <Droplets size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Water Goal</p>
                  <p className="text-xl font-bold text-stone-900">3.5 Liters</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                  <PieChartIcon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Macro Split</p>
                  <p className="text-xl font-bold text-stone-900">40/30/30</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {plan[activeDay]?.meals?.map((meal, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        meal.type === 'Breakfast' ? 'bg-yellow-50 text-yellow-600' :
                        meal.type === 'Lunch' ? 'bg-emerald-50 text-emerald-600' :
                        meal.type === 'Snack' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {meal.type === 'Breakfast' ? <Coffee size={24} /> : <Utensils size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{meal.type}</p>
                        <h3 className="text-lg font-bold text-stone-900">{meal.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-900">{meal.calories} kcal</p>
                        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tighter">
                          P: {meal.protein} • C: {meal.carbs} • F: {meal.fats}
                        </p>
                      </div>
                      <button className="p-3 bg-stone-50 text-stone-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-stone-50">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Ingredients</p>
                    <div className="flex flex-wrap gap-2">
                      {meal.ingredients.map((ing, j) => (
                        <a 
                          key={j} 
                          href={getBigBasketLink(ing)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-stone-50 text-stone-600 rounded-lg text-xs font-medium border border-stone-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center gap-1"
                        >
                          {ing}
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Utensils size={40} />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Fuel your body right</h2>
          <p className="text-stone-500 max-w-md mx-auto mb-8">
            Get a personalized 7-day meal plan with Indian & global cuisine options, macro tracking, and auto-grocery lists.
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
