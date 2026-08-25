import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Plus, Trash2, Settings, Download, AlertCircle, Info, Calculator, FileText, Globe, Copy, CheckCircle2 } from 'lucide-react';
import { materials, supportTypes, loadTypes, defaultSupports } from './constants';
import { analyzeBeam } from './calculations';
import { buildExportData, buildReportText, buildPdfText, downloadJson, downloadText } from './reporting';
import { Load, Support } from './types';
import { exportDiagramsCsv } from './csv';

const translations = {
  es: {
    title: 'Analisis Estructural Profesional',
    subtitle: 'Software de Ingenieria para Vigas y Estructuras',
    info: 'Mostrar Info',
    hideInfo: 'Ocultar Info',
    report: 'Reporte',
    pdf: 'PDF',
    export: 'Exportar',
    csv: 'CSV',
    share: 'Copiar enlace',
  },
  en: {
    title: 'Professional Structural Analysis',
    subtitle: 'Engineering software for beams and structures',
    info: 'Show Info',
    hideInfo: 'Hide Info',
    report: 'Report',
    pdf: 'PDF',
    export: 'Export',
    csv: 'CSV',
    share: 'Copy link',
  },
};

type PersistedState = {
  beamLength?: number;
  beamMaterial?: string;
  crossSection?: string;
  width?: number;
  height?: number;
  supports?: Support[];
  loads?: Load[];
  includeSelfWeight?: boolean;
  loadFactor?: number;
  effectiveLengthFactor?: number;
  analysisNotes?: string;
};

function HeaderBar({ showReport, toggleReport, handleGenerateReport, handleExport, handleExportPdf, handleExportCsv, handleCopyLink, results, lang, setLang }) {
  const t = translations[lang];
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-500/20 rounded-xl">
          <Settings className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{t.title}</h1>
          <p className="text-slate-300 mt-1">{t.subtitle}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg transition-all shadow-md shadow-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
          aria-label="Cambiar idioma / Change language"
        >
          <Globe className="w-4 h-4" />
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
        <button
          onClick={toggleReport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg transition-all shadow-md shadow-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
          aria-pressed={showReport}
        >
          <Info className="w-4 h-4" />
          {showReport ? t.hideInfo : t.info}
        </button>
        <button
          onClick={handleGenerateReport}
          disabled={!results}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-cyan-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
          aria-disabled={!results}
        >
          <FileText className="w-4 h-4" />
          {t.report}
        </button>
        <button
          onClick={handleExportPdf}
          disabled={!results}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-indigo-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
          aria-disabled={!results}
        >
          <FileText className="w-4 h-4" />
          {t.pdf}
        </button>
        <button
          onClick={handleExport}
          disabled={!results}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-emerald-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
          aria-disabled={!results}
        >
          <Download className="w-4 h-4" />
          {t.export}
        </button>
        <button
          onClick={() => handleExportCsv()}
          disabled={!results}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-slate-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
          aria-disabled={!results}
        >
          <Download className="w-4 h-4" />
          {t.csv}
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all shadow-md shadow-slate-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
          aria-label={t.share}
        >
          <Copy className="w-4 h-4" />
          {t.share}
        </button>
      </div>
    </div>
  );
}

function InfoPanel({ showReport, analysisNotes, setAnalysisNotes }) {
  if (!showReport) return null;
  return (
    <div className="mb-6 bg-slate-800/60 rounded-xl p-4 border border-blue-500/40 shadow-lg shadow-slate-900/40">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-400" />
        Informacion del Analisis
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-slate-400 mb-1">Alcance del Modelo</div>
          <div className="text-white">Viga con dos apoyos verticales simples</div>
        </div>
        <div>
          <div className="text-slate-400 mb-1">Metodo de Analisis</div>
          <div className="text-white">Euler-Bernoulli e integracion numerica M/EI</div>
        </div>
        <div>
          <div className="text-slate-400 mb-1">Hipotesis</div>
          <div className="text-white">Pequenas deformaciones, material lineal elastico</div>
        </div>
      </div>
      <div className="mt-3">
        <label className="block text-sm text-slate-300 mb-2">Notas del Analisis</label>
        <textarea
          value={analysisNotes}
          onChange={(e) => setAnalysisNotes(e.target.value)}
          placeholder="Agregue notas, consideraciones especiales, o comentarios sobre el analisis..."
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          rows={2}
        />
      </div>
    </div>
  );
}

function GeometryCard({
  beamLength,
  setBeamLength,
  beamMaterial,
  setBeamMaterial,
  materials,
  crossSection,
  setCrossSection,
  width,
  setWidth,
  height,
  setHeight,
  includeSelfWeight,
  setIncludeSelfWeight,
  loadFactor,
  setLoadFactor,
  effectiveLengthFactor,
  setEffectiveLengthFactor,
}) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70 shadow-lg shadow-slate-900/40">
      <h2 className="text-lg font-semibold text-white mb-3">Geometria de la Viga</h2>
      
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-2" aria-label="Longitud de la viga">Longitud (m)</label>
            <input
              type="number"
              value={beamLength}
              onChange={(e) => setBeamLength(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
              min="0.1"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2" aria-label="Material">Material</label>
            <select
              value={beamMaterial}
              onChange={(e) => setBeamMaterial(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
            >
              {Object.entries(materials as Record<string, { name: string }>).map(([key, mat]) => (
                <option key={key} value={key}>{mat.name}</option>
              ))}
            </select>
          <div className="mt-2 text-xs text-slate-400 space-y-1">
            <div>E: {(materials[beamMaterial].E / 1e9).toFixed(0)} GPa</div>
            <div>sigma y: {(materials[beamMaterial].yieldStrength / 1e6).toFixed(0)} MPa</div>
            <div>rho: {materials[beamMaterial].density} kg/m3</div>
          </div>
        </div>

        <div>
            <label className="block text-sm text-slate-300 mb-2" aria-label="Seccion transversal">Seccion Transversal</label>
            <select
              value={crossSection}
              onChange={(e) => setCrossSection(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
            >
              <option value="rectangular">Rectangular</option>
              <option value="circular">Circular</option>
              <option value="I-beam">Viga I (Perfil IPE)</option>
              <option value="T-beam">Viga T</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                {crossSection === 'circular' ? 'Diametro (m)' : 'b (m)'}
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0.01)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
                min="0.01"
                step="0.01"
              />
            </div>
            {crossSection !== 'circular' && (
              <div>
                <label className="block text-sm text-slate-300 mb-2">h (m)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0.01)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
                  min="0.01"
                  step="0.01"
                />
              </div>
            )}
          </div>
        <div className="text-[11px] text-slate-500 pt-1">
          Unidades: longitudes en metros, carga en kN o kN/m segun tipo.
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Factor global de carga</label>
            <input
              type="number"
              value={loadFactor}
              onChange={(e) => setLoadFactor(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
              min="0.5"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Factor de longitud efectiva (K)</label>
            <input
              type="number"
              value={effectiveLengthFactor}
              onChange={(e) => setEffectiveLengthFactor(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
              min="0.5"
              step="0.1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            id="self-weight"
            type="checkbox"
            checked={includeSelfWeight}
            onChange={(e) => setIncludeSelfWeight(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="self-weight" className="text-sm text-slate-200">Incluir peso propio</label>
        </div>
      </div>
    </div>
  );
}

function LoadSystemCard({
  loads,
  loadTypes,
  addLoad,
  updateLoad,
  removeLoad,
  runAnalysis,
  results,
  beamLength,
  applyPreset,
}) {
  const addMidspanPointLoad = () => {
    addLoad({ type: 'point', position: beamLength / 2, magnitude: 10, angle: 90 });
  };

  const addFullUniformLoad = () => {
    addLoad({ type: 'distributed', position: 0, endPosition: beamLength, magnitude: 5 });
  };

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70 shadow-lg shadow-slate-900/40">
      <h2 className="text-lg font-semibold text-white mb-3">Sistema de Cargas</h2>
      <button
        onClick={addLoad}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mb-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
      >
        <Plus className="w-4 h-4" />
        Agregar Carga
      </button>
      <div className="preset-grid mb-3">
        <button
          onClick={addMidspanPointLoad}
          className="flex-1 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
        >
          Punto en medio
        </button>
        <button
          onClick={addFullUniformLoad}
          className="flex-1 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
        >
          Uniforme L
        </button>
        <button
          onClick={() => applyPreset('simple')}
          className="flex-1 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
        >
          Simple
        </button>
        <button
          onClick={() => applyPreset('uniform')}
          className="flex-1 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
        >
          Uniforme
        </button>
        <button
          onClick={() => applyPreset('mixed')}
          className="flex-1 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
        >
          Mixta
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {loads.map((load, index) => (
          <div key={load.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-400">#{index + 1}</span>
                <span className="text-[10px] text-slate-500">({load.type})</span>
                <select
                  value={load.type}
                  onChange={(e) => updateLoad(load.id, 'type', e.target.value)}
                  className="text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
                >
                  {loadTypes.map(lt => (
                    <option key={lt.type} value={lt.type}>{lt.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeLoad(load.id)}
                className="p-1 hover:bg-red-500/20 rounded"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
            
            <div className="space-y-2">
              <input
                type="number"
                value={load.position}
                onChange={(e) => updateLoad(load.id, 'position', parseFloat(e.target.value) || 0)}
                placeholder="Inicio (m)"
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
                step="0.1"
              />
              {(load.type === 'distributed' || load.type === 'triangular') && (
                <input
                  type="number"
                  value={load.endPosition}
                  onChange={(e) => updateLoad(load.id, 'endPosition', parseFloat(e.target.value) || 0)}
                  placeholder="Fin (m)"
                  className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
                  step="0.1"
                />
              )}
              <input
                type="number"
                value={load.magnitude}
                onChange={(e) => updateLoad(load.id, 'magnitude', parseFloat(e.target.value) || 0)}
                placeholder={`Magnitud (${loadTypes.find(lt => lt.type === load.type)?.unit})`}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
                step="0.1"
              />
              {load.type === 'point' && (
                <input
                  type="number"
                  value={load.angle || 90}
                  onChange={(e) => updateLoad(load.id, 'angle', parseFloat(e.target.value) || 90)}
                  placeholder="Angulo (deg)"
                  className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
                  min="0"
                  max="180"
                  step="1"
                />
              )}
            </div>
          </div>
        ))}
        {loads.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-4" aria-live="polite">
            No hay cargas aplicadas
          </div>
        )}
      </div>
      <div className="text-[11px] text-slate-500 mt-1">
        Cargas en kN, distribuidas/triangulares en kN/m, angulos en grados.
      </div>

        <button
          onClick={runAnalysis}
          disabled={loads.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all transform hover:scale-105 disabled:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 focus-visible:outline-offset-2"
        >
          <Calculator className="w-5 h-5" />
          Calcular Analisis
        </button>
      <div className="text-[11px] text-slate-500 mt-2">
        Atajos: A = agregar carga, P = punto medio, U = carga uniforme
      </div>

      {results && (
        <div className="space-y-3 mt-3">
          <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-green-500/30">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5" />
              Factor de Seguridad
            </h3>
            <div className="text-center">
              <div className={`text-4xl font-bold ${
                parseFloat(results.safetyFactor) >= 2 ? 'text-green-400' :
                parseFloat(results.safetyFactor) >= 1.5 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {results.safetyFactor}
              </div>
              <div className="text-xs text-slate-300 mt-2">
                {parseFloat(results.safetyFactor) >= 2 ? ' Diseno Seguro' :
                 parseFloat(results.safetyFactor) >= 1.5 ? ' Revisar Diseno' :
                 ' Refuerzo Necesario'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                FS Ultimo: {results.ultimateSafetyFactor}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/70 shadow-inner shadow-slate-900/30">
            <h3 className="text-sm font-semibold text-white mb-2">Propiedades</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Area:</span>
                <span className="text-white font-mono">{results.area} cm2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inercia:</span>
                <span className="text-white font-mono">{results.I} cm4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Eje neutro:</span>
                <span className="text-white font-mono">{results.centroid} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Modulo W:</span>
                <span className="text-white font-mono">{results.sectionModulus} cm3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Peso:</span>
                <span className="text-white font-mono">{results.weight} kN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Utilizacion:</span>
                <span className={`font-mono ${
                  parseFloat(results.utilizationRatio) > 80 ? 'text-red-400' :
                  parseFloat(results.utilizationRatio) > 60 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>{results.utilizationRatio}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/70 shadow-inner shadow-slate-900/30">
            <h3 className="text-sm font-semibold text-white mb-2">Analisis de Pandeo</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Pcr:</span>
                <span className="text-white font-mono">{results.buckling.criticalLoad} kN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lambda:</span>
                <span className="text-white font-mono">{results.buckling.slendernessRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Riesgo:</span>
                <span className={`font-semibold ${
                  results.buckling.bucklingRisk === 'Bajo' ? 'text-green-400' :
                  results.buckling.bucklingRisk === 'Medio' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>{results.buckling.bucklingRisk}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SupportsCard({ supports, supportTypes, beamLength, updateSupport }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/70 shadow-lg shadow-slate-900/40">
      <h2 className="text-lg font-semibold text-white mb-3">Apoyos simples</h2>
      <div className="text-xs text-slate-400 mb-2">
        El solver admite dos reacciones verticales en posiciones distintas, incluso con voladizos exteriores.
      </div>
      <div className="space-y-2">
        {supports.map((support) => (
          <div key={support.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-purple-400">#{support.id}</span>
              <select
                value={support.type}
                onChange={(e) => updateSupport(support.id, 'type', e.target.value)}
                className="text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
              >
                {supportTypes.map((s) => (
                  <option key={s.type} value={s.type}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Posicion (m)</label>
              <input
                type="number"
                value={support.position}
                onChange={(e) => updateSupport(support.id, 'position', parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
                min="0"
                max={beamLength}
                step="0.1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelSection({ beamLength, supports, supportTypes, loads }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 shadow-lg shadow-slate-900/40">
      <h2 className="text-xl font-semibold text-white mb-4">Modelo Estructural</h2>
      
      <div className="relative bg-slate-900/50 rounded-lg p-8 min-h-[300px]">
        <svg width="100%" height="250" viewBox="0 0 1000 250">
          <rect x="50" y="100" width={900 * (beamLength / (beamLength + 1))} height="20" fill="#64748b" />
          
          <text x="50" y="140" fill="#94a3b8" fontSize="12">0</text>
          <text x={50 + 900 * (beamLength / (beamLength + 1))} y="140" fill="#94a3b8" fontSize="12">{beamLength}m</text>
          {supports.map(support => {
            const x = 50 + (support.position / beamLength) * 900 * (beamLength / (beamLength + 1));
            const supportType = supportTypes.find(s => s.type === support.type);
            
            if (support.type === 'fixed') {
              return (
                <g key={support.id}>
                  <rect x={x - 5} y="85" width="10" height="50" fill="#ef4444" />
                  <line x1={x - 5} y1="85" x2={x - 15} y2="75" stroke="#ef4444" strokeWidth="2" />
                  <line x1={x + 5} y1="85" x2={x + 15} y2="75" stroke="#ef4444" strokeWidth="2" />
                  <text x={x} y="170" fill="#ef4444" fontSize="16" textAnchor="middle">{supportType.symbol}</text>
                </g>
              );
            } else if (support.type === 'pinned') {
              return (
                <g key={support.id}>
                  <polygon points={`${x},120 ${x-15},135 ${x+15},135`} fill="#22c55e" />
                  <circle cx={x} cy="110" r="5" fill="#22c55e" stroke="#fff" strokeWidth="1" />
                  <text x={x} y="170" fill="#22c55e" fontSize="16" textAnchor="middle">{supportType.symbol}</text>
                </g>
              );
            } else {
              return (
                <g key={support.id}>
                  <circle cx={x} cy="130" r="10" fill="#3b82f6" />
                  <line x1={x - 10} y1="145" x2={x + 10} y2="145" stroke="#3b82f6" strokeWidth="3" />
                  <text x={x} y="170" fill="#3b82f6" fontSize="16" textAnchor="middle">{supportType.symbol}</text>
                </g>
              );
            }
          })}
          
          {loads.map((load, idx) => {
            const maxMag = Math.max(...loads.map(l => l.magnitude || 0), 1);
            const scale = 50 * (load.magnitude || 0) / maxMag + 30;
            const x = 50 + (load.position / beamLength) * 900 * (beamLength / (beamLength + 1));
            
            if (load.type === 'point') {
              return (
                <g key={load.id}>
                  <line x1={x} y1={100 - scale} x2={x} y2="100" stroke="#eab308" strokeWidth="3" markerEnd="url(#arrowhead)" />
                  <text x={x} y="20" fill="#eab308" fontSize="11" textAnchor="middle">F{idx+1}={load.magnitude}kN</text>
                </g>
              );
            } else if (load.type === 'distributed') {
              const x2 = 50 + (load.endPosition / beamLength) * 900 * (beamLength / (beamLength + 1));
              const arrows: ReactNode[] = [];
              for (let i = x; i <= x2; i += 25) {
                arrows.push(
                  <line key={`arrow-${i}`} x1={i} y1={100 - scale / 2} x2={i} y2="100" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrowhead2)" />
                );
              }
              return (
                <g key={load.id}>
                  {arrows}
                  <line x1={x} y1={100 - scale / 2} x2={x2} y2={100 - scale / 2} stroke="#f97316" strokeWidth="2" />
                  <text x={(x + x2) / 2} y="30" fill="#f97316" fontSize="11" textAnchor="middle">w={load.magnitude}kN/m</text>
                </g>
              );
            } else if (load.type === 'triangular') {
              const x2 = 50 + (load.endPosition / beamLength) * 900 * (beamLength / (beamLength + 1));
              const arrows: ReactNode[] = [];
              const numArrows = 8;
              for (let i = 0; i <= numArrows; i++) {
                const xi = x + (x2 - x) * (i / numArrows);
                const yi = 70 - 30 * (i / numArrows);
                arrows.push(
                  <line key={`arrow-${i}`} x1={xi} y1={yi} x2={xi} y2="100" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead4)" />
                );
              }
              return (
                <g key={load.id}>
                  {arrows}
                  <line x1={x} y1="70" x2={x2} y2="40" stroke="#06b6d4" strokeWidth="2" />
                  <text x={(x + x2) / 2} y="30" fill="#06b6d4" fontSize="11" textAnchor="middle">w={load.magnitude}kN/m</text>
                </g>
              );
            } else {
              return (
                <g key={load.id}>
                  <path d={`M ${x} 80 A 30 30 0 0 1 ${x} 120`} stroke="#a855f7" strokeWidth="3" fill="none" markerEnd="url(#arrowhead3)" />
                  <text x={x + 40} y="100" fill="#a855f7" fontSize="11">M={load.magnitude}kNm</text>
                </g>
              );
            }
          })}
          
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill="#eab308" />
            </marker>
            <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill="#f97316" />
            </marker>
            <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill="#a855f7" />
            </marker>
            <marker id="arrowhead4" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill="#06b6d4" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function ResultsSection({ showResults, results, materials, beamMaterial }) {
  const [chartLibrary, setChartLibrary] = useState<typeof import('recharts')>();

  useEffect(() => {
    if (chartLibrary) return undefined;
    if (!showResults) return undefined;
    if (!results) return undefined;

    let cancelled = false;
    void import('recharts').then((module) => {
      if (!cancelled) setChartLibrary(module);
    });

    return () => {
      cancelled = true;
    };
  }, [showResults, results, chartLibrary]);

  if (!showResults) return null;
  if (!results) return null;
  if (!chartLibrary) {
    return (
      <div className={'bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 text-sm text-slate-300'}>
        Preparando diagramas interactivos...
      </div>
    );
  }

  const {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    AreaChart,
    Area,
  } = chartLibrary;

  return (
    <>
      <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 shadow-lg shadow-slate-900/40">
        <h2 className="text-xl font-semibold text-white mb-4">Reacciones y Esfuerzos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">R1</div>
            <div className="text-xl font-bold text-red-400">{results.reactions.R1} kN</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">R2</div>
            <div className="text-xl font-bold text-blue-400">{results.reactions.R2} kN</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Vmax</div>
            <div className="text-xl font-bold text-green-400">{results.maxShear} kN</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">Mmax</div>
            <div className="text-xl font-bold text-purple-400">{results.maxMoment} kNm</div>
            <div className="text-xs text-slate-500">x = {results.maxMomentLocation} m</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">sigma max</div>
            <div className="text-xl font-bold text-yellow-400">{results.maxStress} MPa</div>
            <div className="text-xs text-slate-500">x = {results.maxStressLocation} m</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">tau aprox.</div>
            <div className="text-xl font-bold text-orange-400">{results.shearStress} MPa</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">sigma VM</div>
            <div className="text-xl font-bold text-pink-400">{results.vonMisesStress} MPa</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-slate-400">delta max</div>
            <div className="text-xl font-bold text-cyan-400">{results.maxDeflection} mm</div>
            <div className="text-xs text-slate-500">x = {results.maxDeflectionLocation} m</div>
          </div>
        </div>
        <div className="mt-4 verification-strip">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm font-semibold text-white">Verificacion numerica: {results.verification.status}</div>
              <div className="text-xs text-slate-400">{results.verification.method}</div>
            </div>
          </div>
          <div className="verification-values">
            <span>Sum Fy: {results.verification.verticalResidual} kN</span>
            <span>Sum M: {results.verification.momentResidual} kNm</span>
            <span>delta apoyos: {results.verification.supportDeflectionResidual} mm</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 shadow-lg shadow-slate-900/40">
          <h3 className="text-lg font-semibold text-white mb-3">Diagrama de Corte (V)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={results.shearData}>
              <defs>
                <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="x" 
                stroke="#9ca3af"
                label={{ value: 'x (m)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#9ca3af"
                label={{ value: 'V (kN)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
                cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
              <Area type="monotone" dataKey="V" stroke="#22c55e" strokeWidth={2} fill="url(#colorV)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-center text-xs text-slate-400 mt-2">
            Cortante maximo: {results.maxShear} kN
          </div>
        </div>

    <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 shadow-lg shadow-slate-900/40">
          <h3 className="text-lg font-semibold text-white mb-3">Diagrama de Momento (M)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={results.momentData}>
              <defs>
                <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="x" 
                stroke="#9ca3af"
                label={{ value: 'x (m)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#9ca3af"
                label={{ value: 'M (kNm)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
                cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
              <Area type="monotone" dataKey="M" stroke="#3b82f6" strokeWidth={2} fill="url(#colorM)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-center text-xs text-slate-400 mt-2">
            Momento maximo: {results.maxMoment} kNm
          </div>
        </div>

    <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 shadow-lg shadow-slate-900/40">
          <h3 className="text-lg font-semibold text-white mb-3">Deflexion (delta)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={results.deflectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="x" 
                stroke="#9ca3af"
                label={{ value: 'x (m)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#9ca3af"
                label={{ value: 'delta (mm)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
                cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
              <ReferenceLine y={parseFloat(results.deflectionLimit)} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '+L/360', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={-parseFloat(results.deflectionLimit)} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '-L/360', fill: '#ef4444', fontSize: 10 }} />
              <Line type="monotone" dataKey="d" stroke="#eab308" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-center text-xs text-slate-400 mt-2">
            delta max: {results.maxDeflection} mm | Limite L/360: {results.deflectionLimit} mm
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 shadow-lg shadow-slate-900/40">
          <h3 className="text-lg font-semibold text-white mb-3">Esfuerzo Normal (sigma)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={results.stressData}>
              <defs>
                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="x" 
                stroke="#9ca3af"
                label={{ value: 'x (m)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#9ca3af"
                label={{ value: 'sigma (MPa)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
                cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
              />
              <ReferenceLine y={materials[beamMaterial].yieldStrength / 1e6} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'sigma y', fill: '#ef4444', fontSize: 10 }} />
              <Area type="monotone" dataKey="stress" stroke="#eab308" strokeWidth={2} fill="url(#colorStress)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-center text-xs text-slate-400 mt-2">
            sigma max: {results.maxStress} MPa | sigma y: {(materials[beamMaterial].yieldStrength / 1e6).toFixed(0)} MPa
          </div>
        </div>
      </div>
      <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700 text-xs text-slate-300 flex flex-wrap gap-4">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Corte (V)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Momento (M)</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400"></span> Deflexion</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Esfuerzo</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Referencias (0 / limites)</div>
      </div>

      <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/70 shadow-lg shadow-slate-900/40">
        <h2 className="text-xl font-semibold text-white mb-4">Conclusiones del Analisis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-green-400 mb-2"> Resistencia</h3>
            <p className="text-sm text-slate-300">
              {parseFloat(results.safetyFactor) >= 2 
                ? 'La estructura cumple con los requisitos de resistencia. Factor de seguridad adecuado para cargas de servicio.'
                : parseFloat(results.safetyFactor) >= 1.5
                ? 'ATENCION: El factor de seguridad esta por debajo del recomendado (FS  2.0). Se sugiere aumentar la seccion o cambiar el material.'
                : 'CRITICO: La estructura no es segura. El esfuerzo excede el limite de fluencia. Requiere rediseno inmediato.'}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-blue-400 mb-2"> Rigidez</h3>
            <p className="text-sm text-slate-300">
              {parseFloat(results.deflectionRatio) <= 1
                ? 'La deflexion cumple con el limite L/360. La estructura tiene rigidez adecuada para condiciones de servicio.'
                : `ADVERTENCIA: La deflexion (${results.maxDeflection} mm) excede el limite recomendado (${results.deflectionLimit} mm). Considere aumentar la rigidez.`}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-purple-500">
            <h3 className="text-sm font-semibold text-purple-400 mb-2"> Pandeo</h3>
            <p className="text-sm text-slate-300">
              {results.buckling.bucklingRisk === 'Bajo'
                ? `Riesgo de pandeo bajo (lambda = ${results.buckling.slendernessRatio}). La esbeltez es aceptable para la configuracion actual.`
                : results.buckling.bucklingRisk === 'Medio'
                ? `Riesgo de pandeo moderado (lambda = ${results.buckling.slendernessRatio}). Se recomienda considerar arriostramientos laterales.`
                : `CRITICO: Alto riesgo de pandeo (lambda = ${results.buckling.slendernessRatio}). Se requieren arriostramientos o aumento de seccion.`}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-yellow-500">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2"> Utilizacion</h3>
            <p className="text-sm text-slate-300">
              Utilizacion del material: {results.utilizationRatio}%.
              {parseFloat(results.utilizationRatio) < 50
                ? ' La seccion esta sobredimensionada. Puede optimizarse para reducir peso y costo.'
                : parseFloat(results.utilizationRatio) < 80
                ? ' Utilizacion optima del material.'
                : ' Alta utilizacion del material. Margen de seguridad reducido.'}
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 recommendation-panel rounded-lg border border-purple-500/30">
          <h3 className="text-sm font-semibold text-white mb-2"> Recomendaciones Profesionales</h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">-</span>
              <span>
                <strong>Factor de Seguridad:</strong> FS = {results.safetyFactor} 
                {parseFloat(results.safetyFactor) >= 2 ? ' (Margen elastico orientativo adecuado)' : ' (Margen elastico reducido)'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">-</span>
              <span>
                <strong>Esfuerzo de Von Mises:</strong> sigma_VM = {results.vonMisesStress} MPa considera efectos combinados de flexion y corte.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">-</span>
              <span>
                <strong>Verificacion de Serviciabilidad:</strong> La relacion deflexion/longitud es {results.deflectionRatio} 
                {parseFloat(results.deflectionRatio) <= 1 ? ' (Aceptable segun L/360)' : ' (Excede limite de servicio)'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">-</span>
              <span>
                <strong>Carga Critica de Pandeo:</strong> P_cr = {results.buckling.criticalLoad} kN. Asegurar arriostramientos apropiados.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">-</span>
              <span>
                <strong>Peso Estructural:</strong> {results.weight} kN. Considerar en el diseno de cimentaciones y conexiones.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
          <h3 className="text-sm font-semibold text-white mb-2"> Alcance y criterios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
            <div>
              <strong className="text-slate-300">Equilibrio:</strong> residuos de fuerza y momento informados con cada calculo
            </div>
            <div>
              <strong className="text-slate-300">Deflexion:</strong> integracion numerica de la curvatura M/EI
            </div>
            <div>
              <strong className="text-slate-300">Resistencia:</strong> comparacion elastica orientativa con fluencia
            </div>
            <div>
              <strong className="text-slate-300">Servicio:</strong> limite configurable de referencia L/360
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            * Este analisis es preliminar. Se requiere revision por ingeniero estructural certificado para proyectos reales.
          </p>
        </div>
      </div>
    </>
  );
}
export default function BeamAnalyzer() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [beamLength, setBeamLength] = useState(10);
  const [beamMaterial, setBeamMaterial] = useState('steel');
  const [crossSection, setCrossSection] = useState('rectangular');
  const [width, setWidth] = useState(0.1);
  const [height, setHeight] = useState(0.2);
  const [supports, setSupports] = useState<Support[]>(defaultSupports);
  const [loads, setLoads] = useState<Load[]>([]);
  const [nextLoadId, setNextLoadId] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof analyzeBeam> | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [includeSelfWeight, setIncludeSelfWeight] = useState(true);
  const [loadFactor, setLoadFactor] = useState(1.0);
  const [effectiveLengthFactor, setEffectiveLengthFactor] = useState(1.0);
  const [hydrated, setHydrated] = useState(false);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const addLoad = useCallback((preset: Partial<Load> = {}) => {
    const newLoad: Load = {
      id: nextLoadId,
      type: 'point',
      position: beamLength / 2,
      magnitude: 10,
      endPosition: beamLength / 2 + 2,
      angle: 90,
      ...preset
    };
    setLoads([...loads, newLoad]);
    setNextLoadId(nextLoadId + 1);
  }, [beamLength, loads, nextLoadId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'a') addLoad();
      if (e.key.toLowerCase() === 'p') addLoad({ type: 'point', position: beamLength / 2, magnitude: 10, angle: 90 });
      if (e.key.toLowerCase() === 'u') addLoad({ type: 'distributed', position: 0, endPosition: beamLength, magnitude: 5 });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [addLoad, beamLength]);

  const removeLoad = (id: number | string) => {
    setLoads(loads.filter(l => l.id !== id));
  };

  const updateLoad = (id: number, field: string, value: number | string) => {
    setLoads(loads.map(l => {
      if (l.id !== id) return l;
      const next = { ...l, [field]: value };
      if (field === 'position') {
        next.position = clamp(Number(value) || 0, 0, beamLength);
        if (next.type !== 'point') {
          next.endPosition = clamp(next.endPosition || next.position, next.position, beamLength);
        }
      }
      if (field === 'endPosition') {
        next.endPosition = clamp(Number(value) || 0, next.position, beamLength);
      }
      if (field === 'magnitude') {
        next.magnitude = clamp(Number(value) || 0, 0.01, 1e6);
      }
      return next;
    }));
  };

  const updateSupport = (id, field, value) => {
    setSupports(supports.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const validateInputs = () => {
    if (beamLength <= 0) return 'La longitud de la viga debe ser mayor que cero.';
    if (width <= 0 || height <= 0) return 'Las dimensiones de la seccion deben ser mayores que cero.';
    if (supports.length !== 2) return 'El analisis actual asume dos apoyos.';
    const sortedSupports = [...supports].sort((a, b) => a.position - b.position);
    if (sortedSupports.some((support) => support.type === 'fixed')) {
      return 'El solver actual no resuelve empotramientos. Use apoyos articulados o de rodillo.';
    }
    const pos0 = sortedSupports[0]?.position;
    const pos1 = sortedSupports[1]?.position;
    if (pos0 < 0 || pos1 > beamLength || pos0 === pos1) {
      return 'Las posiciones de los apoyos deben estar dentro de la viga y ser diferentes.';
    }
    for (const load of loads) {
      if (load.position < 0 || load.position > beamLength) return `La posicion de la carga ${load.id} debe estar dentro de la viga.`;
      if ((load.type === 'distributed' || load.type === 'triangular') &&
        (load.endPosition === undefined || load.endPosition <= load.position || load.endPosition > beamLength)) {
        return `El tramo de la carga ${load.id} debe estar dentro de la viga y mayor a la posicion inicial.`;
      }
      if (load.magnitude <= 0) return `La magnitud de la carga ${load.id} debe ser mayor que cero.`;
    }
    const spanLoads = loads.filter(l => l.type === 'distributed' || l.type === 'triangular');
    for (let i = 0; i < spanLoads.length; i++) {
      for (let j = i + 1; j < spanLoads.length; j++) {
        const a = spanLoads[i];
        const b = spanLoads[j];
        const overlap = Math.min(a.endPosition || 0, b.endPosition || 0) - Math.max(a.position, b.position);
        if (overlap > 0) {
          return `Las cargas ${a.id} y ${b.id} se superponen. Ajusta los tramos.`;
        }
      }
    }
    return '';
  };

  const runAnalysis = () => {
    const validationMessage = validateInputs();
    if (validationMessage) {
      setFormError(validationMessage);
      setShowResults(false);
      return;
    }
    setFormError('');
    const sortedSupports = [...supports].sort((a, b) => a.position - b.position);
    const analysis = analyzeBeam({
      beamLength,
      beamMaterial,
      crossSection,
      width,
      height,
      loads,
      materials,
      supports: sortedSupports,
      includeSelfWeight,
      loadFactor,
      effectiveLengthFactor
    });
    setResults(analysis);
    setShowResults(true);
  };

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleExport = () => {
    if (!results) return;
    const payload = buildExportData({
      beamLength,
      beamMaterial,
      materials,
      crossSection,
      width,
      height,
      supports,
      loads,
      results,
      analysisNotes,
      includeSelfWeight,
      loadFactor,
      effectiveLengthFactor
    });
    downloadJson(payload, `analisis_estructural_${Date.now()}.json`);
    showToast('Exportacion JSON lista');
  };

  const handleGenerateReport = () => {
    if (!results) return;
    const report = buildReportText({
      beamLength,
      beamMaterial,
      materials,
      crossSection,
      width,
      height,
      loads,
      loadTypes,
      supports,
      includeSelfWeight,
      loadFactor,
      effectiveLengthFactor,
      results,
      analysisNotes
    });
    downloadText(report, `reporte_estructural_${Date.now()}.txt`);
    showToast('Reporte generado');
  };

  const handleExportPdf = () => {
    if (!results) return;
    const pdfText = buildPdfText({
      beamLength,
      beamMaterial,
      materials,
      crossSection,
      width,
      height,
      loads,
      loadTypes,
      supports,
      includeSelfWeight,
      loadFactor,
      effectiveLengthFactor,
      results,
      analysisNotes
    });
    downloadText(pdfText, `reporte_estructural_${Date.now()}.pdf`);
    showToast('PDF generado');
  };

  const handleCopyLink = () => {
    try {
      const state = {
        beamLength,
        beamMaterial,
        crossSection,
        width,
        height,
        supports,
        loads,
        includeSelfWeight,
        loadFactor,
        effectiveLengthFactor,
        analysisNotes,
      };
      const encoded = encodeURIComponent(JSON.stringify(state));
      const url = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url);
      } else {
        prompt('Copia el enlace', url);
      }
      showToast('Enlace copiado');
    } catch {
      showToast('No se pudo copiar el enlace');
    }
  };

  useEffect(() => {
    // Load state from URL hash or localStorage
    try {
      const hash = window.location.hash;
      let saved: PersistedState | null = null;
      if (hash.startsWith('#state=')) {
        saved = JSON.parse(decodeURIComponent(hash.replace('#state=', ''))) as PersistedState;
      } else {
        const ls = localStorage.getItem('beam-state');
        if (ls) saved = JSON.parse(ls) as PersistedState;
      }
      if (saved) {
        setBeamLength(saved.beamLength || 10);
        setBeamMaterial(saved.beamMaterial || 'steel');
        setCrossSection(saved.crossSection || 'rectangular');
        setWidth(saved.width || 0.1);
        setHeight(saved.height || 0.2);
        setSupports(
          (saved.supports || defaultSupports).map((support: Support) => ({
            ...support,
            type: support.type === 'fixed' ? 'pinned' : support.type,
          })),
        );
        setLoads(saved.loads || []);
        setIncludeSelfWeight(saved.includeSelfWeight ?? true);
        setLoadFactor(saved.loadFactor ?? 1.0);
        setEffectiveLengthFactor(saved.effectiveLengthFactor ?? 1.0);
        setAnalysisNotes(saved.analysisNotes || '');
        setNextLoadId((saved.loads?.length || 0) + 1);
        setHydrated(true);
      }
    } catch {
      // ignore restore errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state = {
        beamLength,
        beamMaterial,
        crossSection,
        width,
        height,
        supports,
        loads,
        includeSelfWeight,
        loadFactor,
        effectiveLengthFactor,
        analysisNotes,
      };
      localStorage.setItem('beam-state', JSON.stringify(state));
      const encoded = encodeURIComponent(JSON.stringify(state));
      window.history.replaceState(null, '', `#state=${encoded}`);
    } catch {
      // ignore persist errors
    }
  }, [hydrated, beamLength, beamMaterial, crossSection, width, height, supports, loads, includeSelfWeight, loadFactor, effectiveLengthFactor, analysisNotes]);

  const applyPreset = (preset: 'simple' | 'uniform' | 'mixed') => {
    setIncludeSelfWeight(false);
    if (preset === 'simple') {
      setBeamLength(10);
      setSupports([
        { id: 1, type: 'pinned', position: 0 },
        { id: 2, type: 'roller', position: 10 },
      ]);
      setLoads([
        { id: 1, type: 'point', position: 5, magnitude: 10, angle: 90 },
      ]);
      setNextLoadId(2);
    } else if (preset === 'uniform') {
      setBeamLength(6);
      setSupports([
        { id: 1, type: 'pinned', position: 0 },
        { id: 2, type: 'roller', position: 6 },
      ]);
      setLoads([
        { id: 1, type: 'distributed', position: 0, endPosition: 6, magnitude: 3 },
      ]);
      setNextLoadId(2);
    } else if (preset === 'mixed') {
      setBeamLength(12);
      setSupports([
        { id: 1, type: 'pinned', position: 0 },
        { id: 2, type: 'roller', position: 12 },
      ]);
      setLoads([
        { id: 1, type: 'distributed', position: 0, endPosition: 6, magnitude: 4 },
        { id: 2, type: 'point', position: 9, magnitude: 8, angle: 90 },
      ]);
      setNextLoadId(3);
    }
    showToast('Preset aplicado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6">
      <div className="max-w-[1900px] mx-auto">
        <div className="bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.55)] p-6 border border-slate-700/60">
          <HeaderBar
            showReport={showReport}
            toggleReport={() => setShowReport(!showReport)}
            handleGenerateReport={handleGenerateReport}
            handleExport={handleExport}
            handleExportPdf={handleExportPdf}
            handleExportCsv={() => results && exportDiagramsCsv(results)}
            handleCopyLink={handleCopyLink}
            results={results}
            lang={lang}
            setLang={setLang}
          />
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/70 rounded-lg px-3 py-2 text-sm text-slate-200">
              <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
              <span>Factor carga: <span className="font-semibold text-white">{loadFactor}</span></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/70 rounded-lg px-3 py-2 text-sm text-slate-200">
              <span className="inline-flex h-2 w-2 rounded-full bg-indigo-400"></span>
              <span>K (pandeo): <span className="font-semibold text-white">{effectiveLengthFactor}</span></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/70 rounded-lg px-3 py-2 text-sm text-slate-200">
              <span className={`inline-flex h-2 w-2 rounded-full ${includeSelfWeight ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span>Peso propio: <span className="font-semibold text-white">{includeSelfWeight ? 'Incluido' : 'No'}</span></span>
            </div>
          </div>

          <InfoPanel
            showReport={showReport}
            analysisNotes={analysisNotes}
            setAnalysisNotes={setAnalysisNotes}
          />
          {formError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/50 border border-red-500/40 text-red-100 text-sm">
              <div className="font-semibold mb-1">Revisa los datos:</div>
              <div>{formError}</div>
            </div>
          )}
          {toast && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-900/50 border border-emerald-500/40 text-emerald-100 text-sm">
              {toast}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1 space-y-4">
              <GeometryCard
                beamLength={beamLength}
                setBeamLength={setBeamLength}
                beamMaterial={beamMaterial}
                setBeamMaterial={setBeamMaterial}
                materials={materials}
                crossSection={crossSection}
                setCrossSection={setCrossSection}
                width={width}
                setWidth={setWidth}
                height={height}
                setHeight={setHeight}
                includeSelfWeight={includeSelfWeight}
                setIncludeSelfWeight={setIncludeSelfWeight}
                loadFactor={loadFactor}
                setLoadFactor={setLoadFactor}
                effectiveLengthFactor={effectiveLengthFactor}
                setEffectiveLengthFactor={setEffectiveLengthFactor}
              />

              <SupportsCard
                supports={supports}
                supportTypes={supportTypes}
                beamLength={beamLength}
                updateSupport={updateSupport}
              />

              <LoadSystemCard
                loads={loads}
                loadTypes={loadTypes}
                addLoad={addLoad}
                updateLoad={updateLoad}
                removeLoad={removeLoad}
                runAnalysis={runAnalysis}
                results={results}
                beamLength={beamLength}
                applyPreset={applyPreset}
              />
            </div>

            <div className="xl:col-span-3 space-y-6">
              <ModelSection
                beamLength={beamLength}
                supports={supports}
                supportTypes={supportTypes}
                loads={loads}
              />
              <ResultsSection
                showResults={showResults}
                results={results}
                materials={materials}
                beamMaterial={beamMaterial}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
