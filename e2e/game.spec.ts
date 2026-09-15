import { test, expect, type APIRequestContext } from '@playwright/test';
import { chooseCpu } from '../src/game/engine';
import type { Session, RoomView } from '../src/server/types';

async function post(request: APIRequestContext, body: object, session?: Session) {
  const response = await request.post('/api/rooms', { headers: session ? { Authorization: `Bearer ${session.token}` } : {}, data: { ...body, ...(session ? { code: session.code } : {}) } });
  expect(response.ok(), await response.text()).toBeTruthy(); return response.json();
}
async function view(request: APIRequestContext, session: Session): Promise<RoomView> {
  const response = await request.get(`/api/rooms?code=${session.code}`, { headers: { Authorization: `Bearer ${session.token}` } });
  expect(response.ok()).toBeTruthy(); return response.json();
}
test('1〜4人の全モードで秘密選択・再接続・10ターン完走', async ({ request }) => {
  test.setTimeout(240000);
  for (const count of [1, 2, 3, 4]) {
    const host: Session = await post(request, { action: 'create', humanCount: count, name: 'ホスト' });
    const sessions = [host];
    for (let i = 1; i < count; i++) sessions.push(await post(request, { action: 'join', code: host.code, name: `ゲスト${i}` }));
    if (count < 4) await post(request, { action: 'color', color: 'topaz' }, host);
    let room: RoomView = await post(request, { action: 'start' }, host);
    expect(room.game!.players.filter(p => p.cpu)).toHaveLength(4 - count);
    for (let turn = 1; turn <= 10; turn++) {
      expect(room.game!.turn).toBe(turn);
      for (const session of sessions) {
        const before = await view(request, session);
        expect(Object.keys(before.game!.selections)).not.toContain('p3' === session.playerId ? 'p2' : 'p3');
        room = await post(request, { action: 'select', selection: chooseCpu(before.game!, session.playerId, Math.random) }, session);
      }
      expect(room.game!.phase).toBe('reveal');
      expect(Object.keys(room.game!.selections)).toHaveLength(1);
      await expect.poll(async () => { room = await view(request, host); return room.game!.phase; }, { timeout: 10000, intervals: [400] }).not.toBe('reveal');
      expect(room.game!.phase).toBe('inspect');
      for (const session of sessions) room = await post(request, { action: 'resolve' }, session);
      while (room.game!.phase === 'poison') {
        const task = room.game!.poisonTasks[0];
        room = await post(request, { action: 'poison', jewelId: task.candidates[0] }, sessions.find(s => s.playerId === task.actor)!);
      }
      expect(room.game!.phase).toBe('result');
      expect(Object.keys(room.game!.selections)).toHaveLength(4);
      for (const session of sessions) room = await post(request, { action: 'ready' }, session);
    }
    expect(room.game!.phase).toBe('over');
    expect((await view(request, host)).game).toEqual(room.game);
  }
});
test('スマホでゲーム開始・サイコロ選択・一斉公開', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} ${message.location().url}`); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /ファントムジェム/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('あなたの名前').fill('スマホハンター');
  await page.getByRole('button', { name: 'ハントを始める' }).click();
  await expect(page.getByRole('heading', { name: '席についたら、始めよう。' })).toBeVisible();
  await page.screenshot({ path: 'test-results/lobby-mobile.png', fullPage: true });
  await page.getByRole('button', { name: /全員そろった/ }).click();
  await expect(page.getByRole('heading', { name: 'カップに、次の一手を。' })).toBeVisible();
  await expect(page.getByRole('timer', { name: '選択の残り時間' })).toHaveText(/^[01]:[0-5][0-9]$/);
  await expect(page.locator('.table-world')).toHaveAttribute('data-renderer', 'webgl', { timeout: 30000 });
  await page.getByRole('button', { name: 'ルビー 残り6個' }).click();
  await page.getByRole('button', { name: '6の目', exact: true }).click();
  await page.getByRole('button', { name: '採掘 残り4個' }).click();
  await page.waitForTimeout(600); // Let the chosen figure land in its cup.
  await page.screenshot({ path: 'test-results/game-mobile.png', fullPage: true });
  expect(await page.locator('.table-world').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return [...element.querySelectorAll('.table-nameplate')].every(label => { const rect = label.getBoundingClientRect(); return rect.left >= bounds.left && rect.right <= bounds.right; });
  })).toBe(true);
  await page.getByRole('button', { name: 'カップを伏せる' }).click();
  await expect(page.getByRole('heading', { name: 'せーので、カップを公開。' })).toBeVisible();
  await page.getByRole('button', { name: '確認した · 得点と効果を実行' }).click();
  await expect(page.getByRole('button', { name: '次のターンへ' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: '次のターンへ' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'カップに、次の一手を。' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '遊び方' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '遊び方を閉じる' }).click();
  expect(errors).toEqual([]);
});
test('同じ卓でも2人の画面は自分の席が手前になる', async ({ browser, request }) => {
  const host: Session = await post(request, { action: 'create', humanCount: 2, name: 'アカリ' });
  const guest: Session = await post(request, { action: 'join', code: host.code, name: 'ソラ' });
  await post(request, { action: 'start' }, host);
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
  for (const [index, session] of [host, guest].entries()) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(s => sessionStorage.setItem('jewel-hunt-session', JSON.stringify(s)), session);
    const page = await context.newPage(); await page.goto(baseURL); await page.reload();
    await expect(page.locator('.table-world')).toHaveAttribute('data-renderer', 'webgl', { timeout: 30000 });
    await expect(page.locator('.table-world')).toHaveAttribute('data-viewer-seat', session.playerId);
    await expect(page.locator(`[data-player="${session.playerId}"]`)).toHaveAttribute('data-seat-offset', '0');
    await page.getByRole('button', { name: '卓を上から見る' }).click();
    await page.getByRole('button', { name: '自分の視点に戻す' }).click();
    await page.waitForTimeout(1500); // Allow the camera to settle before comparing views.
    await page.screenshot({ path: `test-results/table-player-${index + 1}.png`, fullPage: true });
    await page.getByRole('button', { name: '中央の宝箱と宝石マーケットを見る' }).click();
    await expect(page.getByRole('dialog', { name: '宝箱と宝石マーケット' })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await context.close();
  }
});
test('PC画面の表示', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
