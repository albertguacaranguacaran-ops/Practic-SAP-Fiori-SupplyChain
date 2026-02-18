import { useState, useEffect, useCallback } from 'react';
import './index.css';

// Components
import CommandBar, { TRANSACTIONS } from './components/CommandBar';
import ALVGrid from './components/ALVGrid';
import StatusBar, { useStatusMessage } from './components/StatusBar';
import MaterialDetail from './components/MaterialDetail';
import SalesOrder from './components/SalesOrder';
import SQLBrowser from './components/SQLBrowser';
import FioriLaunchpad from './components/FioriLaunchpad';
import RoadmapViewer from './components/RoadmapViewer';

// Data & Utils - Hybrid Supabase/Local
import { useMaterials, useConnectionStatus } from './lib/useData';
import { useVendors } from './lib/useVendors';
import { usePurchaseOrders } from './lib/usePurchaseOrders';
import { useCustomers } from './lib/useCustomers';
import { useSalesOrders } from './lib/useSalesOrders';
import { getDataStats } from './data/dakaProducts';
import PurchaseOrder from './components/PurchaseOrder';
import GoodsMovement from './components/GoodsMovement';
import VendorMaster from './components/VendorMaster';
import ReleaseOrder from './components/ReleaseOrder';
import OutboundDelivery from './components/OutboundDelivery';
import DataDictionary from './components/DataDictionary';
import Billing from './components/Billing';
import ManagerDashboard from './components/ManagerDashboard';
import SQVI from './components/SQVI';
import EcommerceMonitor from './components/EcommerceMonitor';
import MD04 from './components/MD04';
import EANManager from './components/EANManager';
import TeamOperations from './components/TeamOperations';
import MasterPlan from './components/MasterPlan';
import Presentation from './components/Presentation';
import { useBilling } from './lib/useBilling';
import { exportToExcel } from './utils/excelExport';

function App() {
  // Hybrid Data Hook - Supabase con fallback a datos locales
  const {
    materials: products,
    loading,
    dataSource,
    loadFullDataset,
    createMaterial,
    updateMaterial,
    loadMaterials
  } = useMaterials();

  // Vendor Hook
  const { createVendor, vendors } = useVendors();

  // Customer Hook
  const { customers } = useCustomers();

  // PO & SO Hooks
  const { createOrder, releaseOrder, orders } = usePurchaseOrders();
  const { createSalesOrder, createDelivery, orders: salesOrders, loading: salesLoading } = useSalesOrders();
  const { createInvoice } = useBilling({ orders: salesOrders }); // Pass salesOrders to Billing hook

  const connectionStatus = useConnectionStatus();

  // UI State
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentTransaction, setCurrentTransaction] = useState('/nMM03');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [modalMode, setModalMode] = useState(null); // 'view', 'edit', 'create', 'sales', 'sql'
  const [activeFilter, setActiveFilter] = useState('all');
  const [showLaunchpad, setShowLaunchpad] = useState(false);

  const { status, showSuccess, showError, showWarning, showInfo } = useStatusMessage();

  // Sync filtered products when products change
  useEffect(() => {
    if (products.length > 0) {
      setFilteredProducts(products);
      const sourceLabel = dataSource === 'supabase' ? 'Supabase' : 'datos locales';
      showInfo(`${products.length.toLocaleString()} materiales cargados desde ${sourceLabel}`);
    }
  }, [products, dataSource]);

  // Load full dataset handler
  const handleLoadFullDataset = useCallback(() => {
    showInfo('Cargando dataset completo (36,000 registros)...');
    loadFullDataset();
    setTimeout(() => {
      showSuccess('Dataset completo cargado exitosamente');
    }, 1500);
  }, [loadFullDataset]);

  // Apply filter based on transaction
  const applyFilter = useCallback((filterType) => {
    let filtered = [...products];

    switch (filterType) {
      case 'duplicates':
        filtered = products.filter(p => p.status === 'duplicate');
        break;
      case 'lowStock':
        filtered = products.filter(p => p.status === 'low_stock' || p.stockActual < p.puntoReorden);
        break;
      case 'overweight':
        filtered = products.filter(p => p.pesoNeto && p.pesoNeto > 50);
        break;
      case 'discontinued':
        filtered = products.filter(p => p.status === 'discontinued');
        break;
      case 'missingData':
        filtered = products.filter(p => !p.pesoNeto || !p.largo || !p.ancho || !p.alto);
        break;
      default:
        filtered = products;
    }

    setFilteredProducts(filtered);
    setActiveFilter(filterType);

    return filtered.length;
  }, [products]);

  // Handle transaction execution
  const handleTransaction = (code, info) => {
    console.log('📌 Transaction executed:', code, info);
    setCurrentTransaction(code);

    switch (code) {
      case '/nMM01':
        // Create new material
        console.log('🆕 MM01 - Opening create modal');
        setSelectedProduct(null);
        setModalMode('create');
        showInfo('Transacción MM01 - Crear Material');
        break;

      case '/nMM02':
        // Edit selected material
        if (selectedRows.size === 0) {
          showWarning('Seleccione un material para modificar');
          return;
        }
        if (selectedRows.size > 1) {
          showWarning('Seleccione solo un material para modificar');
          return;
        }
        const editId = Array.from(selectedRows)[0];
        const editProduct = products.find(p => p.id === editId);
        setSelectedProduct(editProduct);
        setModalMode('edit');
        showInfo('Transacción MM02 - Modificar Material');
        break;

      case '/nMM03':
        // View materials (default view)
        const allCount = applyFilter('all');
        showInfo(`Visualizando ${allCount.toLocaleString()} materiales`);
        break;

      case '/nME21N':
        // Create purchase order
        setModalMode('po');
        showInfo('Transacción ME21N - Crear Pedido de Compra');
        break;

      case '/nME28':
        // Release purchase order
        setModalMode('release');
        showInfo('Transacción ME28 - Liberar documentos de compra');
        break;

      case '/nMIGO':
        // Goods movement
        setModalMode('migo');
        showInfo('Transacción MIGO - Movimiento de Mercancías');
        break;

      case '/nXK01':
        // Create Vendor (Central)
        setModalMode('vendor');
        showInfo('Transacción XK01 - Crear Acreedor (Central)');
        break;

      case '/nVA01':
        // Create sales order
        setModalMode('sales');
        showInfo('Transacción VA01 - Crear Pedido de Venta');
        break;

      case '/nPACK':
        // View packaging model of selected
        if (selectedRows.size === 0) {
          showWarning('Seleccione un material para ver modelo de empaque');
          return;
        }
        const packId = Array.from(selectedRows)[0];
        const packProduct = products.find(p => p.id === packId);
        setSelectedProduct(packProduct);
        setModalMode('view');
        showInfo('Modelo de Empaque - Ver cálculos');
        break;

      case '/nDUP':
        // Filter duplicates
        const dupCount = applyFilter('duplicates');
        if (dupCount === 0) {
          showInfo('No se encontraron materiales duplicados');
        } else {
          showWarning(`${dupCount} material(es) con EAN duplicado`);
        }
        break;

      case '/nREORD':
        // Filter low stock
        const lowCount = applyFilter('lowStock');
        if (lowCount === 0) {
          showSuccess('No hay materiales bajo punto de reorden');
        } else {
          showWarning(`${lowCount} material(es) requieren recompra`);
        }
        break;

      case '/nOVERW':
        // Filter overweight
        const overCount = applyFilter('overweight');
        if (overCount === 0) {
          showInfo('No hay materiales con sobrepeso');
        } else {
          showWarning(`${overCount} material(es) exceden 50kg`);
        }
        break;

      case '/nSTATS':
        // Show statistics
        const stats = getDataStats(products);
        showInfo(`Total: ${stats.total} | Duplicados: ${stats.duplicates} | Stock Bajo: ${stats.lowStock} | Sobrepeso: ${stats.overweight}`);
        break;

      case '/n':
        // Cancel/reset
        applyFilter('all');
        setSelectedRows(new Set());
        showInfo('Transacción cancelada');
        break;

      case '/nSE16':
      case '/nSE16N':
        // Open SQL Browser
        setModalMode('sql');
        showInfo(code === '/nSE16N' ? 'Transacción SE16N - Visualización General de Tablas' : 'Transacción SE16 - Data Browser');
        break;

      case '/nJOB':
      case '/nGERENTE':
        // Manager Dashboard / Job Description
        setModalMode('manager');
        showInfo('Descripción de Cargo - Gerencia Supply Chain');
        break;

      case '/nSQVI':
        // Report Generator Simulator
        setModalMode('sqvi');
        showInfo('QuickViewer: Generador de Reportes (Entrenamiento)');
        break;

      case '/nECOMM':
        // E-commerce Strategy Dashboard
        setModalMode('ecomm');
        showInfo('Tablero Estratégico E-commerce (Plan 36k)');
        break;

      case '/nMD04':
        // Stock/Requirements List
        setModalMode('md04');
        showInfo('MD04 - Lista de Necesidades/Stock');
        break;

      case '/nEAN':
        // EAN Manager
        setModalMode('ean');
        showInfo('Gestión de Códigos EAN - Múltiples Códigos de Barra');
        break;

      case '/nTEAM':
        // Team Operations Center
        setModalMode('team');
        showInfo('Centro de Operaciones - Equipo Supply Chain');
        break;

      case '/nPLAN':
        // Master Plan
        setModalMode('plan');
        showInfo('Plan Maestro — Naming, Cedulación y Plan 30-60-90');
        break;

      case '/nPRES':
        // Presentation
        setModalMode('pres');
        showInfo('Presentación Profesional — Use ← → o Espacio para navegar');
        break;

      case '/nMENU':
        // Open Fiori Launchpad
        setShowLaunchpad(true);
        showInfo('Abriendo Menú SAP Easy Access (Launchpad)');
        break;

      // ============ MATERIAL MASTER ADICIONALES ============
      case '/nMM04':
        // Material change history
        if (selectedRows.size === 0) {
          showWarning('Seleccione un material para ver historial de cambios');
          return;
        }
        const histId = Array.from(selectedRows)[0];
        const histProduct = products.find(p => p.id === histId);
        showInfo(`Historial de cambios para ${histProduct?.id}: Creado ${histProduct?.fechaCreacion || 'N/A'}, Última modificación: ${histProduct?.ultimaModificacion || 'N/A'}`);
        break;

      case '/nMM60':
        // Price analysis
        const avgPrice = products.reduce((sum, p) => sum + (p.precioBase || 0), 0) / products.length;
        const maxPrice = Math.max(...products.map(p => p.precioBase || 0));
        const minPrice = Math.min(...products.filter(p => p.precioBase > 0).map(p => p.precioBase));
        showInfo(`Análisis de Precios - Promedio: $${avgPrice.toFixed(2)} | Máx: $${maxPrice.toFixed(2)} | Mín: $${minPrice.toFixed(2)}`);
        break;

      case '/nMMBE':
        // Stock overview
        const totalStock = products.reduce((sum, p) => sum + (p.stockActual || 0), 0);
        const avgStock = totalStock / products.length;
        showInfo(`Resumen de Stocks - Total: ${totalStock.toLocaleString()} unidades | Promedio por material: ${avgStock.toFixed(0)}`);
        break;

      // ============ VENTAS (SD) ============
      case '/nVA02':
        // Modify sales order - requires existing order
        showWarning('No hay pedidos de venta para modificar. Cree uno primero con VA01.');
        break;

      case '/nVA03':
        // View sales orders
        showInfo('Transacción VA03 - No hay pedidos de venta registrados. Use VA01 para crear uno.');
        break;

      case '/nVL01N':
        // Create delivery
        setModalMode('delivery');
        showInfo('Transacción VL01N - Crear Entrega de Salida');
        break;

      case '/nVL02N':
        // Modify delivery
        showWarning('No hay entregas para modificar. Cree un pedido (VA01) y luego una entrega (VL01N).');
        break;

      // ============ WAREHOUSE (WM) ============
      case '/nLT01':
        // Create transfer order
        if (selectedRows.size === 0) {
          showWarning('Seleccione material(es) para crear orden de transferencia');
          return;
        }
        const transferCount = selectedRows.size;
        showSuccess(`Orden de transferencia creada para ${transferCount} material(es). [Simulación]`);
        break;

      case '/nLT21':
        // View transfer orders
        showInfo('Transacción LT21 - No hay órdenes de transferencia. Use LT01 para crear una.');
        break;

      // ============ SISTEMA ============
      case '/nSU01':
        // User maintenance
        showInfo('Usuario actual: CONSULTOR01 | Rol: Coordinador Supply Chain | Centro: 1000 DATAELECTRIC CCS');
        break;

      case '/nDIC':
        // Data Dictionary
        setModalMode('dictionary');
        showInfo('Diccionario de Datos - Referencia Técnica');
        break;

      case '/nVF01':
        // Billing
        setModalMode('billing');
        showInfo('Transacción VF01 - Crear Factura');
        break;

      case '/nEX':
        // Exit system
        if (confirm('¿Está seguro que desea cerrar la sesión SAP?')) {
          showWarning('Sesión SAP cerrada. [En producción, esto cerraría la aplicación]');
        }
        break;

      case 'ERROR':
        showError(info.description);
        break;

      default:
        showInfo(`${info.name} - ${info.description}`);
    }
  };

  // Handle row click
  const handleRowClick = (product) => {
    setSelectedProduct(product);
  };

  // Handle row double click
  const handleRowDoubleClick = (product) => {
    setSelectedProduct(product);
    setModalMode('view');
  };

  // Handle export
  const handleExport = async (data) => {
    try {
      showInfo('Generando archivo Excel...');
      const result = await exportToExcel(data);
      showSuccess(`Excel exportado: ${result.recordsExported.toLocaleString()} registros`);
    } catch (error) {
      showError('Error al exportar: ' + error.message);
    }
  };

  // Handle save material - Using hybrid hook
  const handleSaveMaterial = async (material) => {
    if (modalMode === 'create') {
      const result = await createMaterial(material);
      if (result.success) {
        showSuccess(`Material ${result.id} creado exitosamente`);
      } else {
        showError('Error al crear material: ' + (result.error?.message || 'Error desconocido'));
      }
    } else {
      const result = await updateMaterial(material);
      if (result.success) {
        showSuccess(`Material ${material.id} actualizado`);
      } else {
        showError('Error al actualizar: ' + (result.error?.message || 'Error desconocido'));
      }
    }
    setModalMode(null);
    setSelectedProduct(null);
    // Refresh filtered products
    applyFilter(activeFilter);
  };

  // Close modal
  const closeModal = () => {
    setModalMode(null);
    setSelectedProduct(null);
  };

  // Get stats
  const stats = getDataStats(products);

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col">
      {/* SAP Shell Header */}
      <header className="sap-shell-header">
        <div className="flex items-center gap-4">
          <div className="sap-logo flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
              <span className="text-[#0854A0] font-bold text-xs">DE</span>
            </div>
            <span>Dataelectric</span>
          </div>
          <span className="text-white/60 text-sm">|</span>
          <span className="text-white/80 text-sm">SAP S/4HANA Training Simulator</span>
        </div>

        <div className="ml-auto flex items-center gap-4 text-white/80 text-sm">
          {/* Help / Dictionary Button */}
          <button
            onClick={() => handleTransaction('/nDIC', { name: 'Diccionario', description: 'Abrir ayuda' })}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors mr-2"
            title="Diccionario de Datos (/nDIC)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </button>

          {/* Fiori Launchpad Button */}
          <button
            onClick={() => setShowLaunchpad(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Abrir SAP Fiori Launchpad"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span className="hidden md:inline">Launchpad</span>
          </button>

          {/* Connection Status Indicator */}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${dataSource === 'supabase'
            ? 'bg-green-500/20 text-green-300'
            : 'bg-yellow-500/20 text-yellow-300'
            }`}>
            <span className={`w-2 h-2 rounded-full ${dataSource === 'supabase' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
            {dataSource === 'supabase' ? '☁️ Supabase' : '💾 Local'}
          </span>
          <span>|</span>
          <span>Sistema: PRD</span>
          <span>|</span>
          <span>Mandante: 100</span>
          <span>|</span>
          <span className="font-semibold">Usuario: CONSULTOR01</span>
        </div>
      </header>

      {/* Command Bar */}
      <CommandBar
        onExecute={handleTransaction}
        currentTransaction={currentTransaction}
      />

      {/* Quick Filter Tabs */}
      <div className="bg-white border-b border-[#C4C4C4] px-4 py-2 flex items-center gap-2">
        <span className="text-sm text-[#6A6D70] mr-2">Filtros Rápidos:</span>
        {[
          { key: 'all', label: 'Todos', count: products.length },
          { key: 'duplicates', label: 'Duplicados', count: stats.duplicates, color: 'bg-[#FFF3CD] text-[#856404]' },
          { key: 'lowStock', label: 'Stock Bajo', count: stats.lowStock, color: 'bg-[#FFEBEE] text-[#BB0000]' },
          { key: 'overweight', label: 'Sobrepeso', count: stats.overweight, color: 'bg-[#FFE0B2] text-[#E65100]' },
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => {
              applyFilter(filter.key);
              setCurrentTransaction(filter.key === 'all' ? '/nMM03' : filter.key === 'duplicates' ? '/nDUP' : filter.key === 'lowStock' ? '/nREORD' : '/nOVERW');
            }}
            className={`px-3 py-1 rounded text-sm transition-all ${activeFilter === filter.key
              ? 'bg-[#0854A0] text-white'
              : filter.color || 'bg-[#F2F2F2] text-[#32363A] hover:bg-[#E0E0E0]'
              }`}
          >
            {filter.label}
            <span className="ml-1 opacity-80">({filter.count.toLocaleString()})</span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleLoadFullDataset}
            className="sap-btn sap-btn-secondary text-xs"
            disabled={products.length >= 36000}
          >
            {products.length >= 36000 ? '36K Cargados' : 'Cargar 36K SKUs'}
          </button>
        </div>
      </div>

      {/* Main Content - ALV Grid */}
      <main className="flex-1 pb-8">
        <ALVGrid
          data={filteredProducts}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          onSelectionChange={setSelectedRows}
          onExport={handleExport}
          onRefresh={() => handleTransaction('/nMM03', TRANSACTIONS['/nMM03'])}
          title={
            activeFilter === 'all' ? 'Lista de Materiales' :
              activeFilter === 'duplicates' ? 'Materiales Duplicados' :
                activeFilter === 'lowStock' ? 'Materiales - Alerta Recompra' :
                  activeFilter === 'overweight' ? 'Materiales - Sobrepeso (>50kg)' :
                    'Lista de Materiales'
          }
          loading={loading}
        />
      </main>

      {/* Status Bar */}
      <StatusBar
        message={status.message}
        type={status.type}
        selectedCount={selectedRows.size}
        totalCount={filteredProducts.length}
        currentTransaction={currentTransaction}
      />

      {/* Material Detail Modal */}
      {(modalMode === 'view' || modalMode === 'edit' || modalMode === 'create') && (
        <MaterialDetail
          material={selectedProduct}
          mode={modalMode}
          onSave={handleSaveMaterial}
          onClose={closeModal}
          transactionCode={currentTransaction}
        />
      )}

      {/* Sales Order Modal */}
      {modalMode === 'sales' && (
        <SalesOrder
          products={products}
          customers={customers}
          onCreate={async (order) => {
            try {
              const result = await createSalesOrder(order);
              showSuccess(`Pedido de Venta ${result.id} creado correctamente`);
              closeModal();
            } catch (e) {
              showError(`Error al crear pedido: ${e.message}`);
            }
          }}
          onClose={closeModal}
          onStatusMessage={(msg, type) => {
            if (type === 'success') showSuccess(msg);
            else if (type === 'error') showError(msg);
            else showInfo(msg);
          }}
        />
      )}

      {/* SQL Browser Modal */}
      {modalMode === 'sql' && (
        <SQLBrowser
          data={products}
          onClose={closeModal}
          onStatusMessage={(msg, type) => {
            if (type === 'success') showSuccess(msg);
            else if (type === 'error') showError(msg);
            else if (type === 'warning') showWarning(msg);
            else showInfo(msg);
          }}
        />
      )}

      {/* Roadmap Viewer */}
      {modalMode === 'roadmap' && (
        <RoadmapViewer onClose={closeModal} />
      )}

      {/* Purchase Order Modal */}
      {modalMode === 'po' && (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
          <div className="bg-[#0854A0] text-white px-4 py-2 flex items-center justify-between shadow-md">
            <span className="font-bold text-sm">Crear Pedido Estándar</span>
            <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded">✕</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <PurchaseOrder
              onSave={createOrder}
              onCancel={closeModal}
              vendors={vendors}
              materials={products}
              showStatus={(msg, type) => {
                if (type === 'success') showSuccess(msg);
                else if (type === 'error') showError(msg);
                else showInfo(msg);
              }}
            />
          </div>
        </div>
      )}

      {/* Release Order Modal */}
      {modalMode === 'release' && (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
          <div className="bg-[#0854A0] text-white px-4 py-2 flex items-center justify-between shadow-md">
            <span className="font-bold text-sm">Liberar Documentos de Compra</span>
            <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded">✕</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ReleaseOrder
              orders={orders}
              onRelease={releaseOrder}
              onClose={closeModal}
              showStatus={(msg, type) => {
                if (type === 'success') showSuccess(msg);
                else if (type === 'error') showError(msg);
                else showInfo(msg);
              }}
            />
          </div>
        </div>
      )}


      {/* Outbound Delivery Modal */}
      {
        modalMode === 'delivery' && (
          <OutboundDelivery
            orders={salesOrders}
            products={products}
            onClose={closeModal}
            showStatus={(msg, type) => {
              if (type === 'success') showSuccess(msg);
              else if (type === 'error') showError(msg);
              else showInfo(msg);
            }}
            onPost={async (orderId, pickedItems) => {
              try {
                // 1. Deduct Stock
                for (const [matId, qty] of Object.entries(pickedItems)) {
                  const product = products.find(p => p.id === matId);
                  if (product) {
                    const newStock = (product.stockActual || 0) - qty;
                    // Ensure we don't go below zero? SAP allows negative stock if configured, but let's be safe.
                    await updateMaterial({ ...product, stockActual: newStock });
                  }
                }
                // 2. Update Order Status
                await createDelivery(orderId);
              } catch (e) {
                showError('Error finalizing delivery: ' + e.message);
                throw e; // Propagate to component
              }
            }}
          />
        )
      }

      {/* MIGO Modal */}
      {
        modalMode === 'migo' && (
          <div className="fixed inset-0 z-50 bg-[#F5F7FA] flex flex-col">
            <div className="bg-[#0854A0] text-white px-4 py-2 flex items-center justify-between shadow-md">
              <span className="font-bold text-sm">MIGO - Movimiento de Mercancías</span>
              <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <GoodsMovement
                showStatus={(msg, type) => {
                  if (type === 'success') showSuccess(msg);
                  else if (type === 'error') showError(msg);
                  else showInfo(msg);
                }}
                onClose={closeModal}
                onFindPO={(poId) => orders.find(o => o.EBELN === poId && o.STATUS === 'Released')}
                onPost={async (data) => {
                  try {
                    // Find product (Case insensitive and fuzzy)
                    const searchMat = data.material.toUpperCase();
                    const product = products.find(p =>
                      p.id === searchMat ||
                      p.id.toUpperCase() === searchMat ||
                      p.id.endsWith(searchMat) ||
                      (p.ean && p.ean === searchMat)
                    );

                    if (!product) {
                      showError(`Error MIGO: Material "${data.material}" no existe en centro 1000`);
                      return;
                    }

                    // Update stock
                    let newStock = product.stockActual;
                    if (data.claseMov === '101' || data.claseMov === '501' || data.claseMov === '561') {
                      newStock += parseInt(data.cantidad);
                    } else {
                      newStock -= parseInt(data.cantidad);
                    }

                    // Save changes
                    const updatedProduct = { ...product, stockActual: newStock };
                    await updateMaterial(updatedProduct);

                    // If linked to PO, close it
                    if (data.refDoc) {
                      await receiveOrder(data.refDoc);
                    }

                    showSuccess(`Documento material ${data.docMaterial} contabilizado. Nuevo stock: ${newStock}`);
                    setTimeout(() => closeModal(), 2000);
                  } catch (err) {
                    showError('Error al contabilizar: ' + err.message);
                  }
                }}
              />
            </div>
          </div>
        )
      }

      {/* Vendor Master Modal */}
      {
        modalMode === 'vendor' && (
          <VendorMaster
            onClose={closeModal}
            onSave={createVendor}
            onStatusMessage={(msg, type) => {
              if (type === 'success') showSuccess(msg);
              else if (type === 'error') showError(msg);
              else showInfo(msg);
            }}
          />
        )
      }

      {/* Fiori Launchpad */}
      {
        showLaunchpad && (
          <FioriLaunchpad
            onExecuteTransaction={(code) => {
              const info = TRANSACTIONS[code];
              if (info) handleTransaction(code, info);
            }}
            onClose={() => setShowLaunchpad(false)}
            stats={stats}
          />
        )
      }
      {/* Data Dictionary Modal */}
      {
        modalMode === 'dictionary' && (
          <DataDictionary onClose={closeModal} />
        )
      }

      {/* Billing Modal */}
      {
        modalMode === 'billing' && (
          <Billing
            orders={salesOrders}
            onCreateInvoice={createInvoice}
            onClose={closeModal}
            showStatus={(msg, type) => {
              if (type === 'success') showSuccess(msg);
              else if (type === 'error') showError(msg);
              else showInfo(msg);
            }}
          />
        )
      }

      {/* Manager Dashboard Modal */}
      {
        modalMode === 'manager' && (
          <ManagerDashboard
            onClose={closeModal}
            onNavigate={(cmd) => {
              setModalMode(null);
              setTimeout(() => handleTransaction(cmd), 100);
            }}
            data={{
              salesOrders,
              purchaseOrders: orders,
              products
            }}
          />
        )
      }



      {/* SQVI Simulator Modal */}
      {
        modalMode === 'sqvi' && (
          <SQVI onClose={closeModal} />
        )
      }

      {/* E-commerce Monitor Modal */}
      {
        modalMode === 'ecomm' && (
          <EcommerceMonitor onClose={closeModal} />
        )
      }

      {/* MD04 Monitor */}
      {
        modalMode === 'md04' && (
          <MD04
            onClose={closeModal}
            onNavigate={(cmd) => {
              setModalMode(null);
              setTimeout(() => handleTransaction(cmd), 100);
            }}
          />
        )
      }

      {/* EAN Manager */}
      {
        modalMode === 'ean' && (
          <EANManager
            materials={products}
            onUpdateMaterial={async (updatedMat) => {
              const result = await updateMaterial(updatedMat);
              if (result.success) {
                applyFilter(activeFilter);
              }
            }}
            onClose={closeModal}
            showStatus={(msg, type) => {
              if (type === 'success') showSuccess(msg);
              else if (type === 'error') showError(msg);
              else if (type === 'warning') showWarning(msg);
              else showInfo(msg);
            }}
          />
        )
      }

      {/* Team Operations Center */}
      {
        modalMode === 'team' && (
          <TeamOperations
            materials={products}
            onNavigate={(cmd) => {
              setModalMode(null);
              setTimeout(() => handleTransaction(cmd), 150);
            }}
            onClose={closeModal}
            showStatus={(msg, type) => {
              if (type === 'success') showSuccess(msg);
              else if (type === 'error') showError(msg);
              else if (type === 'warning') showWarning(msg);
              else showInfo(msg);
            }}
          />
        )
      }

      {/* Master Plan */}
      {
        modalMode === 'plan' && (
          <MasterPlan
            materials={products}
            onNavigate={(cmd) => {
              setModalMode(null);
              setTimeout(() => handleTransaction(cmd), 150);
            }}
            onClose={closeModal}
            showStatus={(msg, type) => {
              if (type === 'success') showSuccess(msg);
              else if (type === 'error') showError(msg);
              else if (type === 'warning') showWarning(msg);
              else showInfo(msg);
            }}
          />
        )
      }

      {modalMode === 'pres' && (
        <Presentation
          materials={products}
          onNavigate={(cmd) => {
            setModalMode(null);
            setTimeout(() => handleTransaction(cmd), 150);
          }}
          onClose={closeModal}
        />
      )}

    </div >
  );
}

export default App;
