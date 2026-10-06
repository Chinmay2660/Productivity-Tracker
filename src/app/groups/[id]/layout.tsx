import GroupShell from "@/components/groups/GroupShell";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupShell groupId={id}>{children}</GroupShell>;
}
