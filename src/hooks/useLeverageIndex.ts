import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface LeverageIndexData {
    value: number; // 0-100
    classification: 'Healthy' | 'Normal' | 'Loaded' | 'Overleveraged';
    components: {
        fundingScore: number;
        oiScore: number;
        longShortScore: number;
        liquidationScore: number;
    };
    metrics: {
        totalOI: number;
        avgFunding: number;
        avgLongShortRatio: number;
    };
    insight: string;
    timestamp?: number;
}

/**
 * Fetch Leverage Index from backend (pre-calculated and stored in database)
 * 
 * The index is calculated in the backend from derivatives data:
 * - Funding Rate Magnitude (30% weight) - Higher absolute funding = more stress
 * - Open Interest Level (30% weight) - Higher OI = more leverage
 * - Long/Short Ratio Extremity (20% weight) - Extreme ratios = crowded trades
 * - Liquidations (20% weight) - Higher liquidations = more risk
 */
export function useLeverageIndex() {
    return useQuery({
        queryKey: ['leverage-index'],
        queryFn: async (): Promise<LeverageIndexData | null> => {
            const response = await supabase.functions.invoke('get-crypto-data', {
                body: { type: 'leverage_index' }
            });

            if (response.error) throw response.error;

            const data = response.data?.data;
            if (!data) {
                // Return default values if no data available
                return {
                    value: 50,
                    classification: 'Normal',
                    components: {
                        fundingScore: 0,
                        oiScore: 0,
                        longShortScore: 0,
                        liquidationScore: 0
                    },
                    metrics: {
                        totalOI: 0,
                        avgFunding: 0,
                        avgLongShortRatio: 1
                    },
                    insight: 'Loading market data...'
                };
            }

            return data as LeverageIndexData;
        },
        refetchInterval: 2 * 60 * 1000, // 2 minutes
    });
}
