import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { ok, err, type Result, type AppError } from './errors';

WebBrowser.maybeCompleteAuthSession();

// ── OAuth helpers ────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<Result<void>> {
  try {
    const redirectTo = Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return err({ kind: 'auth', message: error.message });

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') {
      return err({ kind: 'auth', message: 'Google sign-in cancelled' });
    }

    const url = new URL(result.url);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
    return ok(undefined);
  } catch (e) {
    return err({ kind: 'unknown', message: 'Google sign-in failed', raw: e });
  }
}

export async function signInWithApple(): Promise<Result<void>> {
  if (Platform.OS !== 'ios') {
    return err({ kind: 'auth', message: 'Apple Sign In is only available on iOS' });
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
    });
    if (error) return err({ kind: 'auth', message: error.message });
    return ok(undefined);
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED') {
      return err({ kind: 'auth', message: 'Apple sign-in cancelled' });
    }
    return err({ kind: 'unknown', message: 'Apple sign-in failed', raw: e });
  }
}

// ── Email / password ─────────────────────────────────────────────────────────

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<Result<void>> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return err({ kind: 'auth', message: error.message });
  return ok(undefined);
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<Result<void>> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return err({ kind: 'auth', message: error.message });
  return ok(undefined);
}

// ── Phone OTP ────────────────────────────────────────────────────────────────

export async function sendPhoneOtp(phone: string): Promise<Result<void>> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return err({ kind: 'auth', message: error.message });
  return ok(undefined);
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<Result<void>> {
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) return err({ kind: 'auth', message: error.message });
  return ok(undefined);
}

// ── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut(): Promise<Result<void>> {
  const { error } = await supabase.auth.signOut();
  if (error) return err({ kind: 'auth', message: error.message });
  return ok(undefined);
}
