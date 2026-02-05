# 🏪 Dakafacil SAP S/4HANA Training Simulator

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/SAP-Fiori%20Style-0854A0" alt="SAP" />
</p>

<p align="center">
  <strong>🎓 Simulador de entrenamiento para consultores SAP</strong><br>
  Practica transacciones MM, SD y gestión de materiales con una interfaz realista estilo SAP Fiori/Quartz
</p>

---

## ✨ Características

### 🖥️ Interfaz SAP Realista
- **Barra de comandos** con transacciones auténticas (`/nMM01`, `/nVA01`, etc.)
- **ALV Grid** con 36,000 SKUs, paginación y ordenamiento
- **Status Bar** con mensajes en tiempo real
- **Diseño Fiori/Quartz** industrial y compacto

### 📦 Gestión de Materiales (MM)
| Transacción | Descripción |
|-------------|-------------|
| `/nMM01` | Crear nuevo material |
| `/nMM02` | Modificar material existente |
| `/nMM03` | Visualizar material (solo lectura) |
| `/nMMBE` | Resumen de stocks |

### 🛒 Ventas y Distribución (SD)
| Transacción | Descripción |
|-------------|-------------|
| `/nVA01` | Crear pedido de venta |
| `/nVA03` | Visualizar pedido |
| `/nVL01N` | Crear entrega |

### 📊 Funciones Especiales
- `/nDUP` - Detectar **códigos EAN duplicados**
- `/nREORD` - Alertas de **punto de reorden**
- `/nOVERW` - Materiales con **sobrepeso (>50kg)**
- `/nPACK` - **Modelo de empaque** con cálculo de apilamiento

### 📈 Lógica de Negocio
- **Cálculo automático de volumen** (m³)
- **Factor de apilamiento** (cajas por pallet 120x100cm)
- **Ocupación logística** de pedidos (pallets necesarios)
- **Validación de peso** de seguridad

### 📥 Exportación Excel
- Archivo `.xlsx` profesional con estilos SAP
- 3 hojas: Ficha Técnica, Modelo Empaque, Alertas
- Formato condicional para estados

---

## 🚀 Demo

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/dakafacil-sap.git

# Instalar dependencias
cd dakafacil-sap
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🎯 Casos de Uso para Practicar

### 1. Maestro de Materiales
1. Ejecuta `/nMM01` para crear un material
2. Completa todos los campos incluyendo dimensiones
3. Observa el cálculo automático de volumen y apilamiento

### 2. Detección de Duplicados
1. Ejecuta `/nDUP` para filtrar materiales con EAN duplicado
2. Identifica los registros problemáticos
3. Usa `/nMM02` para corregir

### 3. Gestión de Recompras
1. Ejecuta `/nREORD` para ver materiales bajo stock
2. Selecciona los que requieren reabastecimiento
3. Exporta a Excel para generar orden de compra

### 4. Simulación de Pedido
1. Ejecuta `/nVA01` para crear un pedido
2. Agrega múltiples líneas de productos
3. Observa el cálculo de pallets en tiempo real

---

## 🛠️ Tecnologías

- **React 18** - Framework UI
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS 4** - Estilos utility-first
- **Lucide React** - Iconos
- **ExcelJS** - Exportación Excel

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── CommandBar.jsx    # Barra de transacciones SAP
│   ├── ALVGrid.jsx       # Tabla estilo SAP ALV
│   ├── StatusBar.jsx     # Barra de estado
│   ├── MaterialDetail.jsx # Modal de material
│   └── SalesOrder.jsx    # Transacción de ventas
├── data/
│   └── dakaProducts.js   # Generador de 36K SKUs
├── utils/
│   ├── packagingCalc.js  # Cálculos logísticos
│   └── excelExport.js    # Exportación Excel
├── App.jsx
└── index.css             # Estilos SAP Fiori
```

---

## 🤝 Contribuir

¿Tienes ideas para nuevas transacciones o mejoras? ¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-transaccion`)
3. Commit tus cambios (`git commit -m 'Agrega transacción /nME21N'`)
4. Push a la rama (`git push origin feature/nueva-transaccion`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT © 2026 - Proyecto educativo para entrenamiento SAP

---

<p align="center">
  <strong>⭐ Si te fue útil, dale una estrella al repositorio!</strong>
</p>
