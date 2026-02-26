import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface CurrentCyclePosition {
    current_block: number;
    current_halving_block: number;
    blocks_from_halving: number;
    cycle_progress: number;
    current_price: number;
    normalized_price: number;
    historical_percentile: number;
    phase: string;
    phase_confidence: number;
    updated_at: string;
    // New prediction columns
    cycle_start_date: string;
    predicted_top_date: string;
    predicted_bottom_date: string;
    predicted_next_halving_date: string;
}

export interface CycleStats {
    blocks_from_halving: number;
    avg_normalized_price: number;
    std_deviation: number;
    min_price: number;
    max_price: number;
    percentile_25: number;
    percentile_75: number;
    sample_count: number;
}

export interface BitcoinCycleData {
    current: CurrentCyclePosition;
    cycles: Record<number, { x: number; y: number }[]>;
    stats: CycleStats[];
}

export const useBitcoinCycle = () => {
    return useQuery({
        queryKey: ['bitcoin-cycle'],
        queryFn: async (): Promise<BitcoinCycleData> => {
            // Fetch latest position
            const { data: currentData, error: currentError } = await supabase
                .from('current_cycle_position')
                .select('*')
                .limit(1)
                .single();

            if (currentError) throw currentError;

            // Fetch statistics
            const { data: statsData, error: statsError } = await supabase
                .from('cycle_statistics')
                .select('*')
                .order('blocks_from_halving', { ascending: true });

            if (statsError) throw statsError;

            // Fetch historical cycle data (lightweight version for charting)
            // We might want to sample this if it's too heavy
            const { data: cycleData, error: cycleError } = await supabase
                .from('bitcoin_cycle_data')
                .select('cycle_number, blocks_from_halving, normalized_price')
                .order('blocks_from_halving', { ascending: true });

            if (cycleError) throw cycleError;

            // Process cycle data into series
            const cycles: Record<number, { x: number; y: number }[]> = {};
            if (cycleData) {
                cycleData.forEach((row) => {
                    if (!cycles[row.cycle_number]) cycles[row.cycle_number] = [];
                    // Downsample blocks for smoother chart if needed (currently raw)
                    cycles[row.cycle_number].push({
                        x: row.blocks_from_halving,
                        y: row.normalized_price
                    });
                });
            }

            return {
                current: currentData as CurrentCyclePosition,
                cycles,
                stats: statsData as CycleStats[]
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
