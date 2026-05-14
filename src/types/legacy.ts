export interface FinancialData {
  month: string;
  revenue: number;
  expenses: number;
  cashflow: number;
  cumulativeCash: number;
}

export interface KPIMetrics {
  cac: number;
  ltv: number;
  burnRate: number;
  runway: number;
  riskScore?: number;
  protectionScore?: number;
}

export interface CanvasBox {
  title: string;
  content: string[];
}

export interface LeanCanvas {
  problem: CanvasBox;
  solution: CanvasBox;
  uniqueValueProp: CanvasBox;
  unfairAdvantage: CanvasBox;
  customerSegments: CanvasBox;
  keyMetrics: CanvasBox;
  channels: CanvasBox;
  costStructure: CanvasBox;
  revenueStreams: CanvasBox;
}

export interface KanbanTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface DashboardData {
  financials: FinancialData[];
  kpi: KPIMetrics;
  segments: string[];
  competitors: string[];
  gritLevel: number;
  canvas?: LeanCanvas;
  tasks?: KanbanTask[];
}
