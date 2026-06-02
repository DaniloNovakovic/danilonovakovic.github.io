# Adopt Ridge Blockout As Exploration Map Source Of Truth

Status: **superseded** — blockout implementation removed from the repo (Bridge
Tracer is the active Ridge runtime). Kept as historical ADR.

This ADR explains why the existing Phaser Ridge prototype compiles a typed
blockout source into spatial facts. It does not require the desired
Bridge/Concert/Dance/Relay game rework to keep the folded-desk topology,
Cicka Home hub, or platformer-like traversal. For future Ridge design, start
from [`../game-design/ridge/README.md`](../game-design/ridge/README.md).

Within the current/prototype Ridge runtime, we treat the typed Ridge Blockout
Source as the source of truth for spatial facts and as the prototype Exploration
Map. Exploration Traversal may become the common movement model for
non-mini-game exploration, while opt-in mini-games keep their own Mini-Game
Movement Systems; the old Overworld and Hobbies scenes remain operational
during migration but are transitional long-term because their strongest content
should fold into artifacts, entrances, Cicka reactions, Basement/Potassium
paths, and mini-game props inside the Exploration Map.

The current/prototype Ridge runtime compiles blockout source into typed room,
route, anchor, shortcut, and home-mutation facts before runtime presentation and
interaction modules consume it. This deepens the original runtime decision
rather than superseding it.

The folded-desk blockout source and compiler were removed from the repository.
The language documentation remains in `docs/game-design/ridge/map-language.md`
as a historical contract reference.
