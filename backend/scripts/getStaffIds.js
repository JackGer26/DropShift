// Quick script to get staff IDs from your database
// Usage: node scripts/getStaffIds.js

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shiftdrop';

async function main() {
  await mongoose.connect(MONGO_URI);

  const StaffCollection = mongoose.connection.collection('staff');

  const staff = await StaffCollection.find({}).limit(10).toArray();

  console.log('\n📋 Staff Members:\n');
  console.log('ID'.padEnd(30) + 'Name');
  console.log('-'.repeat(60));

  staff.forEach(member => {
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown';
    console.log(`${member._id.toString().padEnd(30)}${name}`);
  });

  console.log('\n💡 To view a staff member\'s rota, visit:');
  if (staff.length > 0) {
    console.log(`   http://localhost:5173/my-rota/${staff[0]._id}\n`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
