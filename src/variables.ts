import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { ModuleState } from './state'

export function getVariableDefinitions(state: ModuleState): CompanionVariableDefinition[] {
	const defs: CompanionVariableDefinition[] = []

	for (const screen of state.screens) {
		defs.push({ variableId: `screen_${screen.id}_event_title`, name: `${screen.name}: current event title` })
		defs.push({ variableId: `screen_${screen.id}_micboard_name`, name: `${screen.name}: current micboard name` })
	}

	defs.push({ variableId: 'today_event_id', name: "Today's event: id" })
	defs.push({ variableId: 'today_event_title', name: "Today's event: title" })

	defs.push({ variableId: 'tracked_event_title', name: 'Tracked event: title' })
	defs.push({ variableId: 'tracked_event_unconfirmed_count', name: 'Tracked event: unconfirmed assignment count' })
	defs.push({ variableId: 'tracked_event_declined_count', name: 'Tracked event: declined assignment count' })
	defs.push({ variableId: 'tracked_event_pco_sent', name: 'Tracked event: sent to PCO (yes/no)' })

	for (const pos of state.trackedPositions) {
		defs.push({ variableId: `position_${pos.positionId}_role`, name: `Tracked event: role at position ${pos.positionId}` })
		defs.push({ variableId: `position_${pos.positionId}_name`, name: `Tracked event: person at position ${pos.positionId}` })
	}

	for (const item of state.hardware.items) {
		const type = state.hardware.types.find((t) => t.id === item.typeId)
		const label = item.label || `${type?.name ?? item.typeId} ${item.num}`
		defs.push({ variableId: `hardware_${item.id}_assigned_to`, name: `Tracked event: ${label} assigned to` })
	}

	return defs
}

export function getVariableValues(state: ModuleState): CompanionVariableValues {
	const values: CompanionVariableValues = {}

	for (const screen of state.screens) {
		values[`screen_${screen.id}_event_title`] = state.eventTitle(screen.currentEventId)
		values[`screen_${screen.id}_micboard_name`] = state.micboardName(screen.micboardId)
	}

	values['today_event_id'] = state.todaysEvent?.id ?? ''
	values['today_event_title'] = state.todaysEvent?.title ?? ''

	values['tracked_event_title'] = state.eventTitle(state.trackedEventId ?? undefined)
	values['tracked_event_unconfirmed_count'] = state.trackedAssignmentCount('unconfirmed')
	values['tracked_event_declined_count'] = state.trackedAssignmentCount('declined')
	values['tracked_event_pco_sent'] = state.trackedEvent?.pcoAttachmentSentAt ? 'yes' : 'no'

	for (const pos of state.trackedPositions) {
		values[`position_${pos.positionId}_role`] = pos.roleName
		values[`position_${pos.positionId}_name`] = pos.personName ?? ''
	}

	for (const item of state.hardware.items) {
		values[`hardware_${item.id}_assigned_to`] = state.hardwareAssignedTo(item.typeId, item.num) ?? ''
	}

	return values
}
