import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency, calculatePercentage, formatDate } from "@/lib/utils";
import GoalForm from "@/components/forms/goal-form";

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/goals"],
  });

  const enrichedGoals = (goals || []).map(goal => {
    const targetAmount = parseFloat(goal.targetAmount);
    const currentAmount = parseFloat(goal.currentAmount);
    const percentage = calculatePercentage(currentAmount, targetAmount);
    const remaining = targetAmount - currentAmount;
    const isCompleted = goal.isCompleted || percentage >= 100;
    
    // Calculate days until target date
    let daysUntilTarget = null;
    if (goal.targetDate) {
      const today = new Date();
      const target = new Date(goal.targetDate);
      const diffTime = target.getTime() - today.getTime();
      daysUntilTarget = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      ...goal,
      targetAmount,
      currentAmount,
      percentage,
      remaining,
      isCompleted,
      daysUntilTarget,
    };
  });

  const completedGoals = enrichedGoals.filter(g => g.isCompleted);
  const activeGoals = enrichedGoals.filter(g => !g.isCompleted);
  const totalGoalValue = enrichedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalProgress = enrichedGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-800">Financial Goals</h2>
          <Button onClick={() => {
            setEditingGoal(null);
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Goal
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                  <p className="text-2xl font-bold text-foreground">{enrichedGoals.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-accent">{completedGoals.length}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Target</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalGoalValue)}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-full">
                  <Target className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
                  <p className="text-2xl font-bold text-accent">{formatCurrency(totalProgress)}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedGoals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{goal.name}</CardTitle>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {goal.isCompleted && (
                      <Badge variant="default" className="bg-accent">
                        Completed
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingGoal(goal);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(goal.currentAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          of {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {goal.percentage}%
                        </p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(goal.percentage, 100)} 
                      className="h-3"
                    />
                  </div>

                  {/* Target Date */}
                  {goal.targetDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Target: {formatDate(goal.targetDate)}</span>
                      {goal.daysUntilTarget !== null && (
                        <span className={`ml-auto ${
                          goal.daysUntilTarget < 0 
                            ? "text-danger" 
                            : goal.daysUntilTarget < 30 
                              ? "text-warning" 
                              : "text-muted-foreground"
                        }`}>
                          {goal.daysUntilTarget < 0 
                            ? `${Math.abs(goal.daysUntilTarget)} days overdue`
                            : `${goal.daysUntilTarget} days left`
                          }
                        </span>
                      )}
                    </div>
                  )}

                  {/* Remaining Amount */}
                  {!goal.isCompleted && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Remaining: </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(goal.remaining)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {enrichedGoals.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No financial goals set yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Set financial goals to track your progress and stay motivated
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm
          goal={editingGoal}
          onClose={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}
