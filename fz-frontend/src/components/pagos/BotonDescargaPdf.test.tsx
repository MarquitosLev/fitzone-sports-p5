import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BotonDescargaPdf } from './BotonDescargaPdf';

describe('BotonDescargaPdf Component', () => {
  it('renderiza con el texto por defecto y el icono de descarga', () => {
    render(<BotonDescargaPdf numeroFactura="FAC-0001-00000123" />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Descargar PDF')).toBeInTheDocument();
  });

  it('permite personalizar el texto del botón', () => {
    render(<BotonDescargaPdf texto="Descargar Comprobante" />);
    expect(screen.getByText('Descargar Comprobante')).toBeInTheDocument();
  });

  it('ejecuta el callback onDescargar al hacer clic', async () => {
    const handleDescargar = vi.fn().mockResolvedValue(undefined);
    render(<BotonDescargaPdf onDescargar={handleDescargar} />);

    const boton = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(boton);
    });

    expect(handleDescargar).toHaveBeenCalledTimes(1);
  });

  it('deshabilita el botón si la prop disabled es true', () => {
    const handleDescargar = vi.fn();
    render(<BotonDescargaPdf disabled={true} onDescargar={handleDescargar} />);

    const boton = screen.getByRole('button');
    expect(boton).toBeDisabled();

    fireEvent.click(boton);
    expect(handleDescargar).not.toHaveBeenCalled();
  });

  it('muestra estado de carga cuando loading es true', () => {
    render(<BotonDescargaPdf loading={true} />);

    expect(screen.getByText('Generando PDF...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
