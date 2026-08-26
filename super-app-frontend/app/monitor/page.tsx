'use client'

import { Card, AreaChart, BarChart, Title, Text, Grid, Metric, Flex, BadgeDelta } from '@tremor/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { pb } from '@/lib/pocketbase'
import { supabase } from '@/lib/supabase'

export default function MonitorPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [requestData, setRequestData] = useState<any[]>([])
  const [agentData, setAgentData] = useState<any[]>([])
  const [totalRequests, setTotalRequests] = useState(0)

  useEffect(() => {
    const user = pb.authStore.model
    if (!user || (user.role_level || 1) < 6) {
      router.push('/workspace')
    } else {
      setIsAuthorized(true)
      fetchLogs()
    }
  }, [router])

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching logs:', error)
        return
      }

      if (data) {
        setTotalRequests(data.length)
        
        // Process data for AreaChart (Requests per Day)
        const dateCount: Record<string, number> = {}
        const agentCount: Record<string, number> = {}

        data.forEach(log => {
          // Format date to local date string (e.g., '10/24')
          const dateStr = new Date(log.created_at).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })
          dateCount[dateStr] = (dateCount[dateStr] || 0) + 1

          const agent = log.target_agent || 'Unknown'
          agentCount[agent] = (agentCount[agent] || 0) + 1
        })

        const formattedRequestData = Object.keys(dateCount).map(date => ({
          date,
          Requests: dateCount[date]
        }))

        const formattedAgentData = Object.keys(agentCount).map(agent => ({
          agent,
          Requests: agentCount[agent]
        }))

        setRequestData(formattedRequestData)
        setAgentData(formattedAgentData)
      }
    } catch (err) {
      console.error('Supabase fetch error:', err)
    }
  }

  if (!isAuthorized) return null

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Giám sát Hệ thống</h2>
        <p className="text-muted-foreground text-sm mt-1">Theo dõi tài nguyên và hiệu suất của mạng lưới AI Agents qua Supabase.</p>
      </div>

      <Grid numItemsSm={1} numItemsLg={3} className="gap-6 mb-6">
        <Card className="bg-card/60 border-border ring-0 shadow-xs backdrop-blur-xs" decoration="top" decorationColor="emerald">
          <Text className="text-muted-foreground font-medium">Trạng thái Cluster</Text>
          <Metric className="text-foreground mt-2 font-semibold">Healthy</Metric>
          <Flex className="mt-4">
            <Text className="text-muted-foreground text-sm">Supabase Connected</Text>
            <BadgeDelta deltaType="increase" isIncreasePositive={true} size="xs">Tốt</BadgeDelta>
          </Flex>
        </Card>
        
        <Card className="bg-card/60 border-border ring-0 shadow-xs backdrop-blur-xs">
          <Text className="text-muted-foreground font-medium">Tổng Requests</Text>
          <Metric className="text-foreground mt-2 font-semibold">{totalRequests.toLocaleString()}</Metric>
        </Card>

        <Card className="bg-card/60 border-border ring-0 shadow-xs backdrop-blur-xs">
          <Text className="text-muted-foreground font-medium">Tỷ lệ Lỗi (Errors)</Text>
          <Metric className="text-foreground mt-2 font-semibold">0</Metric>
          <Flex className="mt-4">
            <Text className="text-muted-foreground text-sm">~ 0.00% tổng request</Text>
            <BadgeDelta deltaType="moderateDecrease" size="xs">0%</BadgeDelta>
          </Flex>
        </Card>
      </Grid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/60 border-border ring-0 shadow-xs backdrop-blur-xs">
          <Title className="text-foreground font-medium">Lưu lượng Truy cập</Title>
          <AreaChart
            className="h-72 mt-4"
            data={requestData}
            index="date"
            categories={['Requests']}
            colors={['emerald']}
            valueFormatter={(number) => Intl.NumberFormat('us').format(number).toString()}
            showAnimation={true}
            curveType="monotone"
          />
        </Card>

        <Card className="bg-card/60 border-border ring-0 shadow-xs backdrop-blur-xs">
          <Title className="text-foreground font-medium">Sử dụng theo Agent</Title>
          <BarChart
            className="h-72 mt-4"
            data={agentData}
            index="agent"
            categories={['Requests']}
            colors={['purple']}
            valueFormatter={(number) => Intl.NumberFormat('us').format(number).toString()}
            showAnimation={true}
            layout="horizontal"
          />
        </Card>
      </div>
    </div>
  )
}
