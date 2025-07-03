import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  PieChart, 
  Shield, 
  CreditCard,
  Receipt,
  Calculator
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Finance Tracker</h1>
          </div>
          <Button onClick={() => window.location.href = '/api/login'}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h2 className="text-5xl font-bold text-foreground">
            Take Control of Your 
            <span className="text-primary"> Financial Future</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive finance management platform to track expenses, set budgets, 
            achieve goals, and make informed financial decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need to Manage Your Money
          </h3>
          <p className="text-lg text-muted-foreground">
            Powerful tools designed to simplify your financial life
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Expense Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor all your spending with detailed categorization and real-time insights.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Budget Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set smart budgets and get alerts when you're approaching your limits.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <PieChart className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Financial Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set and track progress towards your financial objectives with visual progress indicators.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CreditCard className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Multi-Account</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage checking, savings, credit cards, and investment accounts in one place.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Receipt className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Receipt Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Scan receipts and automatically extract transaction details for easy entry.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Calculator className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Bill Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Never miss a payment with smart bill tracking and reminder notifications.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get detailed insights into your spending patterns with interactive charts.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your financial data is encrypted and secure with industry-standard protection.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Financial Life?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of users who have taken control of their finances with our powerful platform.
            </p>
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Start Your Journey Today
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 Finance Tracker. Built with modern web technologies for the best user experience.</p>
        </div>
      </footer>
    </div>
  );
}