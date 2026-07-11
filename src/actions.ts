import type { CompanionActionDefinitions } from '@companion-module/base'
import type { StagePlotipharApi } from './api'
import type { ModuleState } from './state'
import { SCREEN_TEMPLATE_CHOICES, type StageEvent } from './types'

export interface ActionDeps {
	api: StagePlotipharApi
	state: ModuleState
	refresh: () => Promise<void>
	log: (level: 'info' | 'warn' | 'error', message: string) => void
}

function neighborEvent(sorted: StageEvent[], currentId: string | undefined, direction: 'next' | 'previous'): StageEvent | undefined {
	if (sorted.length === 0) return undefined
	const currentIndex = sorted.findIndex((e) => e.id === currentId)
	if (currentIndex === -1) return direction === 'next' ? sorted[0] : sorted[sorted.length - 1]
	const step = direction === 'next' ? 1 : -1
	return sorted[(currentIndex + step + sorted.length) % sorted.length]
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

		setScreenTemplate: {
			name: 'Set Screen Template',
			options: [
				{ type: 'dropdown', id: 'screenId', label: 'Screen', choices: screenChoices(), default: screenChoices()[0]?.id ?? '' },
				{ type: 'dropdown', id: 'template', label: 'Template', choices: SCREEN_TEMPLATE_CHOICES, default: SCREEN_TEMPLATE_CHOICES[0].id },
			],
			callback: async (event) => {
				const screenId = String(event.options.screenId)
				const template = event.options.template as (typeof SCREEN_TEMPLATE_CHOICES)[number]['id']
				await api.updateScreen(screenId, { type: template })
				await refresh()
			},
		},

		advanceScreenEvent: {
			name: 'Advance Screen To Next/Previous Event',
			options: [
				{ type: 'dropdown', id: 'screenId', label: 'Screen', choices: screenChoices(), default: screenChoices()[0]?.id ?? '' },
				{
					type: 'dropdown',
					id: 'direction',
					label: 'Direction',
					choices: [
						{ id: 'next', label: 'Next' },
						{ id: 'previous', label: 'Previous' },
					],
					default: 'next',
				},
			],
			callback: async (event) => {
				const screenId = String(event.options.screenId)
				const direction = event.options.direction === 'previous' ? 'previous' : 'next'
				const screen = state.screens.find((s) => s.id === screenId)
				const target = neighborEvent(state.sortedEvents, screen?.currentEventId, direction)
				if (!target) {
					log('warn', 'Advance Screen Event: no events available')
					return
				}
				await api.updateScreen(screenId, { currentEventId: target.id })
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

		sendNearestUpcomingEventToAllScreens: {
			name: 'Send Nearest Upcoming Event To All Screens',
			options: [],
			callback: async () => {
				const nearest = state.nearestUpcomingEvent
				if (!nearest) {
					log('warn', 'Send Nearest Upcoming Event To All Screens: no upcoming event found')
					return
				}
				await api.sendEventToAllScreens(nearest.id)
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

		trackNearestUpcomingEvent: {
			name: 'Track Nearest Upcoming Event For Position Variables',
			options: [],
			callback: async () => {
				const nearest = state.nearestUpcomingEvent
				if (!nearest) {
					log('warn', 'Track Nearest Upcoming Event: no upcoming event found')
					return
				}
				state.setTrackedEvent(nearest.id)
				await refresh()
			},
		},

		trackNextEvent: {
			name: 'Track Next Event',
			options: [],
			callback: async () => {
				const target = neighborEvent(state.sortedEvents, state.trackedEventId ?? undefined, 'next')
				if (!target) return
				state.setTrackedEvent(target.id)
				await refresh()
			},
		},

		trackPreviousEvent: {
			name: 'Track Previous Event',
			options: [],
			callback: async () => {
				const target = neighborEvent(state.sortedEvents, state.trackedEventId ?? undefined, 'previous')
				if (!target) return
				state.setTrackedEvent(target.id)
				await refresh()
			},
		},

		sendEventToPco: {
			name: 'Send Event To PCO',
			options: [{ type: 'dropdown', id: 'eventId', label: 'Event', choices: eventChoices(), default: eventChoices()[0]?.id ?? '' }],
			callback: async (event) => {
				const eventId = String(event.options.eventId)
				await api.sendEventToPco(eventId)
				await refresh()
			},
		},

		sendTrackedEventToPco: {
			name: 'Send Tracked Event To PCO',
			options: [],
			callback: async () => {
				if (!state.trackedEventId) {
					log('warn', 'Send Tracked Event To PCO: no event is currently tracked')
					return
				}
				await api.sendEventToPco(state.trackedEventId)
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
