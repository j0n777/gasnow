import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface BitcoinCyclePosition {
    current_block: number;
    blocks_from_halving: number;
    cycle_progress: number;
    current_price: number;
    normalized_price: number;
    historical_percentile: number;
    phase: string;
    phase_confidence: number;
    updated_at: string;
}

export interface CycleStatistics {
    blocks_from_halving: number;
    avg_normalized_price: number;
    std_deviation: number;
    percentile_25: number;
    percentile_75: number;
}

export interface CycleDataPoint {
    x: number;
    y: number;
}

export interface BitcoinCycleData {
    current: BitcoinCyclePosition;
    stats: CycleStatistics[];
    cycles: Record<number, CycleDataPoint[]>;
}

export const useBitcoinCycle = () => {
    return useQuery({
        queryKey: ['bitcoinCycle'],
        queryFn: async () => {
            console.log('[useBitcoinCycle] Fetching Bitcoin Cycle data...');
            const { data, error } = await supabase.functions.invoke('get-crypto-data', {
                body: { type: 'bitcoin_cycle' }
            });

            if (error) {
                console.error('[useBitcoinCycle] Error:', error);
                throw error;
            }

            return data.data as BitcoinCycleData;
        },
        refetchInterval: 3600000, // 1 hour
        staleTime: 300000, // 5 minutes
    });
};
