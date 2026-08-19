// Pure unit tests — no server required, unlike contract/.
//
//   npm run test:unit
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

const { ModuleState } = await import('../dist/state.js')
const { ApiError } = await import('../dist/api.js')

// An event whose layoutId points at a layout that's been deleted server-side
// (or a stale/corrupted config) must not take the whole module offline —
// see the 404 log from Companion module init that prompted this fix.
describe('stale layout references', () => {
	test('refreshAllPositions skips a 404 layout instead of throwing', async () => {
		const warnings = []
		const api = {
			getLayout: async (id) => {
				if (id === 'missing-layout') {
					throw new ApiError(404, `GET /api/layouts/${id} failed: 404 {"error":"Not found"}`)
				}
				return { id, positions: [{ id: 'pos1', roleId: 'role1' }] }
			},
		}
		const state = new ModuleState(api, (level, message) => warnings.push({ level, message }))
		state.events = [
			{ id: 'e1', layoutId: 'missing-layout' },
			{ id: 'e2', layoutId: 'good-layout' },
		]
		state.roles = [{ id: 'role1', name: 'Lead Vocal' }]

		await state.refreshAllPositions()

		assert.deepEqual(state.allPositions, [{ positionId: 'pos1', roleName: 'Lead Vocal' }])
		assert.equal(warnings.length, 1)
		assert.equal(warnings[0].level, 'warn')
		assert.match(warnings[0].message, /missing-layout/)
	})

	test('a non-404 layout error still propagates', async () => {
		const api = {
			getLayout: async () => {
				throw new ApiError(500, 'boom')
			},
		}
		const state = new ModuleState(api)
		state.events = [{ id: 'e1', layoutId: 'broken-layout' }]
		state.roles = []

		await assert.rejects(() => state.refreshAllPositions(), /boom/)
	})

	test('refreshTrackedEventDetails clears tracked positions when the layout is gone', async () => {
		const api = {
			getLayout: async () => {
				throw new ApiError(404, 'not found')
			},
		}
		const state = new ModuleState(api)
		state.trackedEventId = 'e1'
		state.events = [{ id: 'e1', layoutId: 'missing-layout', roleAssignments: [], positionOverrides: [] }]
		state.roles = []

		await state.refreshTrackedEventDetails()

		assert.deepEqual(state.trackedPositions, [])
	})
})
