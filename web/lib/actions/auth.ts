'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ulid } from 'ulid';

import { HOME_ROUTE, ROOT_ROUTE, SESSION_COOKIE_NAME, SESSION_ID_COOKIE_NAME } from '@/lib/constants';

export const createSession = async (uid: string) => {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;
  if (!sessionId) {
    sessionId = ulid();
    cookieStore.set(SESSION_ID_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // One hour
      path: HOME_ROUTE,
    });
  }
  cookieStore.set(SESSION_COOKIE_NAME, uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // One hour
    path: HOME_ROUTE,
  });
  return sessionId;
};

export const removeSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect(ROOT_ROUTE);
};
