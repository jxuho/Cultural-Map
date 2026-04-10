// JSend 표준 규격 인터페이스
export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  data: T;
  message?: string; // 주로 error 상태일 때 사용
}
