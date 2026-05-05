import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';
import useUiStore from '../store/uiStore';

vi.mock('../store/uiStore');

describe('Modal component testing', () => {
  // Fake functions that will be executed before each test starts
  const closeModalSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks(); //Clear history of previous tests.
  });

  test('Modal content appears on the screen when isModalOpen is true.', () => {
    // Force the store's status to 'open'
    (useUiStore as any).mockReturnValue({
      isModalOpen: true,
      modalContent: <div>Hello, this is Modal</div>,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // Check if there is text on the screen
    expect(screen.getByText('Hello, this is Modal')).toBeInTheDocument();
  });

  test('Modal content does not appear on the screen when isModalOpen is false.', () => {
    // Force the store's status to 'closed'
    (useUiStore as any).mockReturnValue({
      isModalOpen: false,
      modalContent: null,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // Screen should not have anything
    expect(screen.queryByText('Hello, this is Modal')).not.toBeInTheDocument();
  });

  test('Close button (x) click calls closeModal function', async () => {
    const user = userEvent.setup();
    (useUiStore as any).mockReturnValue({
      isModalOpen: true,
      modalContent: <div>Content</div>,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // Click the close button (×)
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Check whether the store's closeModal function has been executed
    expect(closeModalSpy).toHaveBeenCalledTimes(1);
  });

  test('Escape key press calls closeModal function', () => {
    (useUiStore as any).mockReturnValue({
      isModalOpen: true,
      modalContent: <div>Content</div>,
      closeModal: closeModalSpy,
    });

    render(<Modal />);

    // Keyboard event occurrence simulation
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeModalSpy).toHaveBeenCalled();
  });
});
