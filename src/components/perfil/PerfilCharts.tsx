'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts'

type DayData = { dia: string; partes: number }
type StatusData = { name: string; value: number }
type TechData = { nombre: string; partes: number }
type ModeloData = { modelo: string; count: number }
type RepuestoData = { name: string; count: number }
type TasaConversion = { total: number; aceptados: number; pct: number }

type Props = {
  porDia: DayData[]
  porEstado: StatusData[]
  porTecnico?: TechData[]
  isAdmin: boolean
  topModelos?: ModeloData[]
  topRepuestos?: RepuestoData[]
  tasaConversion?: TasaConversion
  tiempoMedioResolucion?: number | null
}

const COLORS = {
  blue: '#0a3a54',
  orange: '#f85a2b',
  green: '#22c55e',
  gray: '#e5e7eb',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs font-bold text-mp-blue">
      {label && <p className="text-gray-400 font-medium mb-0.5">{label}</p>}
      <p>{payload[0].value} {payload[0].value === 1 ? 'parte' : 'partes'}</p>
    </div>
  )
}

function CountTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs font-bold text-mp-blue">
      {label && <p className="text-gray-400 font-medium mb-0.5 truncate max-w-32">{label}</p>}
      <p>{payload[0].value}</p>
    </div>
  )
}

export default function PerfilCharts({
  porDia,
  porEstado,
  porTecnico,
  isAdmin,
  topModelos,
  topRepuestos,
  tasaConversion,
  tiempoMedioResolucion,
}: Props) {
  return (
    <div className="space-y-4">

      {/* Partes por día */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
          Actividad — últimos 7 días
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={porDia} barSize={20} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="dia"
              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 8 }} />
            <Bar dataKey="partes" fill={COLORS.orange} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Estado */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
          Estado de partes
        </p>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={porEstado}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {porEstado.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#cc0000' : COLORS.green} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1">
            {porEstado.map((entry, i) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: i === 0 ? '#cc0000' : COLORS.green }}
                  />
                  <span className="text-xs text-gray-500 font-medium">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-mp-blue">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasa de conversión */}
      {tasaConversion && tasaConversion.total > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
            Tasa de conversión
          </p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-black text-mp-blue">{tasaConversion.pct}%</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Aceptación</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total presupuestos</span>
                <span className="text-sm font-black text-mp-blue">{tasaConversion.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Aceptados</span>
                <span className="text-sm font-black text-green-600">{tasaConversion.aceptados}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${tasaConversion.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tiempo medio resolución */}
      {tiempoMedioResolucion !== null && tiempoMedioResolucion !== undefined && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
            Tiempo medio de resolución
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-mp-blue">{tiempoMedioResolucion}</span>
            <span className="text-sm font-bold text-gray-400 mb-1">días</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Calculado sobre partes finalizados</p>
        </div>
      )}

      {/* Modelos más frecuentes */}
      {topModelos && topModelos.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
            Modelos más frecuentes
          </p>
          <ResponsiveContainer width="100%" height={topModelos.length * 44 + 16}>
            <BarChart
              data={topModelos}
              layout="vertical"
              barSize={16}
              margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="modelo"
                tick={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CountTooltip />} cursor={{ fill: '#f3f4f6', radius: 8 }} />
              <Bar dataKey="count" fill={COLORS.orange} radius={[0, 6, 6, 0]}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#f85a2b' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Repuestos más usados */}
      {topRepuestos && topRepuestos.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
            Repuestos más usados
          </p>
          <ResponsiveContainer width="100%" height={topRepuestos.length * 44 + 16}>
            <BarChart
              data={topRepuestos}
              layout="vertical"
              barSize={16}
              margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip content={<CountTooltip />} cursor={{ fill: '#f3f4f6', radius: 8 }} />
              <Bar dataKey="count" fill={COLORS.blue} radius={[0, 6, 6, 0]}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#0a3a54' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Por técnico — solo admin */}
      {isAdmin && porTecnico && porTecnico.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">
            Partes por técnico
          </p>
          <ResponsiveContainer width="100%" height={porTecnico.length * 44 + 16}>
            <BarChart
              data={porTecnico}
              layout="vertical"
              barSize={16}
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 8 }} />
              <Bar dataKey="partes" fill={COLORS.blue} radius={[0, 6, 6, 0]}>
                <LabelList dataKey="partes" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#0a3a54' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
