import Papa from 'papaparse';
import localQuestions from '../data/questions.json';

const BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGXU8ltIG6N1iH53d7g4gaC9GLx12fDMoGdsmDCyEJL92dRItSyUN_iNLPSeyN4Y_jkenW_YSclgEH/pub?output=csv";

// CONFIGURATION: Map Game IDs to CSV URLs
const SHEET_SOURCES = [
    {
        id: 'rosco-1',
        title: 'Rosco Clásico 1',
        url: `${BASE_URL}&gid=0`
    },
    {
        id: 'rosco-2',
        title: 'Rosco Clásico 2',
        url: `${BASE_URL}&gid=360887770`
    },
    {
        id: 'rosco-infancias',
        title: 'Rosco Infancias',
        url: `${BASE_URL}&gid=1342997611`
    }
];

export const fetchQuestions = async () => {
    try {
        const promises = SHEET_SOURCES.map(source => fetchSingleSheet(source));
        const remoteGames = await Promise.all(promises);

        // Filter out failed fetches (nulls)
        const validRemoteGames = remoteGames.filter(g => g !== null);

        if (validRemoteGames.length > 0) {
            console.log("Loaded remote games:", validRemoteGames.length);
            return validRemoteGames;
        }
        // Fallback? The user said "Lee solo de google sheet". 
        // But if network fails, maybe empty array or local?
        // Let's return empty array if strict, or local as safe failover?
        // "Lee solo de google sheet" implies ignoring local if possible.
        // I will return empty array if remote loads, but local if ALL fail (offline).
        return localQuestions;

    } catch (error) {
        console.warn("Failed to fetch from Sheets:", error);
        return localQuestions;
    }
};

async function fetchSingleSheet(source) {
    try {
        const response = await fetch(source.url);
        if (!response.ok) return null;
        const csvText = await response.text();

        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const game = processCSV(results.data, source.id, source.title);
                    resolve(game.questions.length > 0 ? game : null);
                },
                error: (err) => resolve(null)
            });
        });
    } catch (e) {
        return null;
    }
}

function processCSV(rows, gameId, gameTitle) {
    const gamesMap = {};
    const questions = [];

    rows.forEach(row => {
        // 1. Flexible Column Names (Case insensitive logic)
        // CSV headers from user might be: Letra, Pregunta, Respuesta
        const rawLetter = row.Letter || row.letter || row.Letra || row.letra || '';
        const rawDef = row.Definition || row.definition || row.Definicion || row.definicion || row.Pregunta || row.pregunta || '';
        const rawAns = row.Answer || row.answer || row.Respuesta || row.respuesta || '';

        if (!rawLetter || !rawDef || !rawAns) return;

        // 2. Parse Letter & Type
        let letter = rawLetter.toUpperCase();
        let type = 'Empieza'; // Default

        // Logic: Check keywords
        if (letter.includes('CONTIENE')) {
            type = 'Contiene';
            // Cleanup "Contiene Z" -> "Z"
            letter = letter.replace('CONTIENE', '').replace(/[^A-ZÑ]/g, '').trim();
        } else if (letter.trim() === 'Ñ') {
            type = 'Contiene';
        } else {
            letter = letter.replace(/[^A-ZÑ]/g, '');
        }

        // Heuristic: If definition starts with "Contiene X", it overrides.
        if (rawDef.toLowerCase().startsWith('contiene ' + letter.toLowerCase())) {
            type = 'Contiene';
        }

        questions.push({
            letter: letter,
            type: type,
            definition: rawDef,
            answer: rawAns
        });
    });

    // Sort A-Z
    questions.sort((a, b) => {
        const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
        return alphabet.indexOf(a.letter) - alphabet.indexOf(b.letter);
    });

    return {
        id: gameId,
        title: gameTitle,
        questions: questions
    };
}
