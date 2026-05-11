import { permissions, ASSIGNABLE_STATUSES, TERMINAL_STATUSES, type CaseStatusName } from '~~/shared/utils/permissions';

interface CaseLike {
  status: CaseStatusName;
  assignedToId?: string | null;
  practiceId: string;
}

// Lab users can't act on a DRAFT (not yet submitted) or a terminal case.
const LAB_INACTIONABLE_STATUSES: readonly CaseStatusName[] = [...TERMINAL_STATUSES, 'DRAFT'] as const;

export function useCasePermissions(case_: Ref<CaseLike | null | undefined>) {
  const { user } = useUserSession();
  const role = computed(() => user.value?.role);
  const userId = computed(() => user.value?.id);
  const userPracticeId = computed(() => user.value?.practiceId ?? null);

  const isManager = computed(() => role.value === 'ADMIN');
  const isLabUser = computed(() => permissions.isLabUser(role.value));

  const status = computed(() => case_.value?.status ?? null);
  const assignedId = computed(() => case_.value?.assignedToId ?? null);
  const ownsCase = computed(() => isManager.value || (assignedId.value != null && assignedId.value === userId.value));
  const isLabInactionable = computed(() => status.value != null && LAB_INACTIONABLE_STATUSES.includes(status.value));

  const canTransitionTo = (toStatus: CaseStatusName) =>
    computed(() => {
      const c = case_.value;
      if (!c) return false;
      return permissions.canTransition({
        role: role.value,
        userId: userId.value,
        fromStatus: c.status,
        toStatus,
        assignedToId: c.assignedToId ?? null,
        userPracticeId: userPracticeId.value,
        casePracticeId: c.practiceId,
      });
    });

  const canSelfAssign = computed(() => {
    const c = case_.value;
    return !!c && permissions.canSelfAssign(role.value, c.assignedToId ?? null);
  });

  const canSelfAssignNow = computed(
    () => role.value === 'USER' && status.value === 'SUBMITTED' && assignedId.value == null
  );

  const canAssignAny = computed(() => permissions.canAssignAny(role.value));

  const canManagerAssign = computed(
    () => isManager.value && status.value != null && ASSIGNABLE_STATUSES.includes(status.value)
  );

  return {
    role,
    userId,
    userPracticeId,
    isManager,
    isLabUser,
    status,
    assignedId,
    ownsCase,
    isLabInactionable,
    canStartWorking: canTransitionTo('IN_PROGRESS'),
    canMarkComplete: canTransitionTo('COMPLETED'),
    canRequestInfo: canTransitionTo('NEEDS_INFO'),
    canCancel: canTransitionTo('CANCELLED'),
    canResubmit: canTransitionTo('SUBMITTED'),
    canSelfAssign,
    canSelfAssignNow,
    canAssignAny,
    canManagerAssign,
  };
}
