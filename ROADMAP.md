# 🗺️ ROADMAP — Fase 5: Transacciones + Certificación + Escenarios

> **Fecha**: 19 Feb 2026  
> **Status**: Planificado — Por implementar  
> **Prioridad**: Alta

---

## A. 🆕 Nuevas Transacciones SAP

| Transacción | Nombre | Módulo | Descripción |
|---|---|---|---|
| `/nMB52` | Stock por Almacén | MM | Vista de inventario agrupada por almacén/centro |
| `/nVA05` | Lista Pedidos Venta | SD | Órdenes de venta con status y totales |

### MB52 — Stock por Almacén
- Tabla: Material · Descripción · Centro · Almacén · Stock · UMB · Valor
- Filtros por centro/almacén
- Resumen de valor por ubicación

### VA05 — Lista de Pedidos de Venta
- Dual view: por cliente / por material
- Expandible con items
- Status: Open → Delivered → Billed

---

## B. 🏆 Sistema de Certificación / Scoring (`/nCERT`)

### Sistema de XP
| Dificultad | XP por escenario |
|---|---|
| Fácil | 100 XP |
| Medio | 200 XP |
| Difícil | 300 XP |

### Niveles
| XP Requerido | Nivel |
|---|---|
| 0 | 🟢 Trainee |
| 300 | 🔵 Analyst |
| 800 | 🟣 Specialist |
| 1500 | 🟠 Consultant |
| 3000 | ⭐ Expert |

### Badges (por completar categorías)
- 📦 **MM Master** — Completar todos los escenarios de Materials Management
- 🛒 **SD Specialist** — Completar todos los escenarios de Sales & Distribution
- 📊 **Report Champion** — Completar escenarios de reportes
- ⛓️ **SCM Pro** — Completar todos los escenarios

### Certificado Visual
- Genera un "Certificado SAP Dataelectric" con nombre, nivel y fecha
- Descargable como imagen

---

## C. 📚 Más Escenarios de Entrenamiento

### Escenarios Existentes (3)
| # | Título | Código | Dificultad |
|---|---|---|---|
| 1 | Verificar Disponibilidad | MMBE | Fácil |
| 2 | Entrada de Mercancía | MIGO | Medio |
| 3 | Crear Pedido de Venta | VA01 | Difícil |

### Nuevos Escenarios (+5)
| # | Título | Código | Dificultad | XP |
|---|---|---|---|---|
| 4 | Crear Pedido de Compra | ME21N | Medio | 200 |
| 5 | Importar Datos de SAP | IMPORT | Fácil | 100 |
| 6 | Generar Reporte de Gestión | REPORT | Difícil | 300 |
| 7 | Analizar MRP/Disponibilidad | MD04 | Difícil | 300 |
| 8 | Diagnóstico de Calidad Datos | DQ | Medio | 200 |

Cada escenario tiene 3-5 pasos guiados con contexto de situación real.

---

## 📊 Resumen de Transacciones (después de Fase 5)

| Módulo | Transacciones | Cantidad |
|---|---|---|
| **MM** | MM03, ME21N, ME23N, ME28, MIGO, MMBE, ME2M, MB52, EAN, IMPORT | 10 |
| **SD** | VA01, VA03, VL01N, VF01, VA05 | 5 |
| **SCM** | MD04, ECOMM, TEAM, PLAN, PRES, REPORT | 6 |
| **Tools** | SE16, SE16N, SQVI, DQ, TRAIN, CERT, MENU, DIC | 8 |
| **HR** | GERENTE/JOB | 1 |
| **Otros** | PACK, DUP, REORD, OVERW, STATS, SU01 | 6 |
| **Total** | | **36 transacciones** |

---

*Este roadmap se implementará en la próxima sesión.*
