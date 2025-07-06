// Email confirmation handler for Supabase
import { supabase } from '../lib/supabaseClient';

export const handleEmailConfirmation = async () => {
  // This function handles the email confirmation redirect
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error confirming email:', error.message);
    return { error: error.message };
  }
  
  if (data?.session) {
    return { success: true, user: data.session.user };
  }
  
  return { error: 'No active session found' };
};

export const resendConfirmationEmail = async (email) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/confirm-email`
    }
  });
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
};
