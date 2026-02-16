/**
 * Cleanup script to fix duplicate and empty published rotas
 * Run with: ts-node src/scripts/cleanupRotas.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Rota } from '../models/Rota.model';

dotenv.config();

async function cleanupRotas() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shiftdrop';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Step 1: Delete published rotas with 0 assignments
    console.log('\n=== Step 1: Deleting empty published rotas ===');
    const allRotas = await Rota.find({ status: 'published' }).lean();
    const emptyRotas = allRotas.filter((rota: any) => {
      const totalAssignments = rota.days.reduce((sum: number, day: any) => {
        return sum + (day.assignments?.length || 0);
      }, 0);
      return totalAssignments === 0;
    });

    console.log(`Found ${emptyRotas.length} empty published rotas`);
    for (const rota of emptyRotas) {
      console.log(`  Deleting empty rota for week ${rota.weekStartDate}`);
      await Rota.findByIdAndDelete(rota._id);
    }

    // Step 2: Handle duplicate published rotas for same week/location
    console.log('\n=== Step 2: Handling duplicate published rotas ===');
    const publishedRotas = await Rota.find({ status: 'published' }).lean();

    // Group by week + location
    const weekLocationMap = new Map<string, any[]>();
    publishedRotas.forEach((rota: any) => {
      const key = `${rota.weekStartDate}-${rota.locationId}`;
      if (!weekLocationMap.has(key)) {
        weekLocationMap.set(key, []);
      }
      weekLocationMap.get(key)!.push(rota);
    });

    // Find duplicates
    let duplicateCount = 0;
    for (const [key, rotas] of weekLocationMap.entries()) {
      if (rotas.length > 1) {
        console.log(`\nFound ${rotas.length} published rotas for ${key}`);

        // Sort by creation date (newest first) and keep only the most recent
        rotas.sort((a: any, b: any) => {
          const aTime = a._id.getTimestamp().getTime();
          const bTime = b._id.getTimestamp().getTime();
          return bTime - aTime;
        });

        const [keepRota, ...deleteRotas] = rotas;
        console.log(`  Keeping newest rota (ID: ${keepRota._id})`);

        for (const rota of deleteRotas) {
          console.log(`  Deleting duplicate rota (ID: ${rota._id})`);
          await Rota.findByIdAndDelete(rota._id);
          duplicateCount++;
        }
      }
    }

    console.log(`\nDeleted ${duplicateCount} duplicate published rotas`);

    // Step 3: Summary
    console.log('\n=== Cleanup Summary ===');
    const finalRotas = await Rota.find({}).lean();
    const finalByStatus = finalRotas.reduce((acc: any, rota: any) => {
      acc[rota.status] = (acc[rota.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`Total rotas after cleanup: ${finalRotas.length}`);
    console.log('Rotas by status:');
    Object.entries(finalByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    await mongoose.connection.close();
    console.log('\nCleanup completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupRotas();
