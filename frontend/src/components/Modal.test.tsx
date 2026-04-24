import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Modal from './Modal';
import useUiStore from '../store/uiStore';

vi.mock('../store/uiStore');

describe('Modal component testing', () => {
  // 각 테스트가 시작되기 전에 실행될 가짜 함수들
  const closeModalSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks(); // 이전 테스트의 기록을 지웁니다.
  });

  it('isModalOpen이 true일 때 모달 콘텐츠가 화면에 나타난다', () => {
    // 스토어의 상태를 '열림' 상태로 강제 설정
    (useUiStore as any).mockReturnValue({
      isModalOpen: true,
      modalContent: <div>안녕하세요 모달입니다</div>,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // 화면에 텍스트가 있는지 확인
    expect(screen.getByText('안녕하세요 모달입니다')).toBeInTheDocument();
  });

  it('isModalOpen이 false이면 아무것도 나타나지 않는다', () => {
    // 스토어의 상태를 '닫힘' 상태로 강제 설정
    (useUiStore as any).mockReturnValue({
      isModalOpen: false,
      modalContent: null,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // 화면에 아무것도 없어야 함
    expect(screen.queryByText('안녕하세요 모달입니다')).not.toBeInTheDocument();
  });

  it('닫기 버튼(×)을 클릭하면 closeModal 함수가 호출된다', async () => {
    const user = userEvent.setup();
    (useUiStore as any).mockReturnValue({
      isModalOpen: true,
      modalContent: <div>내용</div>,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // 닫기 버튼(×) 클릭
    const closeButton = screen.getByRole('button', { name: /×/i });
    await user.click(closeButton);

    // 스토어의 closeModal 함수가 실행되었는지 확인
    expect(closeModalSpy).toHaveBeenCalledTimes(1);
  });

  it('Escape 키를 누르면 closeModal 함수가 호출된다', () => {
    (useUiStore as any).mockReturnValue({
      isModalOpen: true,
      modalContent: <div>내용</div>,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // 키보드 이벤트 발생 시뮬레이션
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeModalSpy).toHaveBeenCalled();
  });
});