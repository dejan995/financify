import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <DollarSign className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">Finance Tracker</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Manage your finances with ease
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign In with Replit
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Track expenses, manage budgets, and achieve your financial goals
          </p>
        </CardContent>
      </Card>
    </div>
  );
}