import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './services/supabase';
import Login from './components/Login';
import { KPICard, Badge, ChartCard } from './components/Components';
import Aurora from './components/react-bits/Aurora';
import { LogOut, RotateCcw, Search, AlertTriangle, Clock, RefreshCw, BookOpen, ChevronRight, Lightbulb, Info } from 'lucide-react';
import { Interaccion, Seguimiento, Cliente, Vendedor, Filters } from './types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

function App() {
  const [sessionUser, setSessionUser] = useState<string | null>(sessionStorage.getItem('calier_user'));
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'resumen' | 'interacciones' | 'clientes' | 'vendedores' | 'manual'>('resumen');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    clasificacion: '',
    estado: '',
    derivado: '',
    vendedor: '',
    provincia: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredSummary, setHoveredSummary] = useState<{ text: string; x: number; y: number } | null>(null);

  // Load Data
  useEffect(() => {
    if (sessionUser) {
      loadData();
    }
  }, [sessionUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [interRes, segRes, cliRes, vendRes] = await Promise.all([
        supabase.from('calier_interacciones').select('*'),
        supabase.from('calier_seguimientio').select('*'),
        supabase.from('calier_clientes').select('*'),
        supabase.from('calier_vendedores').select('*')
      ]);

      if (interRes.data) setInteracciones(interRes.data);
      if (segRes.data) setSeguimientos(segRes.data);
      if (cliRes.data) setClientes(cliRes.data);
      if (vendRes.data) setVendedores(vendRes.data);
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('calier_user');
    setSessionUser(null);
  };

  // Helper to normalize classification string
  const getClas = (i: Interaccion) => i.clasificación || (i as any).clasificacion || '';

  // Filter Logic
  const filteredData = useMemo(() => {
    let filteredInt = interacciones;
    let filteredCli = clientes;

    // Date Range (Interactions only)
    if (filters.dateFrom) {
      filteredInt = filteredInt.filter(i => (i.fecha_envio || '') >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filteredInt = filteredInt.filter(i => (i.fecha_envio || '') <= filters.dateTo + 'T23:59:59');
    }

    // Clasificación
    if (filters.clasificacion) {
      filteredInt = filteredInt.filter(i => getClas(i) === filters.clasificacion);
    }

    // Estado
    if (filters.estado) {
      filteredInt = filteredInt.filter(i => i.estado === filters.estado);
    }

    // Derivado
    if (filters.derivado) {
      const isDer = filters.derivado === 'Sí';
      filteredInt = filteredInt.filter(i => i.derivado === isDer);
    }

    // Vendedor
    if (filters.vendedor) {
      filteredInt = filteredInt.filter(i => i.vendedor_codigo === filters.vendedor);
      filteredCli = filteredCli.filter(c => c.cod_vendedor === filters.vendedor);
    }

    // Provincia
    if (filters.provincia) {
      filteredCli = filteredCli.filter(c => c.provincia === filters.provincia);
      // Filter interactions based on clients in that province
      const clientCodesInProv = new Set(filteredCli.map(c => c.codigo));
      filteredInt = filteredInt.filter(i => clientCodesInProv.has(i.client_codigo));
    }

    return { interacciones: filteredInt, clientes: filteredCli };
  }, [interacciones, clientes, filters]);

  // Overview KPIs
  const kpiData = useMemo(() => {
    const ints = filteredData.interacciones;
    const total = ints.length;
    const uniqueClients = new Set(ints.map(i => i.client_codigo)).size;
    const respondido = ints.filter(i => i.estado === 'respondido').length;
    const compra = ints.filter(i => getClas(i) === 'COMPRA').length;
    const info = ints.filter(i => getClas(i) === 'INFO').length;
    const baja = ints.filter(i => getClas(i) === 'BAJA').length;
    const derivados = ints.filter(i => i.derivado).length;

    return {
      total,
      uniqueClients,
      rate: total ? ((respondido / total) * 100).toFixed(1) : '0',
      compra,
      compraRate: total ? ((compra / total) * 100).toFixed(1) : '0',
      info,
      infoRate: total ? ((info / total) * 100).toFixed(1) : '0',
      baja,
      bajaRate: total ? ((baja / total) * 100).toFixed(1) : '0',
      derivados,
      derivadoRate: total ? ((derivados / total) * 100).toFixed(1) : '0'
    };
  }, [filteredData.interacciones]);

  // Overview Charts
  const chartsData = useMemo(() => {
    // 1. Interactions by Day
    const byDayMap = new Map<string, number>();
    filteredData.interacciones.forEach(i => {
      const date = i.fecha_envio?.split('T')[0] || 'N/A';
      byDayMap.set(date, (byDayMap.get(date) || 0) + 1);
    });
    const byDay = Array.from(byDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Classification Pie
    const pieData = [
      { name: 'COMPRA', value: kpiData.compra, color: '#2DD4A8' },
      { name: 'INFO', value: kpiData.info, color: '#3B82F6' },
      { name: 'BAJA', value: kpiData.baja, color: '#F43F5E' }
    ].filter(d => d.value > 0);

    // 3. Response Rate by Vendor
    const vendorStats = new Map<string, { total: number, resp: number }>();
    filteredData.interacciones.forEach(i => {
      if (i.vendedor_codigo) {
        const curr = vendorStats.get(i.vendedor_codigo) || { total: 0, resp: 0 };
        curr.total++;
        if (i.estado === 'respondido') curr.resp++;
        vendorStats.set(i.vendedor_codigo, curr);
      }
    });
    
    // Join with vendor names
    const vendorBar = Array.from(vendorStats.entries()).map(([code, stats]) => {
      const vName = vendedores.find(v => v.codigo === code)?.nombre || code;
      return {
        name: vName,
        rate: stats.total ? Math.round((stats.resp / stats.total) * 100) : 0
      };
    }).sort((a, b) => b.rate - a.rate).slice(0, 10);

    return { byDay, pieData, vendorBar };
  }, [filteredData.interacciones, kpiData, vendedores]);

  // Clients Tab Stats
  const clientStats = useMemo(() => {
    const cli = filteredData.clientes;
    const ints = filteredData.interacciones;
    
    // REQUEST 1: Calculate Total Interactions (Filtered) & Clients without interactions
    const totalFilteredInteractions = ints.length;

    // Get set of clients who have interaction (within the filtered interactions list)
    const activeClientCodes = new Set(ints.map(i => i.client_codigo));
    const clientsWithInteractionCount = activeClientCodes.size;
    const clientsWithoutInteractionCount = cli.length - clientsWithInteractionCount;

    // Chart Data
    const sectors: Record<string, number> = {};
    const provinces: Record<string, number> = {};
    const intCounts: Record<string, number> = {};
    
    ints.forEach(i => {
       intCounts[i.client_codigo] = (intCounts[i.client_codigo] || 0) + 1;
    });

    cli.forEach(c => {
        const s = c.sector || 'Sin Sector';
        sectors[s] = (sectors[s] || 0) + 1;
        const p = c.provincia || 'N/A';
        provinces[p] = (provinces[p] || 0) + 1;
    });

    const sectorData = Object.entries(sectors)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const provData = Object.entries(provinces)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    return {
        total: cli.length,
        totalInteractions: totalFilteredInteractions,
        withoutInteractions: clientsWithoutInteractionCount,
        provCount: Object.keys(provinces).length,
        sectorData,
        provData,
        intCounts
    };
  }, [filteredData]);

  // Vendors Tab Stats
  const vendorStats = useMemo(() => {
    let baseVendors = vendedores;
    if (filters.vendedor) {
        baseVendors = vendedores.filter(v => v.codigo === filters.vendedor);
    }

    // REQUEST 2: Derivations vs Contacted (Global for filtered context)
    const derivedInteractions = filteredData.interacciones.filter(i => i.derivado);
    const totalDerived = derivedInteractions.length;
    const totalContacted = derivedInteractions.filter(i => i.estado === 'respondido').length;
    const totalPending = totalDerived - totalContacted;

    const derivationPieData = [
        { name: 'Contactados', value: totalContacted, color: '#2DD4A8' },
        { name: 'Pendientes', value: totalPending, color: '#F43F5E' }
    ].filter(d => d.value > 0);

    // REQUEST 3: Top Peores Vendedores (Most pending derivations)
    // Using global interactions for alerts
    const globalDerived = interacciones.filter(i => i.derivado && i.estado !== 'respondido');
    
    // Create the "Worst Vendors" list details
    const delayedList = globalDerived.map(i => {
        const dateEnvio = i.fecha_envio ? new Date(i.fecha_envio) : new Date();
        const diffTime = Math.abs(new Date().getTime() - dateEnvio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        return {
            id: i.id,
            vendorCode: i.vendedor_codigo,
            vendorName: vendedores.find(v => v.codigo === i.vendedor_codigo)?.nombre || 'Sin Asignar',
            clientName: clientes.find(c => c.codigo === i.client_codigo)?.nombre || i.client_codigo,
            date: i.fecha_envio?.split('T')[0] || '-',
            daysDelayed: diffDays
        };
    }).sort((a, b) => b.daysDelayed - a.daysDelayed).slice(0, 10); 

    // Main Stats for Table
    const stats = baseVendors.map(v => {
        const vInts = filteredData.interacciones.filter(i => i.vendedor_codigo === v.codigo);
        const vCli = filteredData.clientes.filter(c => c.cod_vendedor === v.codigo);
        const purchases = vInts.filter(i => getClas(i) === 'COMPRA').length;
        const totalInt = vInts.length;
        const derived = vInts.filter(i => i.derivado).length;
        
        return {
            ...v,
            stats: {
                clients: vCli.length,
                interactions: totalInt,
                purchases,
                conversion: totalInt ? ((purchases/totalInt)*100).toFixed(1) : '0.0',
                derived
            }
        };
    });

    const totalInts = stats.reduce((acc, curr) => acc + curr.stats.interactions, 0);
    const totalPurchases = stats.reduce((acc, curr) => acc + curr.stats.purchases, 0);

    return {
        list: stats,
        activeCount: stats.filter(v => v.activo).length,
        totalInteractions: totalInts,
        totalPurchases,
        avgConversion: totalInts ? ((totalPurchases / totalInts) * 100).toFixed(1) : '0.0',
        derivationPieData,
        delayedList,
        totalDerived, 
        totalContacted
    };
  }, [vendedores, filteredData, filters.vendedor, interacciones, clientes]);

  const SECTOR_COLORS = ['#2DD4A8','#3B82F6','#F59E0B','#F43F5E','#8B5CF6','#EC4899','#06B6D4'];

  if (!sessionUser) {
    return <Login onLoginSuccess={setSessionUser} />;
  }

  return (
    <div className="min-h-screen bg-bg text-t1 font-sans relative overflow-hidden">
      <Aurora />
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-brd px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center text-white font-bold shadow-lg shadow-teal/10">
            CA
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Calier Argentina</h1>
            <p className="text-xs text-t2">Panel de Control — Bot WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-brd rounded-full">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse"></span>
            <span className="text-[10px] font-bold text-teal tracking-wide">EN VIVO</span>
          </div>
          <div className="text-sm text-t2 border-r border-brd pr-6">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-t1">{sessionUser}</div>
              <div className="text-[10px] text-t3">Admin</div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-2 text-t2 hover:text-teal hover:bg-teal-d rounded-lg transition-colors"
              title="Actualizar Datos"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-t2 hover:text-rose hover:bg-rose-d rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-bg border-b border-brd px-6 py-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-t3 uppercase">Desde</label>
          <input 
            type="date" 
            value={filters.dateFrom}
            onChange={e => setFilters({...filters, dateFrom: e.target.value})}
            className="block w-36 bg-card border border-brd rounded px-3 py-1.5 text-xs focus:border-teal outline-none transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-t3 uppercase">Hasta</label>
          <input 
            type="date" 
            value={filters.dateTo}
            onChange={e => setFilters({...filters, dateTo: e.target.value})}
            className="block w-36 bg-card border border-brd rounded px-3 py-1.5 text-xs focus:border-teal outline-none transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-t3 uppercase">Clasificación</label>
          <select 
            value={filters.clasificacion}
            onChange={e => setFilters({...filters, clasificacion: e.target.value})}
            className="block w-32 bg-card border border-brd rounded px-3 py-1.5 text-xs focus:border-teal outline-none"
          >
            <option value="">Todas</option>
            <option value="COMPRA">Compra</option>
            <option value="INFO">Info</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-t3 uppercase">Vendedor</label>
          <select 
            value={filters.vendedor}
            onChange={e => setFilters({...filters, vendedor: e.target.value})}
            className="block w-40 bg-card border border-brd rounded px-3 py-1.5 text-xs focus:border-teal outline-none"
          >
            <option value="">Todos</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.codigo}>{v.nombre}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setFilters({
            dateFrom: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0],
            clasificacion: '',
            estado: '',
            derivado: '',
            vendedor: '',
            provincia: ''
          })}
          className="ml-auto px-4 py-1.5 bg-cardH border border-brd hover:bg-brd rounded text-xs font-semibold text-t2 flex items-center gap-2 transition-colors"
        >
          <RotateCcw size={12} /> Limpiar
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-6 pb-0 border-b border-brd flex gap-1 overflow-x-auto">
        {[
          { id: 'resumen', label: 'Resumen', count: kpiData.total },
          { id: 'interacciones', label: 'Interacciones', count: filteredData.interacciones.length },
          { id: 'clientes', label: 'Clientes', count: filteredData.clientes.length },
          { id: 'vendedores', label: 'Vendedores', count: vendedores.length },
          { id: 'manual', label: 'Manual', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              relative px-5 py-3 text-xs font-semibold uppercase tracking-wide transition-all
              ${activeTab === tab.id ? 'text-teal' : 'text-t3 hover:text-t1'}
            `}
          >
            {tab.id === 'manual' && <BookOpen size={14} className="inline mr-1.5 -mt-0.5" />}
            {tab.label}
            {tab.count !== null && <span className="ml-2 text-[10px] opacity-70">({tab.count})</span>}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-teal"></div>}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="p-6 max-w-[1600px] mx-auto animate-fadeIn relative">
        
        {/* Hover Summary Tooltip */}
        {hoveredSummary && (
          <div 
            className="fixed z-50 bg-[#181D25] border border-[#252C37] p-4 rounded-lg shadow-2xl max-w-md text-sm text-[#E8ECF1] pointer-events-none animate-fadeIn break-words"
            style={{ 
              left: hoveredSummary.x, 
              top: hoveredSummary.y,
              transform: 'translate(-50%, 10px)'
            }}
          >
            <div className="text-[10px] uppercase font-bold text-[#5A6577] mb-1">Resumen Completo</div>
            {hoveredSummary.text}
          </div>
        )}

        {activeTab === 'resumen' && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KPICard label="Total Interacciones" value={kpiData.total} subtext={`${kpiData.uniqueClients} clientes únicos`} color="text-t1" dotColor="bg-t1" />
              <KPICard label="Tasa Respuesta" value={`${kpiData.rate}%`} subtext="Respondido vs Total" color="text-teal" dotColor="bg-teal" />
              <KPICard label="Leads Compra" value={kpiData.compra} subtext={`${kpiData.compraRate}% del total`} color="text-teal" dotColor="bg-teal" />
              <KPICard label="Leads Info" value={kpiData.info} subtext={`${kpiData.infoRate}% del total`} color="text-blue" dotColor="bg-blue" />
              <KPICard label="Leads Baja" value={kpiData.baja} subtext={`${kpiData.bajaRate}% del total`} color="text-rose" dotColor="bg-rose" />
              <KPICard label="Derivadas" value={kpiData.derivados} subtext={`${kpiData.derivadoRate}% del total`} color="text-violet" dotColor="bg-violet" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Interacciones por Día" tag="Ultimos 90 Días">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartsData.byDay}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2DD4A8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2DD4A8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E2530" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#5A6577'}} tickLine={false} axisLine={false} />
                    <YAxis tick={{fontSize: 10, fill: '#5A6577'}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#181D25', border: '1px solid #252C37', borderRadius: '8px'}}
                      itemStyle={{color: '#E8ECF1'}}
                    />
                    <Area type="monotone" dataKey="count" stroke="#2DD4A8" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Clasificación de Leads" tag="Distribución">
                <div className="flex items-center justify-center h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartsData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartsData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#181D25" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#181D25', border: '1px solid #252C37'}}/>
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Tasa de Respuesta por Vendedor" tag="Top 10" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartsData.vendorBar} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1E2530" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#8B95A5'}} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{backgroundColor: '#181D25', border: '1px solid #252C37'}} />
                    <Bar dataKey="rate" fill="#2DD4A8" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}

        {activeTab === 'interacciones' && (
          <div className="bg-card border border-brd rounded-xl overflow-hidden">
             <div className="p-4 border-b border-brd bg-bg2 flex justify-between items-center">
               <h3 className="font-semibold text-sm">Registro de Interacciones</h3>
               <div className="relative">
                 <Search className="absolute left-3 top-2 w-4 h-4 text-t3" />
                 <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-bg border border-brd rounded text-sm text-t1 w-64 focus:border-teal outline-none"
                 />
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-bg2 text-[11px] uppercase font-bold text-t3 tracking-wider">
                   <tr>
                     <th className="px-5 py-3">ID</th>
                     <th className="px-5 py-3">Cliente</th>
                     <th className="px-5 py-3">Vendedor</th>
                     <th className="px-5 py-3">Clasificación</th>
                     <th className="px-5 py-3">Estado</th>
                     <th className="px-5 py-3">Derivado</th>
                     <th className="px-5 py-3">Resumen</th>
                     <th className="px-5 py-3">Fecha</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-brd text-sm text-t2">
                   {filteredData.interacciones
                      .filter(i => 
                        !searchTerm || 
                        JSON.stringify(i).toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 100)
                      .map(i => {
                        const clientName = clientes.find(c => c.codigo === i.client_codigo)?.nombre || i.client_codigo;
                        const vendName = vendedores.find(v => v.codigo === i.vendedor_codigo)?.nombre || '-';
                        return (
                         <tr key={i.id} className="hover:bg-cardH transition-colors">
                           <td className="px-5 py-3 font-mono text-xs">{i.id}</td>
                           <td className="px-5 py-3 font-medium text-t1">{clientName}</td>
                           <td className="px-5 py-3 text-xs">{vendName}</td>
                           <td className="px-5 py-3"><Badge type="clasificacion" value={getClas(i)} /></td>
                           <td className="px-5 py-3"><Badge type="estado" value={i.estado || '-'} /></td>
                           <td className="px-5 py-3"><Badge type="derivado" value={!!i.derivado} /></td>
                           
                           {/* Updated Resumen Cell with Hover Tooltip */}
                           <td 
                             className="px-5 py-3 max-w-xs truncate cursor-help hover:text-teal transition-colors"
                             onMouseEnter={(e) => {
                                 if (!i.resumen) return;
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 setHoveredSummary({
                                     text: i.resumen,
                                     x: rect.left + rect.width / 2,
                                     y: rect.bottom
                                 });
                             }}
                             onMouseLeave={() => setHoveredSummary(null)}
                           >
                             {i.resumen}
                           </td>
                           
                           <td className="px-5 py-3 font-mono text-xs">{i.fecha_envio?.split('T')[0]}</td>
                         </tr>
                        );
                   })}
                 </tbody>
               </table>
               {filteredData.interacciones.length === 0 && (
                 <div className="p-8 text-center text-t3 text-sm">No se encontraron datos con los filtros actuales.</div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'clientes' && (
           <div className="space-y-6">
              {/* Clients KPIs (Updated Request 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Total Clientes" value={clientStats.total} subtext={`${clientStats.provCount} provincias`} color="text-t1" dotColor="bg-t1" />
                
                {/* Replaced 'Con Interacciones' with 'Total Interacciones' */}
                <KPICard label="Total Interacciones" value={clientStats.totalInteractions} subtext="Filtradas" color="text-teal" dotColor="bg-teal" />
                
                {/* Replaced 'Sector Top' with 'Sin Interacción' */}
                <KPICard label="Sin Interacción" value={clientStats.withoutInteractions} subtext="Clientes" color="text-rose" dotColor="bg-rose" />
                
                <KPICard label="Provincias" value={clientStats.provCount} subtext="Cobertura" color="text-amber" dotColor="bg-amber" />
              </div>

              {/* Clients Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Clientes por Sector" tag="Segmento">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={clientStats.sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {clientStats.sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} stroke="#181D25" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#181D25', border: '1px solid #252C37'}}/>
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Clientes por Provincia" tag="Top 10">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientStats.provData} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1E2530" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#8B95A5'}} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{backgroundColor: '#181D25', border: '1px solid #252C37'}} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Clients Table */}
              <div className="bg-card border border-brd rounded-xl overflow-hidden">
                 <div className="p-4 border-b border-brd bg-bg2 flex justify-between items-center">
                   <h3 className="font-semibold text-sm">Directorio de Clientes</h3>
                   <div className="relative">
                     <Search className="absolute left-3 top-2 w-4 h-4 text-t3" />
                     <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-bg border border-brd rounded text-sm text-t1 w-64 focus:border-teal outline-none"
                     />
                   </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-bg2 text-[11px] uppercase font-bold text-t3 tracking-wider">
                       <tr>
                         <th className="px-5 py-3">Código</th>
                         <th className="px-5 py-3">Nombre</th>
                         <th className="px-5 py-3">Provincia</th>
                         <th className="px-5 py-3">Localidad</th>
                         <th className="px-5 py-3">Sector</th>
                         <th className="px-5 py-3">Vendedor</th>
                         <th className="px-5 py-3">Email</th>
                         <th className="px-5 py-3 text-center">Inter.</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-brd text-sm text-t2">
                       {filteredData.clientes
                          .filter(c => 
                            !searchTerm || 
                            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .slice(0, 100)
                          .map(c => {
                            const v = vendedores.find(v => v.codigo === c.cod_vendedor);
                            const intCount = clientStats.intCounts[c.codigo] || 0;
                            return (
                             <tr key={c.id} className="hover:bg-cardH transition-colors">
                               <td className="px-5 py-3 font-mono text-xs text-t3">{c.codigo}</td>
                               <td className="px-5 py-3 font-medium text-t1">{c.nombre}</td>
                               <td className="px-5 py-3">{c.provincia}</td>
                               <td className="px-5 py-3">{c.localidad}</td>
                               <td className="px-5 py-3"><Badge type="default" value={c.sector} /></td>
                               <td className="px-5 py-3">{v ? v.nombre : c.cod_vendedor}</td>
                               <td className="px-5 py-3 text-xs">{c.email}</td>
                               <td className="px-5 py-3 font-mono text-xs text-center">{intCount}</td>
                             </tr>
                            );
                       })}
                     </tbody>
                   </table>
                 </div>
              </div>
           </div>
        )}
        
        {activeTab === 'vendedores' && (
           <div className="space-y-6">
              {/* Vendors KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard label="Total Vendedores" value={vendedores.length} subtext={`${vendorStats.activeCount} activos`} color="text-t1" dotColor="bg-t1" />
                <KPICard label="Interacciones" value={vendorStats.totalInteractions} subtext="Asignadas" color="text-teal" dotColor="bg-teal" />
                <KPICard label="Compras" value={vendorStats.totalPurchases} subtext={`% Conv: ${vendorStats.avgConversion}`} color="text-amber" dotColor="bg-amber" />
                <KPICard label="Conversión Prom." value={`${vendorStats.avgConversion}%`} subtext="Compra / Total" color="text-violet" dotColor="bg-violet" />
              </div>

              {/* Vendors Charts & Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* REQUEST 2: Derived vs Contacted Pie Chart */}
                <ChartCard title="Efectividad en Derivaciones" tag="Gestión">
                   <div className="flex flex-col h-[300px]">
                      <div className="flex items-center justify-center flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={vendorStats.derivationPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {vendorStats.derivationPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="#181D25" />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#181D25', border: '1px solid #252C37'}}/>
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center text-xs text-t2 mt-[-20px] pb-4">
                         Total Derivadas: <span className="text-t1 font-mono font-bold">{vendorStats.totalDerived}</span>
                         <span className="mx-2">•</span>
                         Contactadas: <span className="text-teal font-mono font-bold">{vendorStats.totalContacted}</span>
                      </div>
                   </div>
                </ChartCard>

                {/* REQUEST 3: Top Delayed Vendors (Peores Vendedores) */}
                <ChartCard title="Top Derivaciones con Mora" tag="Alerta Global">
                  <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {vendorStats.delayedList.length > 0 ? (
                        <div className="space-y-3">
                           <div className="flex justify-between text-[10px] uppercase font-bold text-t3 border-b border-brd pb-2 mb-2 sticky top-0 bg-card">
                             <span>Vendedor / Cliente</span>
                             <span>Fecha / Mora</span>
                           </div>
                           {vendorStats.delayedList.map(item => (
                             <div key={item.id} className="flex justify-between items-center p-3 bg-bg2/50 border border-brd rounded-lg hover:border-rose/50 transition-colors group">
                                <div className="flex flex-col">
                                   <span className="text-sm font-semibold text-t1">{item.vendorName}</span>
                                   <span className="text-xs text-t2">{item.clientName}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                   <div className="flex items-center gap-1 text-rose font-mono font-bold text-sm bg-rose-d px-2 py-0.5 rounded">
                                      <Clock size={12} />
                                      {item.daysDelayed} días
                                   </div>
                                   <span className="text-[10px] text-t3 mt-1">{item.date}</span>
                                </div>
                             </div>
                           ))}
                        </div>
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-t3 gap-2">
                           <AlertTriangle size={24} opacity={0.5} />
                           <span className="text-xs">No hay derivaciones pendientes con mora.</span>
                        </div>
                     )}
                  </div>
                </ChartCard>
              </div>

              {/* Vendors Table */}
              <div className="bg-card border border-brd rounded-xl overflow-hidden">
                 <div className="p-4 border-b border-brd bg-bg2 flex justify-between items-center">
                   <h3 className="font-semibold text-sm">Equipo de Ventas</h3>
                   <div className="relative">
                     <Search className="absolute left-3 top-2 w-4 h-4 text-t3" />
                     <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-bg border border-brd rounded text-sm text-t1 w-64 focus:border-teal outline-none"
                     />
                   </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-bg2 text-[11px] uppercase font-bold text-t3 tracking-wider">
                       <tr>
                         <th className="px-5 py-3">Código</th>
                         <th className="px-5 py-3">Nombre</th>
                         <th className="px-5 py-3">Lab.</th>
                         <th className="px-5 py-3">Estado</th>
                         <th className="px-5 py-3 text-center">Clientes</th>
                         <th className="px-5 py-3 text-center">Inter.</th>
                         <th className="px-5 py-3 text-center">Compras</th>
                         <th className="px-5 py-3 text-center">%Conv</th>
                         <th className="px-5 py-3 text-center">Deriv.</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-brd text-sm text-t2">
                       {vendorStats.list
                          .filter(v => 
                            !searchTerm || 
                            v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.codigo.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(v => (
                             <tr key={v.id} className="hover:bg-cardH transition-colors">
                               <td className="px-5 py-3 font-mono text-xs text-t3">{v.codigo}</td>
                               <td className="px-5 py-3 font-medium text-t1">{v.nombre}</td>
                               <td className="px-5 py-3">{v.laboratorio}</td>
                               <td className="px-5 py-3"><Badge type="status" value={v.activo} /></td>
                               <td className="px-5 py-3 font-mono text-xs text-center">{v.stats.clients}</td>
                               <td className="px-5 py-3 font-mono text-xs text-center">{v.stats.interactions}</td>
                               <td className="px-5 py-3 font-mono text-xs text-center text-teal">{v.stats.purchases}</td>
                               <td className="px-5 py-3 font-mono text-xs text-center">{v.stats.conversion}%</td>
                               <td className="px-5 py-3 font-mono text-xs text-center">{v.stats.derived}</td>
                             </tr>
                          ))
                       }
                     </tbody>
                   </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Manual Header */}
            <div className="bg-card border border-brd rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-d flex items-center justify-center">
                <BookOpen size={32} className="text-teal" />
              </div>
              <h2 className="text-2xl font-bold text-t1 mb-1">Manual de Usuario</h2>
              <p className="text-base text-teal font-medium mb-1">Tablero de Control — Bot WhatsApp</p>
              <p className="text-sm text-t3">Calier Argentina</p>
              <p className="text-xs text-t3 mt-3">Guía práctica para el uso diario del dashboard &middot; Versión 1.0 — Marzo 2026</p>
            </div>

            {/* Qué es este tablero */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal rounded-full"></span>
                ¿Qué es este tablero?
              </h3>
              <p className="text-sm text-t2 leading-relaxed">
                Es una herramienta web que te permite ver todo lo que pasa con el Bot de WhatsApp de Calier Argentina: cuántas conversaciones hay, qué piden los clientes, cómo responden los vendedores y dónde hay oportunidades o problemas.
              </p>
            </div>

            {/* Cómo entrar */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal rounded-full"></span>
                Cómo entrar
              </h3>
              <ul className="space-y-2 text-sm text-t2 ml-1">
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-teal mt-0.5 shrink-0" /> Abrí el link del tablero en tu navegador (Chrome, Safari, etc.)</li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-teal mt-0.5 shrink-0" /> Escribí tu usuario y contraseña</li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-teal mt-0.5 shrink-0" /> Hacé clic en <span className="font-semibold text-t1">Iniciar Sesión</span></li>
              </ul>
              <div className="mt-4 p-3 bg-teal-d border border-teal/20 rounded-lg text-xs text-teal flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0" />
                Si es tu primera vez, podés registrarte desde la misma pantalla.
              </div>
              <p className="mt-3 text-xs text-t3 italic">Para cerrar sesión, usá el icono de salida (flecha) arriba a la derecha.</p>
            </div>

            {/* Barra superior */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal rounded-full"></span>
                La barra superior (común a todo el tablero)
              </h3>
              <p className="text-sm text-t2 mb-4">Arriba de todo vas a ver controles que afectan todas las pestañas:</p>
              <div className="space-y-3">
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-teal">Desde / Hasta:</span>
                  <p className="text-sm text-t2 mt-1">Elegís el rango de fechas que querés analizar. Por defecto muestra los últimos 90 días.</p>
                </div>
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-teal">Clasificación:</span>
                  <p className="text-sm text-t2 mt-1">Filtrá por tipo de conversación:</p>
                  <div className="mt-2 ml-4 space-y-1 text-xs text-t2">
                    <p><span className="inline-block w-2 h-2 rounded-full bg-teal mr-2"></span><span className="font-medium text-t1">Compra</span> = el cliente quiere comprar o pedir algo</p>
                    <p><span className="inline-block w-2 h-2 rounded-full bg-blue mr-2"></span><span className="font-medium text-t1">Info</span> = el cliente consulta precios, disponibilidad, etc.</p>
                    <p><span className="inline-block w-2 h-2 rounded-full bg-rose mr-2"></span><span className="font-medium text-t1">Baja</span> = no hay intención de compra, rechazo o no aplica</p>
                    <p><span className="font-medium text-t1">Todas</span> = muestra todo</p>
                  </div>
                </div>
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-teal">Vendedor:</span>
                  <p className="text-sm text-t2 mt-1">Podés elegir ver solo los datos de un vendedor en particular, o dejar "Todos".</p>
                </div>
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-teal">Botón Limpiar:</span>
                  <p className="text-sm text-t2 mt-1">Vuelve todo a los valores originales (últimos 90 días, sin filtros).</p>
                </div>
              </div>
            </div>

            {/* Pestaña RESUMEN */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-1 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-teal rounded-full"></span>
                Pestaña 1: RESUMEN
              </h3>
              <p className="text-sm text-t2 mb-4">Es la vista principal. Te da un pantallazo rápido de cómo va todo.</p>

              <h4 className="text-sm font-bold text-t1 mb-3">Los 6 cuadros de arriba</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-teal text-white text-xs uppercase tracking-wider">
                      <th className="px-4 py-2.5 rounded-tl-lg font-semibold">Cuadro</th>
                      <th className="px-4 py-2.5 rounded-tr-lg font-semibold">Qué significa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brd text-t2">
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-teal">Total Interacciones</td><td className="px-4 py-2.5">Cuántas conversaciones hubo en el período. Abajo dice cuántos clientes distintos participaron.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-teal">Tasa Respuesta</td><td className="px-4 py-2.5">El porcentaje de casos que fueron respondidos. Si dice 93%, significa que de cada 100 consultas, 93 se contestaron.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-teal">Leads Compra</td><td className="px-4 py-2.5">Cuántas conversaciones fueron pedidos o intenciones de compra concretas.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-teal">Leads Info</td><td className="px-4 py-2.5">Cuántas fueron consultas informativas (precios, catálogo, disponibilidad).</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-teal">Leads Baja</td><td className="px-4 py-2.5">Cuántas no tenían intención real (rechazo, no corresponde).</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-teal">Derivadas</td><td className="px-4 py-2.5">Cuántas conversaciones se pasaron a un vendedor humano porque el bot no podía resolverlas solo.</td></tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-bold text-t1 mb-3">Los 3 gráficos</h4>
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-teal">Interacciones por Día:</span>
                  <p className="text-sm text-t2 mt-1">Una línea que muestra cuántas conversaciones hubo cada día. Sirve para ver si hubo picos (por ejemplo después de una campaña) o días flojos.</p>
                </div>
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-teal">Clasificación de Leads:</span>
                  <p className="text-sm text-t2 mt-1">Un gráfico circular (dona) que muestra la proporción entre Compra, Info y Baja. De un vistazo ves qué tipo de consultas predominan.</p>
                </div>
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-teal">Tasa de Respuesta por Vendedor:</span>
                  <p className="text-sm text-t2 mt-1">Barras horizontales que muestran los 10 mejores vendedores según su porcentaje de respuesta. Útil para ver quién responde más y quién necesita seguimiento.</p>
                </div>
              </div>

              <h4 className="text-sm font-bold text-t1 mb-3">¿Qué mirar y cuándo?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-teal-d border border-teal/20 rounded-lg text-center">
                  <div className="text-xs font-bold text-teal uppercase mb-1">Todos los días (2 min)</div>
                  <p className="text-xs text-t2">Tasa de Respuesta + Derivadas. Si bajan o suben mucho, algo está pasando.</p>
                </div>
                <div className="p-3 bg-blue-d border border-blue/20 rounded-lg text-center">
                  <div className="text-xs font-bold text-blue uppercase mb-1">Cada semana (10 min)</div>
                  <p className="text-xs text-t2">El gráfico de interacciones por día + la dona de clasificación.</p>
                </div>
                <div className="p-3 bg-violet-d border border-violet/20 rounded-lg text-center">
                  <div className="text-xs font-bold text-violet uppercase mb-1">Cada mes (30 min)</div>
                  <p className="text-xs text-t2">Comparar vendedores y pensar si hay que ajustar algo.</p>
                </div>
              </div>
            </div>

            {/* Pestaña INTERACCIONES */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-1 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue rounded-full"></span>
                Pestaña 2: INTERACCIONES
              </h3>
              <p className="text-sm text-t2 mb-4">Acá ves el detalle de cada conversación, una por una, en una tabla.</p>

              <h4 className="text-sm font-bold text-t1 mb-3">Columnas de la tabla</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-blue text-white text-xs uppercase tracking-wider">
                      <th className="px-4 py-2.5 rounded-tl-lg font-semibold">Columna</th>
                      <th className="px-4 py-2.5 rounded-tr-lg font-semibold">Qué significa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brd text-t2">
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">ID</td><td className="px-4 py-2.5">Número único de cada caso.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">Cliente</td><td className="px-4 py-2.5">Nombre de la veterinaria, distribuidora, etc.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">Vendedor</td><td className="px-4 py-2.5">Quién tiene asignado ese cliente.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">Clasificación</td><td className="px-4 py-2.5">COMPRA, INFO o BAJA (con colorcito).</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">Estado</td><td className="px-4 py-2.5">Si fue RESPONDIDO o no.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">Derivado</td><td className="px-4 py-2.5">Sí o No. "Sí" significa que se pasó a un vendedor humano.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">Resumen</td><td className="px-4 py-2.5">Un extracto corto de qué se trató. Si pasás el mouse por encima, ves el texto completo.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-blue">Fecha</td><td className="px-4 py-2.5">Cuándo ocurrió.</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-bg rounded-lg border border-brd mb-4">
                <span className="font-semibold text-sm text-blue">El buscador:</span>
                <p className="text-sm text-t2 mt-1">Arriba a la derecha de la tabla. Escribí cualquier palabra y filtra al instante. Podés buscar por nombre de cliente, vendedor o palabras del resumen.</p>
              </div>

              <h4 className="text-sm font-bold text-t1 mb-2">¿Para qué la usarías?</h4>
              <ul className="space-y-1 text-sm text-t2 ml-1">
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-blue mt-0.5 shrink-0" /> Buscar un caso puntual de un cliente.</li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-blue mt-0.5 shrink-0" /> Filtrar por COMPRA + Derivado = Sí para ver qué pedidos se pasaron a vendedores.</li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-blue mt-0.5 shrink-0" /> Filtrar por BAJA y revisar si realmente no había oportunidad.</li>
              </ul>
            </div>

            {/* Pestaña CLIENTES */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-1 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber rounded-full"></span>
                Pestaña 3: CLIENTES
              </h3>
              <p className="text-sm text-t2 mb-4">Te muestra la base de clientes y su actividad.</p>

              <h4 className="text-sm font-bold text-t1 mb-3">Los 4 cuadros de arriba</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-amber text-white text-xs uppercase tracking-wider">
                      <th className="px-4 py-2.5 rounded-tl-lg font-semibold">Cuadro</th>
                      <th className="px-4 py-2.5 rounded-tr-lg font-semibold">Qué significa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brd text-t2">
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-amber">Total Clientes</td><td className="px-4 py-2.5">Cuántos clientes distintos hay.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-amber">Total Interacciones</td><td className="px-4 py-2.5">Cuántas conversaciones hay en el período filtrado.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-amber">Sin Interacción</td><td className="px-4 py-2.5">Cuántos clientes NO tuvieron ninguna conversación. Estos son clientes "dormidos" que tal vez necesitan un contacto.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-amber">Provincias</td><td className="px-4 py-2.5">En cuántas provincias hay clientes (cobertura geográfica).</td></tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-bold text-t1 mb-3">Los 2 gráficos</h4>
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-amber">Clientes por Sector (dona):</span>
                  <p className="text-sm text-t2 mt-1">Muestra cómo se reparten los clientes por rubro (Veterinaria, Farmacia Vet, Distribuidora, Cooperativa, etc.). Sirve para saber a qué tipo de cliente llega más el bot.</p>
                </div>
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-amber">Clientes por Provincia (barras):</span>
                  <p className="text-sm text-t2 mt-1">Las 10 provincias con más clientes. Útil para decisiones de cobertura comercial.</p>
                </div>
              </div>

              <div className="p-3 bg-bg rounded-lg border border-brd mb-4">
                <span className="font-semibold text-sm text-amber">Directorio de Clientes:</span>
                <p className="text-sm text-t2 mt-1">Lista completa con Código, Nombre, Provincia, Localidad, Sector, Vendedor asignado, Email y cuántas interacciones tuvo cada cliente. También tiene buscador.</p>
              </div>

              <h4 className="text-sm font-bold text-t1 mb-2">¿Para qué la usarías?</h4>
              <ul className="space-y-1 text-sm text-t2 ml-1">
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-amber mt-0.5 shrink-0" /> Ver qué clientes no tienen actividad y planificar contacto.</li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-amber mt-0.5 shrink-0" /> Detectar provincias o sectores con más demanda.</li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-amber mt-0.5 shrink-0" /> Encontrar clientes sin vendedor asignado.</li>
              </ul>
            </div>

            {/* Pestaña VENDEDORES */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-1 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-violet rounded-full"></span>
                Pestaña 4: VENDEDORES
              </h3>
              <p className="text-sm text-t2 mb-4">Acá se mide el rendimiento del equipo comercial.</p>

              <h4 className="text-sm font-bold text-t1 mb-3">Los 4 cuadros de arriba</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-violet text-white text-xs uppercase tracking-wider">
                      <th className="px-4 py-2.5 rounded-tl-lg font-semibold">Cuadro</th>
                      <th className="px-4 py-2.5 rounded-tr-lg font-semibold">Qué significa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brd text-t2">
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-violet">Total Vendedores</td><td className="px-4 py-2.5">Cuántos hay en total y cuántos están activos.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-violet">Interacciones</td><td className="px-4 py-2.5">Cuántas conversaciones tiene asignadas el equipo.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-violet">Compras</td><td className="px-4 py-2.5">Cuántos casos fueron clasificados como compra.</td></tr>
                    <tr className="hover:bg-bg transition-colors"><td className="px-4 py-2.5 font-semibold text-violet">Conversión Prom.</td><td className="px-4 py-2.5">El porcentaje promedio de conversión del equipo (compras sobre total). Ejemplo: 41% significa que de cada 100 interacciones, 41 terminaron en compra.</td></tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-sm font-bold text-t1 mb-3">Los 2 paneles del medio</h4>
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-violet">Efectividad en Derivaciones (dona):</span>
                  <p className="text-sm text-t2 mt-1">Muestra cuántas derivaciones (casos pasados a vendedores) ya fueron contactadas vs cuántas siguen pendientes. Si hay muchas pendientes, hay que actuar.</p>
                </div>
                <div className="p-3 bg-bg rounded-lg border border-brd">
                  <span className="font-semibold text-sm text-violet">Top Derivaciones con Mora (lista):</span>
                  <p className="text-sm text-t2 mt-1">Los casos con más días sin resolución. Cada tarjeta muestra el vendedor, el cliente y cuántos días lleva pendiente.</p>
                </div>
              </div>

              <div className="p-3 bg-amber-d border border-amber/20 rounded-lg text-sm mb-6 flex items-start gap-2">
                <Lightbulb size={16} className="text-amber mt-0.5 shrink-0" />
                <span className="text-t2"><span className="font-bold text-amber">Consejo:</span> Esta es una lista de alertas para actuar ya. Si ves algo con muchos días, hay que hacer seguimiento urgente.</span>
              </div>

              <div className="p-3 bg-bg rounded-lg border border-brd mb-4">
                <span className="font-semibold text-sm text-violet">Tabla "Equipo de Ventas":</span>
                <p className="text-sm text-t2 mt-1">Muestra cada vendedor con su Código, Nombre, Laboratorio, si está Activo, cuántos Clientes tiene, cuántas Interacciones manejó, cuántas Compras logró, su porcentaje de Conversión y cuántas Derivaciones tiene.</p>
              </div>

              <h4 className="text-sm font-bold text-t1 mb-2">¿Para qué la usarías?</h4>
              <ul className="space-y-1 text-sm text-t2 ml-1">
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-violet mt-0.5 shrink-0" /><span><span className="font-semibold text-t1">Todos los días:</span> Mirar las derivaciones con mora y actuar sobre las más viejas.</span></li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-violet mt-0.5 shrink-0" /><span><span className="font-semibold text-t1">Cada semana:</span> Comparar interacciones por vendedor para ver si la carga está balanceada.</span></li>
                <li className="flex items-start gap-2"><ChevronRight size={16} className="text-violet mt-0.5 shrink-0" /><span><span className="font-semibold text-t1">Cada mes:</span> Revisar % de conversión para detectar quién necesita capacitación o apoyo.</span></li>
              </ul>
            </div>

            {/* Consejos generales */}
            <div className="bg-card border border-brd rounded-xl p-6">
              <h3 className="text-lg font-bold text-t1 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber rounded-full"></span>
                Consejos generales
              </h3>
              <p className="text-sm text-t2 mb-4">Estas son recomendaciones prácticas para sacarle el máximo provecho al tablero:</p>
              <div className="space-y-3">
                <div className="p-3 bg-amber-d border border-amber/20 rounded-lg text-sm flex items-start gap-2">
                  <Lightbulb size={16} className="text-amber mt-0.5 shrink-0" />
                  <span className="text-t2"><span className="font-bold text-amber">Si las Derivadas suben mucho:</span> El bot no está resolviendo lo suficiente. Revisar las respuestas automáticas.</span>
                </div>
                <div className="p-3 bg-amber-d border border-amber/20 rounded-lg text-sm flex items-start gap-2">
                  <Lightbulb size={16} className="text-amber mt-0.5 shrink-0" />
                  <span className="text-t2"><span className="font-bold text-amber">Si la Tasa de Respuesta baja:</span> Los vendedores no están respondiendo a tiempo. Mirar el panel de mora.</span>
                </div>
                <div className="p-3 bg-amber-d border border-amber/20 rounded-lg text-sm flex items-start gap-2">
                  <Lightbulb size={16} className="text-amber mt-0.5 shrink-0" />
                  <span className="text-t2"><span className="font-bold text-amber">Si hay mucho INFO:</span> Es oportunidad para crear respuestas automáticas de precios, fichas técnicas, etc.</span>
                </div>
                <div className="p-3 bg-amber-d border border-amber/20 rounded-lg text-sm flex items-start gap-2">
                  <Lightbulb size={16} className="text-amber mt-0.5 shrink-0" />
                  <span className="text-t2"><span className="font-bold text-amber">Si hay muchos clientes sin interacción:</span> Armar una campaña de reactivación.</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-teal-d border border-teal/20 rounded-lg text-xs text-teal flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0" />
                El botón de actualizar (flechas circulares arriba a la derecha) recarga los datos frescos de la base.
              </div>
            </div>
          </div>
        )}

      </main>
      </div>
    </div>
  );
}

export default App;