const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const col = db.collection('stories');

  // Show all remaining stories sorted by newest
  const stories = await col.find({}).sort({ createdAt: -1 }).limit(10).toArray();
  console.log('Total remaining:', stories.length);
  stories.forEach((s, i) => {
    console.log(`\n--- Story ${i} ---`);
    console.log('_id:', s._id.toString());
    console.log('createdAt:', s.createdAt);
    console.log('expiresAt:', s.expiresAt);
    console.log('mediaUrl:', JSON.stringify(s.mediaUrl));
    console.log('mediaType:', s.mediaType);
    console.log('media:', JSON.stringify(s.media));
    console.log('caption:', s.caption);
    console.log('archived:', s.archived);
    console.log('userId:', s.userId?.toString());
  });
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
