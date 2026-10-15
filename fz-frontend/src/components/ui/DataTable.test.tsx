import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from './DataTable';

describe('DataTable Component', () => {
  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Nombre' },
    { key: 'role', header: 'Rol' },
  ];

  const data = [
    { id: 1, name: 'Carlos Tevez', role: 'Socio' },
    { id: 2, name: 'Lucia Galan', role: 'Recepcionista' },
  ];

  it('renders table headers and rows correctly', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Rol')).toBeInTheDocument();

    expect(screen.getByText('Carlos Tevez')).toBeInTheDocument();
    expect(screen.getByText('Lucia Galan')).toBeInTheDocument();
  });

  it('renders empty state when data array is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyTitle="Sin socios"
        emptyMessage="No hay usuarios dados de alta"
      />
    );

    expect(screen.getByText('Sin socios')).toBeInTheDocument();
    expect(screen.getByText('No hay usuarios dados de alta')).toBeInTheDocument();
  });

  it('triggers onRowClick when a row is clicked', () => {
    const handleRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={handleRowClick} />);

    fireEvent.click(screen.getByText('Carlos Tevez'));
    expect(handleRowClick).toHaveBeenCalledWith(data[0], 0);
  });
});
