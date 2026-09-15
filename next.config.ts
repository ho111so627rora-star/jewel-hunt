import type { NextConfig } from 'next';
const exporting = process.env.PAGES_EXPORT === '1';
const config: NextConfig = {
  devIndicators: false,
  ...(exporting ? { output: 'export', trailingSlash: true, basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/phantom-gem', images: { unoptimized: true } } : {}),
};
export default config;
