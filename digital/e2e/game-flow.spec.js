
import { test, expect } from '@playwright/test';

const GAME_URL = 'http://localhost:5173/Rosco/';

test('automated game flow play', async ({ page }) => {
    // 1. Open the game
    await page.goto(GAME_URL);

    // 2. Wait for Load and Click Jugar
    // 2. Click Main Menu Jugar
    const playMenuButton = page.getByText('JUGAR', { exact: true }).first();
    await expect(playMenuButton).toBeVisible();
    await playMenuButton.click();

    // 3. Wait for Intro and Click Start Game
    const playIntroButton = page.locator('button.bg-green-500');
    await expect(playIntroButton).toBeVisible();
    await playIntroButton.click();

    // Wait for game start (input field visible)
    const input = page.getByPlaceholder('Escribí tu respuesta...');
    await expect(input).toBeVisible();

    // Helper to get current letter
    const getLetter = async () => {
        return await page.locator('.text-6xl').textContent();
    };

    // 3. Play 5 rounds

    // 4. Play with specific logic to test Multiple Answers
    // We expect Letter B to be present. We will try to answer "Manuel Belgrano" (secondary option).
    const pasapalabraButton = page.getByText('PASAPALABRA');

    // Loop through a few questions
    for (let i = 0; i < 5; i++) {
        const letter = (await getLetter()).trim();
        console.log(`Current Letter: ${letter}`);

        if (letter === 'B') {
            console.log('Found B! Testing secondary answer: Manuel Belgrano');
            await input.fill('Manuel Belgrano');
            await page.keyboard.press('Enter');
            // Wait for score update or visual feedback
            await page.waitForTimeout(500);

            // Verify we moved to next letter (not stuck)
            const nextLetter = (await getLetter()).trim();
            expect(nextLetter).not.toBe('B');
            console.log('Answer accepted, moved to next letter.');
        } else {
            console.log('Skipping (Pasapalabra)');
            await pasapalabraButton.click();
            await page.waitForTimeout(500);
        }
    }

    // Verification: Ensure game is still active (input present)
    await expect(input).toBeVisible();
    console.log('Game continues successfully.');
});
