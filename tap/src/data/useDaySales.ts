import { useEffect, useState } from 'react';

import type { DayKey } from '@/lib/dates';
import type { AppMode, Sale } from '@/lib/sale';
import { saleRepository } from '@/services';

import type { SaleRepository } from './SaleRepository';

/**
 * Ventas de un día en un modo. Se actualiza sola cuando se registra o cambia
 * una venta (por ejemplo, al terminar un cobro).
 */
export function useDaySales(day: DayKey, mode: AppMode, repo: SaleRepository = saleRepository): Sale[] {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    let active = true;
    const load = () => {
      repo
        .listByDay(day, mode)
        .then((list) => {
          if (active) setSales(list);
        })
        .catch(() => {
          // TODO(paso 6): mostrar un aviso de "sin conexión" cuando la fuente sea Supabase.
        });
    };
    load();
    const unsubscribe = repo.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [day, mode, repo]);

  return sales;
}
