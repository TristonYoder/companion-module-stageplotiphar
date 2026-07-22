import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import { getHardwareSlugs, getPositionSlugs, hardwareItemLabel, type ModuleState } from './state'
import { SCREEN_TEMPLATE_CHOICES } from './types'

function templateLabel(id: string): string {
	return SCREEN_TEMPLATE_CHOICES.find((t) => t.id === id)?.label ?? id
}

export function getVariableDefinitions(state: ModuleState): CompanionVariableDefinition[] {
	const defs: CompanionVariableDefinition[] = []

	for (const screen of state.screens) {
		defs.push({ variableId: `screen_${screen.id}_event_title`, name: `${screen.name}: current event title` })
		defs.push({ variableId: `screen_${screen.id}_micboard_name`, name: `${screen.name}: current micboard name` })
		defs.push({ variableId: `screen_${screen.id}_template`, name: `${screen.name}: current template` })
	}

	defs.push({ variableId: 'upcoming_event_id', name: 'Nearest upcoming event: id' })
	defs.push({ variableId: 'upcoming_event_title', name: 'Nearest upcoming event: title' })
	defs.push({ variableId: 'upcoming_event_date', name: 'Nearest upcoming event: date' })

	defs.push({ variableId: 'previous_event_id', name: 'Most recent past event: id' })
	defs.push({ variableId: 'previous_event_title', name: 'Most recent past event: title' })
	defs.push({ variableId: 'previous_event_date', name: 'Most recent past event: date' })

	defs.push({ variableId: 'tracked_event_title', name: 'Tracked event: title' })
	defs.push({ variableId: 'tracked_event_date', name: 'Tracked event: date' })
	defs.push({ variableId: 'tracked_event_unconfirmed_count', name: 'Tracked event: unconfirmed assignment count' })
	defs.push({ variableId: 'tracked_event_declined_count', name: 'Tracked event: declined assignment count' })
	defs.push({ variableId: 'tracked_event_pco_sent', name: 'Tracked event: sent to PCO (yes/no)' })

	const positionSlugs = getPositionSlugs(state.allPositions)
	for (const pos of state.allPositions) {
		const slug = positionSlugs.get(pos.positionId) ?? pos.positionId
		defs.push({ variableId: `position_${slug}_role`, name: `Tracked event: role at position ${pos.roleName}` })
		defs.push({ variableId: `position_${slug}_name`, name: `Tracked event: person at position ${pos.roleName}` })
	}

	const hardwareSlugs = getHardwareSlugs(state.hardware)
	for (const item of state.hardware.items) {
		const label = hardwareItemLabel(state.hardware, item)
		const slug = hardwareSlugs.get(item.id) ?? item.id
		defs.push({ variableId: `hardware_${slug}_assigned_to`, name: `Tracked event: ${label} assigned to` })
	}

	return defs
}

export function getVariableValues(state: ModuleState): CompanionVariableValues {
	const values: CompanionVariableValues = {}

	for (const screen of state.screens) {
		values[`screen_${screen.id}_event_title`] = state.eventTitle(screen.currentEventId)
		values[`screen_${screen.id}_micboard_name`] = state.micboardName(screen.micboardId)
		values[`screen_${screen.id}_template`] = templateLabel(screen.type)
	}

	values['upcoming_event_id'] = state.nearestUpcomingEvent?.id ?? ''
	values['upcoming_event_title'] = state.nearestUpcomingEvent?.title ?? ''
	values['upcoming_event_date'] = state.nearestUpcomingEvent?.date ?? ''

	values['previous_event_id'] = state.previousEvent?.id ?? ''
	values['previous_event_title'] = state.previousEvent?.title ?? ''
	values['previous_event_date'] = state.previousEvent?.date ?? ''

	values['tracked_event_title'] = state.eventTitle(state.trackedEventId ?? undefined)
	values['tracked_event_date'] = state.eventDate(state.trackedEventId ?? undefined)
	values['tracked_event_unconfirmed_count'] = state.trackedAssignmentCount('unconfirmed')
	values['tracked_event_declined_count'] = state.trackedAssignmentCount('declined')
	values['tracked_event_pco_sent'] = state.trackedEvent?.pcoAttachmentSentAt ? 'yes' : 'no'

	const positionSlugs = getPositionSlugs(state.allPositions)
	for (const pos of state.allPositions) {
		const slug = positionSlugs.get(pos.positionId) ?? pos.positionId
		const tracked = state.trackedPositions.find((p) => p.positionId === pos.positionId)
		values[`position_${slug}_role`] = tracked?.roleName ?? pos.roleName
		values[`position_${slug}_name`] = tracked?.personName ?? ''
	}

	const hardwareSlugs = getHardwareSlugs(state.hardware)
	for (const item of state.hardware.items) {
		const slug = hardwareSlugs.get(item.id) ?? item.id
		values[`hardware_${slug}_assigned_to`] = state.hardwareAssignedTo(item.typeId, item.num) ?? ''
	}

	return values
}
