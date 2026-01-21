import React, { useState, useEffect, useRef } from 'react';
import { RoscoBoard } from './RoscoBoard';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowRight, Clock, RefreshCw, Trophy, Volume2, VolumeX } from 'lucide-react';

const GAME_DURATION = 300; // 5 minutes standard

export function GameContainer({ gameData, onExit }) {
    const [gameState, setGameState] = useState('intro'); // intro, playing, finished
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // Map letter -> 'correct' | 'incorrect' | 'pasapalabra'
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [inputValue, setInputValue] = useState('');
    const [score, setScore] = useState(0);
    const inputRef = useRef(null);

    const questions = gameData.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const currentLetter = currentQuestion.letter;

    // Timer
    useEffect(() => {
        let interval;
        if (gameState === 'playing' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setGameState('finished');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, timeLeft]);

    // Focus input on turn change
    useEffect(() => {
        if (gameState === 'playing' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentQuestionIndex, gameState]);

    const startGame = () => {
        setGameState('playing');
        setTimeLeft(GAME_DURATION);
    };

    const normalizeString = (str) => {
        return str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .trim();
    };

    const handleAnswer = (e) => {
        e.preventDefault();
        if (gameState !== 'playing') return;

        const userAnswer = normalizeString(inputValue);

        // Support both array 'answers' (dynamic) and single 'answer' (legacy json)
        const validAnswers = currentQuestion.answers || [currentQuestion.answer];

        const isCorrect = validAnswers.some(ans => normalizeString(ans) === userAnswer);

        let status = 'incorrect';
        if (isCorrect) {
            status = 'correct';
            setScore(s => s + 1);
            new Audio('/Rosco/ok.wav').play().catch(e => console.log('Audio play failed', e));
        } else {
            new Audio('/Rosco/error.wav').play().catch(e => console.log('Audio play failed', e));
        }

        // Logic to move to next pending question
        // In original Rosco, if you fail, you stop? Or you continue? 
        // Usually you continue until circle is full.
        // We will mark it and move to next.

        const newAnswers = { ...answers, [currentLetter]: status };
        setAnswers(newAnswers);
        setInputValue('');

        if (status === 'correct') {
            // Trigger mini confetti?
        }

        moveToNextQuestion(newAnswers);
    };

    const handlePasapalabra = () => {
        if (gameState !== 'playing') return;

        // Mark as pasapalabra (optional visual, but logic is just skip)
        // Usually pasapalabra leaves it pending (blue) for the next round.
        // We won't mark it in 'answers' map as finished, just skip index.
        // But for visual feedback let's ensuring it stays blue.

        moveToNextQuestion(answers);
    };

    const moveToNextQuestion = (currentAnswers) => {
        // Find next index that hasn't been answered correctly or incorrectly
        // We need to loop from current + 1 until we find one that is NOT in currentAnswers (or is pasapalabra?)
        // If we circle back to current and it's answered, game over.

        let nextIndex = currentQuestionIndex + 1;
        let found = false;
        let loopCount = 0;

        while (loopCount < questions.length) {
            if (nextIndex >= questions.length) nextIndex = 0;

            const letter = questions[nextIndex].letter;
            // If not answered yet (not in map), break
            if (!currentAnswers[letter]) {
                found = true;
                break;
            }

            nextIndex++;
            loopCount++;
        }

        if (found) {
            setCurrentQuestionIndex(nextIndex);
        } else {
            endGame();
        }
    };

    const endGame = () => {
        setGameState('finished');
        if (score >= questions.length * 0.8) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    if (gameState === 'intro') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-8 p-4 text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 drop-shadow-md">{gameData.title}</h1>
                <p className="text-xl max-w-lg">
                    Tenés <strong>{Math.floor(GAME_DURATION / 60)} minutos</strong> para responder las {questions.length} definiciones.
                    <br />
                    ¡Pasapalabra si no sabés!
                </p>
                <button
                    onClick={startGame}
                    className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-full text-2xl font-bold shadow-lg transform transition hover:scale-105"
                >
                    JUGAR
                </button>
                <button onClick={onExit} className="text-sm underline text-blue-200">Volver al Menú</button>
            </div>
        );
    }

    if (gameState === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-8 p-4 text-center">
                <Trophy className="w-24 h-24 text-yellow-400" />
                <h2 className="text-5xl font-bold">¡Juego Terminado!</h2>
                <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm border border-white/20">
                    <p className="text-2xl">Aciertos</p>
                    <p className="text-6xl font-bold text-green-400">{score}</p>
                    <p className="text-lg mt-2 opacity-80">de {questions.length} palabras</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onExit}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
                    >
                        Menú Principal
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-bold flex items-center gap-2"
                    >
                        <RefreshCw size={20} /> Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full max-w-6xl mx-auto overflow-hidden">
            {/* Header / Stats */}
            <div className="flex justify-between items-center p-4 text-white">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="text-white/50 hover:text-white">✕ Salir</button>
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider opacity-70">Puntuación</span>
                        <span className="text-2xl font-bold text-yellow-400">{score}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-900/50 px-4 py-2 rounded-full border border-blue-700">
                    <Clock size={20} className={timeLeft < 60 ? "text-red-400 animate-pulse" : "text-white"} />
                    <span className={`text-xl font-mono ${timeLeft < 60 ? "text-red-400" : "text-white"}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col md:flex-row flex-wrap items-center justify-center relative p-4 gap-12 md:gap-24">

                {/* Board Section */}
                <div className="relative z-0 scale-75 md:scale-100 flex-shrink-0">
                    <RoscoBoard currentLetter={currentLetter} states={answers} />
                </div>

                {/* Interaction Section */}
                <div className="z-10 w-full max-w-lg flex flex-col items-center md:items-start text-center md:text-left space-y-6 bg-blue-800/80 p-6 rounded-2xl md:bg-transparent md:p-0 backdrop-blur-md md:backdrop-blur-none border border-white/10 md:border-none shadow-2xl md:shadow-none">

                    <div className="space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold uppercase tracking-wider shadow-sm border border-blue-400">
                                {currentQuestion.type === 'Contiene' ? 'Contiene' : 'Empieza con'}
                            </span>
                            <span className="text-6xl font-black text-white drop-shadow-lg leading-none">
                                {currentLetter}
                            </span>
                        </div>
                        <p className="text-xl md:text-2xl text-white font-medium leading-relaxed min-h-[100px]">
                            {currentQuestion.definition}
                        </p>
                    </div>

                    <form onSubmit={handleAnswer} className="w-full flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribí tu respuesta..."
                            className="flex-1 px-4 py-3 rounded-lg text-lg text-slate-900 font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-400 uppercase shadow-inner"
                            autoComplete="off"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg shadow-lg active:transform active:scale-95 transition"
                        >
                            <ArrowRight size={28} />
                        </button>
                    </form>

                    <button
                        onClick={handlePasapalabra}
                        className="w-full py-3 border-2 border-white/30 hover:bg-white/10 text-white rounded-lg font-bold text-lg transition tracking-wide"
                    >
                        PASAPALABRA
                    </button>

                    {/* Debug/Skip for testing (Optional, remove in prod) */}
                    {/* <div className="text-xs text-white/20 pt-4">Respuesta: {currentQuestion.answer}</div> */}
                </div>
            </div>
        </div>
    );
}
