import { useQuery } from "@tanstack/react-query";
import type { CapitalEntriesResponse, PurchasesResponse } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RecentTransactions() {
  const { data: capitalEntries, isLoading } = useQuery<CapitalEntriesResponse>({
    queryKey: ['/api/capital/entries'],
  });

  const { data: purchases } = useQuery<PurchasesResponse>({
    queryKey: ['/api/purchases'],
  });

  // Combine and sort transactions
  const transactions = [
    ...(capitalEntries || []).map((entry: any) => ({
      id: entry.id,
      date: entry.date,
      type: entry.type === 'CapitalIn' ? 'Capital' : 'Capital',
      description: entry.description || 'Capital transaction',
      amount: entry.type === 'CapitalIn' ? parseFloat(entry.amount) : -parseFloat(entry.amount),
      status: 'Completed',
      category: entry.type === 'CapitalIn' ? 'income' : 'expense'
    })),
    ...(purchases || []).slice(0, 10).map((purchase: any) => ({
      id: purchase.id,
      date: purchase.date,
      type: 'Purchase',
      description: `Purchase - ${purchase.weight}kg`,
      amount: -parseFloat(purchase.total),
      status: 'Completed',
      category: 'expense'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const getTypeColor = (type: string, category: string) => {
    switch (type) {
      case 'Purchase':
        return 'bg-blue-100 text-blue-800';
      case 'Capital':
        return category === 'income' ? 'bg-purple-100 text-purple-800' : 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2" data-testid="recent-transactions">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="ghost" size="sm" data-testid="view-all-transactions">
            View all
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/50" data-testid={`transaction-${transaction.id}`}>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="secondary" 
                      className={getTypeColor(transaction.type, transaction.category)}
                    >
                      {transaction.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                      ${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {transaction.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
