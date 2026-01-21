import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split('');

export function RoscoBoard({ currentLetter, states = {} }) {
    // states map: { "A": "correct", "B": "incorrect", "C": "pending" }
    // default is pending (blue)

    // Calculate positions for a perfect circle
    const radius = 160; // Base radius for desktop
    const center = { x: 0, y: 0 };

    return (
        <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] mx-auto flex items-center justify-center">
            {/* Central area will hold the gameplay info (managed by parent) */}

            {ALPHABET.map((letter, index) => {
                const angle = (index / ALPHABET.length) * 2 * Math.PI - Math.PI / 2; // Start at top (-90deg)

                // Adjust radius based on screen size (using CSS variables or percentage could be tricker with absolute pixels, 
                // so we use a responsive scale approach via Tailwind or simple inline calc)
                // For simplicity, we'll assume the container scales, but the logic here places them relatively.
                // Better: use direct percent positioning?

                const x = Math.cos(angle) * 50; // 50% radius
                const y = Math.sin(angle) * 50;

                const style = {
                    left: `${50 + x}%`,
                    top: `${50 + y}%`,
                    transform: 'translate(-50%, -50%)',
                };

                const status = states[letter] || 'pending';
                const isCurrent = currentLetter === letter;

                return (
                    <motion.div
                        key={letter}
                        className={clsx(
                            "absolute w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-xl font-bold border-2 shadow-md transition-colors duration-300",
                            {
                                // Pending (Blue)
                                "bg-blue-600 text-white border-white": status === 'pending' && !isCurrent,
                                // Current (Yellow blinking or solid highlight)
                                "bg-yellow-400 text-blue-900 border-white ring-4 ring-yellow-200 z-10 scale-125": isCurrent,
                                // Correct (Green)
                                "bg-green-500 text-white border-green-700": status === 'correct',
                                // Incorrect (Red)
                                "bg-red-500 text-white border-red-700": status === 'incorrect',
                                // Pasapalabra (still blue but visited? usually stays blue until answered)
                                "bg-blue-400 text-white": status === 'pasapalabra',
                            }
                        )}
                        style={style}
                        initial={{ scale: 0 }}
                        animate={{ scale: isCurrent ? 1.3 : 1 }}
                    >
                        {letter}
                    </motion.div>
                );
            })}
        </div>
    );
}
