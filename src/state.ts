import type { StagePlotiferApi } from './api'
import type { Layout, MicBoard, Role, Screen, StageEvent } from './types'

export interface ResolvedPosition {
	positionId: string
	roleId: string
	roleName: string
	personName: string | null
}

export class ModuleState {
	screens: Screen[] = []
	events: StageEvent[] = []
	micboards: MicBoard[] = []
	roles: Role[] = []

	// Positions for whichever event is currently tracked for variables (see
	// trackedEventId). Kept separate from `events` because it requires an
	// extra layout fetch per refresh.
	trackedEventId: string | null = null
	trackedPositions: ResolvedPosition[] = []

	constructor(private api: StagePlotiferApi) {}

	async refreshAll(): Promise<void> {
		const [screens, events, micboards, roles] = await Promise.all([
			this.api.listScreens(),
			this.api.listEvents(),
			this.api.listMicBoards(),
			this.api.listRoles(),
		])
		this.screens = screens
		this.events = events
		this.micboards = micboards
		this.roles = roles

		if (this.trackedEventId) {
			await this.refreshTrackedPositions()
		}
	}

	setTrackedEvent(eventId: string | null): void {
		this.trackedEventId = eventId
		this.trackedPositions = []
	}

	async refreshTrackedPositions(): Promise<void> {
		if (!this.trackedEventId) {
			this.trackedPositions = []
			return
		}

		const event = this.events.find((e) => e.id === this.trackedEventId) ?? (await this.api.getEvent(this.trackedEventId))
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

	eventTitle(eventId: string | undefined): string {
		if (!eventId) return ''
		return this.events.find((e) => e.id === eventId)?.title ?? eventId
	}

	micboardName(micboardId: string | undefined): string {
		if (!micboardId) return ''
		return this.micboards.find((m) => m.id === micboardId)?.name ?? micboardId
	}
}
