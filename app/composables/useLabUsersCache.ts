interface LabUser {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export function useLabUsersCache() {
  const labUsers = ref<LabUser[]>([]);
  const loaded = ref(false);

  const ensure = async () => {
    if (loaded.value) return;
    try {
      labUsers.value = await $fetch<LabUser[]>('/api/lab-users');
      loaded.value = true;
    } catch (e) {
      // Silent failure: caller's UI will simply show no users to choose from.
      // Re-throwing would mask the dropdown trigger from rendering.
      console.error('Failed to load lab users:', e);
    }
  };

  return { labUsers, loaded, ensure };
}
