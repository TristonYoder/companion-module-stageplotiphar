import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleState } from './state'
import { combineRgb } from '@companion-module/base'
import { SCREEN_TEMPLATE_CHOICES } from './types'

export function getFeedbackDefinitions(state: ModuleState): CompanionFeedbackDefinitions {
	const screenChoices = () => state.screens.map((s) => ({ id: s.id, label: s.name }))
	const eventChoices = () => state.events.map((e) => ({ id: e.id, label: `${e.date} — ${e.title}` }))
	const micboardChoices = () => state.micboards.map((m) => ({ id: m.id, label: m.name }))
	const hardwareTypeChoices = () => state.hardware.types.map((t) => ({ id: t.id, label: t.name }))

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

		screenShowsTemplate: {
			type: 'boolean',
			name: 'Screen Shows Template',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [
				{ type: 'dropdown', id: 'screenId', label: 'Screen', choices: screenChoices(), default: screenChoices()[0]?.id ?? '' },
				{ type: 'dropdown', id: 'template', label: 'Template', choices: SCREEN_TEMPLATE_CHOICES, default: SCREEN_TEMPLATE_CHOICES[0].id },
			],
			callback: (feedback) => {
				const screen = state.screens.find((s) => s.id === feedback.options.screenId)
				return !!screen && screen.type === feedback.options.template
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

		trackedEventAssignmentStatus: {
			type: 'boolean',
			name: 'Tracked Event Has Assignment With Status',
			defaultStyle: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
			options: [
				{
					type: 'dropdown',
					id: 'status',
					label: 'Status',
					choices: [
						{ id: 'unconfirmed', label: 'Unconfirmed' },
						{ id: 'declined', label: 'Declined' },
						{ id: 'confirmed', label: 'Confirmed' },
					],
					default: 'unconfirmed',
				},
			],
			callback: (feedback) => {
				const status = feedback.options.status as 'confirmed' | 'unconfirmed' | 'declined'
				return state.trackedAssignmentCount(status) > 0
			},
		},

		eventSentToPco: {
			type: 'boolean',
			name: 'Event Sent To PCO',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [{ type: 'dropdown', id: 'eventId', label: 'Event', choices: eventChoices(), default: eventChoices()[0]?.id ?? '' }],
			callback: (feedback) => {
				const event = state.events.find((e) => e.id === feedback.options.eventId)
				return !!event?.pcoAttachmentSentAt
			},
		},

		trackedEventSentToPco: {
			type: 'boolean',
			name: 'Tracked Event Sent To PCO',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [],
			callback: () => !!state.trackedEvent?.pcoAttachmentSentAt,
		},

		hardwareSlotAssigned: {
			type: 'boolean',
			name: 'Hardware Slot Assigned (Tracked Event)',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [
				{ type: 'dropdown', id: 'typeId', label: 'Hardware Type', choices: hardwareTypeChoices(), default: hardwareTypeChoices()[0]?.id ?? '' },
				{ type: 'number', id: 'num', label: 'Number', default: 1, min: 1, max: 999 },
			],
			callback: (feedback) => {
				const typeId = String(feedback.options.typeId)
				const num = Number(feedback.options.num)
				return !!state.hardwareAssignedTo(typeId, num)
			},
		},
	}
}
