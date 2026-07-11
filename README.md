# companion-module-stageplotiphar

A [Bitfocus Companion](https://bitfocus.io/companion) module for controlling and monitoring [StagePlotiphar](https://plotiphar.com) venues through its public REST API — switching screens between events/micboards, and exposing live stage-position → person assignments as Companion variables.

See [companion/HELP.md](companion/HELP.md) for setup and usage.

Paired as a git submodule under `companion-module/` in the main [stagePlotiphar](https://github.com/TristonYoder/stagePlotiphar) repo so versions can be tracked together, while remaining a standalone repo as required for Bitfocus module review/publishing.

## Development

```bash
npm install
npm run build
```

Then add this directory as a "developer module" path in Companion's module manager to test locally.

## CI / Releases

Every push and PR runs typecheck, `companion-module-check`, and a full `companion-module-build` via GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

To cut a release: bump `version` in both `package.json` and `companion/manifest.json`, commit, then push a matching tag (e.g. `v1.1.0`). That triggers [.github/workflows/release.yml](.github/workflows/release.yml), which builds the module and attaches the packaged `.tgz` to a GitHub Release.
