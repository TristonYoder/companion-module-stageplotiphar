# StagePlotiphar

Connects Bitfocus Companion to a [StagePlotiphar](https://plotiphar.com) venue via its REST API.

## Setup

1. In StagePlotiphar, go to **Settings → API Keys** and create a key.
2. In Companion, add this module, paste the key into **API Key**, and save.
   The **StagePlotiphar URL** defaults to `https://plotiphar.com` — only change it if you self-host.
3. Reopen the connection's settings. If your org has more than one venue, a **Venue** dropdown is now populated — pick one. With only one venue, it's selected automatically and there's nothing else to do.
4. Companion will poll screens, events, micboards, roles, and hardware for the selected venue on the configured interval. As soon as events load, the tracked event (used for `position_*`/`hardware_*` variables) is automatically set to the nearest event that hasn't already passed — no action needed unless you want to point it elsewhere.

## Actions

- **Set Screen Event** — point a screen at a specific event's stage plot
- **Set Screen MicBoard** — point a screen at a specific micboard
- **Set Screen Template** — switch what a screen renders: Stage Plot, MicBoard, Assignments, or Agario
- **Advance Screen To Next/Previous Event** — move a screen forward/back through the event list (sorted by date) without opening a dropdown each time
- **Send Event To All Screens** — push one event to every screen at once
- **Send Nearest Upcoming Event To All Screens** — same, auto-detected as the soonest event that hasn't already passed
- **Track Event For Position Variables** — choose which event's stage positions/hardware populate the `position_*`/`hardware_*` variables
- **Track Nearest Upcoming Event For Position Variables** — same, auto-detected as the soonest event that hasn't already passed (this also happens automatically on load — see Setup)
- **Track Next Event** / **Track Previous Event** — move the tracked event forward/back chronologically
- **Send Event To PCO** — manually post an event's stage plot attachment to its PCO plan
- **Send Tracked Event To PCO** — same, for whichever event is currently tracked
- **Refresh Data Now** — force an immediate poll

## Feedbacks

- **Screen Shows Event** — true when a screen is currently displaying a given event
- **Screen Shows MicBoard** — true when a screen is currently displaying a given micboard
- **Screen Shows Template** — true when a screen is currently rendering a given template (Stage Plot/MicBoard/Assignments/Agario)
- **Tracked Position Is Filled** — true when the tracked event has a person assigned to a given position ID
- **Tracked Event Has Assignment With Status** — true when the tracked event has any role assignment with the given PCO status (confirmed/unconfirmed/declined) — use this to flag a missing musician before doors
- **Event Sent To PCO** / **Tracked Event Sent To PCO** — true once that event's stage-plot attachment has been posted to PCO
- **Hardware Slot Assigned (Tracked Event)** — true when a given hardware type/number is in use somewhere in the tracked event (via role default hardware or a per-assignment override)
- **Person Image (Full Screen)** — fills the whole button with a person's photo. Type a name directly, or a variable expression (e.g. `$(stageplotiphar:position_xxx_name)`) — Companion resolves variables before this feedback runs either way, so both work identically. Does nothing if the name doesn't match a known person or that person has no photo (local upload or synced PCO avatar).

## Variables

- `screen_<id>_event_title`, `screen_<id>_micboard_name`, `screen_<id>_template` — per screen
- `upcoming_event_id`, `upcoming_event_title` — the soonest event that hasn't already passed, blank if none
- `tracked_event_title` — title of the tracked event
- `tracked_event_unconfirmed_count`, `tracked_event_declined_count` — counts of role assignments by PCO status
- `tracked_event_pco_sent` — `yes`/`no`, whether the tracked event's plot has been sent to PCO
- `position_<id>_role`, `position_<id>_name` — per stage position in the tracked event's layout, resolved through that event's role assignments and position overrides
- `hardware_<id>_assigned_to` — per hardware item in the venue's catalog, the person using it in the tracked event (via role default hardware or a per-assignment override), blank if unused

## Presets

Drag-in buttons for the most common operations: refresh, track/send the nearest upcoming event, cycle the tracked event, send-to-PCO with a live sent/unsent color, an unconfirmed-assignments indicator, one button per screen per template with a live highlight on whichever template is currently active, one "Role" button per stage position in the tracked event, and one status button per hardware item in the venue's catalog (highlights green when in use on the tracked event).

Each Role button layers the **Person Image** feedback over the fill-status one: filled with no photo shows green + role/name text (the old behavior), filled with a photo replaces that entirely with the person's photo filling the button, and empty stays default.

Per-screen buttons are ordered as a pager — **◂ Prev Event | [Screen Name / current event] | Next Event ▸** — meant to be dragged onto three adjacent Stream Deck keys in that order.

Position and hardware buttons appear as soon as events load, since a tracked event is auto-selected on load (see Setup) — no manual tracking action needed unless you want a different event.
