import UserProfile from '@/lib/models/userModel';

/**
 * Find or auto-create a UserProfile for the given authId.
 * Prevents 404 errors when profile documents are missing from MongoDB.
 */
export async function ensureProfile(authId: any) {
  let profile = await UserProfile.findOne({ authId });
  if (!profile) {
    profile = new UserProfile({ authId });
    await profile.save();
  }
  return profile;
}
