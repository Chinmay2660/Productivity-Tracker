/** Native confirm for irreversible actions (ponytail: no extra modal component). */
export function confirmDestructive(message: string): boolean {
  return window.confirm(message);
}
