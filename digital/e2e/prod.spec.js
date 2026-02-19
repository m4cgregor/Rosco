
import { test, expect } from '@playwright/test';

// PRODUCTION URL
const GAME_URL = 'https://m4cgregor.github.io/Rosco/';

test('production game flow play', async ({ page }) => {
    // 1. Open the game
    console.log(`Navigating to ${GAME_URL}`);
    await page.goto(GAME_URL);

    // 2. Wait for Load and Click Jugar
    // In PROD it might take longer or have different loading behavior.

    // Check if we are seeing the menu
    const playMenuButton = page.getByText('JUGAR', { exact: true }).first();
    await expect(playMenuButton).toBeVisible({ timeout: 10000 });
    await playMenuButton.click();

    // 3. Wait for Intro and Click Start Game
    const playIntroButton = page.locator('button.bg-green-500');
    await expect(playIntroButton).toBeVisible();
    await playIntroButton.click();

    // Wait for game start (input field visible)
    const input = page.getByPlaceholder('Escribí tu respuesta...');
    await expect(input).toBeVisible();

    console.log('Production Game Started Successfully');

    // 4. Test multiple answers for letter B
    const currentLetterElement = page.locator('.text-6xl.font-black');
    
    // Skip A if it's there
    let currentLetter = (await currentLetterElement.textContent()).trim();
    if (currentLetter === 'A') {
        await input.fill('skip');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        currentLetter = (await currentLetterElement.textContent()).trim();
    }

    console.log(`Current Letter for validation: ${currentLetter}`);

    if (currentLetter === 'B') {
        await input.fill('manuel belgrano');
        await page.keyboard.press('Enter');
        
        await page.waitForTimeout(1000);
        const nextLetter = (await currentLetterElement.textContent()).trim();
        console.log(`Letter after B: ${nextLetter}`);
        
        // Check if B is green in the board
        // The board letters have data-letter or similar?
        // Let's check RoscoBoard.jsx or just look for a green element with 'B'
        const boardB = page.locator('.bg-green-500', { hasText: 'B' });
        const isBCorrect = await boardB.isVisible();
        console.log(`Is B marked correct? ${isBCorrect}`);
        
        if (!isBCorrect) {
            console.log('FAIL: B was not marked correct with "manuel belgrano"');
            throw new Error('Validation failed for multiple answers online');
        }
    } else {
        console.log('Could not find letter B to test.');
    }
});
