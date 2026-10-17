/**
 * Lectura y registro del comercio del usuario en Supabase.
 * RLS garantiza que cada dueño solo vea y cree el suyo.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { BusinessInput, BusinessType, LegalType, Merchant } from '@/lib/business';

type MerchantRow = {
  id: string;
  business_name: string;
  business_type: BusinessType;
  legal_type: LegalType;
};

const COLUMNS = 'id, business_name, business_type, legal_type';

export function toMerchant(row: MerchantRow): Merchant {
  return {
    id: row.id,
    businessName: row.business_name,
    businessType: row.business_type,
    legalType: row.legal_type,
  };
}

/** El comercio del usuario actual, o null si todavía no lo ha registrado. */
export async function fetchMyMerchant(client: SupabaseClient): Promise<Merchant | null> {
  const { data, error } = await client.from('merchants').select(COLUMNS).maybeSingle<MerchantRow>();
  if (error) throw error;
  return data ? toMerchant(data) : null;
}

/** Registra el comercio del usuario actual (el dueño lo pone la base de datos). */
export async function createMerchant(client: SupabaseClient, input: BusinessInput): Promise<Merchant> {
  const { data, error } = await client
    .from('merchants')
    .insert({
      business_name: input.businessName,
      business_type: input.businessType,
      legal_type: input.legalType,
    })
    .select(COLUMNS)
    .single<MerchantRow>();
  if (error) throw error;
  return toMerchant(data);
}
