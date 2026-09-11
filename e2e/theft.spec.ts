import { test, expect } from '@playwright/test';
import type { RoomView, Session } from '../src/server/types';

test('向かいの泥棒が宝石を得点にし、双方に移動先を表示する', async ({ page, request }) => {
  async function act(body: object, session?: Session) {
    const response = await request.post('/api/rooms', { headers: session ? { Authorization: `Bearer ${session.token}` } : {}, data: { ...body, ...(session ? { code: session.code } : {}) } });
    expect(response.ok(), await response.text()).toBeTruthy(); return response.json();
  }
  const a: Session = await act({ action: 'create', humanCount: 2, name: 'アカリ' });
  const b: Session = await act({ action: 'join', code: a.code, name: 'ソラ' });
  const start: RoomView = await act({ action: 'start' }, a);
  const p0 = start.game!.players[0], p1 = start.game!.players[1];
  await act({ action: 'select', selection: [{ ...p0.bag.find(d => d.kind === 'ruby'), value: 6 }, { ...p0.bag.find(d => d.kind === 'poison'), value: 0 }] }, a);
  await act({ action: 'select', selection: [{ ...p1.bag.find(d => d.kind === 'poison'), value: 0 }, { ...p1.bag.find(d => d.kind === 'thief'), value: 0 }] }, b);
  await expect.poll(async () => {
    const response = await request.get(`/api/rooms?code=${a.code}`, { headers: { Authorization: `Bearer ${a.token}` } });
    return (await response.json()).game.phase;
  }).toBe('inspect');
  await act({ action: 'resolve' }, a);
  const result: RoomView = await act({ action: 'resolve' }, b);
  expect(result.game!.players[0].jewels).toHaveLength(0);
  expect(result.game!.players[1].jewels).toHaveLength(1);
  expect(result.game!.players[1].jewels[0]).toMatchObject({ kind: 'ruby', value: 6 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(s => localStorage.setItem('jewel-hunt-session', JSON.stringify(s)), a);
  await page.goto('/');
  await expect(page.locator('.table-world')).toHaveAttribute('data-renderer', 'webgl', { timeout: 30000 });
  await expect(page.locator('.mining-reveal')).toHaveCount(0);
  await expect(page.locator('.mined-die')).toHaveCount(0);
  const source = page.locator('[data-ledger-player="p0"]'), target = page.locator('[data-ledger-player="p1"]');
  await expect(source.locator('[data-theft-direction="lost"]')).toContainText('ソラの泥棒に渡った');
  await expect(target.locator('[data-theft-direction="received"]')).toContainText('アカリから獲得');
  await expect(target.locator('.theft-receipt')).toContainText('ソラの得点に ＋6点');
  await expect(source.getByLabel('ルビー 6点 1個')).toHaveCount(0);
  await expect(target.getByLabel('ルビー 6点 1個')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/theft-mobile.png', fullPage: true });
});
