export const inventoryMessages = {
  title: "Inventory",
  equipment: "Equipment",
  glasses: "Glasses",
  circuit: "Circuit — powers the street CRT",
  noItemsYet: "No items yet",
  parts: "Spare parts",
  partsTally: (owned: number, total: number) => `${owned}/${total}`,
  partNames: {
    "copper-string": "Copper string — from a riff played right",
    "clock-crystal": "Clock crystal — keeps perfect time",
    "battery-cell": "Battery cell — pure stored energy",
  },
  partsSoldered: "soldered",
} as const;
