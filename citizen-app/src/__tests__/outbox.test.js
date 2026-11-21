import { beforeEach, describe, expect, it, vi } from 'vitest'
import { enqueue, flushOutbox, getRecord, listRecords } from '../lib/outbox.js'

const sos = { name: 'Bina', phone: '9864012345', category: 'LANDSLIDE', peopleCount: 3, latitude: 23.73, longitude: 92.72 }

function respond(status, body) {
  return Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) })
}

describe('offline SOS outbox', () => {
  beforeEach(async () => {
    navigator.onLine = true
    for (const r of await listRecords()) r // keep earlier records; each test uses its own ids
    vi.restoreAllMocks()
  })

  it('saves the request on the phone before any network call', async () => {
    globalThis.fetch = vi.fn()
    const rec = await enqueue(sos)
    const stored = await getRecord(rec.clientRequestId)
    expect(stored.state).toBe('queued')
    expect(stored.payload.reportedAt).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('keeps it queued with no network, then delivers it when the signal returns', async () => {
    navigator.onLine = false
    const rec = await enqueue(sos)
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    await flushOutbox()
    expect((await getRecord(rec.clientRequestId)).state).toBe('queued')

    navigator.onLine = true
    globalThis.fetch = vi.fn(() => respond(201, { reference: 'AS-7K3Q9', status: 'RECEIVED', history: [] }))
    await flushOutbox()
    const delivered = await getRecord(rec.clientRequestId)
    expect(delivered.state).toBe('delivered')
    expect(delivered.reference).toBe('AS-7K3Q9')

    // It was held on the phone, so the control room is told it arrived late.
    const sent = JSON.parse(fetch.mock.calls.at(-1)[1].body)
    expect(sent.channel).toBe('QUEUED_SYNC')
    expect(sent.clientRequestId).toBe(rec.clientRequestId)
  })

  it('stops retrying when the server rejects the data, but retries on overload', async () => {
    const bad = await enqueue({ ...sos, phone: '12' })
    const busy = await enqueue(sos)
    globalThis.fetch = vi.fn((url, init) => {
      const body = JSON.parse(init.body)
      return body.clientRequestId === bad.clientRequestId
        ? respond(400, { detail: 'Some fields are invalid' })
        : respond(503, { detail: 'busy' })
    })
    await flushOutbox()
    expect((await getRecord(bad.clientRequestId)).state).toBe('failed')
    expect((await getRecord(busy.clientRequestId)).state).toBe('queued')
  })
})
