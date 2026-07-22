import { supabase } from './supabase.js'

export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
    },
  })

  if (error) {
    console.error('GitHub sign-in failed:', error)
    throw error
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign-out failed:', error)
    throw error
  }
}

export async function initializeAuthentication({
  onSignedIn,
  onSignedOut,
}) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Could not read authentication session:', error)
    onSignedOut()
  } else if (session?.user) {
    await onSignedIn(session.user)
  } else {
    onSignedOut()
  }

  supabase.auth.onAuthStateChange((_event, updatedSession) => {
    if (updatedSession?.user) {
      onSignedIn(updatedSession.user)
    } else {
      onSignedOut()
    }
  })
}
