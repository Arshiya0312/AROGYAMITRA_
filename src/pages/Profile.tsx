import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Scale, 
  Ruler, 
  Target, 
  Activity, 
  Save, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useProfileStore } from '../store/profileStore';

export default function Profile() {
  const { profile, fetchProfile, updateProfile, loading } = useProfileStore();
  const [formData, setFormData] = useState({
    age: 25,
    gender: 'Male',
    weight: 70,
    height: 175,
    goal: 'Muscle Gain',
    activity_level: 'Moderate',
    dietary_preferences: 'None',
    medications: '',
    health_conditions: '',
    allergies: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        age: profile.age || 25,
        gender: profile.gender || 'Male',
        weight: profile.weight || 70,
        height: profile.height || 175,
        goal: profile.goal || 'Muscle Gain',
        activity_level: profile.activity_level || 'Moderate',
        dietary_preferences: profile.dietary_preferences || 'None',
        medications: profile.medications || '',
        health_conditions: profile.health_conditions || '',
        allergies: profile.allergies || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    alert('Profile updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Your Profile</h1>
        <p className="text-stone-500 mt-1">Personalize your experience to get better AI recommendations.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Physical Stats */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <Scale size={20} className="text-emerald-600" />
              Physical Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Goals & Activity */}
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <h3 className="font-bold text-stone-900 flex items-center gap-2">
              <Target size={20} className="text-emerald-600" />
              Goals & Lifestyle
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Primary Goal</label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option>Weight Loss</option>
                <option>Muscle Gain</option>
                <option>Endurance</option>
                <option>General Fitness</option>
                <option>Flexibility</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Activity Level</label>
              <select
                value={formData.activity_level}
                onChange={(e) => setFormData({ ...formData, activity_level: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                <option>Sedentary</option>
                <option>Lightly Active</option>
                <option>Moderate</option>
                <option>Very Active</option>
                <option>Extra Active</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Dietary Preferences</label>
              <input
                type="text"
                value={formData.dietary_preferences}
                onChange={(e) => setFormData({ ...formData, dietary_preferences: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="e.g. Vegetarian, Keto, No Nuts"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px]"
                placeholder="e.g. Peanuts, Shellfish, Penicillin"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Health Conditions</label>
              <textarea
                value={formData.health_conditions}
                onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px]"
                placeholder="e.g. Hypertension, Diabetes, Asthma"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Current Medications</label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px]"
                placeholder="e.g. Metformin, Albuterol"
              />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-start gap-4">
          <AlertCircle className="text-emerald-600 shrink-0" size={24} />
          <div>
            <p className="text-sm text-emerald-900 font-medium">
              Your profile data is used by AROMI to generate safe and effective workout and meal plans. Keep it updated for the best results!
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            <Save size={20} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
