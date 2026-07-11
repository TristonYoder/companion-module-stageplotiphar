import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { ModuleState } from './state'

export function getVariableDefinitions(state: ModuleState): CompanionVariableDefinition[] {
	const defs: CompanionVariableDefinition[] = []

	for (const screen of state.screens) {
		defs.push({ variableId: `screen_${screen.id}_event_title`, name: `${screen.name}: current event title` })
		defs.push({ variableId: `screen_${screen.id}_micboard_name`, name: `${screen.name}: current micboard name` })
	}

	defs.push({ variableId: 'tracked_event_title', name: 'Tracked event: title' })

	for (const pos of state.trackedPositions) {
		defs.push({ variableId: `position_${pos.positionId}_role`, name: `Tracked event: role at position ${pos.positionId}` })
		defs.push({ variableId: `position_${pos.positionId}_name`, name: `Tracked event: person at position ${pos.positionId}` })
	}

	return defs
}

export function getVariableValues(state: ModuleState): CompanionVariableValues {
	const values: CompanionVariableValues = {}

	for (const screen of state.screens) {
		values[`screen_${screen.id}_event_title`] = state.eventTitle(screen.currentEventId)
		values[`screen_${screen.id}_micboard_name`] = state.micboardName(screen.micboardId)
	}

	values['tracked_event_title'] = state.eventTitle(state.trackedEventId ?? undefined)

	for (const pos of state.trackedPositions) {
		values[`position_${pos.positionId}_role`] = pos.roleName
		values[`position_${pos.positionId}_name`] = pos.personName ?? ''
	}

	return values
}
