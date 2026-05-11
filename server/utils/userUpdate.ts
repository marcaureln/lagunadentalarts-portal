export function buildUserUpdateData<R extends string>(body: {
  name?: string;
  email?: string;
  role?: R;
}): {
  name?: string;
  email?: string;
  role?: R;
} {
  const data: { name?: string; email?: string; role?: R } = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.role !== undefined) data.role = body.role;
  return data;
}
