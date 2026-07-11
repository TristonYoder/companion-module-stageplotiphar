import type { StagePlotipharApi } from './api'
import type { Hardware, HardwareItem, Layout, MicBoard, Person, Role, Screen, StageEvent } from './types'

export function hardwareItemLabel(hardware: Hardware, item: HardwareItem): string {
	const type = hardware.types.find((t) => t.id === item.typeId)
	return item.label || `${type?.name ?? item.typeId} ${item.num}`
}

export interface ResolvedPosition {
	positionId: string
	roleId: string
	roleName: string
	personName: string | null
}

function hardwareKey(typeId: string, num: number): string {
	return `${typeId}:${num}`
}

function todayDateString(): string {
	const now = new Date()
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export class ModuleState {
	screens: Screen[] = []
	events: StageEvent[] = []
	micboards: MicBoard[] = []
	roles: Role[] = []
	hardware: Hardware = { types: [], items: [] }
	people: Record<string, Person> = {}

	// Positions/hardware for whichever event is currently tracked for
	// variables (see trackedEventId). Kept separate from `events` because
	// resolving positions requires an extra layout fetch per refresh.
	trackedEventId: string | null = null
	trackedPositions: ResolvedPosition[] = []
	trackedHardwareAssignments: Record<string, string> = {}

	constructor(private api: StagePlotipharApi) {}

	async refreshAll(): Promise<void> {
		const [screens, events, micboards, roles, hardware, people] = await Promise.all([
			this.api.listScreens(),
			this.api.listEvents(),
			this.api.listMicBoards(),
			this.api.listRoles(),
			this.api.getHardware(),
			this.api.listPeople(),
		])
		this.screens = screens
		this.events = events
		this.micboards = micboards
		this.roles = roles
		this.hardware = hardware
		this.people = people

		// First-load (and any-refresh-until-a-choice-is-made) default: track
		// whichever event is soonest without having already passed. Once
		// something else sets trackedEventId, this never overrides it.
		if (!this.trackedEventId) {
			const nearest = this.nearestUpcomingEvent
			if (nearest) this.trackedEventId = nearest.id
		}

		if (this.trackedEventId) {
			await this.refreshTrackedEventDetails()
		}
	}

	setTrackedEvent(eventId: string | null): void {
		this.trackedEventId = eventId
		this.trackedPositions = []
		this.trackedHardwareAssignments = {}
	}

	get trackedEvent(): StageEvent | undefined {
		return this.trackedEventId ? this.events.find((e) => e.id === this.trackedEventId) : undefined
	}

	// Events sorted chronologically — the basis for "next/previous" cycling.
	get sortedEvents(): StageEvent[] {
		return [...this.events].sort((a, b) => a.date.localeCompare(b.date))
	}

	// Soonest event that hasn't already passed (today counts as not-passed).
	// Undefined if every known event is in the past.
	get nearestUpcomingEvent(): StageEvent | undefined {
		const today = todayDateString()
		return this.sortedEvents.find((e) => e.date >= today)
	}

	trackedAssignmentCount(status: 'confirmed' | 'unconfirmed' | 'declined'): number {
		const event = this.trackedEvent
		if (!event) return 0
		return event.roleAssignments.filter((a) => a.pcoStatus === status).length
	}

	async refreshTrackedEventDetails(): Promise<void> {
		if (!this.trackedEventId) {
			this.trackedPositions = []
			this.trackedHardwareAssignments = {}
			return
		}

		const event = this.events.find((e) => e.id === this.trackedEventId) ?? (await this.api.getEvent(this.trackedEventId))

		this.trackedHardwareAssignments = {}
		for (const assignment of event.roleAssignments) {
			const role = this.roles.find((r) => r.id === assignment.roleId)
			const slots = assignment.hardwareOverride ?? role?.defaultHardware ?? []
			for (const slot of slots) {
				this.trackedHardwareAssignments[hardwareKey(slot.typeId, slot.num)] = assignment.personName
			}
		}

		if (!event.layoutId) {
			this.trackedPositions = []
			return
		}

		const layout: Layout = await this.api.getLayout(event.layoutId)
		this.trackedPositions = layout.positions.map((pos) => {
			const override = event.positionOverrides.find((o) => o.positionId === pos.id)
			const effectiveRoleId = override?.roleId ?? pos.roleId
			const assignment = event.roleAssignments.find((a) => a.roleId === effectiveRoleId)
			const role = this.roles.find((r) => r.id === effectiveRoleId)
			return {
				positionId: pos.id,
				roleId: effectiveRoleId,
				roleName: role?.name ?? effectiveRoleId,
				personName: assignment?.personName ?? null,
			}
		})
	}

	hardwareAssignedTo(typeId: string, num: number): string | null {
		return this.trackedHardwareAssignments[hardwareKey(typeId, num)] ?? null
	}

	eventTitle(eventId: string | undefined): string {
		if (!eventId) return ''
		return this.events.find((e) => e.id === eventId)?.title ?? eventId
	}

	micboardName(micboardId: string | undefined): string {
		if (!micboardId) return ''
		return this.micboards.find((m) => m.id === micboardId)?.name ?? micboardId
	}

	findPerson(name: string): Person | undefined {
		const trimmed = name.trim()
		if (!trimmed) return undefined
		if (this.people[trimmed]) return this.people[trimmed]
		const lower = trimmed.toLowerCase()
		return Object.values(this.people).find((p) => p.name.toLowerCase() === lower)
	}
}
