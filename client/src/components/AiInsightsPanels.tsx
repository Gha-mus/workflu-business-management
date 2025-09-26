import { useQuery } from "@tanstack/react-query";
import { apiRequestJson } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Package,
  Users,
  BarChart3,
  Clock,
  Target,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";

// Interface definitions for AI responses
interface ExecutiveSummaryResponse {
  summary: string;
  keyMetrics?: Array<{
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  priorities?: string[];
}

interface AnomalyDetectionResponse {
  anomalies: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
    recommendation: string;
  }>;
}

interface MarketTimingResponse {
  recommendation: 'buy_now' | 'wait' | 'sell_first';
  confidence: number;
  reasoning: string;
  priceTargets?: {
    buy: number;
    sell: number;
  };
}

interface FinancialInsightsResponse {
  optimizations: Array<{
    category: string;
    potential: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  cashFlowForecast: Array<{
    month: string;
    projected: number;
    confidence: number;
  }>;
  riskAlerts: Array<{
    risk: string;
    level: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
}

interface InventoryInsightsResponse {
  insights: string;
  trends: Array<{
    product: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    forecast: string;
  }>;
  predictions: Array<{
    product: string;
    expectedMovement: string;
    timeframe: string;
    confidence: number;
  }>;
}

interface OperationalInsightsResponse {
  insights: string;
  actions: Array<{
    category: string;
    action: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  qualityAlerts?: Array<{
    area: string;
    issue: string;
    recommendation: string;
  }>;
}

// Dashboard AI Insights Component
export function DashboardAiInsights() {
  const { data: executiveSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<ExecutiveSummaryResponse>({
    queryKey: ['/api/ai/executive-summary'],
    queryFn: () => apiRequestJson<ExecutiveSummaryResponse>('/api/ai/executive-summary'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: anomalies, isLoading: anomaliesLoading, refetch: refetchAnomalies } = useQuery<AnomalyDetectionResponse>({
    queryKey: ['/api/ai/anomaly-detection'],
    queryFn: () => apiRequestJson<AnomalyDetectionResponse>('/api/ai/anomaly-detection'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: marketTiming, isLoading: marketLoading, refetch: refetchMarket } = useQuery<MarketTimingResponse>({
    queryKey: ['/api/ai/market-timing'],
    queryFn: () => apiRequestJson<MarketTimingResponse>('/api/ai/market-timing'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const refreshAllInsights = () => {
    refetchSummary();
    refetchAnomalies();
    refetchMarket();
  };

  if (summaryLoading || anomaliesLoading || marketLoading) {
    return (
      <Card data-testid="ai-insights-loading">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Insights</h3>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-ai-insights">
      {/* Executive Summary */}
      {executiveSummary && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Executive Summary</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAllInsights}
                data-testid="refresh-insights"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">{executiveSummary.summary}</p>
            
            {/* Key Metrics */}
            {executiveSummary.keyMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {executiveSummary.keyMetrics.slice(0, 4).map((metric: any, index: number) => (
                  <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      <span className="text-xs font-medium">{metric.metric}</span>
                    </div>
                    <div className="text-sm font-bold">{metric.value}</div>
                    <Badge 
                      variant={metric.significance === 'high' ? 'destructive' : metric.significance === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {metric.significance}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Priorities */}
            {executiveSummary.priorities && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Top Priorities</h4>
                <div className="space-y-1">
                  {executiveSummary.priorities.slice(0, 3).map((priority: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Target className="h-3 w-3 text-primary" />
                      <span>{priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Market Timing & Anomalies */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Market Timing */}
        {marketTiming && (
          <Card className={`border-l-4 ${
            marketTiming.recommendation === 'buy_now' ? 'border-l-green-500' :
            marketTiming.recommendation === 'wait' ? 'border-l-yellow-500' :
            marketTiming.recommendation === 'sell_first' ? 'border-l-red-500' :
            'border-l-blue-500'
          }`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Market Timing</h3>
                <Badge variant="outline" className="text-xs">
                  {Math.round(marketTiming.confidence * 100)}% confident
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${
                    marketTiming.recommendation === 'buy_now' ? 'text-green-500' :
                    marketTiming.recommendation === 'wait' ? 'text-yellow-500' :
                    marketTiming.recommendation === 'sell_first' ? 'text-red-500' :
                    'text-blue-500'
                  }`} />
                  <span className="font-medium text-sm">
                    {marketTiming.recommendation.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{marketTiming.reasoning}</p>
                {marketTiming.priceTargets && (
                  <div className="text-xs space-y-1 mt-2">
                    <div>Buy below: <span className="font-medium">${marketTiming.priceTargets.buyBelow}</span></div>
                    <div>Sell above: <span className="font-medium">${marketTiming.priceTargets.sellAbove}</span></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anomalies */}
        {anomalies && anomalies.anomalies && (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h3 className="font-semibold text-sm">Anomaly Detection</h3>
                <Badge variant="secondary" className="text-xs">
                  {anomalies.anomalies.length} detected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {anomalies.anomalies.slice(0, 3).map((anomaly: any, index: number) => (
                  <Alert key={index} variant={anomaly.severity === 'critical' ? 'destructive' : 'default'}>
                    <AlertDescription className="text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'default'} className="text-xs">
                          {anomaly.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p>{anomaly.description}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Working Capital AI Insights
export function WorkingCapitalAiInsights() {
  const { data: capitalOptimization, isLoading, refetch } = useQuery<FinancialInsightsResponse>({
    queryKey: ['/api/ai/capital-optimization'],
    queryFn: () => apiRequestJson<FinancialInsightsResponse>('POST', '/api/ai/capital-optimization', { timeHorizon: 'monthly' }),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card data-testid="capital-insights-loading">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Capital Optimization</h3>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!capitalOptimization) return null;

  return (
    <Card className="border-l-4 border-l-primary" data-testid="capital-ai-insights">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Capital Optimization</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="optimizations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
          </TabsList>

          <TabsContent value="optimizations" className="mt-4">
            {capitalOptimization.optimizations && (
              <div className="space-y-3">
                {capitalOptimization.optimizations.slice(0, 4).map((opt: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={opt.priority === 'high' ? 'destructive' : opt.priority === 'medium' ? 'default' : 'secondary'}>
                        {opt.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {opt.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{opt.timeframe}</span>
                    </div>
                    <p className="text-sm mb-1">{opt.suggestion}</p>
                    <p className="text-xs text-muted-foreground">{opt.impact}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="forecast" className="mt-4">
            {capitalOptimization.cashFlowForecast && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Cash Flow Forecast</h4>
                <p className="text-sm">{capitalOptimization.cashFlowForecast}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="risks" className="mt-4">
            {capitalOptimization.riskAlerts && (
              <div className="space-y-2">
                {capitalOptimization.riskAlerts.map((alert: string, index: number) => (
                  <Alert key={index} variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {alert}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Reports AI Insights
export function ReportsAiInsights() {
  const { data: financialTrends, isLoading, refetch } = useQuery<InventoryInsightsResponse>({
    queryKey: ['/api/ai/financial-trends'],
    queryFn: () => apiRequestJson<InventoryInsightsResponse>('/api/ai/financial-trends'),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  if (isLoading) {
    return (
      <Card data-testid="reports-insights-loading">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Financial Analysis</h3>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financialTrends) return null;

  return (
    <Card className="border-l-4 border-l-primary" data-testid="reports-ai-insights">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Financial Analysis</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Key Insights */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm">{financialTrends.insights}</p>
          </div>

          {/* Trends */}
          {financialTrends.trends && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Trend Analysis</h4>
              {financialTrends.trends.slice(0, 3).map((trend: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-muted/30 rounded">
                  {trend.trend === 'increasing' && <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />}
                  {trend.trend === 'decreasing' && <TrendingDown className="h-4 w-4 text-red-500 mt-0.5" />}
                  {trend.trend === 'stable' && <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />}
                  {trend.trend === 'volatile' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{trend.metric}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(trend.confidence * 100)}% confident
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{trend.prediction}</p>
                    <p className="text-xs text-primary">{trend.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Predictions */}
          {financialTrends.predictions && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Next Quarter Outlook</h4>
              
              {financialTrends.predictions.risks && financialTrends.predictions.risks.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-red-600">Risks:</span>
                  {financialTrends.predictions.risks.slice(0, 2).map((risk: string, index: number) => (
                    <div key={index} className="text-xs text-red-600 ml-2">• {risk}</div>
                  ))}
                </div>
              )}

              {financialTrends.predictions.opportunities && financialTrends.predictions.opportunities.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-green-600">Opportunities:</span>
                  {financialTrends.predictions.opportunities.slice(0, 2).map((opp: string, index: number) => (
                    <div key={index} className="text-xs text-green-600 ml-2">• {opp}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Warehouse AI Insights  
export function WarehouseAiInsights() {
  const { data: inventoryRecs, isLoading, refetch } = useQuery<OperationalInsightsResponse>({
    queryKey: ['/api/ai/inventory-recommendations'],
    queryFn: () => apiRequestJson<OperationalInsightsResponse>('/api/ai/inventory-recommendations'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <Card data-testid="warehouse-insights-loading">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Inventory Insights</h3>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!inventoryRecs) return null;

  return (
    <Card className="border-l-4 border-l-primary" data-testid="warehouse-ai-insights">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Inventory Recommendations</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Key Insights */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm">{inventoryRecs.insights}</p>
          </div>

          {/* Recommended Actions */}
          {inventoryRecs.actions && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommended Actions</h4>
              {inventoryRecs.actions.slice(0, 4).map((action: any, index: number) => (
                <div key={index} className="p-3 bg-muted/30 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={action.urgency === 'high' ? 'destructive' : action.urgency === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {action.urgency} priority
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {action.action}
                    </Badge>
                  </div>
                  <p className="text-sm mb-1">{action.reasoning}</p>
                  <p className="text-xs text-muted-foreground">Expected benefit: {action.expectedBenefit}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quality Alerts */}
          {inventoryRecs.qualityAlerts && inventoryRecs.qualityAlerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Quality Alerts
              </h4>
              {inventoryRecs.qualityAlerts.map((alert: string, index: number) => (
                <Alert key={index} variant="default">
                  <AlertDescription className="text-sm">
                    {alert}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}