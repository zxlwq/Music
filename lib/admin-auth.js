/**
 * @param {unknown} password
 * @param {unknown} expectedPassword
 */
export function getAdminAuthError(password, expectedPassword) {
  const expected = String(expectedPassword ?? '').trim();
  if (!expected) {
    return {
      status: 503,
      body: {
        error: 'Delete is disabled: set a non-empty PASSWORD environment variable',
        code: 'PASSWORD_NOT_CONFIGURED',
      },
    };
  }

  if (String(password ?? '') !== expected) {
    return { status: 401, body: { error: 'Unauthorized', code: 'INVALID_PASSWORD' } };
  }

  return null;
}
