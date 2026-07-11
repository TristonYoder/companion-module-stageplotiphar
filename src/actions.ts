import type { CompanionActionDefinitions } from '@companion-module/base'
import type { StagePlotiferApi } from './api'
import type { ModuleState } from './state'

export interface ActionDeps {
	api: StagePlotiferApi
	state: ModuleState
	refresh: () => Promise<void>
	log: (level: 'info' | 'warn' | 'error', message: string) => void
}

export function getActionDefinitions({ api, state, refresh, log }: ActionDeps): CompanionActionDefinitions {
	const screenChoices = () => state.screens.map((s) => ({ id: s.id, label: s.name }))
	const eventChoices = () => state.events.map((e) => ({ id: e.id, label: `${e.date} — ${e.title}` }))
	const micboardChoices = () => state.micboards.map((m) => ({ id: m.id, label: m.name }))

	return {
		setScreenEvent: {
			name: 'Set Screen Event',
			options: [
				{ type: 'dropdown', id: 'screenId', label: 'Screen', choices: screenChoices(), default: screenChoices()[0]?.id ?? '' },
				{ type: 'dropdown', id: 'eventId', label: 'Event', choices: eventChoices(), default: eventChoices()[0]?.id ?? '' },
			],
			callback: async (event) => {
				const screenId = String(event.options.screenId)
				const eventId = String(event.options.eventId)
				await api.updateScreen(screenId, { currentEventId: eventId })
				await refresh()
			},
		},

		setScreenMicboard: {
			name: 'Set Screen MicBoard',
			options: [
				{ type: 'dropdown', id: 'screenId', label: 'Screen', choices: screenChoices(), default: screenChoices()[0]?.id ?? '' },
				{ type: 'dropdown', id: 'micboardId', label: 'MicBoard', choices: micboardChoices(), default: micboardChoices()[0]?.id ?? '' },
			],
			callback: async (event) => {
				const screenId = String(event.options.screenId)
				const micboardId = String(event.options.micboardId)
				await api.updateScreen(screenId, { micboardId })
				await refresh()
			},
		},

		sendEventToAllScreens: {
			name: 'Send Event To All Screens',
			options: [{ type: 'dropdown', id: 'eventId', label: 'Event', choices: eventChoices(), default: eventChoices()[0]?.id ?? '' }],
			callback: async (event) => {
				const eventId = String(event.options.eventId)
				await api.sendEventToAllScreens(eventId)
				await refresh()
			},
		},

		setTrackedEvent: {
			name: 'Track Event For Position Variables',
			options: [{ type: 'dropdown', id: 'eventId', label: 'Event', choices: eventChoices(), default: eventChoices()[0]?.id ?? '' }],
			callback: async (event) => {
				state.setTrackedEvent(String(event.options.eventId))
				await refresh()
			},
		},

		refreshNow: {
			name: 'Refresh Data Now',
			options: [],
			callback: async () => {
				try {
					await refresh()
				} catch (err) {
					log('error', `Manual refresh failed: ${err instanceof Error ? err.message : String(err)}`)
				}
			},
		},
	}
}
