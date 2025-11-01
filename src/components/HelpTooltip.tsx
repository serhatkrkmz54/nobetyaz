import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface HelpTooltipProps {
    children: React.ReactNode;
}

export function HelpTooltip({ children }: HelpTooltipProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary">
                    <HelpCircle className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2 text-sm">
                    {children}
                </div>
            </PopoverContent>
        </Popover>
    );
}