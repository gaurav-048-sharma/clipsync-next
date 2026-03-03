require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function dedup() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const col = db.collection('stories');

  const stories = await col.find({ 'views.0': { $exists: true } }).toArray();
  let fixed = 0;

  for (const story of stories) {
    const seen = new Set();
    const unique = [];
    for (const v of story.views) {
      const uid = v.userId?.toString();
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      unique.push(v);
    }
    if (unique.length < story.views.length) {
      await col.updateOne({ _id: story._id }, { $set: { views: unique } });
      console.log(`Story ${story._id}: ${story.views.length} → ${unique.length} views`);
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} stories with duplicate views`);
  await mongoose.disconnect();
}
dedup().catch(console.error);
