import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../ui';

export interface BotonDescargaPdfProps {
  /** URL directa hacia el archivo PDF */
  urlPdf?: string;
  /** Identificador numérico del comprobante (para armar nombre o callback) */
  idComprobante?: number;
  /** Número oficial de factura (ej: 'FAC-0001-00000123') */
  numeroFactura?: string;
  /** Nombre sugerido para el archivo descargado */
  nombreArchivo?: string;
  /** Sobrescribe el estado de carga externo */
  loading?: boolean;
  /** Callback opcional ejecutado al presionar descargar */
  onDescargar?: () => Promise<void> | void;
  /** Variante visual del botón */
  variant?: 'primary' | 'coral' | 'secondary' | 'danger' | 'outline' | 'ghost';
  /** Tamaño del botón */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Texto del botón (por defecto: 'Descargar PDF') */
  texto?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Si está deshabilitado */
  disabled?: boolean;
}

/**
 * Genera un Blob descargable de PDF simulado para pruebas locales/mock
 * evitando errores 404 en el navegador cuando no hay backend activo.
 */
function generarBlobPdfMock(numeroFactura: string): Blob {
  const contenidoPdf = `%PDF-1.4
% FitZone Sports - Comprobante de Pago Oficial
% Factura N°: ${numeroFactura}
1 0 obj
<< /Title (Comprobante FitZone) /Author (FitZone Sports S.A.) >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
  return new Blob([contenidoPdf], { type: 'application/pdf' });
}

export function BotonDescargaPdf({
  urlPdf,
  numeroFactura = '0001-00000123',
  nombreArchivo,
  loading: externalLoading = false,
  onDescargar,
  variant = 'secondary',
  size = 'sm',
  texto = 'Descargar PDF',
  className = '',
  disabled = false,
}: BotonDescargaPdfProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleDescargar = async () => {
    if (isLoading || disabled) return;

    try {
      setInternalLoading(true);

      // Si el componente padre provee un callback personalizado, lo invocamos
      if (onDescargar) {
        await onDescargar();
        return;
      }

      // Nombre del archivo a guardar
      const fileName = nombreArchivo || `comprobante-${numeroFactura.replace(/\s+/g, '_')}.pdf`;

      // Si hay una URL de PDF directa y válida, disparamos la descarga
      if (urlPdf) {
        const link = document.createElement('a');
        link.href = urlPdf;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Fallback para modo mock / pruebas locales: creamos un Blob simulado
      const blob = generarBlobPdfMock(numeroFactura);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error al descargar comprobante PDF:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      onClick={() => void handleDescargar()}
      className={`inline-flex items-center gap-1.5 cursor-pointer font-bold select-none ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <Download className="w-4 h-4 text-current" />
      )}
      <span>{isLoading ? 'Generando PDF...' : texto}</span>
    </Button>
  );
}
