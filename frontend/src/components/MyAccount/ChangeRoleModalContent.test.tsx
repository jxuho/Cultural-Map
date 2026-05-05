import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangeRoleModalContent } from './ChangeRoleModalContent';
import useUiStore from '../../store/uiStore';
import { useUpdateUserRole } from '../../hooks/data/useUserQueries';

// 1. Mocking dependencies
vi.mock('../../store/uiStore', () => ({
  default: vi.fn(),
}));

vi.mock('../../hooks/data/useUserQueries', () => ({
  useUpdateUserRole: vi.fn(),
}));

// mocking window.alert (called when roles are not reversed)
const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

describe('ChangeRoleModalContent', () => {
  const mockUser = { _id: '123', username: 'testuser', role: 'user' };
  const mockCloseModal = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Zustand store mockup setup
    (useUiStore as any).mockReturnValue({
      closeModal: mockCloseModal,
    });

    // React Query Mutation mocking setup
    (useUpdateUserRole as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  test("Displays the user's name and current role correctly on the screen", () => {
    render(<ChangeRoleModalContent user={mockUser} />);

    expect(screen.getByText(/Change Role for "testuser"/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('user');
  });

  test('Shows an alert and closes the modal if the role is not changed', async () => {
    render(<ChangeRoleModalContent user={mockUser} />);

    const submitButton = screen.getByRole('button', { name: /update role/i });
    fireEvent.click(submitButton);

    expect(alertMock).toHaveBeenCalledWith('role is not changed.');
    expect(mockCloseModal).toHaveBeenCalled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test('Shows a success message and closes the modal if the role is changed and submitted', async () => {
    mockMutateAsync.mockResolvedValueOnce({}); // success simulation

    render(<ChangeRoleModalContent user={mockUser} />);

    const select = screen.getByLabelText(/select new role:/i);
    const submitButton = screen.getByRole('button', { name: /update role/i });

    // Change role: user -> admin
    fireEvent.change(select, { target: { value: 'admin' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        userId: '123',
        newRole: 'admin',
      });
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  test('Shows loading state (isPending) with disabled buttons and changed text', () => {
    (useUpdateUserRole as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
    });

    render(<ChangeRoleModalContent user={mockUser} />);

    expect(screen.getByRole('button', { name: /updating.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  test('Shows error message on the screen when an error occurs', () => {
    const errorMessage = 'Server error occurred.';
    (useUpdateUserRole as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: true,
      error: { message: errorMessage },
    });

    render(<ChangeRoleModalContent user={mockUser} />);

    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
  });

  test('Cancel button click calls closeModal', () => {
    render(<ChangeRoleModalContent user={mockUser} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockCloseModal).toHaveBeenCalled();
  });
});
