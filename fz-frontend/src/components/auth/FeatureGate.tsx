import React from 'react';
import { useTienePrestacion } from '../../hooks/usePrestaciones';
import type { Prestacion } from '../../types/rol';

export interface FeatureGateProps {
  prestacion: Prestacion;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ prestacion, children, fallback = null }: FeatureGateProps) {
  const tieneAcceso = useTienePrestacion(prestacion);
  return tieneAcceso ? <>{children}</> : <>{fallback}</>;
}
