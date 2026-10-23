// Public entry of the cart feature for pages and layout. The Redux store wiring
// (src/store/store.ts) imports the application and infrastructure barrels instead, because the
// components here use the typed hooks, which depend on the store's types.
export * from './application/index.ts'
export * from './presentation/index.ts'
