# StagePlotifer

Connects Bitfocus Companion to a [StagePlotifer](https://plotiphar.com) venue via its REST API.

## Setup

1. In StagePlotifer, go to **Settings → API Keys** and create a key.
2. In Companion, add this module, paste the key into **API Key**, and save.
   The **StagePlotifer URL** defaults to `https://plotiphar.com` — only change it if you self-host.
3. Reopen the connection's settings. If your org has more than one venue, a **Venue** dropdown is now populated — pick one. With only one venue, it's selected automatically and there's nothing else to do.
4. Companion will poll screens, events, micboards, and roles for the selected venue on the configured interval.

## Actions

- **Set Screen Event** — point a screen at a specific event's stage plot
- **Set Screen MicBoard** — point a screen at a specific micboard
- **Send Event To All Screens** — push one event to every screen at once
- **Track Event For Position Variables** — choose which event's stage positions populate `position_*` variables
- **Refresh Data Now** — force an immediate poll

## Feedbacks

- **Screen Shows Event** — true when a screen is currently displaying a given event
- **Screen Shows MicBoard** — true when a screen is currently displaying a given micboard
- **Tracked Position Is Filled** — true when the tracked event has a person assigned to a given position ID

## Variables

- `screen_<id>_event_title`, `screen_<id>_micboard_name` — per screen
- `tracked_event_title` — title of the event chosen via "Track Event For Position Variables"
- `position_<id>_role`, `position_<id>_name` — per stage position in the tracked event's layout, resolved through that event's role assignments and position overrides
