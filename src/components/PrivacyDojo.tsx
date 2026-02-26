import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Shield, RefreshCcw, CreditCard, Users, Download, Mail, Lock, Wallet, Network } from 'lucide-react';

interface Tool {
    name: string;
    description: string;
    url: string;
    badge?: string;
    action?: string; // Optional now
    icon?: React.ReactNode;
}

interface PrivacyDojoProps {
    title?: string;
}

const PrivacyDojo = ({ title = "Privacy Command Center" }: PrivacyDojoProps) => {
    const p2pMarkets: Tool[] = [
        {
            name: 'SpikeToSpike',
            description: 'P2P on Nostr',
            url: 'https://spiketospike.com/?referral=JON',
            badge: 'Popular',
            icon: <Users className="h-5 w-5 text-green-500" />
        },
        {
            name: 'RoboSats',
            description: 'Lightning Network & Tor Only',
            url: 'https://robosats.com/',
            badge: 'Lightning',
            icon: <Users className="h-5 w-5 text-yellow-500" />
        },
        {
            name: 'Bisq',
            description: 'The Sovereign Standard (DAO)',
            url: 'https://bisq.network/',
            icon: <Download className="h-5 w-5" />
        },
        {
            name: 'AlfredP2P',
            description: 'Bot P2P no Telegram. Cupom JONATA (20% OFF).',
            url: 'https://alfredp2p.io/',
            badge: '20% DESC',
            icon: <Shield className="h-5 w-5 text-blue-500" />
        }
    ];

    const swaps: Tool[] = [
        {
            name: 'StealthEX',
            description: 'Cross-chain, No-KYC, Instant',
            url: 'https://stealthex.io/?ref=TPcRzgSUvv',
            badge: 'Premium',
            icon: <RefreshCcw className="h-5 w-5 text-yellow-500" />
        },
        {
            name: 'Trocador.app',
            description: 'Exchange aggregator (Tor support)',
            url: 'https://trocador.app/',
        },
        {
            name: 'Simpleswap',
            description: 'Instant crypto exchange',
            url: 'https://simpleswap.io/',
        },
        {
            name: 'FixedFloat',
            description: 'Lightning enabled automated swap',
            url: 'https://fixedfloat.com/',
        }
    ];

    const cards: Tool[] = [
        {
            name: 'KAST',
            description: 'Next-gen crypto banking cards',
            url: 'https://kastfinance.app.link/HP8K5JYH',
            badge: 'Top Pick',
            icon: <CreditCard className="h-5 w-5 text-blue-500" />
        },
        {
            name: 'Bitrefill',
            description: 'Gift cards & Mobile refills',
            url: 'https://www.bitrefill.com/',
        },
        {
            name: 'Coincards',
            description: 'Buy Gift Cards with Crypto',
            url: 'https://coincards.com/',
        },
        {
            name: 'Prepaidify',
            description: 'Prepaid Visa/Mastercards',
            url: 'https://prepaidify.com/',
        }
    ];

    const wallets: Tool[] = [
        {
            name: 'Samourai Wallet',
            description: 'Privacy focused Bitcoin wallet',
            url: 'https://samouraiwallet.com/',
            icon: <Wallet className="h-5 w-5 text-red-500" />
        },
        {
            name: 'Sparrow Wallet',
            description: 'Best desktop Bitcoin wallet',
            url: 'https://sparrowwallet.com/',
        },
        {
            name: 'Monero GUI',
            description: 'The private currency wallet',
            url: 'https://www.getmonero.org/downloads/',
        },
        {
            name: 'Cake Wallet',
            description: 'Open source mobile wallet',
            url: 'https://cakewallet.com/',
        }
    ];

    const mail: Tool[] = [
        {
            name: 'Proton Mail',
            description: 'Encrypted email from Switzerland',
            url: 'https://proton.me/mail',
            badge: 'Secure',
            icon: <Mail className="h-5 w-5 text-purple-500" />
        },
        {
            name: 'Tuta',
            description: 'Private encrypted email',
            url: 'https://tuta.com/',
        },
        {
            name: 'SimpleLogin',
            description: 'Open source email aliases',
            url: 'https://simplelogin.io/',
        },
        {
            name: 'Session',
            description: 'Private messenger (No metadata)',
            url: 'https://getsession.org/',
        }
    ];

    const vpn: Tool[] = [
        {
            name: 'Mullvad',
            description: 'Privacy-first VPN (No email needed)',
            url: 'https://mullvad.net/',
            badge: 'Top Tier',
            icon: <Lock className="h-5 w-5 text-green-500" />
        },
        {
            name: 'IVPN',
            description: 'Ethical VPN service',
            url: 'https://www.ivpn.net/',
        },
        {
            name: 'Proton VPN',
            description: 'High speed Swiss VPN',
            url: 'https://proton.me/vpn',
        },
        {
            name: 'Tor Browser',
            description: 'Defend yourself against tracking',
            url: 'https://www.torproject.org/',
            icon: <Network className="h-5 w-5 text-purple-500" />
        }
    ];

    const ToolGrid = ({ tools }: { tools: Tool[] }) => (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-4">
            {tools.map((tool) => (
                <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block h-full"
                >
                    <div className="relative border rounded-lg p-5 h-full hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 flex flex-col items-start bg-card shadow-sm cursor-pointer">
                        {/* Header Row */}
                        <div className="flex justify-between w-full mb-3">
                            <div className="p-2 bg-muted rounded-md group-hover:bg-background transition-colors">
                                {tool.icon || <Shield className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            {tool.badge && (
                                <span className="text-[10px] font-bold px-2 py-1 bg-primary/5 text-primary rounded-full uppercase tracking-wider">
                                    {tool.badge}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg flex items-center gap-1 group-hover:text-primary transition-colors">
                                {tool.name}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground ml-1" />
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {tool.description}
                            </p>
                        </div>

                        {/* Absolute Overlay for click feedback if needed, but CSS hover is enough. 
                            Maybe an absolute arrow at bottom right? 
                        */}
                    </div>
                </a>
            ))}
        </div>
    );

    return (
        <Card className="w-full shadow-md border-border/60">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Shield className="h-6 w-6 text-primary" />
                            {title}
                        </CardTitle>
                        <CardDescription className="text-base mt-1">
                            Essential tools for financial sovereignty, security, and privacy
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="p2p" className="w-full">
                    <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 gap-2 bg-muted/30 rounded-lg mb-2 scrollbar-hide flex-nowrap">
                        <TabsTrigger value="p2p" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium">
                            <Users className="h-4 w-4 mr-2" />
                            P2P Markets
                        </TabsTrigger>
                        <TabsTrigger value="swap" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium">
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Instant Swap
                        </TabsTrigger>
                        <TabsTrigger value="cards" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Crypto Cards
                        </TabsTrigger>
                        <TabsTrigger value="wallets" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium">
                            <Wallet className="h-4 w-4 mr-2" />
                            Wallets
                        </TabsTrigger>
                        <TabsTrigger value="mail" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium">
                            <Mail className="h-4 w-4 mr-2" />
                            Mail & Chat
                        </TabsTrigger>
                        <TabsTrigger value="vpn" className="data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium">
                            <Lock className="h-4 w-4 mr-2" />
                            VPN & Tor
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="p2p" className="animate-in fade-in-50 duration-300">
                        <ToolGrid tools={p2pMarkets} />
                    </TabsContent>
                    <TabsContent value="swap" className="animate-in fade-in-50 duration-300">
                        <ToolGrid tools={swaps} />
                    </TabsContent>
                    <TabsContent value="cards" className="animate-in fade-in-50 duration-300">
                        <ToolGrid tools={cards} />
                    </TabsContent>
                    <TabsContent value="wallets" className="animate-in fade-in-50 duration-300">
                        <ToolGrid tools={wallets} />
                    </TabsContent>
                    <TabsContent value="mail" className="animate-in fade-in-50 duration-300">
                        <ToolGrid tools={mail} />
                    </TabsContent>
                    <TabsContent value="vpn" className="animate-in fade-in-50 duration-300">
                        <ToolGrid tools={vpn} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default PrivacyDojo;
