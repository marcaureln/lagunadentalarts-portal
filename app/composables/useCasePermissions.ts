import { permissions, type CaseStatusName } from '~~/shared/utils/permissions';

interface CaseLike {
  status: CaseStatusName;
  assignedToId?: string | null;
  practiceId: string;
}

const ASSIGN_ACTIVE_STATUSES: CaseStatusName[] = ['SUBMITTED', 'ACCEPTED', 'IN_PROGRESS'];
const TERMINAL_STATUSES: CaseStatusName[] = ['COMPLETED', 'CANCELLED', 'DRAFT'];

export function useCasePermissions(case_: Ref<CaseLike | null | undefined>) {
  const { user } = useUserSession();
  const role = computed(() => user.value?.role);
  const userId = computed(() => user.value?.id);
  const userPracticeId = computed(() => user.value?.practiceId ?? null);

  const isManager = computed(() => role.value === 'ADMIN');
  const isArtist = computed(() => role.value === 'USER');
  const isLabUser = computed(() => permissions.isLDAUser(role.value));

  const status = computed(() => case_.value?.status ?? null);
  const assignedId = computed(() => case_.value?.assignedToId ?? null);
  const ownsCase = computed(() => isManager.value || (assignedId.value != null && assignedId.value === userId.value));
  const isTerminal = computed(() => status.value != null && TERMINAL_STATUSES.includes(status.value));

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

  const canSelfAssignNow = computed(() => isArtist.value && status.value === 'SUBMITTED' && assignedId.value == null);

  const canAssignAny = computed(() => permissions.canAssignAny(role.value));

  const canManagerAssign = computed(
    () => isManager.value && status.value != null && ASSIGN_ACTIVE_STATUSES.includes(status.value)
  );

  return {
    role,
    userId,
    userPracticeId,
    isManager,
    isArtist,
    isLabUser,
    status,
    assignedId,
    ownsCase,
    isTerminal,
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
