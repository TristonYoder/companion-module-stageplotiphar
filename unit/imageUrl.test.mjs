// Pure unit tests — no server required, unlike contract/.
//
//   npm run test:unit
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

const { isPcoInitialsUrl } = await import('../dist/api.js')

describe('isPcoInitialsUrl', () => {
	// The real shape PCO serves for someone with no uploaded photo.
	test('detects a PCO auto-generated initials placeholder', () => {
		assert.equal(
			isPcoInitialsUrl('https://avatars.planningcenteronline.com/uploads/initials/JD.png?g=224x224%23'),
			true,
		)
		assert.equal(isPcoInitialsUrl('https://avatars.planningcenteronline.com/uploads/initials/AB.png'), true)
	})

	// A real uploaded PCO photo lives under a different path and must still render.
	test('does not match a genuine PCO avatar upload', () => {
		assert.equal(
			isPcoInitialsUrl('https://avatars.planningcenteronline.com/uploads/person/12345-167/avatar.jpg'),
			false,
		)
	})

	test('does not match locally-stored image filenames', () => {
		assert.equal(isPcoInitialsUrl('person-9f8c1e2a.png'), false)
		assert.equal(isPcoInitialsUrl('logo-e5d59ead-5ddd-4e33-8326-dc618896a15c.png'), false)
	})

	// http:// and a lookalike host must not be treated as placeholders — the
	// check is a prefix match on the exact https origin, deliberately.
	test('is strict about scheme and host', () => {
		assert.equal(isPcoInitialsUrl('http://avatars.planningcenteronline.com/uploads/initials/JD.png'), false)
		assert.equal(isPcoInitialsUrl('https://evil.example/uploads/initials/JD.png'), false)
	})

	test('tolerates null, undefined and non-strings', () => {
		assert.equal(isPcoInitialsUrl(null), false)
		assert.equal(isPcoInitialsUrl(undefined), false)
		assert.equal(isPcoInitialsUrl(42), false)
	})
})
