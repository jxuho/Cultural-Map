export interface Review {
  _id: string;
  culturalSite: any; // 혹은 populate 시 Place 객체
  user: {
    _id: string;
    username: string;
    profileImage?: string;
  } | string;
  rating: number;      // min: 1, max: 5
  comment?: string;    // 백엔드 필드명: comment (maxlength: 500)
  createdAt: string;
  active: boolean;     // 소프트 삭제용 필드
}

// 리뷰 생성/수정 시 사용할 데이터 타입
export interface ReviewInput {
  rating: number;
  comment: string;     // 필드명을 review에서 comment로 통일
}