// Packaging and Logistics Calculations

/**
 * Calculate volume in cubic meters
 * @param {number} largo - Length in cm
 * @param {number} ancho - Width in cm
 * @param {number} alto - Height in cm
 * @returns {number} Volume in m³
 */
export function calculateVolume(largo, ancho, alto) {
    if (!largo || !ancho || !alto) return null;
    return Math.round((largo * ancho * alto) / 1000000 * 10000) / 10000;
}

/**
 * Calculate stacking factor (boxes per pallet)
 * Standard pallet: 120x100 cm, max height 150 cm
 * @param {number} largo - Length in cm
 * @param {number} ancho - Width in cm
 * @param {number} alto - Height in cm
 * @returns {object} Stacking details
 */
export function calculateStackingFactor(largo, ancho, alto) {
    if (!largo || !ancho || !alto) return null;

    const PALLET_LARGO = 120;
    const PALLET_ANCHO = 100;
    const PALLET_ALTO_MAX = 150;

    // Try both orientations for base
    const orientation1 = {
        boxesX: Math.floor(PALLET_LARGO / largo),
        boxesY: Math.floor(PALLET_ANCHO / ancho)
    };

    const orientation2 = {
        boxesX: Math.floor(PALLET_LARGO / ancho),
        boxesY: Math.floor(PALLET_ANCHO / largo)
    };

    const boxesBase1 = orientation1.boxesX * orientation1.boxesY;
    const boxesBase2 = orientation2.boxesX * orientation2.boxesY;

    const bestOrientation = boxesBase1 >= boxesBase2 ? orientation1 : orientation2;
    const cajasBase = Math.max(boxesBase1, boxesBase2);

    // Levels (height)
    const niveles = Math.floor(PALLET_ALTO_MAX / alto);
    const factorApilamiento = cajasBase * niveles;

    // Space utilization
    const volumeUsed = largo * ancho * alto * factorApilamiento;
    const volumePallet = PALLET_LARGO * PALLET_ANCHO * PALLET_ALTO_MAX;
    const utilizacion = Math.round((volumeUsed / volumePallet) * 100);

    return {
        cajasBase,
        niveles,
        factorApilamiento,
        utilizacion,
        dimensionesPallet: `${PALLET_LARGO}x${PALLET_ANCHO}x${PALLET_ALTO_MAX} cm`
    };
}

/**
 * Calculate pallets needed for an order
 * @param {number} cantidad - Order quantity
 * @param {number} factorApilamiento - Boxes per pallet
 * @returns {object} Pallet calculation
 */
export function calculatePalletsNeeded(cantidad, factorApilamiento) {
    if (!cantidad || !factorApilamiento) return null;

    const palletsCompletos = Math.floor(cantidad / factorApilamiento);
    const unidadesRestantes = cantidad % factorApilamiento;
    const palletsTotal = Math.ceil(cantidad / factorApilamiento);

    return {
        palletsCompletos,
        unidadesRestantes,
        palletsTotal,
        eficiencia: Math.round((cantidad / (palletsTotal * factorApilamiento)) * 100)
    };
}

/**
 * Calculate total logistics occupation for an order
 * @param {Array} orderLines - Array of {product, cantidad}
 * @returns {object} Total logistics summary
 */
export function calculateOrderLogistics(orderLines) {
    let totalVolume = 0;
    let totalWeight = 0;
    let totalPallets = 0;
    const details = [];

    for (const line of orderLines) {
        const { product, cantidad } = line;

        if (!product.largo || !product.ancho || !product.alto) {
            details.push({
                producto: product.descripcion,
                cantidad,
                error: 'Dimensiones faltantes'
            });
            continue;
        }

        const volume = calculateVolume(product.largo, product.ancho, product.alto);
        const stacking = calculateStackingFactor(product.largo, product.ancho, product.alto);
        const pallets = calculatePalletsNeeded(cantidad, stacking.factorApilamiento);

        totalVolume += volume * cantidad;
        totalWeight += (product.pesoBruto || 0) * cantidad;
        totalPallets += pallets.palletsTotal;

        details.push({
            producto: product.descripcion,
            cantidad,
            volumenUnit: volume,
            volumenTotal: Math.round(volume * cantidad * 10000) / 10000,
            pesoTotal: Math.round((product.pesoBruto || 0) * cantidad * 100) / 100,
            pallets: pallets.palletsTotal,
            utilizacion: pallets.eficiencia
        });
    }

    return {
        totalVolume: Math.round(totalVolume * 10000) / 10000,
        totalWeight: Math.round(totalWeight * 100) / 100,
        totalPallets,
        details
    };
}

/**
 * Validate weight safety (max 50kg for manual handling)
 * @param {number} peso - Weight in kg
 * @returns {object} Validation result
 */
export function validateWeight(peso) {
    const MAX_MANUAL_WEIGHT = 50;

    if (!peso) return { valid: false, message: 'Peso no especificado' };

    if (peso > MAX_MANUAL_WEIGHT) {
        return {
            valid: false,
            message: `Peso (${peso}kg) excede límite de manipulación manual (${MAX_MANUAL_WEIGHT}kg)`,
            requiereEquipo: true,
            nivel: 'warning'
        };
    }

    if (peso > MAX_MANUAL_WEIGHT * 0.8) {
        return {
            valid: true,
            message: `Peso (${peso}kg) cercano al límite - Precaución`,
            nivel: 'caution'
        };
    }

    return { valid: true, message: 'OK', nivel: 'ok' };
}
