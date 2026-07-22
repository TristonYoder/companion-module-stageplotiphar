import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'
import { getHardwareSlugs, getPositionSlugs, hardwareItemLabel, type ModuleState } from './state'
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
		// Ordered as a pager: ◂ Prev | status | Next ▸ — meant to sit side by
		// side on three adjacent Stream Deck buttons.
		presets[`screenPrevious_${screen.id}`] = {
			type: 'button',
			category: 'Screens',
			name: `${screen.name}: Previous Event`,
			style: { text: '◂ Prev Event', size: '14', color: WHITE, bgcolor: BLUE },
			steps: [
				{
					down: [{ actionId: 'advanceScreenEvent', options: { screenId: screen.id, direction: 'previous' } }],
					up: [],
				},
			],
			feedbacks: [],
		}

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
			style: { text: 'Next Event ▸', size: '14', color: WHITE, bgcolor: BLUE },
			steps: [
				{
					down: [{ actionId: 'advanceScreenEvent', options: { screenId: screen.id, direction: 'next' } }],
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

	const positionSlugs = getPositionSlugs(state.allPositions)
	for (const pos of state.allPositions) {
		const slug = positionSlugs.get(pos.positionId) ?? pos.positionId
		presets[`position_${slug}`] = {
			type: 'button',
			category: 'Positions',
			name: `Role: ${pos.roleName}`,
			style: {
				text: `${pos.roleName}\n$(self:position_${slug}_name)`,
				size: '14',
				color: WHITE,
				bgcolor: GREY,
			},
			steps: [{ down: [{ actionId: 'refreshNow', options: {} }], up: [] }],
			feedbacks: [
				// Base state: green + role/name text once the position is filled.
				{
					feedbackId: 'trackedPositionFilled',
					options: { positionId: pos.positionId },
					style: { bgcolor: GREEN },
				},
				// Layered on top: if that person has a photo, it replaces the
				// green/text entirely and fills the button. Falls through to
				// the state above when there's no photo (or no one assigned).
				{
					feedbackId: 'personImage',
					options: { name: `$(self:position_${slug}_name)` },
				},
			],
		}
	}

	const hardwareSlugs = getHardwareSlugs(state.hardware)
	for (const item of state.hardware.items) {
		const label = hardwareItemLabel(state.hardware, item)
		const slug = hardwareSlugs.get(item.id) ?? item.id
		presets[`hardware_${slug}`] = {
			type: 'button',
			category: 'Hardware',
			name: `Hardware: ${label}`,
			style: {
				text: `${label}\n$(self:hardware_${slug}_assigned_to)`,
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
