# Sketchbook Ridge

This context defines the game-design language for the gamified portfolio and its Ridge overworld work.

## Language

**Ridge Map Language**:
A human-editable text notation that describes Ridge topology, room blockouts, traversal primitives, and environment tags as source data.
_Avoid_: map editor, final art map

**Ridge Blockout**:
A playable primitive Ridge map generated from the Ridge Map Language before final assets are placed.
_Avoid_: final map, finished level

**Grid Cell**:
A configurable unit in the Ridge Map Language that converts text-grid positions into world-space pixels.
_Avoid_: hard-coded tile size, permanent pixel size

**Room Beat**:
A named playable region with a traversal purpose, environment identity, and links to other room beats.
_Avoid_: scene, screen, box

**Topology Map**:
A high-level route graph showing room beats, locks, shortcuts, and return paths.
_Avoid_: blockout map, minimap

## Relationships

- A **Topology Map** defines the route logic between **Room Beats**.
- The **Ridge Map Language** describes **Room Beats** in a parseable text file.
- The **Ridge Map Language** produces a **Ridge Blockout**.
- A **Grid Cell** gives **Room Beats** their scale in the **Ridge Blockout**.
- A **Ridge Blockout** is replaced or enriched by final assets after traversal feels good.

## Example Dialogue

> **Dev:** "Should we change the Stampede room art now?"
> **Domain expert:** "No, first update the **Room Beat** in the **Ridge Map Language** so the **Ridge Blockout** proves the shortcut back to Cicka."

## Flagged Ambiguities

- "map" can mean **Topology Map**, **Ridge Blockout**, or final art; resolved by naming the layer explicitly.
