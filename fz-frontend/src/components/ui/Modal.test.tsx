import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} title="Modal Test">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, content and dialog role when isOpen is true', () => {
    render(
      <Modal isOpen={true} title="Título del Modal" subtitle="Subtítulo accesible">
        <p>Contenido del modal</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Título del Modal')).toBeInTheDocument();
    expect(screen.getByText('Subtítulo accesible')).toBeInTheDocument();
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} title="Modal Cerrar" onClose={handleClose}>
        <p>Cuerpo</p>
      </Modal>
    );

    const closeBtn = screen.getByLabelText(/cerrar modal/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} title="Modal ESC" onClose={handleClose} closeOnEsc={true}>
        <p>Cuerpo</p>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('traps tab focus cycling inside the modal dialog', () => {
    render(
      <Modal isOpen={true} title="Focus Trap Modal" onClose={() => {}}>
        <input data-testid="first-input" placeholder="Primero" />
        <button data-testid="second-button">Segundo</button>
      </Modal>
    );

    const closeBtn = screen.getByLabelText(/cerrar modal/i);
    const secondButton = screen.getByTestId('second-button');

    // Simulate tabbing backwards from first element -> cycles to last focusable element
    closeBtn.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(secondButton);

    // Simulate tabbing forwards from last element -> cycles to first element
    secondButton.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);
  });
});
