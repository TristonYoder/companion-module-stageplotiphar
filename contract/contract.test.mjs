// Consumer-driven contract tests.
//
// These live here, with the consumer, but are RUN BY the StagePlotiphar server's
// CI against the server build produced by that PR. That direction matters: it
// means a server change that breaks this module fails the server's own build,
// so the module must be updated and its pin bumped before the server can ship.
//
// They deliberately drive the module's REAL compiled client (dist/api.js), not
// hand-written fetch calls — the thing under test is whether this module still
// works, not whether some idealised request does.
//
//   STAGEPLOTIPHAR_URL=http://localhost:3000 npm run test:contract
//
// The target server must be in single-user mode (no OIDC/PCO env set), where
// auth resolves to the sole org and the Bearer token is ignored.
import { test, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const BASE = (process.env.STAGEPLOTIPHAR_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const API_KEY = process.env.STAGEPLOTIPHAR_API_KEY ?? 'contract-test'

const { StagePlotipharApi } = await import('../dist/api.js')

let venueId
let api

// Seeds through the raw REST API rather than the module client, because the
// module is read/update-only by design — it has no create methods. Everything
// after this point goes through the module's own client.
async function post(path, body, query = '') {
	const res = await fetch(`${BASE}${path}${query}`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) throw new Error(`seed POST ${path} -> ${res.status} ${await res.text()}`)
	return res.json()
}

before(async () => {
	const venuesRes = await fetch(`${BASE}/api/venues`, { headers: { Authorization: `Bearer ${API_KEY}` } })
	assert.equal(venuesRes.status, 200, `server not reachable/authorised at ${BASE}`)
	const existing = await venuesRes.json()

	venueId = existing.venues?.[0]?.id ?? (await post('/api/venues', { name: 'Contract Test Venue' })).id
	const q = `?venueId=${encodeURIComponent(venueId)}`

	// Only seed what isn't already present, so this is safe against both an
	// empty CI database and a populated dev one.
	const roles = await (await fetch(`${BASE}/api/roles${q}`, { headers: { Authorization: `Bearer ${API_KEY}` } })).json()
	const role = roles[0] ?? (await post('/api/roles', { name: 'Contract Role' }, q))

	const layouts = await (
		await fetch(`${BASE}/api/layouts${q}`, { headers: { Authorization: `Bearer ${API_KEY}` } })
	).json()
	const layout =
		layouts[0] ??
		// Positions carry a client-generated id, matching what the editor sends —
		// the server stores them verbatim and the module reads pos.id.
		(await post(
			'/api/layouts',
			{ name: 'Contract Layout', positions: [{ id: randomUUID(), roleId: role.id, x: 10, y: 20 }] },
			q
		))

	const events = await (
		await fetch(`${BASE}/api/events${q}`, { headers: { Authorization: `Bearer ${API_KEY}` } })
	).json()
	if (!events[0]) {
		await post('/api/events', { title: 'Contract Event', date: '2099-01-01', layoutId: layout.id }, q)
	}

	const screens = await (
		await fetch(`${BASE}/api/screens${q}`, { headers: { Authorization: `Bearer ${API_KEY}` } })
	).json()
	if (!screens[0]) await post('/api/screens', { name: 'Contract Screen', type: 'stageplot' }, q)

	api = new StagePlotipharApi(() => ({ host: BASE, apiKey: API_KEY, venueId, pollInterval: 5000 }))
})

describe('response envelopes the module destructures', () => {
	// The highest-value assertion here: listVenues() reads `res.venues`. If
	// /api/venues were ever flattened to a bare array the server's own suite
	// would stay green and every poll in this module would break.
	test('GET /api/venues returns { venues: [...] }, not a bare array', async () => {
		const res = await fetch(`${BASE}/api/venues`, { headers: { Authorization: `Bearer ${API_KEY}` } })
		const body = await res.json()
		assert.ok(!Array.isArray(body), '/api/venues must be an object envelope, not an array')
		assert.ok(Array.isArray(body.venues), 'expected body.venues to be an array')

		const venues = await api.listVenues()
		assert.ok(Array.isArray(venues) && venues.length > 0)
		for (const v of venues) {
			assert.equal(typeof v.id, 'string')
			assert.equal(typeof v.name, 'string')
		}
	})
})

describe('collections the module polls every refresh', () => {
	test('listEvents exposes the fields the module reads', async () => {
		const events = await api.listEvents()
		assert.ok(Array.isArray(events) && events.length > 0)
		const e = events[0]
		for (const f of ['id', 'date', 'title']) assert.equal(typeof e[f], 'string', `event.${f}`)
		assert.ok(Array.isArray(e.roleAssignments), 'event.roleAssignments must be an array')
		assert.ok(Array.isArray(e.positionOverrides), 'event.positionOverrides must be an array')
	})

	test('listRoles exposes id, name and defaultHardware', async () => {
		const roles = await api.listRoles()
		assert.ok(Array.isArray(roles) && roles.length > 0)
		const r = roles[0]
		assert.equal(typeof r.id, 'string')
		assert.equal(typeof r.name, 'string')
		assert.ok(Array.isArray(r.defaultHardware ?? []), 'role.defaultHardware must be an array when present')
	})

	test('listMicBoards returns an array of { id, name }', async () => {
		const boards = await api.listMicBoards()
		assert.ok(Array.isArray(boards))
		for (const b of boards) {
			assert.equal(typeof b.id, 'string')
			assert.equal(typeof b.name, 'string')
		}
	})

	test('getHardware returns { types, items }', async () => {
		const hw = await api.getHardware()
		assert.ok(Array.isArray(hw.types), 'hardware.types must be an array')
		assert.ok(Array.isArray(hw.items), 'hardware.items must be an array')
	})

	test('listPeople returns a name-keyed record, not an array', async () => {
		const people = await api.listPeople()
		assert.ok(people && typeof people === 'object', 'people must be an object')
		assert.ok(!Array.isArray(people), '/api/people must stay keyed by name — the module indexes it directly')
	})

	test('listScreens exposes id, name and type', async () => {
		const screens = await api.listScreens()
		assert.ok(Array.isArray(screens) && screens.length > 0)
		const s = screens[0]
		assert.equal(typeof s.id, 'string')
		assert.equal(typeof s.name, 'string')
		assert.equal(typeof s.type, 'string')
	})
})

describe('per-resource reads', () => {
	test('getEvent and getLayout resolve, and layout.positions carries roleId/x/y', async () => {
		const [event] = await api.listEvents()
		const fetched = await api.getEvent(event.id)
		assert.equal(fetched.id, event.id)

		if (!fetched.layoutId) return // nothing to assert against
		const layout = await api.getLayout(fetched.layoutId)
		assert.equal(typeof layout.id, 'string')
		assert.ok(Array.isArray(layout.positions), 'layout.positions must be an array')
		for (const p of layout.positions) {
			assert.equal(typeof p.id, 'string')
			assert.equal(typeof p.roleId, 'string')
			assert.equal(typeof p.x, 'number')
			assert.equal(typeof p.y, 'number')
		}
	})
})

describe('screen types are advertised, not hardcoded', () => {
	// Guards the regression that motivated /api/screen-types: the module used to
	// carry its own copy and silently missed 'stageplot-invert' for months.
	test('listScreenTypes returns { id, label } entries covering what screens report', async () => {
		const types = await api.listScreenTypes()
		if (types === null) return // server predates the endpoint; module falls back

		assert.ok(Array.isArray(types) && types.length > 0)
		for (const t of types) {
			assert.equal(typeof t.id, 'string')
			assert.equal(typeof t.label, 'string')
			assert.ok(t.label.length > 0, `screen type ${t.id} must have a non-empty label`)
		}

		// Every type an existing screen actually uses must be advertised,
		// otherwise the module can't render or offer it.
		const advertised = new Set(types.map((t) => t.id))
		for (const s of await api.listScreens()) {
			assert.ok(advertised.has(s.type), `screen type "${s.type}" is in use but not advertised by /api/screen-types`)
		}
	})
})

describe('writes the module performs', () => {
	test('updateScreen round-trips and returns the full screen', async () => {
		const [screen] = await api.listScreens()

		// No-op write: same values back, so this is safe to run repeatedly and
		// against a populated dev database.
		const patch = {}
		if (screen.currentEventId) patch.currentEventId = screen.currentEventId
		if (screen.micboardId) patch.micboardId = screen.micboardId
		patch.type = screen.type

		const updated = await api.updateScreen(screen.id, patch)
		assert.equal(updated.id, screen.id, 'updateScreen must return the updated screen')
		assert.equal(updated.type, screen.type)
		assert.equal(typeof updated.name, 'string')
	})
})

describe('image serving', () => {
	test('images are served with an image content-type', async () => {
		// The module reads content-type to build its data: URI; a wrong or
		// missing type silently produces an unrenderable button image.
		const venues = await api.listVenues()
		const logo = venues.find((v) => v.logo && !/^https?:\/\//i.test(v.logo))?.logo
		if (!logo) return // no local image in this dataset

		const res = await fetch(`${BASE}/api/images/${encodeURIComponent(logo)}?venueId=${encodeURIComponent(venueId)}`, {
			headers: { Authorization: `Bearer ${API_KEY}` },
		})
		assert.equal(res.status, 200)
		assert.match(res.headers.get('content-type') ?? '', /^image\//)
	})
})
