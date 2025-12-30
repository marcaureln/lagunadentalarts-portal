import { prisma } from '../server/utils/prisma';

const caseTypes = [
  {
    key: 'CROWN_BRIDGE',
    label: 'Crown & Bridge',
    fields: [
      { id: 'toothNumbers', label: 'Tooth Numbers', type: 'text', required: true },
      {
        id: 'material',
        label: 'Material',
        type: 'select',
        required: true,
        options: ['Zirconia', 'E.max', 'PFM', 'Full Gold'],
      },
      { id: 'shade', label: 'Shade', type: 'text', required: true },
      { id: 'stumpShade', label: 'Stump Shade', type: 'text', required: false },
      {
        id: 'cementationType',
        label: 'Cementation Type',
        type: 'select',
        required: true,
        options: ['Cement Retained', 'Screw Retained'],
      },
      { id: 'occlusion', label: 'Occlusion', type: 'select', required: false, options: ['Light', 'Normal', 'Heavy'] },
      { id: 'contacts', label: 'Contacts', type: 'select', required: false, options: ['Light', 'Normal', 'Heavy'] },
      { id: 'notes', label: 'Special Instructions', type: 'textarea', required: false },
    ],
    fileSlots: [
      { id: 'scan', label: 'Digital Scan Files', required: true, accept: '.zip,.stl,.ply' },
      { id: 'photos', label: 'Patient Photos', required: false, accept: '.zip,.jpg,.jpeg,.png' },
    ],
    instructions:
      'Please provide accurate tooth numbers and shade information. Include any special instructions for contacts or occlusion.',
  },
  {
    key: 'IMPLANT_SUPPORTED',
    label: 'Implant Supported',
    fields: [
      { id: 'toothNumbers', label: 'Tooth Numbers', type: 'text', required: true },
      { id: 'implantSystem', label: 'Implant System', type: 'text', required: true },
      { id: 'platformSize', label: 'Platform Size', type: 'text', required: true },
      { id: 'material', label: 'Material', type: 'select', required: true, options: ['Zirconia', 'Titanium', 'E.max'] },
      { id: 'shade', label: 'Shade', type: 'text', required: true },
      {
        id: 'abutmentType',
        label: 'Abutment Type',
        type: 'select',
        required: true,
        options: ['Custom', 'Stock', 'Ti-Base'],
      },
      {
        id: 'screwAccess',
        label: 'Screw Access',
        type: 'select',
        required: false,
        options: ['Facial', 'Lingual', 'Occlusal'],
      },
      { id: 'notes', label: 'Special Instructions', type: 'textarea', required: false },
    ],
    fileSlots: [
      { id: 'scan', label: 'Digital Scan Files', required: true, accept: '.zip,.stl,.ply' },
      { id: 'photos', label: 'Patient Photos', required: false, accept: '.zip,.jpg,.jpeg,.png' },
      { id: 'cbct', label: 'CBCT/X-Ray', required: false, accept: '.zip,.dcm' },
    ],
    instructions: 'Include implant system details and platform size. CBCT scans are helpful for complex cases.',
  },
  {
    key: 'ORTHODONTICS',
    label: 'Orthodontics',
    fields: [
      {
        id: 'applianceType',
        label: 'Appliance Type',
        type: 'select',
        required: true,
        options: ['Clear Aligners', 'Retainer', 'Night Guard', 'Splint'],
      },
      { id: 'archType', label: 'Arch', type: 'select', required: true, options: ['Upper', 'Lower', 'Both'] },
      { id: 'thickness', label: 'Thickness', type: 'select', required: false, options: ['1mm', '1.5mm', '2mm'] },
      { id: 'notes', label: 'Special Instructions', type: 'textarea', required: false },
    ],
    fileSlots: [
      { id: 'scan', label: 'Digital Scan Files', required: true, accept: '.zip,.stl,.ply' },
      { id: 'photos', label: 'Patient Photos', required: false, accept: '.zip,.jpg,.jpeg,.png' },
    ],
    instructions: 'Specify appliance type and arch. For aligners, include treatment goals.',
  },
  {
    key: 'REMOVABLE',
    label: 'Removable Prosthetics',
    fields: [
      {
        id: 'prostheticType',
        label: 'Type',
        type: 'select',
        required: true,
        options: ['Full Denture', 'Partial Denture', 'Flipper'],
      },
      { id: 'archType', label: 'Arch', type: 'select', required: true, options: ['Upper', 'Lower', 'Both'] },
      { id: 'teethShade', label: 'Teeth Shade', type: 'text', required: true },
      { id: 'gingivalShade', label: 'Gingival Shade', type: 'text', required: false },
      { id: 'notes', label: 'Special Instructions', type: 'textarea', required: false },
    ],
    fileSlots: [
      { id: 'scan', label: 'Digital Scan Files', required: true, accept: '.zip,.stl,.ply' },
      { id: 'photos', label: 'Patient Photos', required: false, accept: '.zip,.jpg,.jpeg,.png' },
      { id: 'biteRegistration', label: 'Bite Registration', required: false, accept: '.zip,.stl' },
    ],
    instructions: 'Include bite registration for full dentures. Specify any special tooth arrangements.',
  },
  {
    key: 'OTHER',
    label: 'Other',
    fields: [
      { id: 'description', label: 'Case Description', type: 'textarea', required: true },
      { id: 'notes', label: 'Special Instructions', type: 'textarea', required: false },
    ],
    fileSlots: [{ id: 'files', label: 'Case Files', required: true, accept: '.zip' }],
    instructions: 'Please describe your case in detail and upload all relevant files.',
  },
];

async function main() {
  // Seed case types
  console.log('Seeding case types...');
  for (const caseType of caseTypes) {
    await prisma.caseType.upsert({
      where: { key: caseType.key },
      update: {
        label: caseType.label,
        fields: caseType.fields,
        fileSlots: caseType.fileSlots,
        instructions: caseType.instructions,
      },
      create: caseType,
    });
    console.log(`  - ${caseType.label}`);
  }

  // Seed admin user
  const adminCount = await prisma.user.count({
    where: {
      role: 'ADMIN',
    },
  });

  if (adminCount > 0) {
    console.log(`Seeding admin skipped. ${adminCount} admin already in the database.`);
    return;
  }

  const adminEmail = 'alexmarcaureln@gmail.com';

  console.log(`Seeding admin user: ${adminEmail}`);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Alex',
      role: 'ADMIN',
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
