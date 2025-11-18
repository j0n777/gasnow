import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useCryptoNews } from '@/hooks/useCryptoNews';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

const newsCategories = [
  { value: 'general', label: 'General' },
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFT' },
  { value: 'altcoins', label: 'Altcoins' },
];

export const NewsSection = () => {
  const [category, setCategory] = useState('general');
  const { data: articles, isLoading } = useCryptoNews(category);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto News</CardTitle>
        <CardDescription>Latest updates from the crypto world</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2">
            {newsCategories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={category} className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {articles?.slice(0, 5).map((article, index) => (
                  <a
                    key={index}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors group"
                  >
                    <div className="flex gap-4">
                      {article.image && (
                        <img 
                          src={article.image} 
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
