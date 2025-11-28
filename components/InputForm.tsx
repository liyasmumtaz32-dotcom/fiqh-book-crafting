
import React, { useState } from 'react';
import { GenerationParams } from '../types';
import { BookOpen, Feather, Globe, Users, FileText, Library, Languages, List } from 'lucide-react';

interface InputFormProps {
  onGenerate: (params: GenerationParams) => void;
  isGenerating: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onGenerate, isGenerating }) => {
  const [params, setParams] = useState<GenerationParams>({
    topic: '',
    specificChapters: '',
    authorName: '',
    madzhab: 'Shafi\'i',
    targetAudience: 'General Public',
    includeMultimedia: true,
    pageCount: 20,
    referenceCount: 15,
    language: 'Indonesia',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(params);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-islamic-green p-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        <h2 className="text-3xl font-serif font-bold relative z-10">Start Your Manuscript</h2>
        <p className="opacity-90 mt-2 relative z-10">Define the parameters for your Fiqh masterpiece</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <BookOpen size={16} className="text-islamic-gold" />
            Book Topic / Title
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent outline-none transition"
            placeholder="e.g., The Fiqh of Modern Islamic Finance"
            value={params.topic}
            onChange={(e) => setParams({ ...params, topic: e.target.value })}
          />
        </div>

        {/* Specific Content Input (New Feature) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <List size={16} className="text-islamic-gold" />
            Specific Chapter Material / Content
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent outline-none transition"
            placeholder="Outline specific chapters or content you want to include (e.g., Chapter 1: Definition, Chapter 2: Rulings...)"
            rows={3}
            value={params.specificChapters || ''}
            onChange={(e) => setParams({ ...params, specificChapters: e.target.value })}
          />
        </div>

        {/* Author Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Feather size={16} className="text-islamic-gold" />
            Author Name
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent outline-none transition"
            placeholder="e.g., Ust. Antoni"
            value={params.authorName}
            onChange={(e) => setParams({ ...params, authorName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Madzhab Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Globe size={16} className="text-islamic-gold" />
              School of Thought (Madzhab)
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent outline-none bg-white"
              value={params.madzhab}
              onChange={(e) => setParams({ ...params, madzhab: e.target.value })}
            >
              <option value="Shafi'i">Shafi'i</option>
              <option value="Hanafi">Hanafi</option>
              <option value="Maliki">Maliki</option>
              <option value="Hanbali">Hanbali</option>
              <option value="Comparative (Muqaran)">Comparative (Muqaran)</option>
            </select>
          </div>

          {/* Audience Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users size={16} className="text-islamic-gold" />
              Target Audience
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent outline-none bg-white"
              value={params.targetAudience}
              onChange={(e) => setParams({ ...params, targetAudience: e.target.value })}
            >
              <option value="General Public">General Public</option>
              <option value="Academic/Scholarly">Academic/Scholarly</option>
              <option value="University Students">University Students</option>
              <option value="Children">Children</option>
            </select>
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Languages size={16} className="text-islamic-gold" />
              Output Language
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-islamic-green focus:border-transparent outline-none bg-white"
              value={params.language}
              onChange={(e) => setParams({ ...params, language: e.target.value })}
            >
              <option value="Indonesia">Bahasa Indonesia</option>
              <option value="Arabic">Arabic (العربية)</option>
              <option value="English">English</option>
              <option value="German">German (Deutsch)</option>
              <option value="French">French (Français)</option>
              <option value="Malay">Bahasa Malaysia (Melayu)</option>
            </select>
        </div>

        {/* Page Count and References Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
           {/* Page Count */}
           <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText size={16} className="text-islamic-gold" />
                Target Page Count
                </label>
                <span className="text-sm font-bold text-islamic-green bg-white px-2 py-0.5 rounded border border-gray-200">
                    {params.pageCount} Pages
                </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-islamic-green"
              value={params.pageCount}
              onChange={(e) => setParams({ ...params, pageCount: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500">Affects depth (1-100).</p>
          </div>

          {/* Reference Count */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Library size={16} className="text-islamic-gold" />
                References
                </label>
                <span className="text-sm font-bold text-islamic-green bg-white px-2 py-0.5 rounded border border-gray-200">
                    {params.referenceCount} Sources
                </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-islamic-green"
              value={params.referenceCount}
              onChange={(e) => setParams({ ...params, referenceCount: parseInt(e.target.value) })}
            />
             <p className="text-xs text-gray-500">Bibliography size (1-50).</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg transform transition-all hover:-translate-y-1 ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-islamic-green to-emerald-800 text-white hover:shadow-xl'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Crafting Manuscript...
            </span>
          ) : (
            "Generate Book Structure"
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;