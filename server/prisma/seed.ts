import { getPrisma } from "../src/prisma.js";
import bcrypt from "bcrypt";

// ---------------------------------------------------------------------------
// Seed script — idempotent (safe to run multiple times without duplicates)
// Lab 1: 4 Categories
// Lab 2 Feature D: 5 Requesters (4 active, 1 inactive per BR-11)
// Lab 3: Users — 4 Requesters, 3 IT Staff, 1 Admin, 1 inactive (BR-05)
// ---------------------------------------------------------------------------
async function main() {
  const prisma = getPrisma();

  // --- Lab 1: Categories ---
  const categories = ["Account and Access", "Hardware", "Software", "Network"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✓ Seeded 4 categories.");

  // --- Lab 2 Feature D: Development Requesters (kept for Lab 2 backward compatibility) ---
  const requesters = [
    { name: "Jennifer Anderson", email: "jennifer.anderson@company.com", department: "Finance",     isActive: true  },
    { name: "Michael Brown",     email: "michael.brown@company.com",     department: "Engineering", isActive: true  },
    { name: "David Lee",         email: "david.lee@company.com",         department: "HR",          isActive: true  },
    { name: "Sarah Johnson",     email: "sarah.johnson@company.com",     department: "Marketing",   isActive: true  },
    { name: "Alex Inactive",     email: "alex.inactive@company.com",     department: "Operations",  isActive: false },
  ];
  for (const r of requesters) {
    await prisma.requester.upsert({
      where:  { email: r.email },
      update: { name: r.name, department: r.department, isActive: r.isActive },
      create: r,
    });
  }
  console.log("✓ Seeded 5 requesters (4 active, 1 inactive).");

  // --- Lab 3: Users (real authentication) ---
  // Default password "Password1" — mustChangePassword:true for fresh accounts
  // Admin has mustChangePassword:false for initial login convenience
  const DEFAULT_PASSWORD = "Password1";
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const users = [
    // Requesters
    { name: "Alice Smith",    email: "alice@toktickit.com",   role: "Requester"    as const, isActive: true,  mustChangePassword: false },
    { name: "Bob Requester",  email: "bob@toktickit.com",     role: "Requester"    as const, isActive: true,  mustChangePassword: false },
    { name: "Carol Nguyen",   email: "carol@toktickit.com",   role: "Requester"    as const, isActive: true,  mustChangePassword: true  },
    { name: "Dave Wilson",    email: "dave@toktickit.com",    role: "Requester"    as const, isActive: true,  mustChangePassword: true  },
    // IT Staff
    { name: "Eve IT",         email: "eve@toktickit.com",     role: "IT_Staff"     as const, isActive: true,  mustChangePassword: false },
    { name: "Frank IT",       email: "frank@toktickit.com",   role: "IT_Staff"     as const, isActive: true,  mustChangePassword: false },
    { name: "Grace IT",       email: "grace@toktickit.com",   role: "IT_Staff"     as const, isActive: true,  mustChangePassword: true  },
    // Administrator
    { name: "Admin User",     email: "admin@toktickit.com",   role: "Administrator" as const, isActive: true,  mustChangePassword: false },
    // Inactive user (BR-13 test)
    { name: "Inactive User",  email: "inactive@toktickit.com",role: "Requester"    as const, isActive: false, mustChangePassword: false },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role, isActive: u.isActive, mustChangePassword: u.mustChangePassword },
      create: { ...u, passwordHash: hash },
    });
  }
  console.log(`✓ Seeded ${users.length} Lab 3 users (password: "${DEFAULT_PASSWORD}").`);

  // --- Lab 3: Sample Tickets ---
  const alice = await prisma.user.findUnique({ where: { email: "alice@toktickit.com" } });
  const bob = await prisma.user.findUnique({ where: { email: "bob@toktickit.com" } });
  const eve = await prisma.user.findUnique({ where: { email: "eve@toktickit.com" } });
  const frank = await prisma.user.findUnique({ where: { email: "frank@toktickit.com" } });
  const hardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const network = await prisma.category.findUnique({ where: { name: "Network" } });
  const software = await prisma.category.findUnique({ where: { name: "Software" } });
  const access = await prisma.category.findUnique({ where: { name: "Account and Access" } });

  if (alice && bob && eve && frank && hardware && network && software && access) {
    const sampleTickets = [
      {
        title: "หน้าจอดับ เปิดไม่ติด (External Monitor Issue)",
        description: "จอต่อแยกที่โต๊ะทำงานเปิดไม่ติด ไฟแสดงสถานะไม่ขึ้น ลองขยับสายไฟแล้วยังไม่ทำงาน",
        categoryId: hardware.id,
        requesterId: alice.id,
        status: "OPEN" as const,
        itPriority: "HIGH" as const,
      },
      {
        title: "VPN Connection timeout when working from home",
        description: "Cannot connect to company VPN from home network. Error code 800.",
        categoryId: network.id,
        requesterId: alice.id,
        assignedStaffId: eve.id,
        status: "IN_PROGRESS" as const,
        itPriority: "MEDIUM" as const,
      },
      {
        title: "Request Adobe Acrobat Pro license for quarterly reporting",
        description: "Need Adobe Acrobat Pro license to edit and export PDF financial reports.",
        categoryId: software.id,
        requesterId: bob.id,
        status: "OPEN" as const,
        itPriority: "LOW" as const,
      },
      {
        title: "Account unlock and MFA reset for ERP portal",
        description: "Changed mobile phone and cannot access Authenticator app.",
        categoryId: access.id,
        requesterId: alice.id,
        assignedStaffId: frank.id,
        status: "RESOLVED" as const,
        itPriority: "MEDIUM" as const,
      },
    ];

    for (const st of sampleTickets) {
      const existing = await prisma.lab3Ticket.findFirst({
        where: { title: st.title, requesterId: st.requesterId },
      });
      if (!existing) {
        const created = await prisma.lab3Ticket.create({ data: st });
        // Also add a sample public comment and internal note on ticket 2
        if (st.status === "IN_PROGRESS" && eve) {
          await prisma.publicComment.create({
            data: {
              ticketId: created.id,
              authorId: eve.id,
              content: "Hello Alice, I have verified your VPN certificate. Please try reconnecting now.",
            },
          });
          await prisma.internalNote.create({
            data: {
              ticketId: created.id,
              authorId: eve.id,
              content: "Internal: Gateway 10.0.4.1 routing table reset by network team.",
            },
          });
        }
      }
    }
    console.log("✓ Seeded sample Lab 3 tickets & notes.");
  }
  console.log("✓ Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    const prisma = getPrisma();
    await prisma.$disconnect();
  });


