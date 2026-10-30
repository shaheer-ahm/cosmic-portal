// Shared mock setup: fake logged-in session + fake API responses.
export const user = { id: '11111111-1111-1111-1111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'sup@example.com', user_metadata: {}, app_metadata: {} };
const session = { access_token: 'x.y.z', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user };
const box = (i, ref, max) => ({ BoxIndex: i, Reference: ref, BoxGroup: null, CentreOfGravity: { X: 200, Y: 200, Z: 60 }, Balanced: true, Dimensions: { Width: 400, Length: 400, Depth: 400 }, ItemCount: 1, ItemsWeight: 8, BoxWeight: 0.5, TotalWeight: 8.5, MaxWeight: max, VolumeUtilisation: 0.42, LoadHeight: 120,
  Items: [{ Sequence: 1, InstanceId: `ITM-00${i}#1`, ItemCode: `ITM-00${i}`, ItemReference: 'Widget', BoxGroup: null, Position: { X: 0, Y: 0, Z: 0 }, Dimensions: { Width: 100, Length: 100, Depth: 100 }, Orientation: { Code: 'WLD', AxisMap: { X: 'Width', Y: 'Length', Z: 'Depth' }, RotationDegrees: { X: 0, Y: 0, Z: 0 } }, Weight: 8, Fragile: false }] });
export const result = { Success: false, Meta: { Engine: 'x', Version: '1', SchemaVersion: '1', SolveTimeMs: 12, TimeLimitReached: false, Units: { Length: 'mm', Weight: 'kg' }, CoordinateSystem: { Origin: 'a', X: 'W', Y: 'L', Z: 'D', PositionMeaning: 'min' } },
  Summary: { BoxCount: 2, BoxCounts: { MED: 1, 'CUSTOM-001': 1 }, PackedItemCount: 2, UnpackedItemCount: 1, TotalWeight: 17, OverallVolumeUtilisation: 0.42 },
  Boxes: [box(1, 'MED', 15.2), box(2, 'CUSTOM-001', null)],
  UnpackedItems: [{ InstanceId: 'BIG-1#1', ItemCode: 'BIG-1', ItemReference: 'Fridge', ReasonCode: 'DOES_NOT_FIT', Reason: 'Item is larger than every available box' }] };
const items = [{ ItemCode: 'ITM-001', ItemReference: 'Widget', Width: 100, Length: 100, Depth: 100, Weight: 8, Quantity: 1, BoxGroup: null, KeepUpright: null, Fragile: false }];
export const orderList = Array.from({ length: 12 }, (_, i) => ({ order_id: i + 1, status: ['draft', 'completed', 'validated'][i % 3], created_by: user.id, created_at: '2026-10-21T10:00:00Z', items_count: 3, boxes_count: 2 }));

// handlers: map of regex -> function(route, url, method) returning {status, body} or undefined
export async function setup(ctx, page, overrides = []) {
  await ctx.addInitScript(s => localStorage.setItem('sb-example-auth-token', s), JSON.stringify(session));
  await page.route('https://example.supabase.co/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }));
  await page.route('**/api/v1/**', async r => {
    const u = new URL(r.request().url()); const p = u.pathname.replace(/^.*\/api\/v1/, ''); const m = r.request().method();
    for (const [re, fn] of overrides) { if (re.test(m + ' ' + p)) { const res = await fn(r, p, m); if (res === 'handled') return; if (res) return r.fulfill({ status: res.status ?? 200, contentType: 'application/json', body: JSON.stringify(res.body ?? {}) }); } }
    let body = {};
    if (p === '/auth/me') body = { user_id: user.id, email: user.email, role: 'SUPERVISOR' };
    else if (/^\/orders\/\d+\/results$/.test(p)) body = { order_id: 1, result_data: result, created_at: '2026-10-21T10:00:00Z' };
    else if (/^\/orders\/\d+$/.test(p)) { const id = Number(p.split('/')[2]); body = { order_id: id, status: 'completed', created_by: user.id, created_at: '2026-10-21T10:00:00Z', items, box_types: ['MED', 'CUSTOM-001'] }; }
    else if (p === '/orders/') body = orderList;
    else if (p === '/dashboard/summary') body = { total_orders: 12, orders_by_status: { draft: 4, completed: 4, validated: 4 }, recent_orders: orderList.slice(0, 5) };
    else if (p === '/box-types/') body = [{ Reference: 'SML', Width: 150, Length: 150, Depth: 150, MaxWeight: 8.5, BoxWeight: 0.5, Active: true, MaximumBoxes: 100 }, { Reference: 'MED', Width: 400, Length: 400, Depth: 400, MaxWeight: 15.2, BoxWeight: 0.75, Active: true, MaximumBoxes: null }];
    else if (p === '/integration/status') body = { solver: { configured: true, connected: true, detail: 'ok', latency_ms: 50 }, supabase: { configured: true, connected: true, detail: 'ok', latency_ms: 5 } };
    else if (p === '/users/') body = [];
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}
