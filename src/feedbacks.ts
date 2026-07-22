import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { StagePlotipharApi } from './api'
import type { ModuleState } from './state'
import { combineRgb } from '@companion-module/base'
import { SCREEN_TEMPLATE_CHOICES } from './types'

export function getFeedbackDefinitions(state: ModuleState, api: StagePlotipharApi): CompanionFeedbackDefinitions {
	const screenChoices = () => state.screens.map((s) => ({ id: s.id, label: s.name }))
	const eventChoices = () => state.events.map((e) => ({ id: e.id, label: `${e.date} — ${e.title}` }))
	const micboardChoices = () => state.micboards.map((m) => ({ id: m.id, label: m.name }))
	const hardwareTypeChoices = () => state.hardware.types.map((t) => ({ id: t.id, label: t.name }))
	const positionChoices = () => state.allPositions.map((p) => ({ id: p.positionId, label: p.roleName }))
	const roleChoices = () => state.allRoles.map((r) => ({ id: r.roleId, label: r.roleName }))

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
			options: [
				{
					type: 'dropdown',
					id: 'positionId',
					label: 'Position',
					tooltip: 'Positions from every layout used by any known event. Type a custom value to use a position ID directly or a variable expression.',
					choices: positionChoices(),
					default: positionChoices()[0]?.id ?? '',
					allowCustom: true,
				},
			],
			callback: (feedback) => {
				const pos = state.trackedPositions.find((p) => p.positionId === feedback.options.positionId)
				return !!pos?.personName
			},
		},

		trackedRoleFilled: {
			type: 'boolean',
			name: 'Tracked Role Is Filled',
			defaultStyle: { bgcolor: combineRgb(0, 153, 0), color: combineRgb(255, 255, 255) },
			options: [
				{
					type: 'dropdown',
					id: 'roleId',
					label: 'Role',
					tooltip: 'Every known role, whether or not it has a stage position. Type a custom value to use a role ID directly or a variable expression.',
					choices: roleChoices(),
					default: roleChoices()[0]?.id ?? '',
					allowCustom: true,
				},
			],
			callback: (feedback) => {
				return !!state.roleAssignedTo(String(feedback.options.roleId))
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

		personImage: {
			type: 'advanced',
			name: 'Person Image (Full Screen)',
			description:
				"Fills the whole button with a person's photo. Enter a name directly, or a variable expression like $(stageplotiphar:position_xxx_name) — Companion resolves it before this runs either way.",
			options: [
				{
					type: 'textinput',
					id: 'name',
					label: 'Person Name',
					default: '',
					useVariables: true,
				},
			],
			callback: async (feedback) => {
				const name = String(feedback.options.name ?? '')
				const person = state.findPerson(name)
				if (!person?.image) return {}

				const dataUri = await api.getPersonImageDataUri(person.image)
				if (!dataUri) return {}

				return { png64: dataUri, pngalignment: 'center:center' }
			},
		},
	}
}
