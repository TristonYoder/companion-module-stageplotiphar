import type { ModuleConfig, ModuleSecrets } from './config'
import type { Hardware, Layout, MicBoard, Role, Screen, StageEvent, Venue } from './types'

export type ResolvedApiConfig = ModuleConfig & ModuleSecrets

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message)
	}
}

export class StagePlotiferApi {
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

	listEvents(): Promise<StageEvent[]> {
		return this.request('/api/events')
	}

	getEvent(id: string): Promise<StageEvent> {
		return this.request(`/api/events/${encodeURIComponent(id)}`)
	}

	getLayout(id: string): Promise<Layout> {
		return this.request(`/api/layouts/${encodeURIComponent(id)}`)
	}

	listRoles(): Promise<Role[]> {
		return this.request('/api/roles')
	}

	listMicBoards(): Promise<MicBoard[]> {
		return this.request('/api/micboards')
	}

	getHardware(): Promise<Hardware> {
		return this.request('/api/hardware')
	}

	listScreens(): Promise<Screen[]> {
		return this.request('/api/screens')
	}

	updateScreen(id: string, patch: Partial<Pick<Screen, 'currentEventId' | 'micboardId' | 'type'>>): Promise<Screen> {
		return this.request(`/api/screens/${encodeURIComponent(id)}`, {
			method: 'PUT',
			body: JSON.stringify(patch),
		})
	}

	sendEventToAllScreens(eventId: string): Promise<{ ok: boolean; count: number }> {
		return this.request('/api/screens/send-all', {
			method: 'POST',
			body: JSON.stringify({ eventId }),
		})
	}

	sendEventToPco(eventId: string): Promise<{ ok: boolean; url: string }> {
		return this.request(`/api/events/${encodeURIComponent(eventId)}/send-to-pco`, {
			method: 'POST',
		})
	}
}
