import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CapitalBalanceResponse, CapitalEntriesResponse, SettingsResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function WorkingCapital() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"CapitalIn" | "CapitalOut">("CapitalIn");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<"USD" | "ETB">("USD");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: balance, isLoading: balanceLoading } = useQuery<CapitalBalanceResponse>({
    queryKey: ['/api/capital/balance'],
  });

  const { data: entries, isLoading: entriesLoading } = useQuery<CapitalEntriesResponse>({
    queryKey: ['/api/capital/entries'],
  });

  const { data: settings } = useQuery<SettingsResponse>({
    queryKey: ['/api/settings'],
  });

  const addEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const exchangeRate = currency === "ETB" ? String(settings?.exchangeRate) : undefined;
      return await apiRequest('POST', '/api/capital/entries', {
        entryId: `CAP-${Date.now()}`,
        amount: data.amount,
        type: data.type,
        description: data.description,
        paymentCurrency: data.currency,
        exchangeRate: exchangeRate,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Capital entry added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/capital/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/capital/balance'] });
      setShowAddEntryModal(false);
      setAmount("");
      setDescription("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add capital entry",
        variant: "destructive",
      });
    },
  });

  // Calculate USD preview for ETB amounts
  const getUsdPreview = () => {
    if (currency === "ETB" && amount && settings?.exchangeRate) {
      const etbAmount = parseFloat(amount);
      const usdAmount = etbAmount / settings.exchangeRate;
      return usdAmount;
    }
    return null;
  };

  const handleAddEntry = () => {
    if (!amount || !description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate exchange rate for ETB entries
    if (currency === "ETB" && (!settings?.exchangeRate || settings.exchangeRate <= 0)) {
      toast({
        title: "Error",
        description: "Exchange rate is required for ETB entries. Please check your settings.",
        variant: "destructive",
      });
      return;
    }

    addEntryMutation.mutate({
      amount,
      type,
      description,
      currency,
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="working-capital">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Working Capital</h2>
              <p className="text-sm text-muted-foreground">Manage your business funding and cash flow</p>
            </div>
            <Dialog open={showAddEntryModal} onOpenChange={setShowAddEntryModal}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-entry">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Capital Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value: "CapitalIn" | "CapitalOut") => setType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CapitalIn">Capital In (Deposit)</SelectItem>
                        <SelectItem value="CapitalOut">Capital Out (Withdrawal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex">
                      <Select value={currency} onValueChange={(value: "USD" | "ETB") => setCurrency(value)}>
                        <SelectTrigger className="w-20 rounded-r-none border-r-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ETB">ETB</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="rounded-l-none"
                        placeholder="0.00"
                        data-testid="input-amount"
                      />
                    </div>
                    {currency === "ETB" && amount && (
                      <div className="mt-2">
                        {settings?.exchangeRate ? (
                          <p className="text-sm text-muted-foreground" data-testid="usd-preview">
                            ≈ ${getUsdPreview()?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            <span className="ml-1">(Rate: {settings.exchangeRate})</span>
                          </p>
                        ) : (
                          <p className="text-sm text-destructive" data-testid="exchange-rate-missing">
                            ⚠️ Exchange rate not set. Please update in Settings.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description of transaction"
                      data-testid="input-description"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddEntryModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddEntry} 
                      disabled={addEntryMutation.isPending}
                      data-testid="button-save-entry"
                    >
                      {addEntryMutation.isPending ? "Adding..." : "Add Entry"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          {/* Balance Card */}
          <Card className="mb-8">
            <CardHeader>
              <h3 className="text-lg font-semibold">Current Balance</h3>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary" data-testid="current-balance">
                {balanceLoading ? (
                  "Loading..."
                ) : (
                  `$${(balance?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                USD balance (all currencies normalized)
              </p>
            </CardContent>
          </Card>

          {/* Entries Table */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Capital Entries</h3>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-full mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Currency
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {entries?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No capital entries found
                          </td>
                        </tr>
                      ) : (
                        entries?.map((entry: any) => (
                          <tr key={entry.id} className="hover:bg-muted/50" data-testid={`entry-${entry.id}`}>
                            <td className="px-4 py-4 text-sm">
                              {new Date(entry.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <Badge 
                                variant={entry.type === 'CapitalIn' ? 'default' : 'secondary'}
                              >
                                {entry.type === 'CapitalIn' ? 'Capital In' : 'Capital Out'}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {entry.description}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium">
                              <span className={entry.type === 'CapitalIn' ? 'text-green-600' : 'text-red-600'}>
                                {entry.type === 'CapitalIn' ? '+' : '-'}${parseFloat(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {entry.paymentCurrency}
                              {entry.exchangeRate && entry.paymentCurrency === 'ETB' && (
                                <span className="text-muted-foreground ml-2">
                                  (Rate: {parseFloat(entry.exchangeRate).toFixed(2)})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
