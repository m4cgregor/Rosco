import React, { useState } from 'react';
import { GameContainer } from './components/GameContainer';
import questionsData from './data/questions.json';
import { Play } from 'lucide-react';

function App() {
  const [activeGameId, setActiveGameId] = useState(null);

  const activeGameData = questionsData.find(q => q.id === activeGameId);

  // Layout for the Main Menu
  if (!activeGameId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center space-y-12">

          <div className="space-y-4 animate-fade-in-down">
            <img src="/rosco-logo-placeholder.png" alt="" className="h-32 mx-auto hidden" />
            {/* Text Logo fallback */}
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
              ROSCO
            </h1>
            <p className="text-blue-100 text-xl md:text-2xl font-light">¿Qué conocés de Rosario?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {questionsData.map((game) => (
              <button
                key={game.id}
                onClick={() => setActiveGameId(game.id)}
                className="group relative overflow-hidden bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl text-left"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Play size={100} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                  <p className="text-blue-200 text-sm">{game.questions.length} preguntas</p>
                  <div className="mt-8 flex items-center text-yellow-400 font-bold group-hover:gap-2 transition-all">
                    JUGAR <ArrowRightMini />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <footer className="pt-12 text-blue-300/60 text-sm">
            Proyecto Construcción de Ciudadanía - Municipalidad de Rosario
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 overflow-hidden">
      <GameContainer
        gameData={activeGameData}
        onExit={() => setActiveGameId(null)}
      />
    </div>
  );
}

const ArrowRightMini = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
)

export default App;
