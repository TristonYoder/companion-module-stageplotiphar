import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'
import { hardwareItemLabel, type ModuleState } from './state'
import { SCREEN_TEMPLATE_CHOICES } from './types'

const GREEN = combineRgb(0, 153, 0)
const BLUE = combineRgb(0, 78, 153)
const GREY = combineRgb(40, 40, 40)
const WHITE = combineRgb(255, 255, 255)

export function getPresetDefinitions(state: ModuleState): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {
		refreshNow: {
			type: 'button',
			category: 'General',
			name: 'Refresh Data Now',
			style: { text: 'Refresh', size: '18', color: WHITE, bgcolor: GREY },
			steps: [{ down: [{ actionId: 'refreshNow', options: {} }], up: [] }],
			feedbacks: [],
		},

		trackNearestUpcomingEvent: {
			type: 'button',
			category: 'General',
			name: 'Track Nearest Upcoming Event',
			style: { text: 'Track Nearest\nUpcoming Event\n$(self:upcoming_event_title)', size: '14', color: WHITE, bgcolor: BLUE },
			steps: [{ down: [{ actionId: 'trackNearestUpcomingEvent', options: {} }], up: [] }],
			feedbacks: [],
		},

		sendNearestUpcomingEventToAllScreens: {
			type: 'button',
			category: 'General',
			name: 'Send Nearest Upcoming Event To All Screens',
			style: { text: 'Send Nearest\nUpcoming Event\nTo All Screens', size: '14', color: WHITE, bgcolor: BLUE },
			steps: [{ down: [{ actionId: 'sendNearestUpcomingEventToAllScreens', options: {} }], up: [] }],
			feedbacks: [],
		},

		trackNextEvent: {
			type: 'button',
			category: 'General',
			name: 'Track Next Event',
			style: { text: 'Track\nNext Event ▸', size: '14', color: WHITE, bgcolor: GREY },
			steps: [{ down: [{ actionId: 'trackNextEvent', options: {} }], up: [] }],
			feedbacks: [],
		},

		trackPreviousEvent: {
			type: 'button',
			category: 'General',
			name: 'Track Previous Event',
			style: { text: '◂ Track\nPrevious Event', size: '14', color: WHITE, bgcolor: GREY },
			steps: [{ down: [{ actionId: 'trackPreviousEvent', options: {} }], up: [] }],
			feedbacks: [],
		},

		sendTrackedEventToPco: {
			type: 'button',
			category: 'General',
			name: 'Send Tracked Event To PCO',
			style: { text: 'Send To PCO\n$(self:tracked_event_title)', size: '14', color: WHITE, bgcolor: GREY },
			steps: [{ down: [{ actionId: 'sendTrackedEventToPco', options: {} }], up: [] }],
			feedbacks: [{ feedbackId: 'trackedEventSentToPco', options: {}, style: { bgcolor: GREEN } }],
		},

		trackedEventUnconfirmed: {
			type: 'button',
			category: 'General',
			name: 'Tracked Event Has Unconfirmed Assignments',
			style: { text: 'Unconfirmed:\n$(self:tracked_event_unconfirmed_count)', size: '14', color: WHITE, bgcolor: GREY },
			steps: [{ down: [], up: [] }],
			feedbacks: [{ feedbackId: 'trackedEventAssignmentStatus', options: { status: 'unconfirmed' }, style: { bgcolor: combineRgb(204, 0, 0) } }],
		},
	}

	for (const screen of state.screens) {
		presets[`screenStatus_${screen.id}`] = {
			type: 'button',
			category: 'Screens',
			name: `${screen.name}: Status`,
			style: { text: `${screen.name}\n$(self:screen_${screen.id}_event_title)`, size: '14', color: WHITE, bgcolor: GREY },
			steps: [{ down: [{ actionId: 'refreshNow', options: {} }], up: [] }],
			feedbacks: [],
		}

		presets[`screenNext_${screen.id}`] = {
			type: 'button',
			category: 'Screens',
			name: `${screen.name}: Next Event`,
			style: { text: `${screen.name}\nNext Event ▸`, size: '14', color: WHITE, bgcolor: BLUE },
			steps: [
				{
					down: [{ actionId: 'advanceScreenEvent', options: { screenId: screen.id, direction: 'next' } }],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`screenPrevious_${screen.id}`] = {
			type: 'button',
			category: 'Screens',
			name: `${screen.name}: Previous Event`,
			style: { text: `◂ ${screen.name}\nPrevious Event`, size: '14', color: WHITE, bgcolor: BLUE },
			steps: [
				{
					down: [{ actionId: 'advanceScreenEvent', options: { screenId: screen.id, direction: 'previous' } }],
					up: [],
				},
			],
			feedbacks: [],
		}

		for (const template of SCREEN_TEMPLATE_CHOICES) {
			presets[`screenTemplate_${screen.id}_${template.id}`] = {
				type: 'button',
				category: 'Screen Templates',
				name: `${screen.name}: ${template.label} Template`,
				style: { text: `${screen.name}\n${template.label}`, size: '14', color: WHITE, bgcolor: GREY },
				steps: [
					{
						down: [{ actionId: 'setScreenTemplate', options: { screenId: screen.id, template: template.id } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'screenShowsTemplate',
						options: { screenId: screen.id, template: template.id },
						style: { bgcolor: GREEN },
					},
				],
			}
		}
	}

	for (const pos of state.trackedPositions) {
		presets[`position_${pos.positionId}`] = {
			type: 'button',
			category: 'Positions',
			name: `Position: ${pos.roleName}`,
			style: {
				text: `${pos.roleName}\n$(self:position_${pos.positionId}_name)`,
				size: '14',
				color: WHITE,
				bgcolor: GREY,
			},
			steps: [{ down: [{ actionId: 'refreshNow', options: {} }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'trackedPositionFilled',
					options: { positionId: pos.positionId },
					style: { bgcolor: GREEN },
				},
			],
		}
	}

	for (const item of state.hardware.items) {
		const label = hardwareItemLabel(state.hardware, item)
		presets[`hardware_${item.id}`] = {
			type: 'button',
			category: 'Hardware',
			name: `Hardware: ${label}`,
			style: {
				text: `${label}\n$(self:hardware_${item.id}_assigned_to)`,
				size: '14',
				color: WHITE,
				bgcolor: GREY,
			},
			steps: [{ down: [{ actionId: 'refreshNow', options: {} }], up: [] }],
			feedbacks: [
				{
					feedbackId: 'hardwareSlotAssigned',
					options: { typeId: item.typeId, num: item.num },
					style: { bgcolor: GREEN },
				},
			],
		}
	}

	return presets
}
