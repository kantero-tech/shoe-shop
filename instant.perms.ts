// InstantDB permission rules for Mpenzi Shoes
// This is a single-owner shop app — all operations are open (no auth layer).
// If you add login later, replace "true" with "auth.id != null".
export default {
  stockItems: {
    allow: {
      read: 'true',
      create: 'true',
      update: 'true',
      delete: 'true',
    },
  },
  sales: {
    allow: {
      read: 'true',
      create: 'true',
      update: 'true',
      delete: 'true',
    },
  },
}
