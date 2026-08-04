import type { CompanionActionDefinitions } from '@companion-module/base'
import { InstanceStatus } from '@companion-module/base'
import { ApiError, type StagePlotipharApi } from './api'
import type { ModuleState } from './state'
import type { StageEvent } from './types'

export interface ActionDeps {
	api: StagePlotipharApi
	state: ModuleState
	refresh: () => Promise<void>
	log: (level: 'info' | 'warn' | 'error', message: string) => void
	setStatus: (status: InstanceStatus, message?: string) => void
}

// Companion swallows a rejected action callback into a generic unhandled
// -rejection log: the button appears to work, and the module keeps reporting
// Ok. That hides the two failures an operator most needs to see mid-show — a
// revoked API key (401) and a lapsed billing entitlement (402, which the
// server raises on mutating requests only, so a GET-only poll never surfaces
// it). Wrapping every callback here rather than hand-writing try/catch per
// action means a new action can't forget to do it.
function guardCallbacks(defs: CompanionActionDefinitions, deps: ActionDeps): CompanionActionDefinitions {
	const guarded: CompanionActionDefinitions = {}
	for (const [id, def] of Object.entries(defs)) {
		if (!def) continue
		const original = def.callback.bind(def)
		guarded[id] = {
			...def,
			callback: async (event, context) => {
				try {
					return await original(event, context)
				} catch (err) {
					if (err instanceof ApiError && err.status === 401) {
						deps.setStatus(InstanceStatus.AuthenticationFailure, err.message)
					} else if (err instanceof ApiError && err.status === 402) {
						deps.setStatus(InstanceStatus.UnknownWarning, 'Billing entitlement lapsed — changes are rejected until the subscription is renewed')
					}
					deps.log('error', `${def.name} failed: ${err instanceof Error ? err.message : String(err)}`)
					return undefined
				}
			},
		}
	}
	return guarded
}

function neighborEvent(sorted: StageEvent[], currentId: string | undefined, direction: 'next' | 'previous'): StageEvent | undefined {
	if (sorted.length === 0) return undefined
	const currentIndex = sorted.findIndex((e) => e.id === currentId)
	if (currentIndex === -1) return direction === 'next' ? sorted[0] : sorted[sorted.length - 1]
	const step = direction === 'next' ? 1 : -1
	return sorted[(currentIndex + step + sorted.length) % sorted.length]
}

export function getActionDefinitions(deps: ActionDeps): CompanionActionDefinitions {
	const { api, state, refresh, log } = deps
	const screenChoices = () => state.screens.map((s) => ({ id: s.id, label: s.name }))
	const eventChoices = () => state.events.map((e) => ({ id: e.id, label: `${e.date} — ${e.title}` }))
	const micboardChoices = () => state.micboards.map((m) => ({ id: m.id, label: m.name }))
	// Server-driven (GET /api/screen-types), refreshed on every poll — a view
	// type added server-side appears here without a module release.
	const templateChoices = () => state.screenTypes.map((t) => ({ id: t.id, label: t.label }))

	const definitions: CompanionActionDefinitions = {
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
				{ type: 'dropdown', id: 'template', label: 'Template', choices: templateChoices(), default: templateChoices()[0]?.id ?? '' },
			],
			callback: async (event) => {
				const screenId = String(event.options.screenId)
				const template = String(event.options.template)
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

	return guardCallbacks(definitions, deps)
}
