// Excel Export with ExcelJS - SAP Style
import ExcelJS from 'exceljs';

/**
 * Export materials to Excel with SAP-style formatting
 * @param {Array} products - Products to export
 * @param {string} filename - Output filename
 */
export async function exportToExcel(products, filename = 'DATAELECTRIC_MM_Export') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dataelectric SAP Simulator';
    workbook.created = new Date();

    // SAP Colors
    const SAP_BLUE = 'FF0854A0';
    const SAP_BLUE_LIGHT = 'FF1873CC';
    const SAP_WHITE = 'FFFFFFFF';
    const SAP_GRAY = 'FFF2F2F2';
    const SAP_ERROR = 'FFBB0000';
    const SAP_WARNING = 'FFE9730C';
    const SAP_SUCCESS = 'FF107E3E';

    // Header style
    const headerStyle = {
        font: { bold: true, color: { argb: SAP_WHITE }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: SAP_BLUE } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
            top: { style: 'thin', color: { argb: 'FF354A5F' } },
            bottom: { style: 'thin', color: { argb: 'FF354A5F' } },
            left: { style: 'thin', color: { argb: 'FF354A5F' } },
            right: { style: 'thin', color: { argb: 'FF354A5F' } }
        }
    };

    // Data style
    const dataStyle = {
        font: { size: 10 },
        alignment: { vertical: 'middle' },
        border: {
            bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } }
        }
    };

    // =====================
    // SHEET 1: Ficha Técnica
    // =====================
    const sheetFicha = workbook.addWorksheet('Ficha Técnica', {
        properties: { tabColor: { argb: SAP_BLUE } }
    });

    // Title row
    sheetFicha.mergeCells('A1:N1');
    const titleCell = sheetFicha.getCell('A1');
    titleCell.value = 'DATAELECTRIC - MAESTRO DE MATERIALES';
    titleCell.font = { bold: true, size: 14, color: { argb: SAP_BLUE } };
    titleCell.alignment = { horizontal: 'center' };

    // Export info
    sheetFicha.mergeCells('A2:N2');
    const infoCell = sheetFicha.getCell('A2');
    infoCell.value = `Exportado: ${new Date().toLocaleString()} | Total Registros: ${products.length}`;
    infoCell.font = { size: 9, italic: true };
    infoCell.alignment = { horizontal: 'center' };

    // Headers
    const fichaTecnicaHeaders = [
        'ID Material', 'EAN', 'Descripción', 'Marca', 'Modelo',
        'Categoría', 'Subcategoría', 'Color', 'Peso Neto (kg)',
        'Peso Bruto (kg)', 'Largo (cm)', 'Ancho (cm)', 'Alto (cm)', 'Status'
    ];

    const headerRow = sheetFicha.addRow(fichaTecnicaHeaders);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
        Object.assign(cell, headerStyle);
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    // Column widths
    sheetFicha.columns = [
        { width: 12 }, { width: 15 }, { width: 40 }, { width: 15 }, { width: 12 },
        { width: 18 }, { width: 18 }, { width: 12 }, { width: 12 },
        { width: 12 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 14 }
    ];

    // Data rows
    products.forEach((p, idx) => {
        const row = sheetFicha.addRow([
            p.id, p.ean, p.descripcion, p.marca, p.modelo,
            p.categoria, p.subcategoria, p.color, p.pesoNeto,
            p.pesoBruto, p.largo, p.ancho, p.alto, p.status
        ]);

        // Alternate row colors
        if (idx % 2 === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SAP_GRAY } };
            });
        }

        // Status-based coloring
        const statusCell = row.getCell(14);
        switch (p.status) {
            case 'duplicate':
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
                statusCell.font = { color: { argb: 'FF856404' } };
                break;
            case 'low_stock':
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
                statusCell.font = { color: { argb: SAP_ERROR } };
                break;
            case 'discontinued':
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
                statusCell.font = { color: { argb: 'FF6A6D70' } };
                break;
            default:
                statusCell.font = { color: { argb: SAP_SUCCESS } };
        }

        // Weight warning
        if (p.pesoNeto && p.pesoNeto > 50) {
            const weightCell = row.getCell(9);
            weightCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
            weightCell.font = { bold: true, color: { argb: SAP_ERROR } };
        }
    });

    // Freeze header
    sheetFicha.views = [{ state: 'frozen', ySplit: 3 }];

    // Auto filter
    sheetFicha.autoFilter = { from: 'A3', to: 'N3' };

    // =====================
    // SHEET 2: Modelo Empaque
    // =====================
    const sheetEmpaque = workbook.addWorksheet('Modelo Empaque', {
        properties: { tabColor: { argb: SAP_BLUE_LIGHT } }
    });

    sheetEmpaque.mergeCells('A1:H1');
    sheetEmpaque.getCell('A1').value = 'MODELO DE EMPAQUE Y LOGÍSTICA';
    sheetEmpaque.getCell('A1').font = { bold: true, size: 14, color: { argb: SAP_BLUE } };
    sheetEmpaque.getCell('A1').alignment = { horizontal: 'center' };

    const empaqueHeaders = [
        'ID Material', 'Descripción', 'Volumen (m³)', 'Cajas/Base',
        'Niveles', 'Factor Apilam.', 'Utilización %', 'Peso Check'
    ];

    const empaqueHeaderRow = sheetEmpaque.addRow(empaqueHeaders);
    empaqueHeaderRow.height = 25;
    empaqueHeaderRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    sheetEmpaque.columns = [
        { width: 12 }, { width: 40 }, { width: 12 }, { width: 12 },
        { width: 10 }, { width: 14 }, { width: 12 }, { width: 20 }
    ];

    products.forEach((p) => {
        if (!p.largo || !p.ancho || !p.alto) return;

        const volumen = (p.largo * p.ancho * p.alto) / 1000000;
        const cajasBaseX = Math.floor(120 / p.largo) * Math.floor(100 / p.ancho);
        const cajasBaseY = Math.floor(120 / p.ancho) * Math.floor(100 / p.largo);
        const cajasBase = Math.max(cajasBaseX, cajasBaseY);
        const niveles = Math.floor(150 / p.alto);
        const factor = cajasBase * niveles;
        const utilizacion = Math.round((p.largo * p.ancho * p.alto * factor) / (120 * 100 * 150) * 100);
        const pesoCheck = p.pesoNeto > 50 ? '⚠️ EXCEDE 50kg' : '✓ OK';

        sheetEmpaque.addRow([
            p.id, p.descripcion, Math.round(volumen * 10000) / 10000,
            cajasBase, niveles, factor, utilizacion, pesoCheck
        ]);
    });

    sheetEmpaque.views = [{ state: 'frozen', ySplit: 2 }];

    // =====================
    // SHEET 3: Alertas
    // =====================
    const sheetAlertas = workbook.addWorksheet('Alertas', {
        properties: { tabColor: { argb: SAP_ERROR } }
    });

    sheetAlertas.mergeCells('A1:E1');
    sheetAlertas.getCell('A1').value = '⚠️ ALERTAS Y PROBLEMAS';
    sheetAlertas.getCell('A1').font = { bold: true, size: 14, color: { argb: SAP_ERROR } };
    sheetAlertas.getCell('A1').alignment = { horizontal: 'center' };

    const alertHeaders = ['ID Material', 'Descripción', 'Tipo Alerta', 'Detalle', 'Acción Sugerida'];
    const alertHeaderRow = sheetAlertas.addRow(alertHeaders);
    alertHeaderRow.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SAP_ERROR } };
        cell.alignment = headerStyle.alignment;
        cell.border = headerStyle.border;
    });

    sheetAlertas.columns = [
        { width: 12 }, { width: 40 }, { width: 18 }, { width: 30 }, { width: 30 }
    ];

    products.forEach((p) => {
        if (p.alertas && p.alertas.length > 0) {
            p.alertas.forEach(alerta => {
                let accion = '';
                if (alerta.includes('duplicado')) accion = 'Revisar y consolidar registros';
                else if (alerta.includes('Stock bajo')) accion = 'Generar orden de compra';
                else if (alerta.includes('descontinuado')) accion = 'Desactivar y liquidar stock';
                else if (alerta.includes('50kg')) accion = 'Usar equipo de manipulación';
                else if (alerta.includes('incompletos')) accion = 'Completar ficha técnica';

                sheetAlertas.addRow([p.id, p.descripcion, p.status, alerta, accion]);
            });
        }
    });

    sheetAlertas.views = [{ state: 'frozen', ySplit: 2 }];

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, recordsExported: products.length };
}
