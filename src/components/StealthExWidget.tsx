import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const StealthExWidget = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Dynamic import to avoid SSR issues
    import('@stealthex-io/widget').then((module) => {
      const widget = module.default;
      widget.init("7a429329-859d-472a-9e48-5a586f299894", { 
        size: 330,
        containerId: 'stealthex-widget-container'
      });
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exchange Crypto</CardTitle>
        <CardDescription>Swap cryptocurrencies instantly with StealthEX</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div 
          id="stealthex-widget-container" 
          className="rounded-lg overflow-hidden"
        />
      </CardContent>
    </Card>
  );
};
