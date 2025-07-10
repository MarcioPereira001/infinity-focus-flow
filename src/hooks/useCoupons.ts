
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

export type Coupon = Tables<'coupons'>;
export type UserCoupon = Tables<'user_coupons'>;

export function useCoupons() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const validateCoupon = async (code: string) => {
    if (!user) return { valid: false, error: 'Usuário não autenticado' };

    setLoading(true);
    try {
      // Verificar se o cupom existe e está válido
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (couponError || !coupon) {
        return { valid: false, error: 'Cupom não encontrado' };
      }

      // Verificar se o cupom já expirou
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, error: 'Cupom expirado' };
      }

      // Verificar se o cupom atingiu o limite de usos
      if (coupon.max_uses && coupon.current_uses && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, error: 'Cupom esgotado' };
      }

      // Verificar se o usuário já usou este cupom
      const { data: userCoupon } = await supabase
        .from('user_coupons')
        .select('id')
        .eq('user_id', user.id)
        .eq('coupon_code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (userCoupon) {
        return { valid: false, error: 'Cupom já utilizado' };
      }

      return { 
        valid: true, 
        coupon: {
          ...coupon,
          discount_percent: coupon.discount_percent,
          is_free_month: coupon.is_free_month || false
        }
      };

    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, error: 'Erro ao validar cupom' };
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const validation = await validateCoupon(code);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // Aplicar o cupom para o usuário
      const { error: insertError } = await supabase
        .from('user_coupons')
        .insert({
          user_id: user.id,
          coupon_code: code.toUpperCase(),
          expires_at: validation.coupon?.is_permanent ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          is_active: true
        });

      if (insertError) throw insertError;

      // Incrementar o contador de usos do cupom
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ 
          current_uses: (validation.coupon?.current_uses || 0) + 1 
        })
        .eq('code', code.toUpperCase());

      if (updateError) throw updateError;

      return { success: true, coupon: validation.coupon };

    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, error: 'Erro ao aplicar cupom' };
    }
  };

  const getUserActiveCoupons = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupons:coupon_code (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching user coupons:', error);
      return [];
    }
  };

  return {
    loading,
    validateCoupon,
    applyCoupon,
    getUserActiveCoupons
  };
}
