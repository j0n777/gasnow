import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export const Sponsors = () => {
  const sponsors = [
    {
      name: 'OKX',
      description: 'Leading cryptocurrency exchange',
      url: 'https://www.okx.com/pt-br/campaigns/boas-vindas-novos-usuarios?channelId=JONATA',
      logo: '🏦'
    },
    {
      name: 'KAST',
      description: 'Next-gen crypto banking',
      url: 'https://kastfinance.app.link/HP8K5JYH',
      logo: '💳'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Sponsors</CardTitle>
        <CardDescription>Supporting the crypto community</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.name}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="rounded-lg border bg-card p-6 flex items-center gap-4 transition-all hover:shadow-lg hover:border-primary/50">
                <div className="text-4xl">{sponsor.logo}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                    {sponsor.name}
                    <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{sponsor.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
