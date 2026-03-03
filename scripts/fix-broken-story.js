require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const col = db.collection('stories');

  // Delete the newest broken story (no mediaUrl)
  const result = await col.deleteOne({ _id: new mongoose.Types.ObjectId('69a686a9b01e45e7337700d5') });
  console.log('Deleted broken story:', result.deletedCount);

  await mongoose.disconnect();
}
fix().catch(console.error);
