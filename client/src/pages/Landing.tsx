import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl" data-testid="logo">W</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="app-title">WorkFlu</h1>
            <p className="text-muted-foreground">Business Management System</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage your trading operations with comprehensive tools for working capital, 
              purchases, inventory tracking, and financial reporting.
            </p>
            
            <Button 
              className="w-full"
              onClick={() => window.location.href = '/api/login'}
              data-testid="login-button"
            >
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
