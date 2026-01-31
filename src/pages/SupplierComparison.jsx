import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle, Trophy, TrendingUp, Truck, ShieldCheck } from 'lucide-react';

export default function SupplierComparison() {
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ['ledgers'],
    queryFn: () => base44.entities.Ledger.list()
  });

  // Filter for suppliers
  const suppliers = ledgers.filter(l => l.group_id === 'Sundry Creditors' || l.customer_type === 'VAT Customer' || l.customer_type === 'General'); // Adjust filter as needed based on actual data structure

  // Mock performance metrics generator (since we don't have real historical data for these yet)
  const getSupplierMetrics = (supplier) => {
    // Deterministic random based on ID
    const seed = supplier.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const rand = (min, max) => {
      const x = Math.sin(seed + min) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    return {
      ...supplier,
      pricing_score: rand(60, 95),
      delivery_reliability: rand(70, 99),
      quality_score: rand(65, 98),
      payment_flexibility: rand(50, 90),
      zatca_compliance: rand(80, 100),
      total_score: 0 // calculated later
    };
  };

  const enrichedSuppliers = suppliers.map(getSupplierMetrics);

  const handleSelect = (id) => {
    setSelectedSuppliers(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 5) return prev; // Max 5 for readability
      return [...prev, id];
    });
  };

  const comparisonData = selectedSuppliers.map(id => {
    const s = enrichedSuppliers.find(sup => sup.id === id);
    if (!s) return null;
    return s;
  }).filter(Boolean);

  // Calculate weighted score
  const weightedSuppliers = comparisonData.map(s => ({
    ...s,
    total_score: (
      (s.pricing_score * 0.3) +
      (s.delivery_reliability * 0.25) +
      (s.quality_score * 0.25) +
      (s.payment_flexibility * 0.1) +
      (s.zatca_compliance * 0.1)
    ).toFixed(1)
  })).sort((a, b) => b.total_score - a.total_score);

  const bestSupplier = weightedSuppliers[0];

  // Prepare chart data
  const chartData = [
    { subject: 'Pricing', fullMark: 100 },
    { subject: 'Delivery', fullMark: 100 },
    { subject: 'Quality', fullMark: 100 },
    { subject: 'Flexibility', fullMark: 100 },
    { subject: 'Compliance', fullMark: 100 },
  ];

  comparisonData.forEach(s => {
    chartData[0][s.name] = s.pricing_score;
    chartData[1][s.name] = s.delivery_reliability;
    chartData[2][s.name] = s.quality_score;
    chartData[3][s.name] = s.payment_flexibility;
    chartData[4][s.name] = s.zatca_compliance;
  });

  const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea'];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Supplier Comparison Engine" 
        subtitle="Analyze and compare supplier performance metrics"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Select Suppliers</CardTitle>
            <CardDescription>Choose up to 5 suppliers to compare</CardDescription>
          </CardHeader>
          <CardContent className="h-[500px] overflow-y-auto">
            <div className="space-y-3">
              {enrichedSuppliers.map(s => (
                <div key={s.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50">
                  <Checkbox 
                    id={s.id} 
                    checked={selectedSuppliers.includes(s.id)}
                    onCheckedChange={() => handleSelect(s.id)}
                    disabled={!selectedSuppliers.includes(s.id) && selectedSuppliers.length >= 5}
                  />
                  <div className="flex-1">
                    <label htmlFor={s.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      {s.name}
                    </label>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">ZATCA: {s.zatca_compliance}%</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {enrichedSuppliers.length === 0 && <p className="text-sm text-slate-500">No suppliers found.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Visualization Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSuppliers.length < 2 ? (
            <Card className="h-full flex items-center justify-center bg-slate-50 border-dashed">
              <div className="text-center text-slate-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Select at least 2 suppliers</h3>
                <p>Compare performance across key metrics</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      {comparisonData.map((s, index) => (
                        <Radar
                          key={s.id}
                          name={s.name}
                          dataKey={s.name}
                          stroke={colors[index % colors.length]}
                          fill={colors[index % colors.length]}
                          fillOpacity={0.3}
                        />
                      ))}
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Best Value Analysis */}
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <CardTitle className="text-white">Best Value Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weightedSuppliers.map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center h-8 w-8 rounded-full font-bold ${idx === 0 ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-xs text-slate-400">Weighted Score: {s.total_score}/100</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-2 text-xs">
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-0">Price {s.pricing_score}</Badge>
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-0">Rel {s.delivery_reliability}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
