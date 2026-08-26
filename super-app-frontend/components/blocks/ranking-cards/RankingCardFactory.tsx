'use client'

import React from 'react'
import Rank1_ThienDiaCard, { RankCardProps } from './Rank1_ThienDiaCard'
import Rank2_VoThuongCard from './Rank2_VoThuongCard'
import Rank3_DeCanhCard from './Rank3_DeCanhCard'
import Rank4_ThanhCanhCard from './Rank4_ThanhCanhCard'
import Rank5_HoangCanhCard from './Rank5_HoangCanhCard'
import Rank6_LinhVuongCard from './Rank6_LinhVuongCard'
import Rank7_QuyNguyenCard from './Rank7_QuyNguyenCard'
import Rank8_DungHonCard from './Rank8_DungHonCard'
import Rank9_HoaHuCard from './Rank9_HoaHuCard'
import Rank10_ThanChieuCard from './Rank10_ThanChieuCard'
import RankStandard_MaHoangCard from './RankStandard_MaHoangCard'

/**
 * 🏰 RANKING CARD FACTORY (DEMONIC EMPEROR SYSTEM - ĐẠI QUẢN GIA LÀ MA HOÀNG)
 * Dispatcher Router tự động chuyển tiếp tới từng Đối Tượng Component Card từ Top 1 - Top 10 & Standard.
 */
export function RankingCard({ rank = 1, auValue, score, className = '' }: RankCardProps) {
  const num = typeof rank === 'number' ? rank : parseInt(String(rank).replace(/[^0-9]/g, ''), 10) || 1

  // Không hiển thị tên/mã nhân viên trên thẻ xếp hạng để tránh lặp với widget Phân tích AI
  if (num === 1) return <Rank1_ThienDiaCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 2) return <Rank2_VoThuongCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 3) return <Rank3_DeCanhCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 4) return <Rank4_ThanhCanhCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 5) return <Rank5_HoangCanhCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 6) return <Rank6_LinhVuongCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 7) return <Rank7_QuyNguyenCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 8) return <Rank8_DungHonCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 9) return <Rank9_HoaHuCard rank={rank} auValue={auValue} score={score} className={className} />
  if (num === 10) return <Rank10_ThanChieuCard rank={rank} auValue={auValue} score={score} className={className} />

  return <RankStandard_MaHoangCard rank={rank} auValue={auValue} score={score} className={className} />
}

export default RankingCard
