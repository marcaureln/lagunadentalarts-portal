import type { H3Event } from 'h3';

export function requireRouteParam(event: H3Event, name: string, label = name): string {
  const value = getRouterParam(event, name);
  if (!value) {
    throw createError({ statusCode: 400, statusMessage: `${label} is required` });
  }
  return value;
}

export const requireCaseId = (event: H3Event): string => requireRouteParam(event, 'id', 'Case ID');
export const requireUserId = (event: H3Event): string => requireRouteParam(event, 'id', 'User ID');
export const requirePracticeId = (event: H3Event): string => requireRouteParam(event, 'id', 'Practice ID');
export const requireResourceId = (event: H3Event): string => requireRouteParam(event, 'id', 'Resource ID');

export function requirePracticeAndUserId(event: H3Event): { practiceId: string; userId: string } {
  return {
    practiceId: requireRouteParam(event, 'id', 'Practice ID'),
    userId: requireRouteParam(event, 'userId', 'User ID'),
  };
}
