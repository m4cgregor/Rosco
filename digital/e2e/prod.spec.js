
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
});
