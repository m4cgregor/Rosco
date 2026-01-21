import Papa from 'papaparse';
import localQuestions from '../data/questions.json';

// CONFIGURATION: Map Game IDs to CSV URLs
// To use multiple "Sheets", publish each sheet to CSV and add the URL here.
const SHEET_SOURCES = [
    {
        id: 'rosco-infancias',
        title: 'Rosco Infancias (Google Sheet)',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGXU8ltIG6N1iH53d7g4gaC9GLx12fDMoGdsmDCyEJL92dRItSyUN_iNLPSeyN4Y_jkenW_YSclgEH/pub?gid=0&single=true&output=csv'
        // ^ Important: verify 'gid' matches the tab you want. 0 is the first tab.
    },
    // {
    //   id: 'rosco-clasico',
    //   title: 'Rosco Clásico (Google Sheet)',
    //   url: 'YOUR_SECOND_SHEET_URL_HERE'
    // }
];

export const fetchQuestions = async () => {
    try {
        const promises = SHEET_SOURCES.map(source => fetchSingleSheet(source));
        const remoteGames = await Promise.all(promises);

        // Filter out failed fetches (nulls)
        const validRemoteGames = remoteGames.filter(g => g !== null);

        if (validRemoteGames.length > 0) {
            console.log("Loaded remote games:", validRemoteGames.length);
            // We can merge with local or replace. Let's append local as backup or extra options.
            return [...validRemoteGames, ...localQuestions];
        }
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
    const questions = [];

    rows.forEach(row => {
        // 1. Map Columns (Case insensitive)
        const rawLetter = row.Letter || row.letter || row.Letra || row.letra || '';
        const rawDef = row.Definition || row.definition || row.Definicion || row.definicion || row.Pregunta || row.pregunta || '';
        const rawAns = row.Answer || row.answer || row.Respuesta || row.respuesta || '';

        if (!rawLetter || !rawDef || !rawAns) return;

        // 2. Parse Letter & Type
        // Example: "Contiene Z - Apellido..." -> We need to split if the user put the type in the letter col
        // Or if the content is just "A" or "Contiene Ñ"

        let letter = rawLetter.toUpperCase();
        let type = 'Empieza'; // Default

        // Logic: Check keywords
        if (letter.includes('CONTIENE')) {
            type = 'Contiene';
            // Cleanup "Contiene Z" -> "Z"
            letter = letter.replace('CONTIENE', '').replace(/[^A-ZÑ]/g, '').trim();
        } else if (letter.trim() === 'Ñ') {
            type = 'Contiene'; // Ñ is almost always contains
        } else {
            // Just a clean letter
            letter = letter.replace(/[^A-ZÑ]/g, '');
        }

        // Edge case: User put "Contiene X - Medio de transporte..." inside the Letra column?
        // Based on the example CSV:
        // 25: X,"Contiene X - Medio de transporte...",Taxi
        // It seems the "Contiene X" text is actually in the *Definition* or user might put "Contiene Z" in Letter.
        // The example file says:
        // Letra: Z
        // Pregunta: Contiene Z - Apellido de un cantante...
        // Respuesta: Fito Paez

        // SO: We should also check the DEFINITION for "Contiene X" hint if we want to be super smart,
        // but usually the TYPE is driven by the Letter column.
        // However, in the CSV example regarding 'X':
        // Letra: X, Pregunta: "Contiene X - Medio...", Respuesta: Taxi
        // My code will parse Letter="X". Default type="Empieza".
        // Does the UI handle "Empieza con X" for Taxi? It should validly be "Contiene".

        // Let's refine the heuristic:
        // If the *Definition* starts with "Contiene X", set type to Contiene.
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
