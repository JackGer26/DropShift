// Comprehensive script to fix shift IDs in templates AND update all rota assignments
// This script maintains the mapping between old and new shift IDs
// Usage: node fixShiftIdsComprehensive.js

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shiftdrop';

async function main() {
  await mongoose.connect(MONGO_URI);

  const TemplateCollection = mongoose.connection.collection('rotatemplates');
  const RotaCollection = mongoose.connection.collection('rotas');

  const templates = await TemplateCollection.find({}).toArray();

  let templatesUpdated = 0;
  let rotasUpdated = 0;
  let totalAssignmentsFixed = 0;

  console.log(`Found ${templates.length} templates to process...\n`);

  for (const template of templates) {
    let templateChanged = false;
    const shiftIdMapping = new Map(); // oldId -> newId

    console.log(`\n=== Processing template: ${template.name} (${template._id}) ===`);

    // Step 1: Fix shift IDs in the template and build mapping
    for (const day of template.days || []) {
      for (const shift of day.shifts || []) {
        const oldId = shift.id;

        // Check if shift.id is a valid ObjectId
        if (!oldId || !/^[a-f\d]{24}$/i.test(oldId)) {
          // Generate a new ObjectId
          const newId = new ObjectId().toHexString();
          shiftIdMapping.set(String(oldId), newId);
          shift.id = newId;
          templateChanged = true;
          console.log(`  Day ${day.dayOfWeek}: Shift "${shift.startTime}-${shift.endTime}" (${shift.roleRequired})`);
          console.log(`    Old ID: ${oldId} -> New ID: ${newId}`);
        }
      }
    }

    // Step 2: Update the template if changed
    if (templateChanged) {
      await TemplateCollection.updateOne(
        { _id: template._id },
        { $set: { days: template.days } }
      );
      templatesUpdated++;
      console.log(`✓ Template updated with new shift IDs`);
    }

    // Step 3: Find and update all rotas that use this template
    if (shiftIdMapping.size > 0) {
      console.log(`\n  Finding rotas using this template...`);
      const rotas = await RotaCollection.find({ templateId: String(template._id) }).toArray();

      if (rotas.length === 0) {
        console.log(`  No rotas found using this template`);
        continue;
      }

      console.log(`  Found ${rotas.length} rota(s) to update`);

      for (const rota of rotas) {
        let rotaChanged = false;
        let assignmentsFixedInRota = 0;

        for (const rotaDay of (rota.days || [])) {
          for (const assignment of (rotaDay.assignments || [])) {
            const oldShiftId = String(assignment.shiftTemplateId);

            // Check if this shift ID needs to be updated
            if (shiftIdMapping.has(oldShiftId)) {
              const newShiftId = shiftIdMapping.get(oldShiftId);
              assignment.shiftTemplateId = newShiftId;
              rotaChanged = true;
              assignmentsFixedInRota++;
              totalAssignmentsFixed++;
            }
          }
        }

        if (rotaChanged) {
          await RotaCollection.updateOne(
            { _id: rota._id },
            { $set: { days: rota.days } }
          );
          rotasUpdated++;
          console.log(`  ✓ Rota ${rota._id} (${rota.status}): Fixed ${assignmentsFixedInRota} assignment(s)`);
        }
      }
    }
  }

  console.log(`\n\n=== Migration Complete ===`);
  console.log(`Templates processed: ${templates.length}`);
  console.log(`Templates updated: ${templatesUpdated}`);
  console.log(`Rotas updated: ${rotasUpdated}`);
  console.log(`Total assignments fixed: ${totalAssignmentsFixed}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error running comprehensive migration:', err);
  process.exit(1);
});
