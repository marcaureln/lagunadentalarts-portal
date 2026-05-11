import { permissions, type CaseStatusName } from '~~/shared/utils/permissions';

interface CaseLike {
  status: CaseStatusName;
  assignedToId?: string | null;
  practiceId: string;
}

export function useCasePermissions(case_: Ref<CaseLike | null | undefined>) {
  const { user } = useUserSession();
  const role = computed(() => user.value?.role);
  const userId = computed(() => user.value?.id);
  const userPracticeId = computed(() => user.value?.practiceId ?? null);

  const canTransitionTo = (toStatus: CaseStatusName) =>
    computed(() => {
      const c = case_.value;
      if (!c) return false;
      return permissions.canTransition(
        role.value,
        userId.value,
        c.status,
        toStatus,
        c.assignedToId ?? null,
        userPracticeId.value,
        c.practiceId
      );
    });

  const canSelfAssign = computed(() => {
    const c = case_.value;
    return !!c && permissions.canSelfAssign(role.value, c.assignedToId ?? null);
  });

  const canAssignAny = computed(() => permissions.canAssignAny(role.value));

  return {
    canStartWorking: canTransitionTo('IN_PROGRESS'),
    canMarkComplete: canTransitionTo('COMPLETED'),
    canRequestInfo: canTransitionTo('NEEDS_INFO'),
    canCancel: canTransitionTo('CANCELLED'),
    canResubmit: canTransitionTo('SUBMITTED'),
    canSelfAssign,
    canAssignAny,
  };
}
