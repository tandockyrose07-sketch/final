
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface RecognizedUserCardProps {
  name: string;
  role: string;
}

const RecognizedUserCard: React.FC<RecognizedUserCardProps> = ({ name, role }) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Access Details</CardTitle>
        <CardDescription>Information about the recognized individual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecognizedUserCard;
