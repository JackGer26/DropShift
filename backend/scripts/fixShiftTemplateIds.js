// Script to fix all shift IDs in RotaTemplates to be valid MongoDB ObjectIds
// Usage: node fixShiftTemplateIds.js

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shiftdrop';

async function main() {
  await mongoose.connect(MONGO_URI);
  const RotaTemplate = mongoose.connection.collection('rotatemplates');

  const templates = await RotaTemplate.find({}).toArray();
  let updatedCount = 0;

  for (const template of templates) {
    let changed = false;
    for (const day of template.days || []) {
      for (const shift of day.shifts || []) {
        // If shift.id is not a valid ObjectId, replace it
        if (!shift.id || !/^[a-f\d]{24}$/i.test(shift.id)) {
          shift.id = new ObjectId().toHexString();
          changed = true;
        }
      }
    }
    if (changed) {
      await RotaTemplate.updateOne({ _id: template._id }, { $set: { days: template.days } });
      updatedCount++;
      console.log(`Updated template ${template._id}`);
    }
  }
  console.log(`Done. Updated ${updatedCount} templates.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error fixing shift template IDs:', err);
  process.exit(1);
});
