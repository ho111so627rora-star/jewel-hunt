import { test, expect } from '@playwright/test';
import type { RoomView, Session } from '../src/server/types';

test('劇薬で赤6を失わせるとマーケットと次ターンの6の選択が復活する', async ({ page, request }) => {
  async function act(body: object, session?: Session): Promise<any> {
    const response = await request.post('/api/rooms', { headers: session ? { Authorization: `Bearer ${session.token}` } : {}, data: { ...body, ...(session ? { code: session.code } : {}) } });
    expect(response.ok(), await response.text()).toBeTruthy(); return response.json();
  }
  async function get(s: Session): Promise<RoomView> { return (await request.get(`/api/rooms?code=${s.code}`, { headers: { Authorization: `Bearer ${s.token}` } })).json(); }
  const host: Session = await act({ action: 'create', humanCount: 4, name: '赤ハンター' });
  const seats = [host];
  for (let i = 1; i < 4; i++) seats.push(await act({ action: 'join', code: host.code, name: `ハンター${i}` }));
  await act({ action: 'start' }, host);
  for (let turn = 1; turn <= 2; turn++) {
    for (let i = 0; i < 4; i++) {
      const own = (await get(seats[i])).game!.players[i];
      const mines = own.bag.filter(d => d.kind === 'mining');
      let selection = mines.slice(0, 2).map(d => ({ ...d, value: 0 }));
      if (turn === 1 && i === 0) selection = [{ ...own.bag.find(d => d.kind === 'ruby')!, value: 6 }, { ...mines[0], value: 0 }];
      if (turn === 2 && i === 0) selection = [{ ...mines[0], value: 0 }, { ...own.bag.find(d => d.kind === 'thief')!, value: 0 }];
      if (turn === 2 && i === 2) selection = [{ ...own.bag.find(d => d.kind === 'poison')!, value: 0 }, { ...mines[0], value: 0 }];
      await act({ action: 'select', selection }, seats[i]);
    }
    await expect.poll(async () => (await get(host)).game!.phase).toBe('inspect');
    for (const seat of seats) await act({ action: 'resolve' }, seat);
    if (turn === 1) {
      expect((await get(host)).game!.market.ruby[5]).toBe('p0');
      for (const seat of seats) await act({ action: 'ready' }, seat);
    }
  }
  const before = await get(seats[2]);
  expect(before.game!.phase).toBe('poison');
  await act({ action: 'poison', jewelId: before.game!.players[0].jewels[0].id }, seats[2]);
  for (const seat of seats) expect((await get(seat)).game!.market.ruby[5]).toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(s => localStorage.setItem('jewel-hunt-session', JSON.stringify(s)), host);
  await page.goto('/');
  await page.getByRole('button', { name: '宝石の空き目' }).click();
  await expect(page.locator('.market-row.ruby .market-slot').nth(5)).toHaveAttribute('title', '6点：未獲得');
  await page.getByRole('button', { name: '卓に戻る' }).click();
  for (const seat of seats) await act({ action: 'ready' }, seat);
  await page.getByRole('button', { name: /ルビー 残り/ }).click();
  await expect(page.getByRole('button', { name: '6の目', exact: true })).toBeEnabled();
});
