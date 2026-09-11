const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const homePath = basePath + '/';
export function roomFetch(query = '', init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (supabaseUrl) {
    const token = headers.get('Authorization')?.replace(/^Bearer /, '');
    headers.delete('Authorization');
    if (token) headers.set('x-jewel-token', token);
    return fetch(supabaseUrl + '/functions/v1/jewel-rooms' + query, { ...init, headers });
  }
  return fetch(basePath + '/api/rooms' + query, { ...init, headers });
}
