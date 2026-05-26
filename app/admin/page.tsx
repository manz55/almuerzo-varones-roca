'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Inscripcion {
  id: number;
  responsable: string;
  telefono: string;
  cupos: number;
  acompanantes: string;
  total: number;
  ticket: string;
  estado: string;
  comprobante_url: string | null;
}

// SVG REDISEÑADO FIEL AL LOGO OFICIAL (Llama dorada arriba, Paloma plateada abajo)
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

export default function AdminPanel() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [ticketParaImprimir, setTicketParaImprimir] = useState<Inscripcion | null>(null);

  useEffect(() => {
    fetchInscripciones();
  }, []);

  async function fetchInscripciones() {
    try {
      setCargando(true);
      // Petición limpia sin ordenamiento en base de datos para evitar caídas de columna
      const { data, error } = await supabase
        .from('inscripciones')
        .select('*');

      if (error) throw error;

      // Ordenamos localmente por ID descendente
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
      setInscripciones(inscripciones.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item));
    } catch (error: any) {
      alert('Error al actualizar: ' + error.message);
    }
  }

  const formatTicket = (id: number) => `#VAR-${String(id).padStart(3, '0')}`;

  const inscripcionesFiltradas = inscripciones.filter((item) => {
    const termino = busqueda.toLowerCase();
    const ticketCorrelativo = formatTicket(item.id).toLowerCase();
    return (
      item.responsable.toLowerCase().includes(termino) ||
      item.telefono.includes(termino) ||
      ticketCorrelativo.includes(termino)
    );
  });

  const manejarImpresion = (item: Inscripcion) => {
    setTicketParaImprimir(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 p-4 md:p-8 font-sans">
      
      {/* SECCIÓN IMPRESIÓN */}
      {ticketParaImprimir && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-8 print:z-[99999]">
          <div style={{ border: '2px dashed #000', padding: '25px', maxWidth: '380px', margin: '0 auto', borderRadius: '12px', fontFamily: 'sans-serif', textAlign: 'center' }}>
            <div style={{ marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: LOGO_ROCA_ETERNA_SVG }} />
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
              <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#444', letterSpacing: '1.5px' }}>ROCA ETERNA MINISTERIOS</p>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '900', letterSpacing: '0.5px' }}>ALMUERZO DE VARONES</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>Comprobante Oficial de Registro</p>
            </div>
            <div style={{ fontSize: '34px', fontWeight: '900', margin: '18px 0', color: '#b45309', fontFamily: 'monospace' }}>
              {formatTicket(ticketParaImprimir.id)}
            </div>
            <div style={{ margin: '15px 0', fontSize: '14px', lineHeight: '1.7', textAlign: 'left', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
              <strong>Responsable:</strong> {ticketParaImprimir.responsable}<br />
              <strong>Teléfono:</strong> {ticketParaImprimir.telefono}<br />
              <strong>Cupos apartados:</strong> {ticketParaImprimir.cupos}<br />
              {ticketParaImprimir.acompanantes ? <><strong>Acompañantes:</strong> {ticketParaImprimir.acompanantes}<br /></> : ''}
              <strong>Total:</strong> Q{ticketParaImprimir.total}.00<br />
              <strong>Estado:</strong> {ticketParaImprimir.estado}
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
              Generado el {new Date().toLocaleDateString()}<br />
              Control de Entrada • Iglesia Roca Eterna
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL */}
      <div className="max-w-7xl mx-auto space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">Panel de Control Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Administración y validación de entradas para el Almuerzo de Varones</p>
          </div>
          <button onClick={fetchInscripciones} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all">
            🔄 Recargar Datos
          </button>
        </div>

        <div className="bg-[#111827]/40 border border-slate-800/60 p-4 rounded-2xl shadow-xl">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 text-sm">🔍</span>
            <input
              type="text" placeholder="Buscar por nombre, teléfono o correlativo (#VAR-)..."
              className="w-full bg-[#070a13]/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-[#111827]/40 border border-slate-800/60 rounded-3xl shadow-xl overflow-hidden">
          {cargando ? (
            <div className="text-center py-12 text-xs font-bold text-slate-500 animate-pulse">Cargando registros...</div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-xs font-bold text-slate-500">No se encontraron inscripciones.</div>
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
                    <th className="p-4 text-center">Comprobante</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right pr-6">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {inscripcionesFiltradas.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 pl-6 font-mono font-black text-amber-500">{formatTicket(item.id)}</td>
                      <td className="p-4 font-bold text-slate-200">
                        {item.responsable}
                        {item.acompanantes && <span className="block text-[10px] font-normal text-slate-500 mt-0.5 italic max-w-xs truncate">Acomp: {item.acompanantes}</span>}
                      </td>
                      <td className="p-4 text-slate-400 font-mono">{item.telefono}</td>
                      <td className="p-4 text-center font-bold text-slate-300">{item.cupos}</td>
                      <td className="p-4 font-black text-emerald-400">Q{item.total}</td>
                      <td className="p-4 text-center">
                        {item.comprobante_url ? (
                          <a href={item.comprobante_url} target="_blank" rel="noreferrer" className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block transition-all">
                            🖼️ Ver Foto
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Mesa (Efectivo)</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${item.estado === 'Pagado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : item.estado === 'Por Verificar' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6 space-x-2 whitespace-nowrap">
                        <button onClick={() => manejarImpresion(item)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all">
                          🖨️ PDF
                        </button>
                        
                        {item.estado !== 'Pagado' ? (
                          <button onClick={() => cambiarEstado(item.id, 'Pagado')} className="bg-emerald-500 hover:bg-emerald-400 text-black px-2.5 py-1.5 rounded-lg font-black text-[11px] transition-all">
                            Aprobar
                          </button>
                        ) : (
                          <button onClick={() => cambiarEstado(item.id, 'Pendiente')} className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-500 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all">
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