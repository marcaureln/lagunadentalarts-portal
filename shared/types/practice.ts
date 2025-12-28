export type { Practice } from '~~/server/types/user';

export type PracticeCreateInput = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type PracticeUpdateInput = Partial<PracticeCreateInput>;

export type PracticeWithCount = Practice & {
  _count?: {
    staff: number;
  };
};
