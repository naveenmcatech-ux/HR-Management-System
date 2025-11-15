export type PermissionMatrix = Record<string, Record<string, boolean>>;

export function getStoredPermissions(): PermissionMatrix {
  try {
    const raw = localStorage.getItem('auth-permissions');
    if (!raw) return {};
    return JSON.parse(raw) as PermissionMatrix;
  } catch (e) {
    return {};
  }
}

export function hasPermission(moduleName: string, action: string): boolean {
  const perms = getStoredPermissions();
  if (!perms) return false;
  return !!(perms[moduleName] && perms[moduleName][action]);
}

export function usePermissions() {
  const check = (moduleName: string, action: string) => hasPermission(moduleName, action);
  return { hasPermission: check };
}
