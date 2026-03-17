import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import NavigationButtons from '../../components/NavigationButtons';
import HelperTooltip from '../../components/HelperTooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MODEL_METADATA = {
    efficientnet: {
        label: 'EfficientNet-B4',
        description: 'Modelo balanceado entrenado con 15k radiografías validadas.',
        throughput: '1.8s en CPU',
        focus: 'Triaje rápido'
    },
    densenet121: {
        label: 'DenseNet121',
        description: 'Arquitectura profunda para hallazgos sutiles.',
        throughput: '3.5s en GPU',
        focus: 'Sensibilidad avanzada'
    }
};

const getModelMeta = (modelType) => {
    if (!modelType) return MODEL_METADATA.efficientnet;
    return MODEL_METADATA[modelType] || {
        label: modelType,
        description: 'Modelo personalizado registrado',
        throughput: '—',
        focus: 'Personalizado'
    };
};

export default function Report() {
    const { id } = useParams();
    const [study, setStudy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('overlay'); // 'original', 'heatmap', 'overlay', 'grid'
    const [heatmapOpacity, setHeatmapOpacity] = useState(50); // 0-100%
    const [gridData, setGridData] = useState(null);

    const GRID_SIZE = 8; // 8×8 grid

    // Compute grid intensity data from the heatmap alpha channel
    const computeGridData = useCallback(() => {
        if (!study?.heatmap) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const cellW = Math.floor(img.width / GRID_SIZE);
            const cellH = Math.floor(img.height / GRID_SIZE);
            const cells = [];
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    const data = ctx.getImageData(col * cellW, row * cellH, cellW, cellH).data;
                    let sum = 0;
                    let count = 0;
                    // Sample alpha channel (index 3) which carries Grad-CAM intensity
                    for (let i = 3; i < data.length; i += 4) {
                        sum += data[i];
                        count++;
                    }
                    const avgAlpha = count > 0 ? sum / count / 200 : 0; // max alpha was 200
                    cells.push({ row, col, intensity: Math.min(avgAlpha, 1) });
                }
            }
            setGridData(cells);
        };
        img.src = `data:image/png;base64,${study.heatmap}`;
    }, [study?.heatmap]);

    useEffect(() => {
        computeGridData();
    }, [computeGridData]);

    useEffect(() => {
        const fetchStudy = async () => {
            try {
                const { data } = await api.get(`/studies/${id}`);
                setStudy(data);
            } catch (error) {
                console.error('Error fetching study:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchStudy();
        }
    }, [id]);

    // Función para obtener la URL completa de la imagen
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        // Asegurar que tenga el protocolo y host correcto
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    };

    const determineAffectedRegion = (grid, condition) => {
        if (!grid || grid.length === 0 || condition?.toLowerCase().includes('normal')) {
            return {
                location: 'Sin anomalías',
                phrase: 'Radiografía dentro de parámetros normales. No se detectaron anomalías significativas.'
            };
        }

        // Buscar las celdas con mayor intensidad
        const maxIntensity = Math.max(...grid.map(c => c.intensity));
        if (maxIntensity < 0.15) {
            return {
                location: 'Indeterminada',
                phrase: 'No se detectó una región de atención anómala clara.'
            };
        }

        // Obtener celdas significativas (cerca del máximo)
        const activeCells = grid.filter(c => c.intensity >= maxIntensity * 0.7);

        // Promediar posiciones para obtener la zona central de atención
        const avgRow = activeCells.reduce((sum, c) => sum + c.row, 0) / activeCells.length;
        const avgCol = activeCells.reduce((sum, c) => sum + c.col, 0) / activeCells.length;

        // Lógica de pulmones (la imagen en la web suele estar en espejo del paciente, 
        // pero clásicamente la izq de la imagen es el pulmón derecho del paciente)
        // Columnas 0-3 = Pulmón Derecho, 4-7 = Pulmón Izquierdo
        // Filas: 0-2 = Superior, 3-4 = Medio, 5-7 = Inferior/Basal
        let lung = avgCol < 4 ? 'pulmón derecho' : 'pulmón izquierdo';
        let zone = '';

        if (avgRow < 3) zone = 'lóbulo superior';
        else if (avgRow < 5) zone = 'lóbulo medio';
        else zone = 'lóbulo inferior';

        // Casos que tradicionalmente bilatrales (COVID, mucho edema)
        if (activeCells.length > 15 || (condition?.toLowerCase().includes('covid'))) {
            lung = 'ambos pulmones';
            zone = 'múltiples zonas';
        }

        const exactLocation = `${zone} del ${lung}`.replace(' del ambos pulmones', ' de ambos pulmones').replace('múltiples zonas de ambos pulmones', 'múltiples zonas pulmonares');

        // Construir frase dinámica
        let phrase = '';
        const condLower = condition?.toLowerCase() || '';

        if (condLower.includes('neumonía')) {
            phrase = `Se observa opacidad focal en el ${exactLocation} sugestiva de consolidación neumónica.`;
        } else if (condLower.includes('atelectasia')) {
            phrase = `Signos de colapso pulmonar (atelectasia) detectados principalmente en el ${exactLocation}.`;
        } else if (condLower.includes('masa')) {
            phrase = `Se detecta engrosamiento o masa en el ${exactLocation}. Se recomienda evaluación adicional.`;
        } else if (condLower.includes('nódulo')) {
            phrase = `Posible imagen nodular localizada en el ${exactLocation}. Considerar seguimiento.`;
        } else if (condLower.includes('edema')) {
            phrase = `Patrón alveolar/intersticial prominente en ${exactLocation}, compatible con edema.`;
        } else if (condLower.includes('tuberculosis')) {
            phrase = `Patrón radiológico en ${exactLocation} sugestivo de infección tuberculosa.`;
        } else {
            phrase = `Anomalía detectada con mayor foco de atención de la IA en el ${exactLocation}.`;
        }

        return {
            location: exactLocation.charAt(0).toUpperCase() + exactLocation.slice(1),
            phrase
        };
    };

    const getDiagnosisInfo = (results, gridDataCache) => {
        if (!results || results.length === 0) {
            return {
                condition: 'Pendiente',
                probability: 0,
                location: 'N/A',
                description: 'Análisis en proceso'
            };
        }

        const topResult = results[0];
        const regionInfo = determineAffectedRegion(gridDataCache, topResult.condition);

        return {
            condition: topResult.condition,
            probability: topResult.probability,
            location: regionInfo.location,
            description: regionInfo.phrase
        };
    };

    const getRecommendations = (condition) => {
        const conditionLower = condition?.toLowerCase() || '';

        if (conditionLower.includes('neumonía')) {
            return [
                'Correlación clínica sugerida.',
                'Considerar tratamiento antibiótico según protocolo.',
                'Seguimiento radiológico en 4-6 semanas.'
            ];
        } else if (conditionLower.includes('nódulo')) {
            return [
                'Evaluación adicional recomendada.',
                'Considerar tomografía computarizada para caracterización.',
                'Seguimiento en 3-6 meses según protocolo.'
            ];
        } else if (conditionLower.includes('normal')) {
            return [
                'Radiografía dentro de parámetros normales.',
                'Continuar con seguimiento de rutina.'
            ];
        } else if (conditionLower.includes('covid-19')) {
            return [
                'Confirmación con prueba molecular requerida.',
                'Aislamiento según protocolo sanitario.',
                'Monitoreo clínico estrecho.'
            ];
        } else if (conditionLower.includes('tuberculosis')) {
            return [
                'Confirmación microbiológica necesaria.',
                'Aislamiento respiratorio hasta confirmación.',
                'Evaluación de contactos cercanos.'
            ];
        } else if (conditionLower.includes('edema')) {
            return [
                'Evaluación clínica inmediata.',
                'Considerar tratamiento diurético según indicación.',
                'Monitoreo de función cardíaca.'
            ];
        } else {
            return [
                'Correlación clínica sugerida.',
                'Evaluación adicional según presentación clínica.',
                'Seguimiento según indicación médica.'
            ];
        }
    };

    const getResultColor = (condition) => {
        const conditionLower = condition?.toLowerCase() || '';
        if (conditionLower.includes('normal')) {
            return 'text-green-600 dark:text-green-400';
        } else if (conditionLower.includes('neumonía') || conditionLower.includes('edema') || conditionLower.includes('covid-19') || conditionLower.includes('tuberculosis')) {
            return 'text-red-600 dark:text-red-400';
        } else {
            return 'text-orange-600 dark:text-orange-400';
        }
    };

    const getBarColor = (condition, isPredicted) => {
        if (isPredicted) {
            return 'bg-cyan-500 dark:bg-cyan-500';
        }
        const conditionLower = condition?.toLowerCase() || '';
        if (conditionLower.includes('normal')) {
            return 'bg-green-500 dark:bg-green-600';
        } else if (conditionLower.includes('neumonía') || conditionLower.includes('edema') || conditionLower.includes('covid-19') || conditionLower.includes('tuberculosis')) {
            return 'bg-red-500 dark:bg-red-600';
        } else {
            return 'bg-orange-500 dark:bg-orange-600';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
            </div>
        );
    }

    if (!study) {
        return (
            <div className="text-slate-900 dark:text-white text-center py-12 bg-white dark:bg-slate-900 min-h-screen">
                <p className="text-slate-500 dark:text-slate-400">Estudio no encontrado</p>
                <Link to="/dashboard" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mt-4 inline-block">
                    Volver al Dashboard
                </Link>
            </div>
        );
    }

    const diagnosisInfo = getDiagnosisInfo(study.results, gridData);
    const modelMeta = getModelMeta(study.modelType);
    const recommendations = getRecommendations(diagnosisInfo.condition);
    const hasAnomaly = diagnosisInfo.probability > 0.5 && !diagnosisInfo.condition.toLowerCase().includes('normal');
    const top3Results = study.results?.slice(0, 3) || [];

    const handleDownloadPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - margin * 2;
        let yPos = 0;

        // ═══════════════════════════════════════════════════════
        // HELPER: add page footer
        // ═══════════════════════════════════════════════════════
        const addFooter = (pageNum, totalPages) => {
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
            doc.setFontSize(7);
            doc.setTextColor(140, 140, 140);
            doc.text(
                `Reporte EXAI | Estudio #${id.slice(-6).toUpperCase()} | Pagina ${pageNum} de ${totalPages}`,
                pageWidth / 2, pageHeight - 12, { align: 'center' }
            );
            doc.text(
                `Generado: ${new Date().toLocaleString('es-ES')}`,
                pageWidth / 2, pageHeight - 8, { align: 'center' }
            );
        };

        // ═══════════════════════════════════════════════════════
        // HELPER: load image as base64
        // ═══════════════════════════════════════════════════════
        const loadImageAsDataURL = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(c.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = () => resolve(null);
                img.src = src;
            });
        };

        // ═══════════════════════════════════════════════════════
        // HELPER: create overlay composite on canvas
        // ═══════════════════════════════════════════════════════
        const createOverlayImage = (origSrc, heatmapB64) => {
            return new Promise((resolve) => {
                const origImg = new Image();
                origImg.crossOrigin = 'anonymous';
                origImg.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = origImg.width;
                    c.height = origImg.height;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(origImg, 0, 0);
                    if (heatmapB64) {
                        const hmImg = new Image();
                        hmImg.onload = () => {
                            ctx.globalAlpha = 0.55;
                            ctx.drawImage(hmImg, 0, 0, c.width, c.height);
                            ctx.globalAlpha = 1.0;
                            resolve(c.toDataURL('image/jpeg', 0.85));
                        };
                        hmImg.onerror = () => resolve(c.toDataURL('image/jpeg', 0.85));
                        hmImg.src = `data:image/png;base64,${heatmapB64}`;
                    } else {
                        resolve(c.toDataURL('image/jpeg', 0.85));
                    }
                };
                origImg.onerror = () => resolve(null);
                origImg.src = origSrc;
            });
        };

        // ═══════════════════════════════════════════════════════
        // HELPER: create grid visualization on canvas
        // ═══════════════════════════════════════════════════════
        const createGridImage = (origSrc, cells, gridSize) => {
            return new Promise((resolve) => {
                const origImg = new Image();
                origImg.crossOrigin = 'anonymous';
                origImg.onload = () => {
                    const c = document.createElement('canvas');
                    c.width = origImg.width;
                    c.height = origImg.height;
                    const ctx = c.getContext('2d');
                    // Darken original
                    ctx.drawImage(origImg, 0, 0);
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(0, 0, c.width, c.height);
                    const cellW = c.width / gridSize;
                    const cellH = c.height / gridSize;
                    if (cells) {
                        cells.forEach(cell => {
                            const r = Math.min(255, Math.round(cell.intensity * 2 * 255));
                            const g = Math.min(255, Math.round((cell.intensity < 0.5 ? cell.intensity * 2 : (1 - cell.intensity) * 2) * 255));
                            const b = Math.round(Math.max(0, (1 - cell.intensity * 2)) * 255);
                            const alpha = cell.intensity > 0.05 ? 0.65 : 0.12;
                            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                            const x = cell.col * cellW + 1;
                            const y = cell.row * cellH + 1;
                            ctx.fillRect(x, y, cellW - 2, cellH - 2);
                            // Label
                            if (cell.intensity > 0.12) {
                                const pct = Math.round(cell.intensity * 100);
                                ctx.fillStyle = 'white';
                                ctx.font = `bold ${Math.round(cellW * 0.22)}px Arial`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.shadowColor = 'black';
                                ctx.shadowBlur = 3;
                                ctx.fillText(`${pct}%`, x + cellW / 2, y + cellH / 2);
                                ctx.shadowBlur = 0;
                            }
                        });
                    }
                    // Grid lines
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.lineWidth = 1;
                    for (let i = 0; i <= gridSize; i++) {
                        ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, c.height); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(c.width, i * cellH); ctx.stroke();
                    }
                    resolve(c.toDataURL('image/jpeg', 0.85));
                };
                origImg.onerror = () => resolve(null);
                origImg.src = origSrc;
            });
        };

        // ═══════════════════════════════════════════════════════
        // PAGE 1: HEADER + DIAGNOSIS + IMAGES
        // ═══════════════════════════════════════════════════════

        // ---- Header band ----
        doc.setFillColor(15, 23, 42); // Slate-900
        doc.rect(0, 0, pageWidth, 42, 'F');
        // Accent strip
        doc.setFillColor(6, 182, 212); // Cyan-500
        doc.rect(0, 42, pageWidth, 2.5, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporte de IA Explicable (EXAI)', margin, 16);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Estudio #${id.slice(-6).toUpperCase()}`, margin, 26);

        const dateStr = study.createdAt
            ? new Date(study.createdAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
            : new Date().toLocaleString('es-ES');
        doc.text(`Fecha: ${dateStr}`, margin, 34);

        const modelMeta = getModelMeta(study.modelType);
        doc.text(`Modelo: ${modelMeta.label}`, pageWidth - margin, 26, { align: 'right' });
        doc.text(`Procesamiento: ${study.processingTime ? (study.processingTime / 1000).toFixed(1) + 's' : '-'}`, pageWidth - margin, 34, { align: 'right' });

        yPos = 52;

        // ---- Primary Diagnosis ----
        const isNormal = diagnosisInfo.condition.toLowerCase().includes('normal');
        const diagColor = isNormal ? [16, 185, 129] : [239, 68, 68]; // Green/Red

        doc.setFillColor(248, 250, 252); // Slate-50
        doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');
        doc.setDrawColor(...diagColor);
        doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'S');

        // Colored sidebar
        doc.setFillColor(...diagColor);
        doc.rect(margin, yPos, 4, 30, 'F');

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('DIAGNOSTICO PRINCIPAL', margin + 10, yPos + 7);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...diagColor);
        doc.text(diagnosisInfo.condition, margin + 10, yPos + 17);

        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);
        doc.text(`${(diagnosisInfo.probability * 100).toFixed(1)}%`, pageWidth - margin - 10, yPos + 17, { align: 'right' });

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Confianza', pageWidth - margin - 10, yPos + 24, { align: 'right' });

        yPos += 36;

        // Description
        doc.setFontSize(9);
        doc.setTextColor(70, 70, 70);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(diagnosisInfo.description, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 4 + 8;

        // ---- Side-by-side images: Original + Overlay ----
        const imgSrc = getImageUrl(study.imageUrl);
        let originalDataUrl = null;
        let overlayDataUrl = null;
        let gridDataUrl = null;

        if (imgSrc) {
            [originalDataUrl, overlayDataUrl, gridDataUrl] = await Promise.all([
                loadImageAsDataURL(imgSrc),
                createOverlayImage(imgSrc, study.heatmap),
                createGridImage(imgSrc, gridData, GRID_SIZE),
            ]);
        }

        // Section title
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text('Visualizacion de Rayos X', margin, yPos);
        yPos += 6;

        const imgW = (contentWidth - 6) / 2;
        const imgH = imgW * 1.1;

        if (originalDataUrl) {
            doc.addImage(originalDataUrl, 'JPEG', margin, yPos, imgW, imgH);
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('(A) Radiografia Original', margin + imgW / 2, yPos + imgH + 4, { align: 'center' });
        }

        if (overlayDataUrl) {
            doc.addImage(overlayDataUrl, 'JPEG', margin + imgW + 6, yPos, imgW, imgH);
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('(B) Superposicion Grad-CAM', margin + imgW + 6 + imgW / 2, yPos + imgH + 4, { align: 'center' });
        }

        yPos += imgH + 10;

        // ═══════════════════════════════════════════════════════
        // PAGE 2: GRID + COLOR LEGEND + TOP 3 + TABLE
        // ═══════════════════════════════════════════════════════
        doc.addPage();
        yPos = 15;

        // ---- Grid visualization ----
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text('Cuadricula de Activacion (8x8)', margin, yPos);
        yPos += 6;

        if (gridDataUrl) {
            const gridImgW = contentWidth * 0.55;
            const gridImgH = gridImgW;
            const gridX = (pageWidth - gridImgW) / 2;
            doc.addImage(gridDataUrl, 'JPEG', gridX, yPos, gridImgW, gridImgH);

            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text('(C) Cada celda muestra el % de activacion del modelo en esa region', pageWidth / 2, yPos + gridImgH + 4, { align: 'center' });
            yPos += gridImgH + 12;
        } else {
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text('Cuadrícula no disponible', margin, yPos + 10);
            yPos += 18;
        }

        // ---- Color Legend ----
        doc.setFontSize(11);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text('Leyenda de Colores - Mapa de Calor Grad-CAM', margin, yPos);
        yPos += 7;

        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'F');

        // Draw gradient bar
        const barX = margin + 8;
        const barW = contentWidth - 16;
        const barY = yPos + 5;
        const barH = 8;
        const steps = 60;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            // JET-like: blue → cyan → green → yellow → red
            let r, g, b;
            if (t < 0.25) { r = 0; g = Math.round(t * 4 * 255); b = 255; }
            else if (t < 0.5) { r = 0; g = 255; b = Math.round((1 - (t - 0.25) * 4) * 255); }
            else if (t < 0.75) { r = Math.round((t - 0.5) * 4 * 255); g = 255; b = 0; }
            else { r = 255; g = Math.round((1 - (t - 0.75) * 4) * 255); b = 0; }
            doc.setFillColor(r, g, b);
            doc.rect(barX + (barW * i / steps), barY, barW / steps + 0.5, barH, 'F');
        }

        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text('Baja activacion', barX, barY + barH + 5);
        doc.text('Alta activacion', barX + barW, barY + barH + 5, { align: 'right' });
        doc.text('Moderada', barX + barW / 2, barY + barH + 5, { align: 'center' });

        yPos += 34;

        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        const legendText = 'Las zonas en rojo indican alta activacion del modelo - son las regiones de la imagen que mas influyeron en la prediccion. Las zonas en azul indican baja activacion (poca influencia). Esto NO indica necesariamente la ubicacion exacta de la patologia, sino donde "enfoco su atencion" la red neuronal.';
        const legendLines = doc.splitTextToSize(legendText, contentWidth);
        doc.text(legendLines, margin, yPos);
        yPos += legendLines.length * 4 + 10;

        // ---- Top 3 Predictions ----
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text('Top 3 Predicciones', margin, yPos);
        yPos += 8;

        const top3 = study.results.slice(0, 3);
        const rankColors = [[6, 182, 212], [56, 189, 248], [148, 163, 184]];

        top3.forEach((result, idx) => {
            const prob = result.probability * 100;
            const color = rankColors[idx];
            const rowY = yPos;

            // Rank badge
            doc.setFillColor(...color);
            doc.circle(margin + 5, rowY + 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`${idx + 1}`, margin + 5, rowY + 5, { align: 'center' });

            // Condition name
            doc.setTextColor(33, 33, 33);
            doc.setFontSize(10);
            const condName = result.condition || result.conditionEn || '-';
            doc.text(condName, margin + 14, rowY + 5);

            // Bar background
            const pbX = margin + 65;
            const pbW = contentWidth - 85;
            doc.setFillColor(230, 230, 230);
            doc.roundedRect(pbX, rowY, pbW, 8, 2, 2, 'F');

            // Filled bar
            const filledW = Math.max(pbW * result.probability, 3);
            doc.setFillColor(...color);
            doc.roundedRect(pbX, rowY, filledW, 8, 2, 2, 'F');

            // Percentage
            doc.setTextColor(50, 50, 50);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${prob.toFixed(1)}%`, pageWidth - margin, rowY + 5.5, { align: 'right' });

            yPos += 13;
        });

        yPos += 6;

        // ---- Remaining Predictions Table ----
        const remaining = study.results.slice(3);
        if (remaining.length > 0) {
            doc.setFontSize(10);
            doc.setTextColor(33, 33, 33);
            doc.setFont('helvetica', 'bold');
            doc.text('Otras Condiciones Evaluadas', margin, yPos);
            yPos += 4;

            const tableRows = remaining.map((r, idx) => [
                `${idx + 4}`,
                r.condition || r.conditionEn || '-',
                `${(r.probability * 100).toFixed(2)}%`,
                r.probability > 0.15 ? 'MODERADA' : 'Baja'
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['#', 'Condicion', 'Probabilidad', 'Nivel']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    2: { halign: 'right', cellWidth: 26 },
                    3: { halign: 'center', cellWidth: 24 },
                },
                margin: { left: margin, right: margin },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });

            yPos = doc.lastAutoTable.finalY + 10;
        }

        // ---- Clinical Recommendations ----
        if (yPos + 40 > pageHeight - 30) { doc.addPage(); yPos = 15; }

        doc.setFontSize(11);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text('Recomendaciones Clínicas', margin, yPos);
        yPos += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        recommendations.forEach(rec => {
            if (yPos + 6 > pageHeight - 30) { doc.addPage(); yPos = 15; }
            const recLines = doc.splitTextToSize(`- ${rec}`, contentWidth - 5);
            doc.text(recLines, margin + 3, yPos);
            yPos += recLines.length * 4 + 3;
        });

        yPos += 6;

        // ═══════════════════════════════════════════════════════
        // DISCLAIMER — always at the end
        // ═══════════════════════════════════════════════════════
        if (yPos + 38 > pageHeight - 25) { doc.addPage(); yPos = 15; }

        doc.setFillColor(254, 243, 199); // Amber-100
        doc.roundedRect(margin, yPos, contentWidth, 36, 3, 3, 'F');
        doc.setDrawColor(217, 119, 6); // Amber-600
        doc.roundedRect(margin, yPos, contentWidth, 36, 3, 3, 'S');

        // Warning icon strip
        doc.setFillColor(245, 158, 11); // Amber-500
        doc.rect(margin, yPos, 4, 36, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(146, 64, 14); // Amber-800
        doc.text('(!) AVISO CLINICO - LIMITACION DE RESPONSABILIDAD', margin + 10, yPos + 7);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 53, 15);
        const disclaimerText = 'Este reporte ha sido generado automaticamente por un sistema de inteligencia artificial basado en redes neuronales convolucionales (DenseNet-121) y tecnicas de IA explicable (Grad-CAM). Los resultados son orientativos y NO constituyen un diagnostico medico definitivo. Toda interpretacion debe ser realizada por un profesional de la salud cualificado. No tome decisiones clinicas basandose exclusivamente en este analisis. Consulte siempre con un medico especialista.';
        const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 16);
        doc.text(disclaimerLines, margin + 10, yPos + 13);

        // ═══════════════════════════════════════════════════════
        // ADD FOOTERS TO ALL PAGES
        // ═══════════════════════════════════════════════════════
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(i, totalPages);
        }

        doc.save(`EXAI_Reporte_${id.slice(-6).toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="text-slate-900 dark:text-white bg-white dark:bg-slate-900 min-h-screen">
            <NavigationButtons />
            {/* Clinical Disclaimer */}
            <div className="mb-6 p-4 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl flex-shrink-0 mt-0.5">warning</span>
                    <div>
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">Aviso clínico importante</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            Este análisis es una <strong>herramienta de soporte</strong> basada en inteligencia artificial. <strong>No constituye un diagnóstico definitivo.</strong> Los resultados deben ser interpretados por un profesional de la salud cualificado. Consulte siempre con un especialista antes de tomar decisiones clínicas.
                        </p>
                    </div>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                <Link to="/dashboard" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Dashboard</Link>
                <span className="mx-2">/</span>
                <span className="text-slate-900 dark:text-white font-medium">Reporte #{id.slice(-6).toUpperCase()}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900 dark:text-white">Reporte de Análisis IA</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Inteligencia Artificial Explicable - Visualización de Atención</p>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                >
                    <span className="material-symbols-outlined">download</span>
                    Descargar PDF
                </button>
            </div>

            {/* Main Visualization Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Column 1: Image Views */}
                <div className="lg:col-span-2 space-y-6">
                    {/* View Mode Selector */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Visualización de Rayos X</h2>
                                <HelperTooltip text="Alterna entre la imagen original, el mapa de calor y la superposición para entender por qué la IA tomó su decisión." position="right" />
                            </div>
                            {hasAnomaly && (
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full animate-pulse"></span>
                                    <span className="text-sm font-medium">Anomalía Detectada</span>
                                </div>
                            )}
                        </div>

                        {/* Mode Buttons */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {['original', 'heatmap', 'overlay', 'grid'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === mode
                                        ? 'bg-cyan-600 dark:bg-cyan-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {mode === 'original' && 'Original'}
                                    {mode === 'heatmap' && 'Mapa de Calor'}
                                    {mode === 'overlay' && 'Superposición'}
                                    {mode === 'grid' && 'Cuadrícula'}
                                </button>
                            ))}
                        </div>

                        {/* Opacity Slider — visible when overlay or heatmap is selected */}
                        {(viewMode === 'overlay' || viewMode === 'heatmap' || viewMode === 'grid') && study.heatmap && (
                            <div className="flex items-center gap-3 mb-4 px-1">
                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Opacidad</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={heatmapOpacity}
                                    onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                                />
                                <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 w-10 text-right">{heatmapOpacity}%</span>
                            </div>
                        )}

                        {/* Image Display */}
                        <div className="relative bg-slate-100 dark:bg-black rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700" style={{ minHeight: '400px' }}>
                            {viewMode === 'original' && study.imageUrl && (
                                <img
                                    src={getImageUrl(study.imageUrl)}
                                    alt="Radiografía Original"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        console.error('Error loading image:', study.imageUrl);
                                        e.target.src = ''; // Limpiar src para evitar loops
                                    }}
                                />
                            )}

                            {viewMode === 'heatmap' && study.heatmap && (
                                <img
                                    src={`data:image/png;base64,${study.heatmap}`}
                                    alt="Mapa de Calor"
                                    className="w-full h-full object-contain"
                                    style={{ opacity: heatmapOpacity / 100 }}
                                    onError={(e) => {
                                        console.error('Error loading heatmap');
                                        e.target.style.display = 'none';
                                    }}
                                />
                            )}

                            {viewMode === 'overlay' && study.imageUrl && (
                                <div className="relative w-full h-full">
                                    <img
                                        src={getImageUrl(study.imageUrl)}
                                        alt="Radiografía"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            console.error('Error loading image for overlay:', study.imageUrl);
                                        }}
                                    />
                                    {study.heatmap && (
                                        <img
                                            src={`data:image/png;base64,${study.heatmap}`}
                                            alt="Heatmap Overlay"
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                            style={{ opacity: heatmapOpacity / 100 }}
                                            onError={(e) => {
                                                console.warn('Error loading heatmap overlay');
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                            )}

                            {viewMode === 'grid' && study.imageUrl && (
                                <div className="relative w-full h-full">
                                    <img
                                        src={getImageUrl(study.imageUrl)}
                                        alt="Radiografía"
                                        className="w-full h-full object-contain"
                                        style={{ filter: 'brightness(0.5)' }}
                                    />
                                    {gridData && (
                                        <div
                                            className="absolute inset-0 grid pointer-events-none"
                                            style={{
                                                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                                                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                                                padding: '2%',
                                                opacity: heatmapOpacity / 100,
                                            }}
                                        >
                                            {gridData.map((cell, i) => {
                                                const pct = Math.round(cell.intensity * 100);
                                                // Color ramp: low = blue/transparent, mid = yellow, high = red
                                                const r = Math.min(255, Math.round(cell.intensity * 2 * 255));
                                                const g = Math.min(255, Math.round((cell.intensity < 0.5 ? cell.intensity * 2 : (1 - cell.intensity) * 2) * 255));
                                                const b = Math.round(Math.max(0, (1 - cell.intensity * 2)) * 255);
                                                const bg = `rgba(${r}, ${g}, ${b}, ${cell.intensity > 0.05 ? 0.65 : 0.1})`;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="border border-white/10 flex items-center justify-center pointer-events-auto cursor-default transition-all hover:scale-105 hover:z-10"
                                                        style={{
                                                            backgroundColor: bg,
                                                            borderRadius: '4px',
                                                            margin: '1px',
                                                        }}
                                                        title={`Celda (${cell.row + 1}, ${cell.col + 1}): ${pct}% activación`}
                                                    >
                                                        {cell.intensity > 0.15 && (
                                                            <span className="text-white text-xs font-bold drop-shadow-md">
                                                                {pct}%
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!study.imageUrl && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                                    <span className="material-symbols-outlined text-6xl mb-4">image</span>
                                    <p>Imagen de Radiografía</p>
                                </div>
                            )}
                        </div>

                        {/* View Label */}
                        <div className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                            {viewMode === 'original' && '(A) Radiografía Original'}
                            {viewMode === 'heatmap' && '(B) Mapa de Atención Grad-CAM'}
                            {viewMode === 'overlay' && `(C) Superposición - ${diagnosisInfo.condition} (${(diagnosisInfo.probability * 100).toFixed(1)}%)`}
                            {viewMode === 'grid' && '(D) Cuadrícula de Activación — Intensidad por Región'}
                        </div>
                    </div>

                    {/* Predictions Chart */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">(D) Probabilidades de Diagnóstico</h2>
                        <div className="space-y-3">
                            {study.results?.map((result, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-900 dark:text-white">{result.condition}</span>
                                        <span className="text-slate-600 dark:text-slate-400">{(result.probability * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getBarColor(result.condition, index === 0)}`}
                                            style={{ width: `${result.probability * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2: Diagnosis and Stats */}
                <div className="space-y-6">
                    {/* Main Diagnosis */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <span className={`material-symbols-outlined ${getResultColor(diagnosisInfo.condition)}`}>
                                {hasAnomaly ? 'warning' : 'check_circle'}
                            </span>
                            DIAGNÓSTICO PRINCIPAL
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <h3 className={`text-xl font-bold ${getResultColor(diagnosisInfo.condition)}`}>
                                    {diagnosisInfo.condition}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{diagnosisInfo.location}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-2">
                                    <span>Confianza IA</span>
                                    <HelperTooltip text="Probabilidad calculada por la red neuronal para el diagnóstico principal. Se expresa como porcentaje." />
                                </div>
                                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                                    {(diagnosisInfo.probability * 100).toFixed(1)}%
                                </p>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{diagnosisInfo.description}</p>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">ESTADÍSTICAS</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400">Modelo:</span>
                                    <HelperTooltip text="Arquitectura de red neuronal utilizada (e.g., EfficientNet-B4). Cada modelo tiene fortalezas distintas en velocidad o precisión." />
                                </div>
                                <span className="text-slate-900 dark:text-white font-medium">{modelMeta.label}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Predicción:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{diagnosisInfo.condition}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Confianza:</span>
                                <span className="text-cyan-600 dark:text-cyan-400 font-medium">{(diagnosisInfo.probability * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400">Rendimiento:</span>
                                    <HelperTooltip text="Tiempo exacto que tomó el modelo en procesar esta imagen específica en el hardware del servidor." />
                                </div>
                                <span className="text-slate-900 dark:text-white font-medium">
                                    {study.processingTime ? `${(study.processingTime / 1000).toFixed(2)}s` : modelMeta.throughput}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Enfoque:</span>
                                <span className="text-slate-900 dark:text-white font-medium">{modelMeta.focus}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="text-slate-600 dark:text-slate-400">Top 3 Diagnósticos:</p>
                                    <HelperTooltip text="Las tres condiciones con mayor probabilidad según el análisis del modelo." />
                                </div>
                                <ul className="space-y-1">
                                    {top3Results.map((result, index) => (
                                        <li key={index} className="flex justify-between text-xs">
                                            <span className="text-slate-700 dark:text-slate-300">{index + 1}. {result.condition}</span>
                                            <span className="text-slate-600 dark:text-slate-400">{(result.probability * 100).toFixed(1)}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                                <p>{modelMeta.description}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-2 mb-1">
                                    <p>Leyenda del Heatmap:</p>
                                    <HelperTooltip text="Indica qué colores corresponden a zonas de alta o baja atención por parte de la IA." position="top" />
                                </div>
                                <p>🔴 Rojo/Amarillo = Alta atención</p>
                                <p>🔵 Azul/Oscuro = Baja atención</p>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">RECOMENDACIONES</h2>
                        <ul className="space-y-3">
                            {recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 text-lg mt-0.5 flex-shrink-0">
                                        check_circle
                                    </span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}