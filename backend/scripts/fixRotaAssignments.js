// Script to fix rota assignments after shift IDs were regenerated in templates
// This script matches old shift IDs to new ones by comparing shift attributes
// Usage: node fixRotaAssignments.js

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shiftdrop';

async function main() {
  await mongoose.connect(MONGO_URI);

  const RotaCollection = mongoose.connection.collection('rotas');
  const TemplateCollection = mongoose.connection.collection('rotatemplates');

  const rotas = await RotaCollection.find({}).toArray();
  let updatedCount = 0;
  let totalAssignmentsFixed = 0;

  console.log(`Found ${rotas.length} rotas to process...`);

  for (const rota of rotas) {
    let rotaChanged = false;

    // Fetch the template for this rota
    const template = await TemplateCollection.findOne({ _id: new ObjectId(rota.templateId) });

    if (!template) {
      console.log(`WARNING: Template ${rota.templateId} not found for rota ${rota._id}. Skipping.`);
      continue;
    }

    // Process each day in the rota
    for (const rotaDay of (rota.days || [])) {
      // Find the corresponding template day
      const templateDay = template.days.find(td => td.dayOfWeek === rotaDay.dayOfWeek);

      if (!templateDay) {
        console.log(`WARNING: Template day ${rotaDay.dayOfWeek} not found in template ${template._id}. Skipping day.`);
        continue;
      }

      // Process each assignment
      for (const assignment of (rotaDay.assignments || [])) {
        const oldShiftTemplateId = assignment.shiftTemplateId;

        // Try to find the shift in the template by ID first
        let matchedShift = templateDay.shifts.find(s => String(s.id) === String(oldShiftTemplateId));

        // If not found by ID, try to match by shift attributes
        // This handles the case where shift IDs were regenerated
        if (!matchedShift) {
          // We need to find a shift that matches the old one
          // Unfortunately, we don't have the old shift attributes stored
          // So we'll use a heuristic: match by position/index
          // OR if there's only one shift with the same role, match by role

          // Strategy 1: If there's only one shift of any role on this day, use it
          if (templateDay.shifts.length === 1) {
            matchedShift = templateDay.shifts[0];
            console.log(`  Matched by single shift on day ${rotaDay.dayOfWeek}`);
          }
          // Strategy 2: Try to find by checking if old ID is valid ObjectId
          // If old ID is NOT a valid ObjectId (random string), we need to map it
          else if (!/^[a-f\d]{24}$/i.test(oldShiftTemplateId)) {
            // Old random shift ID - this is the problematic case
            // We can't reliably match without more information
            // For now, log a warning
            console.log(`  WARNING: Cannot match old shift ID ${oldShiftTemplateId} for staff ${assignment.staffId} in rota ${rota._id}, day ${rotaDay.dayOfWeek}`);
            console.log(`  Available shifts:`, templateDay.shifts.map(s => ({ id: s.id, startTime: s.startTime, endTime: s.endTime, role: s.roleRequired })));
            continue;
          }
        }

        // Update the assignment with the new shift ID
        if (matchedShift && String(matchedShift.id) !== String(oldShiftTemplateId)) {
          console.log(`  Updating assignment: staff ${assignment.staffId}, old shift ${oldShiftTemplateId} -> new shift ${matchedShift.id}`);
          assignment.shiftTemplateId = String(matchedShift.id);
          rotaChanged = true;
          totalAssignmentsFixed++;
        }
      }
    }

    // Save the updated rota if changed
    if (rotaChanged) {
      await RotaCollection.updateOne(
        { _id: rota._id },
        { $set: { days: rota.days } }
      );
      updatedCount++;
      console.log(`✓ Updated rota ${rota._id} (${totalAssignmentsFixed} assignments fixed so far)`);
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Processed ${rotas.length} rotas`);
  console.log(`Updated ${updatedCount} rotas`);
  console.log(`Fixed ${totalAssignmentsFixed} assignments`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error fixing rota assignments:', err);
  process.exit(1);
});
