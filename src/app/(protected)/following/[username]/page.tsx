'use client';

import Navbar from '@/components/Dashboard/Navbar';
import FollowList from '@/components/Follow/FollowList';

export default function FollowingPage() {
  return (
    <>
      <Navbar />
      <FollowList type="following" />
    </>
  );
}
