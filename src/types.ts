export interface StagePosition {
	id: string
	roleId: string
	x: number
	y: number
}

export interface Layout {
	id: string
	name: string
	positions: StagePosition[]
}

export interface HardwareSlotAssignment {
	typeId: string
	num: number
}

export interface Role {
	id: string
	name: string
	defaultHardware: HardwareSlotAssignment[]
}

export interface RoleAssignment {
	roleId: string
	personName: string
	hardwareOverride?: HardwareSlotAssignment[]
	pcoStatus?: 'confirmed' | 'unconfirmed' | 'declined'
}

export interface PositionOverride {
	positionId: string
	roleId?: string
	x?: number
	y?: number
}

export interface StageEvent {
	id: string
	date: string
	title: string
	layoutId: string
	roleAssignments: RoleAssignment[]
	positionOverrides: PositionOverride[]
	pcoAttachmentSentAt?: string
}

export interface Venue {
	id: string
	name: string
}

export interface MicBoard {
	id: string
	name: string
}

// Server-driven: the authoritative list comes from GET /api/screen-types, so a
// server that gains a view type exposes it without a module release. Kept as a
// plain string rather than a union for exactly that reason — pinning a union
// here is what let this list silently drift out of date before.
export type ScreenTemplate = string

export interface ScreenTypeChoice {
	id: ScreenTemplate
	label: string
}

// Only used when the server doesn't answer /api/screen-types — i.e. a server
// older than the release that added it. Mirrors that server's list at the time
// of writing so an older pairing still gets working dropdowns rather than
// empty ones.
export const FALLBACK_SCREEN_TYPES: ScreenTypeChoice[] = [
	{ id: 'stageplot', label: 'Stage Plot' },
	{ id: 'stageplot-invert', label: 'Stage Plot (Invert)' },
	{ id: 'micboard', label: 'MicBoard' },
	{ id: 'assignments', label: 'Assignments Sheet' },
	{ id: 'agario', label: 'Agario View' },
]

export interface Screen {
	id: string
	name: string
	type: ScreenTemplate
	currentEventId?: string
	micboardId?: string
}

export interface HardwareTypeDef {
	id: string
	name: string
	color?: string
}

export interface HardwareItem {
	id: string
	num: number
	typeId: string
	label?: string
	notes?: string
}

export interface Hardware {
	types: HardwareTypeDef[]
	items: HardwareItem[]
}

export interface Person {
	name: string
	image?: string | null
}
