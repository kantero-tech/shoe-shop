import { init } from '@instantdb/react';
import schema from './schema';

const appId = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID;

if (!appId) {
  throw new Error('NEXT_PUBLIC_INSTANTDB_APP_ID is not set');
}

export const db = init({ appId, schema });
