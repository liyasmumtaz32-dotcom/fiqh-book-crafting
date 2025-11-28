
import React, { useState, useEffect } from 'react';
import { BookStructure, GenerationParams, AppState } from './types';
import { generateBookContent } from './services/geminiService';
import { downloadWordDocument } from './services/wordGenerator';
import InputForm from './components/InputForm';
import BookPreview from './components/BookPreview';
import { Book } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [bookData, setBookData] = useState<BookStructure | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiKeyValid, setApiKeyValid] = useState<boolean>(false);

  useEffect(() => {
    const checkKey = async () => {
        // If the key is already in the environment, we are good.
        if (process.env.API_KEY) {
            setApiKeyValid(true);
            return;
        }
        // Otherwise, check if the user has selected a key in AI Studio.
        if ((window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            setApiKeyValid(hasKey);
        }
    };
    checkKey();
  }, []);

  const handleConnect = async () => {
    if ((window as any).aistudio) {
        try {
            await (window as any).aistudio.openSelectKey();
            setApiKeyValid(true);
        } catch (e) {
            console.error("Key selection failed", e);
        }
    }
  };

  const handleGenerate = async (params: GenerationParams) => {
    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    try {
      const data = await generateBookContent(params);
      setBookData(data);
      setAppState(AppState.VIEWING);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
          setApiKeyValid(false);
          setErrorMsg("API Key invalid or expired. Please reconnect.");
      } else {
          setErrorMsg("Failed to generate content. " + (err.message || "Unknown error"));
      }
      setAppState(AppState.ERROR);
    }
  };

  const handleExport = () => {
    if (bookData) {
      downloadWordDocument(bookData);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setBookData(null);
  };

  if (!apiKeyValid) {
    const isAIStudio = typeof window !== 'undefined' && !!(window as any).aistudio;
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                <div className="text-islamic-green mb-4 flex justify-center">
                    <Book size={48} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">FIQH BOOK CRAFTING</h1>
                <p className="text-gray-600 mb-6">
                    {isAIStudio 
                        ? "Please connect your Google Gemini account to start generating professional Fiqh manuscripts."
                        : "The API Key is missing. Please set process.env.API_KEY in your environment."}
                </p>
                
                {isAIStudio && (
                    <button 
                        onClick={handleConnect}
                        className="px-6 py-3 bg-gradient-to-r from-islamic-green to-emerald-800 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                        Connect to Gemini
                    </button>
                )}
                
                {!isAIStudio && (
                    <div className="bg-gray-100 p-3 rounded text-sm font-mono text-left text-red-500">
                        Error: process.env.API_KEY is undefined.
                    </div>
                )}
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen font-sans text-gray-900">
      {appState === AppState.IDLE && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 relative">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-64 bg-islamic-green z-0"></div>
            
            <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
                <div className="text-center text-white space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm border border-white/20">
                             <Book size={48} className="text-islamic-gold" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-serif font-bold tracking-tight">FIQH BOOK CRAFTING</h1>
                    <p className="text-xl opacity-90 font-light max-w-2xl mx-auto">
                        Professional Fiqh book generation powered by Artificial Intelligence. 
                        Create, validate, and export academically rigorous manuscripts in minutes.
                    </p>
                </div>
                
                <InputForm onGenerate={handleGenerate} isGenerating={false} />
            </div>
            
            <footer className="absolute bottom-4 text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} FIQH BOOK CRAFTING. ISO Standard Compliant Generation.
            </footer>
        </div>
      )}

      {appState === AppState.GENERATING && (
         <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-lg">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-islamic-green rounded-full opacity-20 animate-ping"></div>
                    <div className="relative bg-white p-4 rounded-full border-2 border-islamic-green">
                         <Book size={40} className="text-islamic-green" />
                    </div>
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Consulting Classical Sources...</h2>
                <p className="text-gray-500">
                    The AI is structuring the chapters, verifying Dalil references, and formatting the manuscript according to international academic standards.
                </p>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-6 overflow-hidden">
                    <div className="h-full bg-islamic-gold animate-progress w-2/3"></div>
                </div>
            </div>
         </div>
      )}

      {appState === AppState.ERROR && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
           <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                <div className="text-red-500 mb-4 flex justify-center">
                    <Book size={48} />
                </div>
                <h2 className="text-xl font-bold mb-2">Generation Failed</h2>
                <p className="text-gray-600 mb-6">{errorMsg}</p>
                <button 
                    onClick={() => setAppState(AppState.IDLE)}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                    Try Again
                </button>
           </div>
        </div>
      )}

      {appState === AppState.VIEWING && bookData && (
        <BookPreview 
          book={bookData} 
          onExport={handleExport} 
          onReset={handleReset} 
        />
      )}
    </div>
  );
};

export default App;
