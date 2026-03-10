'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts'
import { Target, PieChart } from 'lucide-react'
import type { KpiWithActual } from '@/types'

// Premium Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-4 border border-gray-100 flex flex-col gap-2 z-50 max-w-[280px]">
                <p className="font-bold text-gray-800 text-[13px] leading-tight mb-1 pb-2 border-b border-gray-100">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 justify-between text-[13px]">
                        <span className="flex items-center gap-2 text-gray-600 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                        </span>
                        <span className="font-bold text-gray-900">
                            {typeof entry.value === 'number' ? `${entry.value.toFixed(1)}%` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

interface Props {
    kpis: KpiWithActual[]
}

export default function DeptDashboardCharts({ kpis }: Props) {
    // 1. Prepare data for Composed Chart (Normalized Target vs Actual Achievement)
    // Since raw Targets have different units (Rp, %, Count), we normalize target to 100%
    // and Actual to (Achievement Rate * 100)
    const achievementData = kpis.map(kpi => ({
        name: kpi.action_verb.length > 25 ? kpi.action_verb.substring(0, 25) + '...' : kpi.action_verb,
        fullName: kpi.action_verb,
        Target: 100, // Normalized baseline
        Aktual: kpi.ach_rate !== null ? (kpi.ach_rate * 100) : 0,
        isWarning: kpi.ach_rate !== null && kpi.ach_rate < 0.75,
    }))

    // 2. Prepare data for Radar Chart (Bobot vs Skor)
    const radarData = kpis.map(kpi => ({
        name: kpi.action_verb.length > 15 ? kpi.action_verb.substring(0, 15) + '...' : kpi.action_verb,
        Bobot: (kpi.bobot * 100),
        Skor: kpi.score !== null ? (kpi.score * 100) : 0,
    }))

    if (kpis.length === 0) return null

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 lg:p-6 pb-2 pt-2 lg:pt-4 bg-[#F8FAFC]">
            {/* Chart 1: Target vs Aktual Achievement (Bigger, spans 2 columns) */}
            <Card className="lg:col-span-2 shadow-sm border-gray-200/60 overflow-hidden bg-white hover:border-blue-200 transition-colors">
                <CardHeader className="p-4 border-b border-gray-50 flex flex-row items-center gap-3 bg-gray-50/30">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 flex-shrink-0">
                        <Target size={16} />
                    </div>
                    <div>
                        <CardTitle className="text-[14px] font-bold text-gray-900">Pencapaian per Indikator</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-0.5">Rasio Aktual vs Target (dinormalisasi ke 100%)</p>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pl-0">
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={achievementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    dy={10}
                                    interval={0}
                                    angle={-20}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 5 }} />
                                <Bar dataKey="Aktual" barSize={20} radius={[4, 4, 0, 0]}>
                                    {
                                        achievementData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isWarning ? '#ef4444' : '#3b82f6'} />
                                        ))
                                    }
                                </Bar>
                                <Line type="step" dataKey="Target" stroke="#10b981" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Chart 2: Distribusi Bobot vs Skor Akhir (Radar Chart) */}
            <Card className="shadow-sm border-gray-200/60 overflow-hidden bg-white hover:border-amber-200 transition-colors">
                <CardHeader className="p-4 border-b border-gray-50 flex flex-row items-center gap-3 bg-gray-50/30">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600 flex-shrink-0">
                        <PieChart size={16} />
                    </div>
                    <div>
                        <CardTitle className="text-[14px] font-bold text-gray-900">Distribusi Bobot KPI</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-0.5">Pemetaan prioritas indikator penopang (Radar)</p>
                    </div>
                </CardHeader>
                <CardContent className="p-2">
                    <div className="h-[215px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis
                                    dataKey="name"
                                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 500 }}
                                />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Radar name="Skor Akhir" dataKey="Skor" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                <Radar name="Bobot KPI" dataKey="Bobot" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
