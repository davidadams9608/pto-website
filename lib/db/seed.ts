import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data (order matters for FK constraints)
  console.log('🗑️  Clearing existing data...');
  await db.delete(schema.volunteerSignups);
  await db.delete(schema.events);
  await db.delete(schema.newsletters);
  await db.delete(schema.meetingMinutes);
  await db.delete(schema.sponsors);
  await db.delete(schema.siteSettings);

  // Events
  console.log('📅 Seeding events...');
  const insertedEvents = await db
    .insert(schema.events)
    .values([
      {
        title: 'Spring Family Picnic',
        description:
          'Join us for our annual Spring Family Picnic! Enjoy food, games, and fun with the whole Westmont community.',
        date: new Date('2026-05-16T11:00:00-07:00'),
        location: 'Westmont Elementary School Field',
        isPublished: true,
        volunteerSlots: [
          { role: 'Setup', count: 4 },
          { role: 'Food Service', count: 3 },
          { role: 'Cleanup', count: 4 },
        ],
      },
      {
        title: 'Teacher Appreciation Week',
        description:
          'Help us show our amazing teachers how much we appreciate everything they do for our students!',
        date: new Date('2026-05-04T08:00:00-07:00'),
        location: 'Main Office',
        isPublished: true,
        volunteerSlots: [
          { role: 'Decorations', count: 3 },
          { role: 'Gift Coordination', count: 2 },
        ],
      },
      {
        title: 'Annual Book Fair',
        description:
          'Our beloved annual Book Fair is back! Browse hundreds of titles and support our school library.',
        date: new Date('2026-04-20T08:30:00-07:00'),
        location: 'School Library',
        isPublished: true,
        volunteerSlots: [
          { role: 'Cashier', count: 4 },
          { role: 'Shelf Restocking', count: 3 },
          { role: 'Greeter', count: 2 },
        ],
      },
      {
        title: 'Monthly PTO Meeting',
        description:
          'Join us for our monthly PTO meeting! All Westmont families are welcome to attend. We\'ll cover updates on upcoming events, budget discussions, and school initiatives.\n\nAgenda items include the spring fundraiser recap, end-of-year field day planning, and an update from Principal Davis. Light refreshments will be provided.',
        date: new Date('2026-04-15T18:30:00-07:00'),
        location: 'School Library',
        isPublished: true,
        volunteerSlots: null,
      },
      {
        title: 'Fall Festival Planning Meeting',
        description:
          'Planning meeting for the upcoming Fall Festival. All interested volunteers welcome.',
        date: new Date('2026-04-08T18:30:00-07:00'),
        location: 'Room 204',
        isPublished: false,
        volunteerSlots: null,
      },
    ])
    .returning();

  const picnic = insertedEvents.find((e) => e.title === 'Spring Family Picnic')!;

  // Volunteer signups (for Spring Picnic)
  console.log('🙋 Seeding volunteer signups...');
  await db.insert(schema.volunteerSignups).values([
    {
      eventId: picnic.id,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '(555) 123-4567',
      role: 'Setup',
      notes: null,
    },
    {
      eventId: picnic.id,
      name: 'Mike Chen',
      email: 'mike@example.com',
      phone: null,
      role: 'Food Service',
      notes: null,
    },
    {
      eventId: picnic.id,
      name: 'Lisa Park',
      email: 'lisa@example.com',
      phone: '(555) 987-6543',
      role: 'Cleanup',
      notes: 'Can arrive 30 min early',
    },
  ]);

  // Newsletters
  console.log('📰 Seeding newsletters...');
  await db.insert(schema.newsletters).values([
    {
      title: 'March 2026 Newsletter',
      pdfUrl: 'https://placeholder.example.com/newsletters/march-2026.pdf',
      fileKey: 'newsletters/march-2026.pdf',
      publishedAt: new Date('2026-03-01T00:00:00Z'),
    },
    {
      title: 'February 2026 Newsletter',
      pdfUrl: 'https://placeholder.example.com/newsletters/february-2026.pdf',
      fileKey: 'newsletters/february-2026.pdf',
      publishedAt: new Date('2026-02-01T00:00:00Z'),
    },
    {
      title: 'January 2026 Newsletter',
      pdfUrl: 'https://placeholder.example.com/newsletters/january-2026.pdf',
      fileKey: 'newsletters/january-2026.pdf',
      publishedAt: new Date('2026-01-01T00:00:00Z'),
    },
  ]);

  // Meeting minutes
  console.log('📋 Seeding meeting minutes...');
  await db.insert(schema.meetingMinutes).values([
    {
      title: 'February Board Meeting',
      meetingDate: '2026-02-15',
      fileUrl: 'https://placeholder.example.com/minutes/february-2026.pdf',
      fileKey: 'minutes/february-2026.pdf',
    },
    {
      title: 'January Board Meeting',
      meetingDate: '2026-01-18',
      fileUrl: 'https://placeholder.example.com/minutes/january-2026.pdf',
      fileKey: 'minutes/january-2026.pdf',
    },
  ]);

  // Sponsors
  console.log('🤝 Seeding sponsors...');
  await db.insert(schema.sponsors).values([
    {
      name: 'Westmont Family Dentistry',
      logoUrl: 'https://placeholder.example.com/logos/westmont-dentistry.png',
      logoKey: 'logos/westmont-dentistry.png',
      websiteUrl: null,
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'Green Valley Market',
      logoUrl: 'https://placeholder.example.com/logos/green-valley-market.png',
      logoKey: 'logos/green-valley-market.png',
      websiteUrl: null,
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'Summit Insurance Group',
      logoUrl: 'https://placeholder.example.com/logos/summit-insurance.png',
      logoKey: 'logos/summit-insurance.png',
      websiteUrl: null,
      displayOrder: 3,
      isActive: true,
    },
  ]);

  // Site settings
  console.log('⚙️  Seeding site settings...');
  await db.insert(schema.siteSettings).values([
    { key: 'venmo_url', value: 'https://venmo.com/westmontpto' },
    {
      key: 'about_text',
      value:
        'The Westmont Elementary PTO supports our school community through events, fundraising, and volunteer coordination.',
    },
    { key: 'school_name', value: 'Westmont Elementary School' },
    { key: 'hero_image_url', value: '' },
    { key: 'contact_email', value: 'pto@westmontpto.org' },
  ]);

  console.log('\n✅ Seed complete!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  });
