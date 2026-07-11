import {
	InstanceBase,
	InstanceStatus,
	runEntrypoint,
	type DropdownChoice,
	type SomeCompanionConfigField,
} from '@companion-module/base'
import { StagePlotiferApi, ApiError } from './api'
import { getConfigFields, type ModuleConfig, type ModuleSecrets } from './config'
import { getActionDefinitions } from './actions'
import { getFeedbackDefinitions } from './feedbacks'
import { getVariableDefinitions, getVariableValues } from './variables'
import { ModuleState } from './state'

class StagePlotiferInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	private config!: ModuleConfig
	private secrets!: ModuleSecrets
	private api!: StagePlotiferApi
	private state!: ModuleState
	private pollTimer: ReturnType<typeof setInterval> | undefined
	private venueChoices: DropdownChoice[] = []

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		this.api = new StagePlotiferApi(() => ({ ...this.config, ...this.secrets }))
		this.state = new ModuleState(this.api)

		this.setActionDefinitions(
			getActionDefinitions({
				api: this.api,
				state: this.state,
				refresh: () => this.refresh(),
				log: (level, message) => this.log(level, message),
			})
		)
		this.setFeedbackDefinitions(getFeedbackDefinitions(this.state))
		this.setVariableDefinitions(getVariableDefinitions(this.state))

		await this.refresh()
		this.startPolling()
	}

	async destroy(): Promise<void> {
		this.stopPolling()
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		this.stopPolling()
		await this.refresh()
		this.startPolling()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields(this.venueChoices)
	}

	private startPolling(): void {
		const interval = Math.max(1000, this.config.pollInterval || 5000)
		this.pollTimer = setInterval(() => {
			this.refresh().catch((err) => this.log('warn', `Poll failed: ${errMessage(err)}`))
		}, interval)
	}

	private stopPolling(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}
	}

	// Org-scoped, so this works before a venue is chosen — populates the config
	// panel's Venue dropdown, and auto-picks it for the user when there's only
	// one venue to choose from (the common case).
	private async refreshVenues(): Promise<void> {
		const venues = await this.api.listVenues()
		this.venueChoices = venues.map((v) => ({ id: v.id, label: v.name }))

		if (!this.config.venueId && venues.length === 1) {
			this.config.venueId = venues[0].id
			this.saveConfig(this.config, undefined)
		}
	}

	private async refresh(): Promise<void> {
		if (!this.config.host || !this.secrets.apiKey) {
			this.updateStatus(InstanceStatus.BadConfig, 'Host and API key are required')
			return
		}

		try {
			await this.refreshVenues()
			await this.state.refreshAll()
			this.updateStatus(InstanceStatus.Ok)
			this.setActionDefinitions(
				getActionDefinitions({
					api: this.api,
					state: this.state,
					refresh: () => this.refresh(),
					log: (level, message) => this.log(level, message),
				})
			)
			this.setFeedbackDefinitions(getFeedbackDefinitions(this.state))
			this.setVariableDefinitions(getVariableDefinitions(this.state))
			this.setVariableValues(getVariableValues(this.state))
			this.checkFeedbacks()
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				this.updateStatus(InstanceStatus.AuthenticationFailure, err.message)
			} else {
				this.updateStatus(InstanceStatus.ConnectionFailure, errMessage(err))
			}
			throw err
		}
	}
}

function errMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err)
}

runEntrypoint(StagePlotiferInstance, [])
