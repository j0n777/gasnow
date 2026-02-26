import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles } from "lucide-react";

interface BecomePartnerProps {
    title?: string;
}

export const BecomePartner = ({ title = "Become a Partner" }: BecomePartnerProps) => {
    return (
        <Card className="bg-gradient-to-r from-primary/10 via-background to-primary/5 border-primary/20 shadow-md">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    {title}
                </CardTitle>
                <CardDescription className="text-base md:text-lg mt-2 max-w-2xl mx-auto">
                    Gain premium visibility for your privacy tool, exchange, or service.
                    Support open-source analytics and reach thousands of crypto natives.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8 pt-4">
                <a href="mailto:partners@gasnow.tools">
                    <Button size="lg" className="font-bold text-lg px-8 py-6 shadow-xl hover:scale-105 transition-transform bg-primary text-primary-foreground">
                        <Mail className="mr-3 h-5 w-5" />
                        partners@gasnow.tools
                    </Button>
                </a>
            </CardContent>
        </Card>
    );
};
