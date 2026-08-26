export interface EnterpriseMetricDoc {
  canonical_key: string
  display_name: string
  short_code: string
  category: 'MACRO_OVERVIEW' | 'CHURN_SUB_METRIC' | 'CORE_METRIC'
  description: string
  formula?: string
  aliases: string[]
}


/**
 * BỘ TỪ ĐIỂN CHUẨN HÓA THÔNG SỐ VẬN HÀNH DOANH NGHIỆP (STANDARDIZED OPERATIONAL METRICS DICTIONARY)
 * Tên biến chuẩn trong Database KHÔNG CHỨA TIỀN TỐ "RM_"
 */
export const ENTERPRISE_METRICS_DICTIONARY: Record<string, EnterpriseMetricDoc> = {
  AU: {
    canonical_key: 'AU',
    display_name: 'AU (Active User)',
    short_code: 'AU',
    category: 'CHURN_SUB_METRIC',
    description: 'Rời mạng thuộc nhóm Active User (AU) / Tổng quy mô KH nhân viên đang quản lý.',
    aliases: [
      'AU', 'au', 'Au', 'RM_AU', 'rm_au', 'rm-au', 'rm au', 'RM AU',
      'Active User', 'active user', 'active_user', 'active-user',
      'Rời mạng AU', 'Roi mang AU', 'roi_mang_au', 'roi-mang-au', 'roi mang au'
    ]
  },
  YCH_Thang: {
    canonical_key: 'YCH_Thang',
    display_name: 'YCH Tháng',
    short_code: 'YCH_Thang',
    category: 'CHURN_SUB_METRIC',
    description: 'Số ca có Yêu Cầu Hủy (YCH) phát sinh trong tháng.',
    aliases: [
      'YCH_Thang', 'ych_thang', 'ych-thang', 'ych thang', 'YCH_THANG',
      'YCH Tháng', 'YCH Thang', 'RM_YCH_Thang', 'rm_ych_thang', 'rm-ych-thang',
      'Yêu cầu hủy tháng', 'Yeu cau huy thang', 'yeu_cau_huy_thang', 'yeu-cau-huy-thang'
    ]
  },
  Yeu_Cau_Huy: {
    canonical_key: 'Yeu_Cau_Huy',
    display_name: 'Yêu cầu huỷ',
    short_code: 'Yeu_Cau_Huy',
    category: 'CHURN_SUB_METRIC',
    description: 'Số ca ghi nhận Yêu Cầu Hủy hợp đồng dịch vụ.',
    aliases: [
      'Yeu_Cau_Huy', 'yeu_cau_huy', 'yeu-cau-huy', 'yeu cau huy',
      'Yêu cầu huỷ', 'Yêu cầu hủy', 'Yeu cau huy', 'RM_Yeu_Cau_Huy', 'rm_yeu_cau_huy',
      'YCH', 'ych', 'RM_YCH', 'rm_ych'
    ]
  },
  CTBDV_DK: {
    canonical_key: 'CTBDV_DK',
    display_name: 'Chủ thuê bao đi vắng',
    short_code: 'CTBDV_DK',
    category: 'CHURN_SUB_METRIC',
    description: 'Số ca rời mạng do lý do Chủ Thuê Bao Đi Vắng (CTBDV ĐK).',
    aliases: [
      'CTBDV_DK', 'ctbdv_dk', 'ctbdv-dk', 'ctbdv dk', 'CTBDV ĐK', 'CTBDV DK',
      'Chủ thuê bao đi vắng', 'Chu thue bao di vang', 'chu_thue_bao_di_vang', 'chu-thue-bao-di-vang', 'chu thue bao di vang',
      'CTBDV', 'ctbdv', 'RM_CTBDV_DK', 'rm_ctbdv_dk'
    ]
  },
  KPDV: {
    canonical_key: 'KPDV',
    display_name: 'Khôi phục dịch vụ',
    short_code: 'KPDV',
    category: 'CHURN_SUB_METRIC',
    description: 'Số ca rời mạng liên quan đến nhóm Khôi Phục Dịch Vụ (KPDV).',
    aliases: [
      'KPDV', 'kpdv', 'kpdv_dk', 'KPDV_DK', 'kpdv-dk', 'RM_KPDV', 'rm_kpdv',
      'Khôi phục dịch vụ', 'Khoi phuc dich vu', 'khoi_phuc_dich_vu', 'khoi-phuc-dich-vu', 'khoi phuc dich vu'
    ]
  },
  PTTB: {
    canonical_key: 'PTTB',
    display_name: 'Phát triển thuê bao',
    short_code: 'PTTB',
    category: 'CHURN_SUB_METRIC',
    description: 'Chỉ số Phát Triển Thuê Bao (PTTB) mới đối ứng bù đắp rời mạng.',
    aliases: [
      'PTTB', 'pttb', 'RM_PTTB', 'rm_pttb', 'rm-pttb', 'rm pttb',
      'Phát triển thuê bao', 'Phat trien thue bao', 'phat_trien_thue_bao', 'phat-trien-thue-bao', 'phat trien thue bao'
    ]
  },
  NET: {
    canonical_key: 'NET',
    display_name: 'NET (Phát triển ròng)',
    short_code: 'NET',
    category: 'MACRO_OVERVIEW',
    description: 'Chỉ số phát triển ròng khu vực.',
    formula: 'NET = - {Rời Mạng} + {PTTB}',
    aliases: [
      'NET', 'net', 'Net', 'Phát triển ròng', 'Phat trien rong', 'phat_trien_rong', 'phat-trien-rong'
    ]
  },
  Ty_Le_RM: {
    canonical_key: 'Ty_Le_RM',
    display_name: 'Tỷ lệ rời mạng',
    short_code: 'Ty_Le_RM',
    category: 'CORE_METRIC',
    description: 'Tỷ lệ phần trăm tổng số thuê bao ngưng dịch vụ rời mạng so với quy mô AU.',
    aliases: [
      'Ty_Le_RM', 'ty_le_rm', 'ty-le-rm', 'ty le rm', 'Ty Le RM',
      'Tỷ Lệ Rời Mạng', 'Tỷ lệ rời mạng', 'Ty le roi mang', 'ty_le_roi_mang', 'churn_rate'
    ]
  },
  Ty_Le_Huy_CLDV: {
    canonical_key: 'Ty_Le_Huy_CLDV',
    display_name: '% Hủy do CLDV',
    short_code: 'Ty_Le_Huy_CLDV',
    category: 'CORE_METRIC',
    description: 'Tỷ lệ phần trăm thuê bao hủy hợp đồng do nguyên nhân Chất Lượng Dịch Vụ.',
    aliases: [
      'Ty_Le_Huy_CLDV', 'ty_le_huy_cldv', 'ty-le-huy-cldv', 'ty le huy cldv',
      '% Hủy do CLDV', 'Hủy do CLDV', 'Huy do CLDV', 'huy_do_cldv', 'cldv'
    ]
  }
}

/**
 * Hàm hỗ trợ quy đổi bất kỳ tên biến thô / alias nào sang Metric Definition chuẩn
 */
export function resolveEnterpriseMetric(inputKey: string): EnterpriseMetricDoc | null {
  if (!inputKey) return null
  const cleanInput = inputKey.trim().toLowerCase()

  for (const metric of Object.values(ENTERPRISE_METRICS_DICTIONARY)) {
    if (metric.canonical_key.toLowerCase() === cleanInput) return metric
    if (metric.aliases.some(alias => alias.toLowerCase() === cleanInput)) return metric
  }

  return null
}

