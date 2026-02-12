export interface CalierUser {
  id: string;
  user: string;
  password?: string;
}

export interface Interaccion {
  id: number;
  client_codigo: string;
  vendedor_codigo: string | null;
  direccion: string | null;
  resumen: string | null;
  clasificación: string | null; // Note: Database has tilde
  estado: string | null;
  derivado: boolean | null;
  fecha_envio: string | null;
  fecha_respuesta: string | null;
}

export interface Seguimiento {
  id: number;
  fecha_enviado: string;
  hora_enviado: string | null;
  fecha_respuesta: string | null;
  hora_respuesta: string | null;
  cliente_id: string | null;
  vendedor_id: string | null;
  contactado: boolean | null;
}

export interface Cliente {
  id: string;
  nombre: string;
  codigo: string;
  numero: string;
  provincia: string;
  localidad: string;
  email: string;
  sector: string;
  cod_vendedor: string;
  domicilio: string;
  codigo_postal: number;
}

export interface Vendedor {
  id: string;
  codigo: string;
  nombre: string;
  email: string;
  telefono: string;
  laboratorio: string;
  activo: boolean;
  notas: string | null;
}

export interface Filters {
  dateFrom: string;
  dateTo: string;
  clasificacion: string;
  estado: string;
  derivado: string;
  vendedor: string;
  provincia: string;
}
