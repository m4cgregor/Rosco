import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
// Using path.resolve to match the file structure: digital/scripts -> g:/AI/Rosco
const SAMPLE_DIR_ROOT = path.resolve(__dirname, '..', '..'); // Up two levels from digital/scripts
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'questions.json');

const FILES_TO_PARSE = [
    { filename: 'Preguntas Rosco 1.md', id: 'rosco-1', title: 'Rosco Clásico 1' },
    { filename: 'Preguntas Rosco 2.md', id: 'rosco-2', title: 'Rosco Clásico 2' },
    { filename: 'Preguntas Rosco Infancias 01.md', id: 'rosco-kids', title: 'Rosco Infancias' }
];

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    try {
        fs.mkdirSync(dirname);
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}

function parseFile(filePath, config) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const questions = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        let match = trimmed.match(/^\*\*(?:Contiene\s+)?([A-ZÑ])(?:[\s-]*)\**[:\s]*(.+?)\**\s*\((.+?)\)[\.\s]*$/i);

        if (!match) {
            match = trimmed.match(/^\*\*(?:Contiene\s+)?([A-ZÑ]).*\*\*\s*(.+?)\s*\((.+?)\)/i);
        }

        if (match) {
            const letter = match[1].toUpperCase();
            const definition = match[2].trim();
            let answer = match[3].trim();

            // Clean up answer
            answer = answer.replace(/\.$/, '').replace(/\*\*/g, '');

            const isContains = trimmed.toLowerCase().includes('contiene');

            questions.push({
                letter: letter,
                type: isContains || letter === 'Ñ' ? 'Contiene' : 'Empieza',
                definition: definition,
                answer: answer
            });
        }
    });

    // Sort A-Z
    questions.sort((a, b) => {
        const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
        return alphabet.indexOf(a.letter) - alphabet.indexOf(b.letter);
    });

    return {
        id: config.id,
        title: config.title,
        questions: questions
    };
}

const results = [];

FILES_TO_PARSE.forEach(config => {
    // We assume files are in g:/AI/Rosco
    const fullPath = path.join(SAMPLE_DIR_ROOT, config.filename);
    console.log(`Parsing ${fullPath}...`);
    const data = parseFile(fullPath, config);
    if (data) {
        console.log(`  Found ${data.questions.length} questions.`);
        results.push(data);
    }
});

ensureDirectoryExistence(OUTPUT_FILE);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
console.log(`\nSuccessfully wrote ${results.length} question sets to ${OUTPUT_FILE}`);
