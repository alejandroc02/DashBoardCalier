import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

// Public TopoJSON for Argentina Provinces
// Verified Working GeoJSON for Argentina Provinces (includes 23 provinces + CABA)
// Using local file for stability and faster loading
const GEO_URL = "/argentina.json";

// Manual coordinate adjustments for markers (Province Centers) to align with map projection
const PROV_MARKERS: Record<string, [number, number]> = {
  'Buenos Aires': [-60.5, -36.5],
  'CABA': [-58.4, -34.6],
  'Ciudad Autónoma de Buenos Aires': [-58.4, -34.6],
  'Capital Federal': [-58.4, -34.6],
  'Catamarca': [-67.0, -27.0],
  'Chaco': [-60.5, -26.5],
  'Chubut': [-68.5, -44.0],
  'Córdoba': [-64.0, -32.0],
  'Corrientes': [-58.0, -29.0],
  'Entre Ríos': [-59.0, -32.0],
  'Formosa': [-60.0, -25.0],
  'Jujuy': [-65.5, -23.0],
  'La Pampa': [-65.5, -37.0],
  'La Rioja': [-67.0, -29.5],
  'Mendoza': [-68.5, -34.5],
  'Misiones': [-54.5, -26.5],
  'Neuquén': [-70.0, -38.5],
  'Río Negro': [-67.0, -40.0],
  'Salta': [-65.5, -25.0],
  'San Juan': [-69.0, -30.5],
  'San Luis': [-66.0, -33.5],
  'Santa Cruz': [-70.0, -49.0],
  'Santa Fe': [-61.0, -30.5],
  'Santiago del Estero': [-64.0, -28.0],
  'Tierra del Fuego': [-68.0, -54.0],
  'Tucumán': [-65.5, -27.0]
};

interface ArgentinaMapProps {
  data: any[];
  metric: 'clientes' | 'interacciones' | 'compras';
  provincesData: Record<string, { clientes: number; interacciones: number; compras: number }>;
}

const ArgentinaMap: React.FC<ArgentinaMapProps> = ({ metric, provincesData }) => {
  const [tooltipContent, setTooltipContent] = useState<{name: string, data: any} | null>(null);

  const maxValue = useMemo(() => {
    return Math.max(...Object.values(provincesData).map(d => d[metric] || 0), 1);
  }, [provincesData, metric]);

  const popScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxValue])
      .range([4, 25]); // Min radius 4, Max radius 25
  }, [maxValue]);

  const getColor = (val: number) => {
    if (metric === 'compras') return '#2DD4A8';
    if (metric === 'interacciones') return '#3B82F6';
    return '#F59E0B';
  };

  const sortedProvinces = useMemo(() => {
    return Object.entries(provincesData)
      .sort(([, a], [, b]) => b[metric] - a[metric])
      .slice(0, 5);
  }, [provincesData, metric]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-8">
      <div className="flex-1 relative bg-[#0F1318] border border-brd rounded-xl overflow-hidden min-h-[500px] flex items-center justify-center">
        
        {/* Metric Label */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
           <h3 className="text-t2 text-[10px] font-bold uppercase mb-1 tracking-widest">Visualización</h3>
           <div className="px-3 py-1 bg-[#181D25]/90 backdrop-blur rounded text-xs font-mono font-bold text-t1 border border-[#252C37]">
             {metric.toUpperCase()}
           </div>
        </div>

        {/* The Map */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 1500, // Significantly increased scale for better visibility
            center: [-63, -38] // Centered more accurately for Argentina
          }}
          className="w-full h-full max-h-[600px]"
        >
          <ZoomableGroup center={[-63, -38]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // The new GeoJSON uses 'nombre' as the property key
                  const provName = geo.properties.nombre || geo.properties.NAME_1 || geo.properties.name;
                  const isHovered = tooltipContent?.name === provName;
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                         const matchName = Object.keys(provincesData).find(key => 
                            key.toLowerCase().trim() === provName.toLowerCase().trim() ||
                            key.toLowerCase().includes(provName.toLowerCase()) || 
                            provName.toLowerCase().includes(key.toLowerCase())
                         );
                         if (matchName) {
                           setTooltipContent({
                             name: matchName, 
                             data: provincesData[matchName]
                           });
                         } else {
                            setTooltipContent({ name: provName, data: { clientes: 0, interacciones: 0, compras: 0 }});
                         }
                      }}
                      onMouseLeave={() => setTooltipContent(null)}
                      style={{
                        default: {
                          fill: "#F1F5F9",
                          stroke: "#CBD5E1",
                          strokeWidth: 1.0,
                          outline: "none",
                        },
                        hover: {
                          fill: "#E2E8F0",
                          stroke: "#3B82F6",
                          strokeWidth: 2.0,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#CBD5E1",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Render Bubbles based on Data */}
            {Object.entries(PROV_MARKERS).map(([name, coords]) => {
              const data = provincesData[name] || { clientes: 0, interacciones: 0, compras: 0 };
              const value = data[metric];
              if (value === 0) return null;

              return (
                <Marker key={name} coordinates={coords}>
                  <circle 
                    r={popScale(value)} 
                    fill={getColor(value)} 
                    fillOpacity={0.6} 
                    stroke={getColor(value)} 
                    strokeWidth={1}
                    className="transition-all duration-300 hover:opacity-100 cursor-pointer"
                    onMouseEnter={() => setTooltipContent({ name, data })}
                    onMouseLeave={() => setTooltipContent(null)}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Custom Floating Tooltip */}
        {tooltipContent && (
          <div 
            className="absolute top-4 right-4 z-20 pointer-events-none bg-cardH border border-brd2 rounded-lg p-3 shadow-2xl animate-fadeIn min-w-[180px]"
          >
            <div className="text-t1 font-bold text-sm mb-2 border-b border-brd pb-1">{tooltipContent.name}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-t2">Clientes:</span>
                <span className="text-t1 font-mono">{tooltipContent.data.clientes}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t2">Interacciones:</span>
                <span className="text-t1 font-mono">{tooltipContent.data.interacciones}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t2">Compras:</span>
                <span className="text-teal font-mono font-bold">{tooltipContent.data.compras}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranking Sidebar */}
      <div className="w-full lg:w-64 bg-card border border-brd rounded-xl p-5 flex flex-col h-full">
        <h3 className="text-t1 font-semibold text-sm mb-4">Top 5 Provincias</h3>
        <div className="space-y-4 overflow-y-auto pr-2">
          {sortedProvinces.map(([name, data], idx) => (
            <div key={name} className="relative group">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-semibold text-t2 group-hover:text-t1 transition-colors">{idx + 1}. {name}</span>
                <span className="text-xs font-mono font-bold text-t1">{data[metric]}</span>
              </div>
              <div className="h-1.5 w-full bg-bg2 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(data[metric] / maxValue) * 100}%`,
                    backgroundColor: getColor(data[metric])
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-auto pt-6 border-t border-brd">
            <h4 className="text-[10px] uppercase font-bold text-t3 mb-3">Referencia</h4>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{background: getColor(1)}}></span>
                <span className="text-xs text-t2 capitalize">{metric}</span>
            </div>
            <p className="text-[10px] text-t3 leading-relaxed">
                El tamaño de las burbujas indica el volumen de la métrica seleccionada en relación al máximo nacional.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ArgentinaMap;