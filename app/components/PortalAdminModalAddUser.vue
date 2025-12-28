<script setup lang="ts">
import { roleOptions, type UserRole } from '~~/shared/utils/users';
import type { Practice } from '~~/shared/types/practice';

const emit = defineEmits<{
  success: [];
}>();

const { data: practices } = await useFetch<Practice[]>('/api/practices');

const newUser = reactive({
  email: '',
  name: '',
  role: 'USER' as UserRole,
  practiceId: '' as string | undefined,
});

const isSubmitting = ref(false);
const error = ref('');
const toast = useToast();

const filteredRoleOptions = computed(() => {
  return roleOptions.filter(() => {
    // All roles are available for admin users
    return true;
  });
});

const isPracticeRole = computed(() => {
  return ['PRACTICE_STAFF', 'PRACTICE_ADMIN'].includes(newUser.role);
});

const resetForm = () => {
  newUser.email = '';
  newUser.name = '';
  newUser.role = 'USER';
  newUser.practiceId = '';
  error.value = '';
};

const addUser = async () => {
  isSubmitting.value = true;
  error.value = '';

  try {
    const payload = {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      ...(isPracticeRole.value && { practiceId: newUser.practiceId }),
    };

    await $fetch('/api/admin/users', {
      method: 'POST',
      body: payload,
    });

    toast.add({ description: 'User added successfully', color: 'success' });
    resetForm();
    emit('success');
  } catch (e: unknown) {
    error.value = 'Failed to add user';
    console.error('Failed to add user', e);
    toast.add({ description: error.value, color: 'error' });
  } finally {
    isSubmitting.value = false;
  }
};

// Reset practiceId when role changes
watch(
  () => newUser.role,
  () => {
    if (!isPracticeRole.value) {
      newUser.practiceId = '';
    }
  }
);
</script>

<template>
  <UModal>
    <UButton icon="i-ri-user-add-line"> Add User </UButton>

    <template #content="{ close }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Add Allowed User</h3>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            Add a new user to the system. LDA users will sign in with Microsoft, while practice users will use
            email/password.
          </p>

          <div>
            <label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email *</label>
            <UInput id="email" v-model="newUser.email" type="email" placeholder="user@example.com" />
          </div>

          <div>
            <label for="name" class="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <UInput id="name" v-model="newUser.name" placeholder="Full name" />
          </div>

          <div>
            <label for="role" class="mb-1 block text-sm font-medium text-gray-700">Role *</label>
            <USelectMenu
              id="role"
              v-model="newUser.role"
              :items="filteredRoleOptions"
              value-key="value"
              label-key="label"
              :search-input="false"
            />
          </div>

          <div v-if="isPracticeRole">
            <label for="practice" class="mb-1 block text-sm font-medium text-gray-700">Practice *</label>
            <USelectMenu
              id="practice"
              v-model="newUser.practiceId"
              :items="practices || []"
              value-key="id"
              label-key="name"
              placeholder="Select a practice"
              :search-input="false"
            />
            <p class="mt-1 text-xs text-gray-500">Practice users will use email/password authentication</p>
          </div>

          <UAlert v-if="error" color="error" variant="soft" :title="error" />
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="close"> Cancel </UButton>
            <UButton
              :loading="isSubmitting"
              @click="
                async () => {
                  await addUser();
                  if (!error) close();
                }
              "
            >
              Add User
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
