const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const col = db.collection('stories');

  const total = await col.countDocuments({});
  const active = await col.countDocuments({ expiresAt: { $gt: new Date() } });
  const withMediaUrl = await col.countDocuments({ mediaUrl: { $exists: true, $ne: '' } });
  const withOldMedia = await col.countDocuments({ 'media.0': { $exists: true } });
  const emptyMedia = await col.countDocuments({ media: { $exists: true, $size: 0 }, mediaUrl: { $exists: false } });

  console.log('Total stories:', total);
  console.log('Active (not expired):', active);
  console.log('With mediaUrl field:', withMediaUrl);
  console.log('With media[0] (old format with data):', withOldMedia);
  console.log('With empty media[] and no mediaUrl:', emptyMedia);

  // Migrate old stories: copy media[0].url -> mediaUrl, media[0].type -> mediaType
  const toMigrate = await col.find({
    'media.0': { $exists: true },
    mediaUrl: { $exists: false }
  }).toArray();

  console.log('\nStories to migrate:', toMigrate.length);
  for (const s of toMigrate) {
    const url = s.media[0].url;
    const type = s.media[0].type || 'photo';
    console.log(`  Migrating ${s._id}: ${type} -> ${url.substring(0, 60)}...`);
    await col.updateOne({ _id: s._id }, {
      $set: { mediaUrl: url, mediaType: type },
    });
  }

  // Delete stories with no media at all (empty media[] and no mediaUrl)
  const broken = await col.find({
    media: { $exists: true, $size: 0 },
    mediaUrl: { $exists: false }
  }).toArray();
  console.log('\nBroken stories (no media at all):', broken.length);
  for (const s of broken) {
    console.log(`  Deleting broken story ${s._id}`);
    await col.deleteOne({ _id: s._id });
  }

  console.log('\nDone!');
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
