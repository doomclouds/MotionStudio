// Production entry point: native Canvas. Legacy browser renderer remains explicit.
// Browser/CDP is not imported or started by the default route.
await import('./render-native.mjs');
