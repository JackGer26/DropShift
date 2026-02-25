/**
 * Creates the default demo admin account.
 * Run once with: npx ts-node src/scripts/seedAdmin.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.model';

const USERNAME = 'admin';
const PASSWORD = 'ShiftDrop2025';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);

  const existing = await Admin.findOne({ username: USERNAME });
  if (existing) {
    console.log(`Admin "${USERNAME}" already exists — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await Admin.create({ username: USERNAME, passwordHash });

  console.log('✓ Demo admin created:');
  console.log(`  Username: ${USERNAME}`);
  console.log(`  Password: ${PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
