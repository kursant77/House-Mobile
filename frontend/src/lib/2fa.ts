import * as OTPAuth from 'otpauth';
import { supabase } from './supabase';
import { logger } from './logger';


export const twoFactorAuth = {
  /**
   * Enable 2FA for user
   */
  async enable(userId: string): Promise<{ secret: string; qrCode: string }> {
    try {
      // Create a new TOTP object.
      const totp = new OTPAuth.TOTP({
        issuer: 'HouseMobile',
        label: userId,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: new OTPAuth.Secret(),
      });

      const secret = totp.secret.base32;
      const qrCode = totp.toString();

      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_secret: secret,
          two_factor_enabled: true
        })
        .eq('id', userId);

      if (error) throw error;

      return { secret, qrCode };
    } catch (error) {
      logger.error('2FA enable failed:', error);
      throw error;
    }
  },

  /**
   * Verify TOTP code
   */
  async verify(userId: string, code: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('two_factor_secret')
        .eq('id', userId)
        .single();

      if (!data?.two_factor_secret) return false;

      const totp = new OTPAuth.TOTP({
        issuer: 'HouseMobile',
        label: userId,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(data.two_factor_secret),
      });

      const delta = totp.validate({
        token: code,
        window: 1, // Allow 30 seconds clock drift
      });

      return delta !== null;
    } catch (error) {
      logger.error('2FA verify failed:', error);
      return false;
    }
  },

  /**
   * Disable 2FA
   */
  async disable(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_secret: null, two_factor_enabled: false })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('2FA disable failed:', error);
      throw error;
    }
  },
};

