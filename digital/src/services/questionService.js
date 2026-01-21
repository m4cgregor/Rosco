import Papa from 'papaparse';
import localQuestions from '../data/questions.json';

const PUBHTML_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGXU8ltIG6N1iH53d7g4gaC9GLx12fDMoGdsmDCyEJL92dRItSyUN_iNLPSeyN4Y_jkenW_YSclgEH/pub?output=csv';

export const fetchQuestions = async () => {
    try {
        // 1. Fetch the HTML to determine Tab Names dynamically
        console.log("Fetching Sheet metadata...");
        const cacheBuster = `?t=${Date.now()}`; // Query param for HTML
        const response = await fetch(PUBHTML_URL + cacheBuster);
        const html = await response.text();

        // 2. Extract tabs using more robust Regex
        // Pattern looks like: {name: "Rosco 1", ..., gid: "0"}
        // We match 'name' and 'gid' key-values which might be separated by other props.
        const sheetRegex = /name:\s*"([^"]+)"[\s\S]*?gid:\s*"(\d+)"/g;
        const matches = [...html.matchAll(sheetRegex)];

        if (matches.length === 0) {
            console.warn("Could not parse Sheet tabs. Using fallback/local data.");
            return localQuestions;
        }

        // 3. Build the list of games dynamically based on Tabs
        const dynamicSources = matches.map(match => ({
            id: `sheet-${match[2]}`,
            title: match[1], // User's Tab Name (e.g., "Rosco 2", "Rosco Infancias")
            url: `${BASE_CSV_URL}&gid=${match[2]}`
        }));

        console.log("Found Tabs:", dynamicSources.map(s => s.title));

        // 4. Fetch the actual questions for each tab
        const promises = dynamicSources.map(source => fetchSingleSheet(source));
        const remoteGames = await Promise.all(promises);

        const validRemoteGames = remoteGames.filter(g => g !== null);

        if (validRemoteGames.length > 0) {
            return validRemoteGames;
        }
        return localQuestions;

    } catch (error) {
        console.warn("Failed to fetch dynamic data:", error);
        return localQuestions;
    }
};

async function fetchSingleSheet(source) {
    try {
        // Cache Busting: Add timestamp to force new fetch from browser
        const cacheBuster = `&t=${Date.now()}`;
        const response = await fetch(source.url + cacheBuster);
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
    // Logic remains the same (Letter/Definition parsing)
    const questions = [];

    rows.forEach(row => {
        const rawLetter = row.Letter || row.letter || row.Letra || row.letra || '';
        const rawDef = row.Definition || row.definition || row.Definicion || row.definicion || row.Pregunta || row.pregunta || '';
        const rawAns = row.Answer || row.answer || row.Respuesta || row.respuesta || '';

        if (!rawLetter || !rawDef || !rawAns) return;

        let letter = rawLetter.toUpperCase();
        let type = 'Empieza';

        if (letter.includes('CONTIENE')) {
            type = 'Contiene';
            letter = letter.replace('CONTIENE', '').replace(/[^A-ZÑ]/g, '').trim();
        } else if (letter.trim() === 'Ñ') {
            type = 'Contiene';
        } else {
            letter = letter.replace(/[^A-ZÑ]/g, '');
        }

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
