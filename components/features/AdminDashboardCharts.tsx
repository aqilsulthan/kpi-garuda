'use client'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    AreaChart, Area
} from 'recharts'
import { Activity, Database } from 'lucide-react'

// Custom tooltip styling for a premium look
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-4 border border-gray-100 flex flex-col gap-2">
                <p className="font-bold text-gray-800 text-sm mb-1 pb-2 border-b border-gray-100">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 justify-between text-[13px]">
                        <span className="flex items-center gap-2 text-gray-600 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                        </span>
                        <span className="font-bold text-gray-900">{entry.value}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

interface UploadChartData {
    period: string
    total: number
    uploaded: number
    pending: number
}

interface AIUsageChartData {
    period: string
    requests: number
    generated: number
}

interface Props {
    uploadData: UploadChartData[]
    aiUsageData: AIUsageChartData[]
}

export default function AdminDashboardCharts({ uploadData, aiUsageData }: Props) {
    const finalUploadData = uploadData.length > 0 ? uploadData : [
        { period: 'Belum Ada', total: 0, uploaded: 0, pending: 0 }
    ]

    const finalAiData = aiUsageData.length > 0 ? aiUsageData : [
        { period: 'Belum Ada', requests: 0, generated: 0 }
    ]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-transparent w-full">
            {/* 1. Kepatuhan Upload Chart */}
            <Card className="shadow-sm border-gray-200/60 overflow-hidden bg-white hover:border-blue-200 transition-colors">
                <CardHeader className="p-5 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                            <Database size={18} />
                        </div>
                        <div>
                            <CardTitle className="text-[15px] font-bold text-gray-900">Kepatuhan Upload Data</CardTitle>
                            <p className="text-xs text-gray-500 mt-0.5">Departemen yang melaporkan KPI per Bulan</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={finalUploadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 15 }} />
                                <Bar dataKey="uploaded" name="Selesai Upload" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={28} />
                                <Bar dataKey="pending" name="Belum Upload" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Pemakaian AI Dify Chart */}
            <Card className="shadow-sm border-gray-200/60 overflow-hidden bg-white hover:border-emerald-200 transition-colors">
                <CardHeader className="p-5 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
                            <Activity size={18} />
                        </div>
                        <div>
                            <CardTitle className="text-[15px] font-bold text-gray-900">Pemakaian Dify AI</CardTitle>
                            <p className="text-xs text-gray-500 mt-0.5">Tren Generate Workflow & Chat (Token Usage Proxy)</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={finalAiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorGenerated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
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
                                />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 15 }} />
                                <Area type="monotone" dataKey="requests" name="Total Interaksi AI" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                                <Area type="monotone" dataKey="generated" name="Draft AI Tersimpan" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorGenerated)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
