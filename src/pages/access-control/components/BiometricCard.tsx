
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface BiometricCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgColor: string;
  iconTextColor: string;
  onSimulate: () => void;
}

const BiometricCard = ({
  icon,
  title,
  description,
  iconBgColor,
  iconTextColor,
  onSimulate,
}: BiometricCardProps) => {
  return (
    <Card className="w-full max-w-xs border-2 border-dashed p-6 text-center flex flex-col items-center">
      <div className={`mb-4 ${iconBgColor} p-3 rounded-full`}>
        <div className={`h-6 w-6 ${iconTextColor}`}>{icon}</div>
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Button onClick={onSimulate} className="w-full">
        {`Simulate ${title}`}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </Card>
  );
};

export default BiometricCard;
