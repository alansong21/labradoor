import "./labs.css"

const mockLabs = [
  {
    id: "yaocoin",
    name: "Yaocoin",
    desc: "World's premier first in first out research group",
    details: [
      "Must be special",
      "Looking for EE/ECE/CS students",
      "who have taken CS 9000",
      "At least plat in Valorant",
    ],
  },
  {
    id: "bytelabs",
    name: "ByteLabs",
    desc: "Innovating low-level compute systems for next-gen AI hardware",
    details: [
      "Strong in embedded systems",
      "Experience with Verilog or FPGA",
      "Collaborative research focus",
      "ECE majors preferred",
    ],
  },
];

// THIS IS JUST MOCK DATA
export async function getLabs() {
  // later: return prisma.lab.findMany();
  return mockLabs;
}

// GET DATA BY id
export async function getLab(id: string) {
  // later: return prisma.lab.findUnique({ where: { id }});
  return mockLabs.find((lab) => lab.id === id);
}