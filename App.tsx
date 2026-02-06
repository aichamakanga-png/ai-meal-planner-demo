
import React, { useState, useCallback } from 'react';
import { UserInputs, MealPlanResponse, DayPlan, ShoppingItem } from './types';
import { generateMealPlan, regenerateSpecificDay } from './services/geminiService';

// --- UI Components ---

interface InputFieldProps {
  label: string;
  children: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, children }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-sm font-semibold text-slate-600 ml-1">{label}</label>
    {children}
  </div>
);

interface SectionTitleProps {
  title: string;
  icon?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-4 mt-8">
    <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
  </div>
);

interface DayCardProps {
  dayPlan: DayPlan;
  onRegenerate: (day: number) => void | Promise<void>;
  isRegenerating: boolean;
}

const DayCard: React.FC<DayCardProps> = ({ 
  dayPlan, 
  onRegenerate, 
  isRegenerating 
}) => {
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayName = dayNames[dayPlan.day - 1] || `Day ${dayPlan.day}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-emerald-500 px-6 py-4 flex justify-between items-center text-white">
        <h3 className="text-xl font-bold">{dayName}</h3>
        <button
          onClick={() => onRegenerate(dayPlan.day)}
          disabled={isRegenerating}
          className="bg-white/20 hover:bg-white/30 text-xs px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50"
        >
          {isRegenerating ? 'Refreshing...' : 'Regenerate'}
        </button>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 block mb-1">Breakfast</span>
          <h4 className="font-bold text-slate-800 text-lg mb-1">{dayPlan.breakfast.title}</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{dayPlan.breakfast.summary}</p>
        </div>
        <div className="pt-6 border-t border-slate-50">
          <span className="text-[10px] uppercase tracking-wider font-bold text-sky-600 block mb-1">Lunch</span>
          <h4 className="font-bold text-slate-800 text-lg mb-1">{dayPlan.lunch.title}</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{dayPlan.lunch.summary}</p>
        </div>
        <div className="pt-6 border-t border-slate-50">
          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 block mb-1">Dinner</span>
          <h4 className="font-bold text-slate-800 text-lg mb-1">{dayPlan.dinner.title}</h4>
          <p className="text-sm text-slate-500 leading-relaxed">{dayPlan.dinner.summary}</p>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [inputs, setInputs] = useState<UserInputs>({
    goal: 'save money',
    diet: 'omnivore',
    allergies: '',
    timePerMeal: '30 mins',
    budget: '$100',
    existingIngredients: '',
    batchCooking: false
  });

  const [loading, setLoading] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setInputs(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMealPlan(inputs);
      setMealPlan(result);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateDay = async (dayNumber: number) => {
    if (!mealPlan) return;
    setRegeneratingDay(dayNumber);
    try {
      const newDay = await regenerateSpecificDay(inputs, dayNumber, mealPlan.plan);
      setMealPlan(prev => {
        if (!prev) return null;
        return {
          ...prev,
          plan: prev.plan.map(d => d.day === dayNumber ? newDay : d)
        };
      });
    } catch (err) {
      setError("Failed to regenerate day. Check your connection.");
    } finally {
      setRegeneratingDay(null);
    }
  };

  const groupShoppingList = (list: ShoppingItem[]) => {
    return list.reduce((acc, curr) => {
      if (!acc[curr.category]) acc[curr.category] = [];
      acc[curr.category].push(curr.item);
      return acc;
    }, {} as Record<string, string[]>);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black">AI</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-sky-600">
              Meal Planner
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Your Preferences</h2>
            <div className="space-y-5">
              
              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div className="flex flex-col">
                  <span className="font-bold text-emerald-900 text-sm">Batch Cooking Mode</span>
                  <span className="text-[10px] text-emerald-700">Cook 2x/week, reuse often</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="batchCooking"
                    checked={inputs.batchCooking}
                    onChange={handleInputChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <InputField label="Primary Goal">
                <select 
                  name="goal" 
                  value={inputs.goal} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                >
                  <option value="lose fat">Lose Fat</option>
                  <option value="gain muscle">Gain Muscle</option>
                  <option value="save money">Save Money</option>
                </select>
              </InputField>

              <InputField label="Dietary Pattern">
                <select 
                  name="diet" 
                  value={inputs.diet} 
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                >
                  <option value="omnivore">Omnivore</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </InputField>

              <InputField label="Allergies / Restrictions">
                <input 
                  type="text"
                  name="allergies"
                  placeholder="e.g. Peanuts, Shellfish..."
                  value={inputs.allergies}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                />
              </InputField>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Time per Meal">
                  <input 
                    type="text"
                    name="timePerMeal"
                    value={inputs.timePerMeal}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                </InputField>
                <InputField label="Weekly Budget">
                  <input 
                    type="text"
                    name="budget"
                    value={inputs.budget}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                </InputField>
              </div>

              <InputField label="Ingredients on Hand">
                <textarea 
                  name="existingIngredients"
                  placeholder="What's in your pantry?"
                  rows={3}
                  value={inputs.existingIngredients}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none"
                />
              </InputField>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Plan'
                )}
              </button>
              {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {!mealPlan && !loading && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl h-96 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Plan Yet</h3>
                <p className="text-slate-500 max-w-sm">
                  Adjust your preferences on the left and click "Generate Plan" to start your 7-day culinary journey.
                </p>
              </div>
            )}

            {mealPlan && (
              <>
                <SectionTitle title="Weekly Menu" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mealPlan.plan.map((day) => (
                    <DayCard 
                      key={day.day} 
                      dayPlan={day} 
                      onRegenerate={handleRegenerateDay} 
                      isRegenerating={regeneratingDay === day.day}
                    />
                  ))}
                </div>

                <div id="shopping-list" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-12">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Shopping List</h2>
                    <button 
                      onClick={() => window.print()}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print List
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Object.entries(groupShoppingList(mealPlan.shoppingList)).map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2 mb-4">
                          {category}
                        </h4>
                        <ul className="space-y-2">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm group">
                              <div className="mt-1 w-4 h-4 rounded border border-slate-300 flex-shrink-0 group-hover:border-emerald-500 cursor-pointer"></div>
                              <span className="group-hover:text-emerald-700 transition-colors">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {!mealPlan && !loading && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
          <button
            onClick={handleGenerate}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
          >
            Generate My Plan
          </button>
        </div>
      )}
    </div>
  );
}
