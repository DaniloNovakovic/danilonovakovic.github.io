# Adopt Ridge Blockout As Exploration Map Source Of Truth

Status: accepted; still current after the Ridge architecture-deepening slices.

We will treat the Ridge Map Language and its Ridge Blockout as the source of truth for Ridge spatial facts and as the prototype Exploration Map. Exploration Traversal may become the common movement model for non-mini-game exploration, while opt-in mini-games keep their own Mini-Game Movement Systems; the old Overworld and Hobbies scenes remain operational during migration but are transitional long-term because their strongest content should fold into artifacts, entrances, Cicka reactions, Basement/Potassium paths, and mini-game props inside the Exploration Map.

The implemented Ridge direction now compiles blockout source into typed room,
route, anchor, shortcut, and home-mutation facts before runtime presentation and
interaction modules consume it. This deepens the original decision rather than
superseding it.

The active blockout source now lives beside the Ridge blockout parser at
`src/game/scenes/ridge/blockout/maps/folded-desk-ridge.blockout.txt`. The
language documentation remains in `docs/game-design/ridge/map-language.md`.
