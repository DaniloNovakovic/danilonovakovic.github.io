export const inventoryMessages = {
  title: "Backpack",
  open: "Open backpack",
  hotkey: "I",
  tally: (found: number, total: number) => `${found} of ${total} street secrets found`,
  unknown: "Not found yet",
  wearing: "Wearing",
  pocketed: "In pocket",
  wearToggle: "Wear glasses",
  soldered: "Soldered in",
  slots: {
    glasses: {
      name: "Glasses",
      note: "The street sharpens. Hidden things show up. The chick bolts.",
      pocketedNote: "Everything blurs again. The chick stops running.",
    },
    "litter-clue": {
      name: "Raccoon tracks",
      note: "Litter past the Abilities shelf, paw prints into the dumpster.",
    },
    "copper-string": {
      name: "Copper string",
      note: "From a riff played right.",
    },
    "clock-crystal": {
      name: "Clock crystal",
      note: "Keeps perfect time.",
    },
    "battery-cell": {
      name: "Battery cell",
      note: "Pure stored energy.",
    },
    circuit: {
      name: "Circuit",
      note: "Powers the blank CRT by Projects.",
    },
  },
} as const;
