import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { SettingsResponse } from "@shared/schema";
import { 
  Plus, 
  FileText, 
  Users, 
  BarChart3 
} from "lucide-react";
import { NewPurchaseModal } from "@/components/modals/NewPurchaseModal";

export function QuickActions() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const { data: settings } = useQuery<SettingsResponse>({
    queryKey: ['/api/settings'],
  });

  return (
    <div className="space-y-6" data-testid="quick-actions">
      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full justify-start"
            onClick={() => setShowPurchaseModal(true)}
            data-testid="button-new-purchase"
          >
            <Plus className="w-5 h-5 mr-3" />
            New Purchase
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="button-create-order"
          >
            <FileText className="w-5 h-5 mr-3 text-muted-foreground" />
            Create Order
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="button-add-supplier"
          >
            <Users className="w-5 h-5 mr-3 text-muted-foreground" />
            Add Supplier
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="button-view-reports"
          >
            <BarChart3 className="w-5 h-5 mr-3 text-muted-foreground" />
            View Reports
          </Button>
        </CardContent>
      </Card>

      {/* Exchange Rates Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Exchange Rates</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">USD/ETB</span>
              <Badge variant="outline" className="bg-green-100 text-green-600">
                Live
              </Badge>
            </div>
            <span className="text-sm font-bold" data-testid="exchange-rate">
              {settings?.exchangeRate?.toFixed(2) || '57.25'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Pending Approvals</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground text-center py-4">
            No pending approvals
          </div>
        </CardContent>
      </Card>

      {showPurchaseModal && (
        <NewPurchaseModal 
          open={showPurchaseModal} 
          onClose={() => setShowPurchaseModal(false)} 
        />
      )}
    </div>
  );
}
