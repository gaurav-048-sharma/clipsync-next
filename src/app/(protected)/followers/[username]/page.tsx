'use client';

import Navbar from '@/components/Dashboard/Navbar';
import FollowList from '@/components/Follow/FollowList';

export default function FollowersPage() {
  return (
    <>
      <Navbar />
      <FollowList type="followers" />
    </>
  );
}
