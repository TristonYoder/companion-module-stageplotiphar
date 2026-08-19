import type { ModuleConfig, ModuleSecrets } from './config'
import type { Hardware, Layout, MicBoard, Person, Role, Screen, ScreenTypeChoice, StageEvent, Venue } from './types'

export type ResolvedApiConfig = ModuleConfig & ModuleSecrets

// Planning Center serves an auto-generated initials placeholder for people with
// no uploaded photo, at URLs like
//   https://avatars.planningcenteronline.com/uploads/initials/JD.png?g=224x224%23
// Kept byte-compatible with the server's isPcoInitialsUrl (src/lib/imgSrc.ts) so
// the module and the web app agree on what counts as "no photo".
const PCO_INITIALS_PREFIX = 'https://avatars.planningcenteronline.com/uploads/initials/'

export function isPcoInitialsUrl(value: string | null | undefined): boolean {
	return typeof value === 'string' && value.startsWith(PCO_INITIALS_PREFIX)
}

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
	}
}

export class StagePlotipharApi {
	// Keyed by the Person.image value (filename or URL) — photos rarely
	// change mid-show, and re-fetching/re-encoding on every feedback
	// evaluation would be wasteful.
	private imageDataUriCache = new Map<string, string>()

	constructor(private getConfig: () => ResolvedApiConfig) {}

	private get baseUrl(): string {
		return this.getConfig().host.replace(/\/+$/, '')
	}

	private async request<T>(path: string, init?: RequestInit): Promise<T> {
		const config = this.getConfig()
		const url = new URL(this.baseUrl + path)
		if (config.venueId) url.searchParams.set('venueId', config.venueId)

		const res = await fetch(url, {
			...init,
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json',
				...init?.headers,
			},
		})

		if (!res.ok) {
			const body = await res.text().catch(() => '')
			throw new ApiError(res.status, `${init?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`)
		}

		if (res.status === 204) return undefined as T
		return (await res.json()) as T
	}

	// Org-scoped, not venue-scoped — safe to call before a venue is chosen.
	async listVenues(): Promise<Venue[]> {
		const res = await this.request<{ venues: Venue[] }>('/api/venues')
		return res.venues
	}

	async listEvents(): Promise<StageEvent[]> {
		return this.request('/api/events')
	}

	async getEvent(id: string): Promise<StageEvent> {
		return this.request(`/api/events/${encodeURIComponent(id)}`)
	}

	async getLayout(id: string): Promise<Layout> {
		return this.request(`/api/layouts/${encodeURIComponent(id)}`)
	}

	async listRoles(): Promise<Role[]> {
		return this.request('/api/roles')
	}

	async listMicBoards(): Promise<MicBoard[]> {
		return this.request('/api/micboards')
	}

	async getHardware(): Promise<Hardware> {
		return this.request('/api/hardware')
	}

	async listPeople(): Promise<Record<string, Person>> {
		return this.request('/api/people')
	}

	// Person.image is either a local filename (served by /api/images, which
	// requires our auth header) or a full http(s) URL from a synced PCO
	// avatar (fetched as-is, no auth needed or wanted for an external host).
	async getPersonImageDataUri(image: string): Promise<string | null> {
		// Mirrors the server's isPcoInitialsUrl (src/lib/imgSrc.ts): Planning
		// Center auto-generates a grey initials placeholder for people with no
		// real photo. The web app skips those and draws its own initials avatar;
		// without this the module would happily paint PCO's generic placeholder
		// onto a button, which looks like a broken photo rather than no photo.
		// Returning null lets the caller fall back to its normal rendering.
		if (isPcoInitialsUrl(image)) return null

		const cached = this.imageDataUriCache.get(image)
		if (cached) return cached

		const isExternal = /^https?:\/\//i.test(image)
		const url = isExternal ? image : `${this.baseUrl}/api/images/${encodeURIComponent(image)}`
		const config = this.getConfig()

		try {
			const res = await fetch(url, {
				headers: isExternal ? {} : { Authorization: `Bearer ${config.apiKey}` },
			})
			if (!res.ok) return null

			const buf = await res.arrayBuffer()
			const mime = res.headers.get('content-type') || 'image/png'
			const dataUri = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
			this.imageDataUriCache.set(image, dataUri)
			return dataUri
		} catch {
			return null
		}
	}

	async listScreens(): Promise<Screen[]> {
		return this.request('/api/screens')
	}

	// Returns null (rather than throwing) when the server predates
	// /api/screen-types, so the caller can fall back to FALLBACK_SCREEN_TYPES
	// instead of failing the whole refresh over an optional capability.
	async listScreenTypes(): Promise<ScreenTypeChoice[] | null> {
		try {
			const res = await this.request<{ screenTypes: ScreenTypeChoice[] }>('/api/screen-types')
			return Array.isArray(res?.screenTypes) && res.screenTypes.length > 0 ? res.screenTypes : null
		} catch (err) {
			if (err instanceof ApiError && err.status === 404) return null
			throw err
		}
	}

	async updateScreen(
		id: string,
		patch: Partial<Pick<Screen, 'currentEventId' | 'micboardId' | 'type'>>,
	): Promise<Screen> {
		return this.request(`/api/screens/${encodeURIComponent(id)}`, {
			method: 'PUT',
			body: JSON.stringify(patch),
		})
	}

	async sendEventToAllScreens(eventId: string): Promise<{ ok: boolean; count: number }> {
		return this.request('/api/screens/send-all', {
			method: 'POST',
			body: JSON.stringify({ eventId }),
		})
	}

	async sendEventToPco(eventId: string): Promise<{ ok: boolean; url: string }> {
		return this.request(`/api/events/${encodeURIComponent(eventId)}/send-to-pco`, {
			method: 'POST',
		})
	}
}
