'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Inscripcion {
  id: number;
  ticket?: string; // Opcional por si no viene directo de la BD
  responsable: string;
  telefono: string;
  cupos: number;
  acompanantes: string;
  total: number;
  estado: string;
  ultimos_4_digitos: string | null;
}

const LOGO_ROCA_ETERNA_SVG = `
  <svg viewBox="0 0 400 400" width="75" height="75" style="margin: 0 auto; display: block;">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#EAB308" />
        <stop offset="50%" stop-color="#FACC15" />
        <stop offset="100%" stop-color="#CA8A04" />
      </linearGradient>
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F1F5F9" />
        <stop offset="60%" stop-color="#CBD5E1" />
        <stop offset="100%" stop-color="#94A3B8" />
      </linearGradient>
    </defs>
    <path d="M200,60 C225,100 255,115 255,145 C255,185 220,195 200,195 C180,195 145,185 145,145 C145,115 175,100 200,60 Z" fill="url(#goldGrad)" />
    <path d="M200,85 C215,112 235,122 235,145 C235,172 215,180 200,180 C185,180 165,172 165,145 C165,122 185,112 200,85 Z" fill="#FEF08A" opacity="0.4" />
    <path d="M200,175 C235,175 295,130 295,180 C295,230 225,250 200,250 C175,250 105,230 105,180 C105,130 165,175 200,175 Z" fill="url(#silverGrad)" stroke="#64748B" stroke-width="1.5" />
    <path d="M200,175 C215,190 235,210 235,225 C235,240 215,248 200,248 C185,248 165,240 165,225 C165,210 185,190 200,175 Z" fill="#94A3B8" opacity="0.3" />
  </svg>
`;

// Helper para garantizar el mismo formato exacto que el cliente de cara al usuario público
const obtenerCodigoTicket = (item: Inscripcion) => {
  if (item.ticket) return item.ticket;
  return `#${String(item.id).padStart(3, '0')}`;
};

export default function AdminPanel() {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [cargando, setCargando] = useState(true);
  const [ticketParaImprimir, setTicketParaImprimir] = useState<Inscripcion | null>(null);
  const [fechaReporte, setFechaReporte] = useState<string>('');

  useEffect(() => {
    if (autenticado) {
      fetchInscripciones();
      setFechaReporte(new Date().toLocaleDateString('es-GT'));
    }
  }, [autenticado]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'RocaEterna2026') {
      setAutenticado(true);
      setErrorPassword('');
    } else {
      setErrorPassword('Contraseña incorrecta');
    }
  };

  async function fetchInscripciones() {
    try {
      setCargando(true);
      const { data, error } = await supabase.from('inscripciones').select('*');
      if (error) throw error;

      // Ordenar por ID de forma descendente (más recientes primero)
      const datosOrdenados = data ? [...data].sort((a, b) => b.id - a.id) : [];
      setInscripciones(datosOrdenados);
    } catch (error: any) {
      alert('Error cargando inscripciones: ' + error.message);
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(id: number, nuevoEstado: string) {
    try {
      const { error } = await supabase
        .from('inscripciones')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizamos el estado local de forma reactiva inmediata
      setInscripciones(prev => prev.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item));
    } catch (error: any) {
      alert('Error al actualizar el estado: ' + error.message);
    }
  }

  // Cálculos dinámicos de métricas sobre la data original de Supabase
  const totalCupos = inscripciones.reduce((sum, item) => item.estado === 'Pagado' ? sum + item.cupos : sum, 0);
  const totalRecaudado = inscripciones.reduce((sum, item) => item.estado === 'Pagado' ? sum + item.total : sum, 0);
  const pendientesEfectivo = inscripciones.filter(item => item.estado === 'Pendiente Efectivo').length;
  const porVerificar = inscripciones.filter(item => item.estado === 'Por Verificar').length;

  // Filtrado inteligente en caliente
  const inscripcionesFiltradas = inscripciones.filter((item) => {
    const termino = busqueda.toLowerCase();
    const ticketStr = obtenerCodigoTicket(item).toLowerCase();
    const digitosAprobacion = (item.ultimos_4_digitos || '').toLowerCase();
    
    const coincideBusqueda = (
      item.responsable.toLowerCase().includes(termino) ||
      item.telefono.includes(termino) ||
      ticketStr.includes(termino) ||
      digitosAprobacion.includes(termino)
    );

    if (filtroEstado === 'todos') return coincideBusqueda;
    return coincideBusqueda && item.estado === filtroEstado;
  });

  const manejarImpresion = (item: Inscripcion) => {
    setTicketParaImprimir(item);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const imprimirReporteCompleto = () => {
    window.print();
  };

  const exportarExcel = () => {
    if (inscripcionesFiltradas.length === 0) {
      alert("No hay datos en la lista actual para exportar.");
      return;
    }

    const headers = ["Ticket", "Responsable", "Telefono", "Cupos", "Acompanantes", "Total (Q)", "Metodo / Ref", "Estado"];
    
    const rows = inscripcionesFiltradas.map(item => [
      `"${obtenerCodigoTicket(item)}"`,
      `"${item.responsable.replace(/"/g, '""')}"`,
      `="${item.telefono}"`, // Fuerza a Excel a tratarlo como texto puro y no truncar ceros iniciales
      item.cupos,
      `"${(item.acompanantes || '').replace(/"/g, '""')}"`,
      item.total,
      `"${item.ultimos_4_digitos ? `Transferencia (Ref: ${item.ultimos_4_digitos})` : "En Efectivo"}"`,
      `"${item.estado}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Almuerzo_Varones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-4">
        <div className="bg-[#111827] p-8 rounded-3xl border border-slate-800 max-w-sm w-full shadow-2xl text-center">
          <div dangerouslySetInnerHTML={{ __html: LOGO_ROCA_ETERNA_SVG }} className="mb-4" />
          <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2">Acceso Restringido</h2>
          <p className="text-xs text-slate-400 mb-6">Ingresa la contraseña para ver el panel de administración.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070a13] border border-slate-800 rounded-xl px-4 py-3 text-sm text-center text-slate-200 focus:outline-none focus:border-amber-500 transition-all"
              />
              {errorPassword && <p className="text-red-400 text-xs mt-2">{errorPassword}</p>}
            </div>
            <button type="submit" className="w-full bg-amber-500 text-black font-black py-3 rounded-xl uppercase tracking-wider text-xs hover:bg-amber-400 transition-colors">
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 p-4 md:p-8 font-sans selection:bg-amber-500 selection:text-black">
      
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* SECCIÓN IMPRESIÓN INDIVIDUAL BOLETO */}
      {ticketParaImprimir && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-8 print:z-[99999]">
          <div style={{ border: '2px dashed #000', padding: '25px', maxWidth: '380px', margin: '0 auto', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: LOGO_ROCA_ETERNA_SVG }} />
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
              <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#444', letterSpacing: '1.5px' }}>ROCA ETERNA MINISTERIOS</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', letterSpacing: '0.5px' }}>ALMUERZO DE VARONES</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>Comprobante Oficial de Registro</p>
            </div>
            <div style={{ fontSize: '34px', fontWeight: '900', margin: '18px 0', color: '#b45309', fontFamily: 'monospace' }}>
              {obtenerCodigoTicket(ticketParaImprimir)}
            </div>
            <div style={{ margin: '15px 0', fontSize: '14px', lineHeight: '1.7', textAlign: 'left', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
              <strong>Responsable:</strong> {ticketParaImprimir.responsable}<br />
              <strong>Teléfono:</strong> {ticketParaImprimir.telefono}<br />
              <strong>Cupos apartados:</strong> {ticketParaImprimir.cupos}<br />
              {ticketParaImprimir.acompanantes ? <><strong>Acompañantes:</strong> {ticketParaImprimir.acompanantes}<br /></> : ''}
              <strong>Total:</strong> Q{ticketParaImprimir.total}.00<br />
              <strong>Método:</strong> {ticketParaImprimir.ultimos_4_digitos ? `Transferencia (Ref: ${ticketParaImprimir.ultimos_4_digitos})` : 'En Efectivo'}<br />
              <strong>Estado:</strong> {ticketParaImprimir.estado === 'Pendiente Efectivo' ? 'Pendiente en Efectivo' : ticketParaImprimir.estado}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
              Generado el {fechaReporte || '—'}<br />
              Control de Entrada • Iglesia Roca Eterna
            </div>
          </div>
        </div>
      )}

      {/* VISTA EXCLUSIVA PARA IMPRESIÓN DEL REPORTE COMPLETO */}
      <div className="hidden print:block text-black bg-white p-4">
        <h1 className="text-xl font-bold uppercase text-center border-b pb-2">Reporte General de Inscripciones - Almuerzo de Varones</h1>
        <p className="text-xs text-center text-gray-600 mt-1 mb-4">
          Generado el: {fechaReporte || '—'} - Iglesia Roca Eterna
        </p>
        <table className="w-full text-left text-xs border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Ticket</th>
              <th className="border border-gray-300 p-2">Responsable</th>
              <th className="border border-gray-300 p-2">Teléfono</th>
              <th className="border border-gray-300 p-2 text-center">Cupos</th>
              <th className="border border-gray-300 p-2">Total</th>
              <th className="border border-gray-300 p-2">Pago / Ref</th>
              <th className="border border-gray-300 p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {inscripcionesFiltradas.map(item => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-2 font-mono font-bold">{obtenerCodigoTicket(item)}</td>
                <td className="border border-gray-300 p-2 font-bold">{item.responsable}</td>
                <td className="border border-gray-300 p-2 font-mono">{item.telefono}</td>
                <td className="border border-gray-300 p-2 text-center">{item.cupos}</td>
                <td className="border border-gray-300 p-2">Q{item.total}.00</td>
                <td className="border border-gray-300 p-2">{item.ultimos_4_digitos ? `Transf. (${item.ultimos_4_digitos})` : 'En Efectivo'}</td>
                <td className="border border-gray-300 p-2">{item.estado === 'Pendiente Efectivo' ? 'Pendiente en Efectivo' : item.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DASHBOARD PRINCIPAL EN PANTALLA */}
      <div className="max-w-7xl mx-auto space-y-6 print:hidden">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Panel de Control Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Administración y validación de entradas para el Almuerzo de Varones</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportarExcel} className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/10">
              📊 Exportar Excel (.csv)
            </button>
            <button onClick={imprimirReporteCompleto} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
              🖨️ Imprimir Reporte
            </button>
            <button onClick={fetchInscripciones} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold transition-all">
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111827]/40 border border-slate-800/60 p-4 rounded-2xl cursor-pointer hover:border-amber-500/20 transition-all" onClick={() => setFiltroEstado('todos')}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cupos Confirmados</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{totalCupos} <span className="text-xs text-slate-500 font-normal">Varones</span></p>
          </div>
          <div className="bg-[#111827]/40 border border-slate-800/60 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Recaudado</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">Q{totalRecaudado}</p>
          </div>
          <div className="bg-[#111827]/40 border border-slate-800/60 p-4 rounded-2xl cursor-pointer hover:border-amber-500/30 transition-all" onClick={() => setFiltroEstado('Pendiente Efectivo')}>
            <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">⚠️ Pendientes en Efectivo</p>
            <p className="text-2xl font-black text-white mt-1">{pendientesEfectivo} <span className="text-xs text-slate-500 font-normal">por cobrar</span></p>
          </div>
          <div className="bg-[#111827]/40 border border-slate-800/60 p-4 rounded-2xl cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => setFiltroEstado('Por Verificar')}>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">🔍 Por Verificar Transf.</p>
            <p className="text-2xl font-black text-white mt-1">{porVerificar} <span className="text-xs text-slate-500 font-normal">en espera</span></p>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="bg-[#111827]/40 border border-slate-800/60 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 text-sm">🔍</span>
            <input
              type="text" placeholder="Buscar por nombre, teléfono, ticket o últimos 4 dígitos..."
              className="w-full bg-[#070a13]/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-[#070a13]/60 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {['todos', 'Pagado', 'Pendiente Efectivo', 'Por Verificar'].map((estado) => (
              <button
                key={estado} type="button" onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filtroEstado === estado ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {estado === 'todos' ? 'Todos' : estado === 'Pagado' ? 'Pagados' : estado === 'Pendiente Efectivo' ? 'Efectivo' : 'Transf.'}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE CONTROL ADMINISTRATIVO */}
        <div className="bg-[#111827]/40 border border-slate-800/60 rounded-3xl shadow-xl overflow-hidden">
          {cargando ? (
            <div className="text-center py-12 text-xs font-bold text-slate-500 animate-pulse">Cargando registros de base de datos...</div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-slate-500">No se encontraron inscripciones con el filtro seleccionado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#070a13]/60 border-b border-slate-800 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                    <th className="p-4 pl-6">Ticket</th>
                    <th className="p-4">Varón Responsable</th>
                    <th className="p-4">Teléfono</th>
                    <th className="p-4 text-center">Cupos</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Detalle Pago</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {inscripcionesFiltradas.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 pl-6 font-mono font-black text-amber-500">{obtenerCodigoTicket(item)}</td>
                      <td className="p-4 font-bold text-slate-200">
                        {item.responsable}
                        {item.acompanantes && <span className="block text-[10px] font-normal text-slate-500 mt-0.5 italic max-w-xs truncate">Acomp: {item.acompanantes}</span>}
                      </td>
                      <td className="p-4 text-slate-400 font-mono">{item.telefono}</td>
                      <td className="p-4 text-center font-bold text-slate-300">{item.cupos}</td>
                      <td className="p-4 font-black text-emerald-400">Q{item.total}</td>
                      <td className="p-4">
                        {item.ultimos_4_digitos ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">
                              🏦 Ref: {item.ultimos_4_digitos}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider bg-amber-500/5 px-2 py-1 rounded-md border border-amber-500/10">
                            💵 En Efectivo
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${item.estado === 'Pagado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : item.estado === 'Por Verificar' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {item.estado === 'Pendiente Efectivo' ? 'Pendiente en Efectivo' : item.estado}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                        <button type="button" onClick={() => manejarImpresion(item)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all">
                          🖨️ PDF
                        </button>
                        
                        {item.estado !== 'Pagado' ? (
                          <button type="button" onClick={() => cambiarEstado(item.id, 'Pagado')} className="bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-lg font-black text-[11px] transition-all">
                            ✓ Aprobar
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => cambiarEstado(item.id, item.ultimos_4_digitos ? 'Por Verificar' : 'Pendiente Efectivo')} 
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-500 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all"
                          >
                            Revertir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}