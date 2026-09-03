import { getPrisma } from "../src/prisma.js";

// ---------------------------------------------------------------------------
// Seed script — idempotent (safe to run multiple times without duplicates)
// Seeds: 4 Categories (Lab 1) + 5 Requesters (Lab 2 Feature D: 4 active, 1 inactive)
// ---------------------------------------------------------------------------
async function main() {
  const prisma = getPrisma();

  // --- Lab 1: Categories ---
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✓ Seeded 4 categories.");

  // --- Lab 2 Feature D: Development Requesters ---
  // BR-11: only isActive:true requesters appear in the Dev Selector
  const requesters = [
    {
      name: "Jennifer Anderson",
      email: "jennifer.anderson@company.com",
      department: "Finance",
      isActive: true,
    },
    {
      name: "Michael Brown",
      email: "michael.brown@company.com",
      department: "Engineering",
      isActive: true,
    },
    {
      name: "David Lee",
      email: "david.lee@company.com",
      department: "HR",
      isActive: true,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      department: "Marketing",
      isActive: true,
    },
    // Inactive — must NOT appear in the Dev Requester Selector (BR-11)
    {
      name: "Alex Inactive",
      email: "alex.inactive@company.com",
      department: "Operations",
      isActive: false,
    },
  ];

  for (const r of requesters) {
    await prisma.requester.upsert({
      where: { email: r.email },
      update: { name: r.name, department: r.department, isActive: r.isActive },
      create: r,
    });
  }
  console.log("✓ Seeded 5 requesters (4 active, 1 inactive).");

  console.log("✓ Database seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
