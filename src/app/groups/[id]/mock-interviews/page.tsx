"use client";

import { useParams } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import GroupMockInterviewsTab from "@/components/groups/GroupMockInterviewsTab";

export default function GroupMockInterviewsPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { user } = useUser();

  return <GroupMockInterviewsTab groupId={groupId} currentUserId={user?._id} />;
}
