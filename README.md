# companion-module-stageplotiphar

A [Bitfocus Companion](https://bitfocus.io/companion) module for controlling and monitoring [StagePlotifer](https://plotiphar.com) venues through its public REST API — switching screens between events/micboards, and exposing live stage-position → person assignments as Companion variables.

See [companion/HELP.md](companion/HELP.md) for setup and usage.

Paired as a git submodule under `companion-module/` in the main [stagePlotifer](https://github.com/TristonYoder/stagePlotiphar) repo so versions can be tracked together, while remaining a standalone repo as required for Bitfocus module review/publishing.

## Development

```bash
npm install
npm run build
```

Then add this directory as a "developer module" path in Companion's module manager to test locally.
