'use client'

import React, { useState, useEffect, useCallback } from 'react'
import BaseDashboard, { BaseDashboardProps } from '@/components/blocks/base-dashboard'
import { supabase } from '@/lib/supabase'
import { cleanEmpId, toDbEmpId } from '@/lib/utils'
import { 
  getCachedAreaList, 
  setCachedAreaList, 
  getCachedAreaMetrics, 
  setCachedAreaMetrics 
} from '@/lib/metrics-cache'

export interface KhuVucMiniappProps extends Partial<BaseDashboardProps> {
  userLevel?: number
  currentUser?: any
  preloadedAreaList?: {id: string, name: string}[]
  preloadedAreaRecord?: any
}

/**
 * 🗺️ KHU VỰC MINIAPP COMPONENT (KẾ THỪA BASE DASHBOARD)
 * Hiển thị Dashboard cấp Khu Vực / Điều Hành kèm bộ lọc Khu Vực khi userLevel >= 3.
 * Tích hợp bộ đệm In-Memory & Session Storage Cache (0ms Instant Tab Switching & Egress Optimization).
 */
export default function KhuVucMiniapp({
  userLevel = 1,
  currentUser,
  preloadedAreaList,
  preloadedAreaRecord,
  ...props
}: KhuVucMiniappProps) {
  // Khởi tạo state tức thì từ Cache nếu có
  const cachedList = getCachedAreaList()
  const initialList = preloadedAreaList || cachedList || []
  const initialAreaId = initialList.length > 0 ? initialList[0].id : (currentUser?.dieu_hanh_id || 'TAIHD')
  const initialRecord = preloadedAreaRecord || getCachedAreaMetrics(initialAreaId)

  const [selectedAreaId, setSelectedAreaId] = useState<string>(initialAreaId)
  const [areaList, setAreaList] = useState<{id: string, name: string}[]>(initialList)
  const [activeAreaRecord, setActiveAreaRecord] = useState<any>(initialRecord)
  const [isLoading, setIsLoading] = useState(!initialRecord)

  // 1. Tải danh sách Khu Vực (Ưu tiên Cache -> Fallback Supabase)
  useEffect(() => {
    const fetchAreaList = async () => {
      try {
        if (userLevel >= 4) {
          // Kiểm tra cache trước
          const cached = getCachedAreaList()
          if (cached && cached.length > 0) {
            setAreaList(cached)
            if (!selectedAreaId) setSelectedAreaId(cached[0].id)
            return
          }

          // L4+ (Trưởng phòng, Giám đốc, Admin): Lấy toàn bộ khu vực từ Supabase
          const { data, error } = await supabase
            .from('khu_vuc_metrics')
            .select('dieu_hanh_id')
          
          if (!error && data && data.length > 0) {
            const list = data.map((item: any) => ({
              id: item.dieu_hanh_id,
              name: item.dieu_hanh_id
            }))
            setAreaList(list)
            setCachedAreaList(list)
            if (!selectedAreaId && list.length > 0) {
              setSelectedAreaId(list[0].id)
            }
          }
        } else {
          // L1, L2, L3: Tra cứu khu vực của nhân viên từ bảng khu_vuc_nvkt trên Supabase
          const rawEmpId = currentUser?.email
            ? currentUser.email.split('@')[0]
            : (currentUser?.username || 'HUYHC')
          const clean = cleanEmpId(rawEmpId) || 'HUYHC'
          const dbId = toDbEmpId(rawEmpId) || 'HUETI.HUYHC'

          let userAreaId = 'TAIHD'
          const { data: userAreaMapping } = await supabase
            .from('khu_vuc_nvkt')
            .select('dieu_hanh_id')
            .or(`nvkt_id.eq.${dbId},nvkt_id.eq.${clean},nvkt_id.ilike.%.${clean}`)
            .limit(1)

          if (userAreaMapping && userAreaMapping.length > 0 && userAreaMapping[0].dieu_hanh_id) {
            userAreaId = userAreaMapping[0].dieu_hanh_id
          }

          const singleList = [{ id: userAreaId, name: userAreaId }]
          setAreaList(singleList)
          setSelectedAreaId(userAreaId)
        }
      } catch (err) {
        console.error('[KhuVucMiniapp fetchAreaList Error]:', err)
      }
    }
    
    fetchAreaList()
  }, [userLevel, currentUser, selectedAreaId])

  // 2. Tải dữ liệu Khu Vực được chọn (Ưu tiên Cache -> 0ms Latency)
  const loadAreaData = useCallback(async (targetAreaId: string) => {
    if (!targetAreaId) return
    
    // Kiểm tra cache trước (0ms, 0 Egress)
    const cached = getCachedAreaMetrics(targetAreaId)
    if (cached) {
      setActiveAreaRecord(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('khu_vuc_metrics')
        .select('*')
        .eq('dieu_hanh_id', targetAreaId)
        .maybeSingle()
      
      if (!error && data) {
        setActiveAreaRecord(data)
        setCachedAreaMetrics(targetAreaId, data)
      } else {
        setActiveAreaRecord(null)
      }
    } catch (err) {
      console.error('[KhuVucMiniapp fetchAreaData Error]:', err)
      setActiveAreaRecord(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedAreaId) {
      loadAreaData(selectedAreaId)
    }
  }, [selectedAreaId, loadAreaData])

  const handleSelectArea = (id: string) => {
    setSelectedAreaId(id)
    loadAreaData(id)
  }

  return (
    <BaseDashboard
      viewType="khu_vuc"
      userLevel={userLevel}
      areaList={areaList}
      selectedAreaId={selectedAreaId}
      setSelectedAreaId={handleSelectArea}
      data={activeAreaRecord}
      {...props}
    />
  )
}
