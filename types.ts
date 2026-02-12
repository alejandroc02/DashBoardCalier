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

export const PROVINCIAS_COORDS: Record<string, { x: number; y: number; abbr: string }> = {
  'Buenos Aires': { x: 295, y: 370, abbr: 'BA' },
  'CABA': { x: 300, y: 345, abbr: 'CABA' },
  'Capital Federal': { x: 300, y: 345, abbr: 'CABA' },
  'Catamarca': { x: 225, y: 225, abbr: 'CT' },
  'Chaco': { x: 310, y: 185, abbr: 'CC' },
  'Chubut': { x: 235, y: 500, abbr: 'CH' },
  'Córdoba': { x: 265, y: 295, abbr: 'CB' },
  'Corrientes': { x: 335, y: 215, abbr: 'CR' },
  'Entre Ríos': { x: 315, y: 305, abbr: 'ER' },
  'Formosa': { x: 305, y: 155, abbr: 'FO' },
  'Jujuy': { x: 235, y: 135, abbr: 'JY' },
  'La Pampa': { x: 255, y: 385, abbr: 'LP' },
  'La Rioja': { x: 225, y: 260, abbr: 'LR' },
  'Mendoza': { x: 210, y: 325, abbr: 'MZ' },
  'Misiones': { x: 355, y: 180, abbr: 'MI' },
  'Neuquén': { x: 210, y: 425, abbr: 'NQ' },
  'Río Negro': { x: 235, y: 455, abbr: 'RN' },
  'Salta': { x: 245, y: 155, abbr: 'SA' },
  'San Juan': { x: 205, y: 285, abbr: 'SJ' },
  'San Luis': { x: 235, y: 325, abbr: 'SL' },
  'Santa Cruz': { x: 225, y: 560, abbr: 'SC' },
  'Santa Fe': { x: 295, y: 280, abbr: 'SF' },
  'Santiago del Estero': { x: 270, y: 225, abbr: 'SE' },
  'Tierra del Fuego': { x: 235, y: 620, abbr: 'TF' },
  'Tucumán': { x: 250, y: 195, abbr: 'TU' }
};

export const ARGENTINA_SVG_PATH = "M235,120 L260,125 L280,130 L310,140 L340,145 L365,150 L370,170 L365,190 L360,210 L345,230 L330,250 L325,270 L320,290 L325,310 L320,330 L310,350 L305,370 L300,390 L290,410 L275,430 L260,450 L250,470 L245,490 L240,510 L235,530 L230,550 L225,570 L230,590 L240,610 L250,630 L240,640 L225,635 L215,620 L210,600 L205,580 L200,560 L195,540 L195,520 L200,500 L205,480 L200,460 L195,440 L190,420 L190,400 L195,380 L195,360 L190,340 L190,320 L195,300 L195,280 L200,260 L205,240 L210,220 L215,200 L220,180 L225,160 L230,140 Z";
