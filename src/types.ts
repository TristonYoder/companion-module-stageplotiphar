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

export interface Screen {
	id: string
	name: string
	type: 'stageplot' | 'micboard' | 'assignments' | 'agario'
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
