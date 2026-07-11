import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	apiKey: string
	venueId?: string
	pollInterval: number
}

export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'StagePlotifer URL',
			tooltip: 'Base URL of your StagePlotifer instance, e.g. https://plotiphar.example.com',
			width: 8,
			default: '',
			required: true,
		},
		{
			type: 'textinput',
			id: 'apiKey',
			label: 'API Key',
			tooltip: 'Created under Settings → API Keys in StagePlotifer',
			width: 8,
			default: '',
			required: true,
		},
		{
			type: 'textinput',
			id: 'venueId',
			label: 'Venue ID (optional)',
			tooltip: 'Leave blank to use the org default venue. Required if your org has more than one venue.',
			width: 6,
			default: '',
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll Interval (ms)',
			tooltip: 'How often to refresh screens, events, and micboard state',
			width: 4,
			default: 5000,
			min: 1000,
			max: 60000,
		},
	]
}
