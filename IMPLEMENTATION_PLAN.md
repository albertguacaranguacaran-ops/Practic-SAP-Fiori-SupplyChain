# 📋 Plan de Implementación: Simulador SAP Data Cleansing

## 🎯 Enfoque Principal
Enseñar a resolver **problemas reales de datos sucios** en materiales SAP.

---

## 📊 Escenarios de Problemas a Implementar

### 1. 📦 Múltiples EAN por Material
**Problema**: Un material tiene varios códigos de barra (EAN) asignados incorrectamente.

**Funcionalidad**:
- Mostrar materiales con múltiples EAN
- Enseñar cómo identificar el EAN correcto
- Permitir eliminar EAN duplicados
- Asignar EAN principal y secundarios

```
Material: DAKA-001 (Televisor Samsung 55")
├── EAN Principal: 7501234567890 ✓
├── EAN Alterno 1: 7501234567891 (Error de captura)
└── EAN Alterno 2: 7501234567892 (Empaque diferente)
```

---

### 2. 🔄 Materiales Duplicados
**Problema**: El mismo producto existe con diferentes IDs.

**Funcionalidad**:
- Detectar duplicados por descripción similar
- Comparar EAN entre materiales
- Fusionar materiales (consolidar stock)
- Redirigir historial de compras

---

### 3. 📝 Datos Incompletos
**Problema**: Materiales sin dimensiones, peso, o categoria.

**Funcionalidad**:
- Listar materiales con campos vacíos
- Completar ficha técnica
- Validar datos mínimos requeridos

---

### 4. 💰 Precios Incorrectos
**Problema**: Material con precio base $0 o precio irreal.

**Funcionalidad**:
- Detectar precios anómalos
- Comparar con registro info de compras
- Corregir precios base

---

## 🔧 Componentes a Crear

| Componente | Función | Transacción |
|------------|---------|-------------|
| `EANManager.jsx` | Gestionar múltiples códigos de barra | /nEAN |
| `DuplicateFinder.jsx` | Detectar y fusionar duplicados | /nDUP |
| `DataQualityDashboard.jsx` | KPIs de calidad de datos | /nDQ |
| `GuidedScenario.jsx` | Tutorial paso a paso interactivo | /nTRAIN |

---

## 💾 Modelo de Datos: Múltiples EAN

```sql
-- Tabla de EAN secundarios (MEAN en SAP)
CREATE TABLE mean (
  matnr TEXT REFERENCES mara(matnr),
  ean11 TEXT NOT NULL,
  eantp TEXT DEFAULT 'HE',  -- Tipo EAN (HE=Principal, HK=Alterno)
  hpean BOOLEAN DEFAULT FALSE, -- Es principal?
  PRIMARY KEY (matnr, ean11)
);
```

---

## 📚 Escenarios de Práctica (Monetizables)

| # | Escenario | Nivel | Duración |
|---|-----------|-------|----------|
| 1 | "El Material con 3 Códigos de Barra" | 🟢 Básico | 20 min |
| 2 | "Detectar y Fusionar Duplicados" | 🟢 Básico | 25 min |
| 3 | "Completar Ficha Técnica" | 🟢 Básico | 15 min |
| 4 | "Auditoría de Precios" | 🟡 Intermedio | 30 min |
| 5 | "Limpieza Masiva de Datos" | 🔴 Avanzado | 45 min |

---

## 🚀 Orden de Implementación

1. **Fase 1**: EANManager - Gestión de múltiples códigos de barra
2. **Fase 1.5**: Purchasing Module (MM-PUR) - Gestión de Compras `/nME21N` (Prioridad SCM)
3. **Fase 2**: DuplicateFinder - Detección de duplicados mejorada
4. **Fase 3**: DataQualityDashboard - Panel de KPIs
5. **Fase 4**: GuidedScenario - Tutoriales interactivos
6. **Fase 5**: Sistema de certificación/puntaje

---

## 📈 Modelo de Monetización Sugerido

| Plan | Precio | Incluye |
|------|--------|---------|
| **Free** | $0 | Acceso limitado, 2 escenarios |
| **Pro** | $19/mes | Todos los escenarios + certificado |
| **Enterprise** | $99/mes | Multi-usuario + reportes + soporte |

---

*Dataelectric - SAP Training Simulator*

---

## 🛠️ Detalle Técnico: Módulo de Compras (Fase 1.5)

### Objetivos
Implementar el ciclo de approvisionamiento básico para practicar la reposición de stock.

### Cambios Propuestos

#### [NEW] `src/components/PurchaseOrder.jsx`
- Formulario estilo cabecera/detalle (Header/Items).
- **Cabecera**: Proveedor (Dropdown), Org. Compras, Gpo. Compras, Fecha.
- **Detalle**: Tabla editable con Material, Cantidad, Precio Neto, Centro (1000), Almacén (0001).
- **Lógica**: 
  - Validar materiales existentes.
  - Calcular valor total (Cantidad * Precio).
  - Simular guardado (Generar ID "45xxxxxxxxx").

#### [MODIFY] `src/App.jsx`
- Agregar switch case para transacción `/nME21N`.
- Renderizar componente `PurchaseOrder`.

#### [MODIFY] `src/components/CommandBar.jsx`
- Registrar `/nME21N` en la lista de transacciones.
- Registrar `/nME23N` (Visualizar) para futuro uso.

