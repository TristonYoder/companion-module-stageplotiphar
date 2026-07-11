import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { StagePlotiferApi, ApiError } from './api'
import { getConfigFields, type ModuleConfig } from './config'
import { getActionDefinitions } from './actions'
import { getFeedbackDefinitions } from './feedbacks'
import { getVariableDefinitions, getVariableValues } from './variables'
import { ModuleState } from './state'

class StagePlotiferInstance extends InstanceBase<ModuleConfig> {
	private config!: ModuleConfig
	private api!: StagePlotiferApi
	private state!: ModuleState
	private pollTimer: ReturnType<typeof setInterval> | undefined

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.api = new StagePlotiferApi(() => this.config)
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

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.stopPolling()
		await this.refresh()
		this.startPolling()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
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

	private async refresh(): Promise<void> {
		if (!this.config.host || !this.config.apiKey) {
			this.updateStatus(InstanceStatus.BadConfig, 'Host and API key are required')
			return
		}

		try {
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
