import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleState } from './state'
import { combineRgb } from '@companion-module/base'

export function getFeedbackDefinitions(state: ModuleState): CompanionFeedbackDefinitions {
	const screenChoices = () => state.screens.map((s) => ({ id: s.id, label: s.name }))
	const eventChoices = () => state.events.map((e) => ({ id: e.id, label: `${e.date} — ${e.title}` }))
	const micboardChoices = () => state.micboards.map((m) => ({ id: m.id, label: m.name }))

	return {
		screenShowsEvent: {
			type: 'boolean',
			name: 'Screen Shows Event',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [
				{ type: 'dropdown', id: 'screenId', label: 'Screen', choices: screenChoices(), default: screenChoices()[0]?.id ?? '' },
				{ type: 'dropdown', id: 'eventId', label: 'Event', choices: eventChoices(), default: eventChoices()[0]?.id ?? '' },
			],
			callback: (feedback) => {
				const screen = state.screens.find((s) => s.id === feedback.options.screenId)
				return !!screen && screen.currentEventId === feedback.options.eventId
			},
		},

		screenShowsMicboard: {
			type: 'boolean',
			name: 'Screen Shows MicBoard',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [
				{ type: 'dropdown', id: 'screenId', label: 'Screen', choices: screenChoices(), default: screenChoices()[0]?.id ?? '' },
				{ type: 'dropdown', id: 'micboardId', label: 'MicBoard', choices: micboardChoices(), default: micboardChoices()[0]?.id ?? '' },
			],
			callback: (feedback) => {
				const screen = state.screens.find((s) => s.id === feedback.options.screenId)
				return !!screen && screen.micboardId === feedback.options.micboardId
			},
		},

		trackedPositionFilled: {
			type: 'boolean',
			name: 'Tracked Position Is Filled',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [{ type: 'textinput', id: 'positionId', label: 'Position ID', default: '' }],
			callback: (feedback) => {
				const pos = state.trackedPositions.find((p) => p.positionId === feedback.options.positionId)
				return !!pos?.personName
			},
		},
	}
}
