import type { DropdownChoice, SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	venueId?: string
	pollInterval: number
}

// Delivered separately from ModuleConfig by the Companion host (see the
// 'secret-text' field type below) — never persisted alongside plain config.
export interface ModuleSecrets {
	apiKey: string
}

const NO_VENUES_YET: DropdownChoice[] = [{ id: '', label: 'Save your API key first, then reopen this panel' }]

export function getConfigFields(venueChoices: DropdownChoice[]): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'StagePlotifer URL',
			tooltip: 'Base URL of your StagePlotifer instance. Change this if you self-host instead of using plotiphar.com.',
			width: 8,
			default: 'https://plotiphar.com',
			required: true,
		},
		{
			type: 'secret-text',
			id: 'apiKey',
			label: 'API Key',
			tooltip: 'Created under Settings → API Keys in StagePlotifer',
			width: 8,
			default: '',
			required: true,
		},
		{
			type: 'dropdown',
			id: 'venueId',
			label: 'Venue',
			tooltip: 'Populated after the API key above is saved. Auto-selected if your org has only one venue.',
			width: 8,
			default: '',
			choices: venueChoices.length > 0 ? venueChoices : NO_VENUES_YET,
			allowCustom: false,
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
