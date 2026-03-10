'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Award, Radar } from 'lucide-react'

// Premium Tooltip styling
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-4 border border-gray-100 flex flex-col gap-2 z-50">
                <p className="font-bold text-gray-800 text-sm mb-1 pb-2 border-b border-gray-100">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 justify-between text-[13px]">
                        <span className="flex items-center gap-2 text-gray-600 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                        </span>
                        <span className="font-bold text-gray-900">
                            {typeof entry.value === 'number' && entry.name.includes('Skor')
                                ? `${(entry.value * 100).toFixed(1)}%`
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

const PIE_COLORS = {
    green: '#10b981', // emerald-500
    yellow: '#f59e0b', // amber-500
    red: '#ef4444'     // red-500
}

interface TrendData {
    period: string
    score: number
}

interface CompareData {
    name: string
    score: number
    level: string
}

interface DistributionData {
    name: string
    value: number
    color: string
}

interface Props {
    trendData: TrendData[]
    compareData: CompareData[]
    distributionData: DistributionData[]
}

export default function BODDashboardCharts({ trendData, compareData, distributionData }: Props) {
    // Safe fallbacks to prevent rendering errors
    const safeTrend = trendData.length > 0 ? trendData : [{ period: 'N/A', score: 0 }]
    const safeCompare = compareData.length > 0 ? compareData : [{ name: 'N/A', score: 0, level: 'L1' }]
    const safeDist = distributionData.length > 0 ? distributionData : [{ name: 'Data Kosong', value: 1, color: '#e5e7eb' }]

    return (
        <div className="space-y-6 w-full animate-fade-in pb-8">
            {/* 1. Trend Kinerja Makro (Line Chart - Full Width) */}
            <Card className="shadow-sm border-gray-200/60 overflow-hidden bg-white hover:border-blue-200 transition-colors">
                <CardHeader className="p-5 border-b border-gray-50 flex flex-row items-center gap-4 bg-gray-50/30">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 flex-shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-base font-bold text-gray-900">Trend Kinerja Perusahaan</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">Rata-rata skor pencapaian KPI seluruh Direktorat & Divisi dari bulan ke bulan.</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={safeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="period"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                                />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 15 }} />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    name="Skor Korporat"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                {/* 2. Komparasi Kinerja Dir/Divisi (Horizontal Bar Chart) */}
                <Card className="shadow-sm border-gray-200/60 overflow-hidden bg-white hover:border-violet-200 transition-colors">
                    <CardHeader className="p-5 border-b border-gray-50 flex flex-row items-center gap-3 bg-gray-50/30">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 flex-shrink-0">
                            <Award size={18} />
                        </div>
                        <div>
                            <CardTitle className="text-[15px] font-bold text-gray-900">Komparasi Kinerja</CardTitle>
                            <p className="text-xs text-gray-500 mt-0.5">Skor performa berdasarkan Direktorat/Divisi (Bulan Aktif).</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={safeCompare} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        type="number"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickFormatter={(val) => `${Math.floor(val * 100)}%`}
                                        domain={[0, 1]}
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={110}
                                        tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="score" name="Skor Divisi" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                                        {safeCompare.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.level === 'L1' ? '#6366f1' : '#a855f7'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Status Pencapaian Makro (Donut Chart) */}
                <Card className="shadow-sm border-gray-200/60 overflow-hidden bg-white hover:border-emerald-200 transition-colors">
                    <CardHeader className="p-5 border-b border-gray-50 flex flex-row items-center gap-3 bg-gray-50/30">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 flex-shrink-0">
                            <Radar size={18} />
                        </div>
                        <div>
                            <CardTitle className="text-[15px] font-bold text-gray-900">Status Kesehatan Makro</CardTitle>
                            <p className="text-xs text-gray-500 mt-0.5">Distribusi departemen dalam kategori Hijau, Kuning, Merah.</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Pie
                                        data={safeDist}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {safeDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: 13 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-[45%] text-center pointer-events-none">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total</p>
                                <p className="text-3xl font-black text-gray-800">{safeDist.reduce((a, b) => a + b.value, 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
