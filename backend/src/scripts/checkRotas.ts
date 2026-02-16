/**
 * Diagnostic script to check rotas in the database
 * Run with: ts-node src/scripts/checkRotas.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Rota } from '../models/Rota.model';

dotenv.config();

async function checkRotas() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shiftdrop';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all rotas
    const allRotas = await Rota.find({}).lean();
    console.log(`\nTotal rotas in database: ${allRotas.length}`);

    // Group by status
    const byStatus = allRotas.reduce((acc: any, rota: any) => {
      acc[rota.status] = (acc[rota.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nRotas by status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Show published rotas
    const publishedRotas = allRotas.filter((r: any) => r.status === 'published');
    console.log('\n=== Published Rotas ===');
    publishedRotas.forEach((rota: any) => {
      const assignmentCount = rota.days.reduce((sum: number, day: any) => {
        return sum + (day.assignments?.length || 0);
      }, 0);
      console.log(`\nWeek: ${rota.weekStartDate}`);
      console.log(`  Location: ${rota.locationId}`);
      console.log(`  Template: ${rota.templateId}`);
      console.log(`  Total assignments: ${assignmentCount}`);
      console.log(`  Days with assignments: ${rota.days.filter((d: any) => d.assignments?.length > 0).length}`);
    });

    // Check for duplicate weeks (multiple rotas for the same week/location)
    const weekLocationMap = new Map();
    allRotas.forEach((rota: any) => {
      const key = `${rota.weekStartDate}-${rota.locationId}`;
      if (!weekLocationMap.has(key)) {
        weekLocationMap.set(key, []);
      }
      weekLocationMap.get(key).push({
        status: rota.status,
        id: rota._id,
        assignmentCount: rota.days.reduce((sum: number, day: any) => sum + (day.assignments?.length || 0), 0)
      });
    });

    console.log('\n=== Duplicate Week Check ===');
    let hasDuplicates = false;
    weekLocationMap.forEach((rotas, key) => {
      if (rotas.length > 1) {
        hasDuplicates = true;
        console.log(`\n${key}:`);
        rotas.forEach((r: any) => {
          console.log(`  - Status: ${r.status}, Assignments: ${r.assignmentCount}, ID: ${r.id}`);
        });
      }
    });

    if (!hasDuplicates) {
      console.log('No duplicate weeks found.');
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRotas();
