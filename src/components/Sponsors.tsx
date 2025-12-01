import { Card, CardContent } from '@/components/ui/card';
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
    <section className="py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Our Sponsors</h2>
        <p className="text-sm text-muted-foreground">Supporting the crypto community</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="text-4xl">{sponsor.logo}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                    {sponsor.name}
                    <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{sponsor.description}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
};
