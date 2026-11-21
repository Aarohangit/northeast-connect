import 'fake-indexeddb/auto'

// The outbox reads navigator.onLine; tests flip it to simulate losing signal.
globalThis.navigator ??= {}
Object.defineProperty(globalThis.navigator, 'onLine', { value: true, writable: true, configurable: true })
