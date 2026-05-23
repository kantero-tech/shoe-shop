import { init } from '@instantdb/react';
import schema from './schema';

// Falls back to '' at build time (SSG); real value must be set via env var at runtime
export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANTDB_APP_ID ?? '',
  schema,
});
