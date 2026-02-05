import { useState, useEffect, useCallback } from 'react';
import './index.css';

// Components
import CommandBar, { TRANSACTIONS } from './components/CommandBar';
import ALVGrid from './components/ALVGrid';
import StatusBar, { useStatusMessage } from './components/StatusBar';
import MaterialDetail from './components/MaterialDetail';
import SalesOrder from './components/SalesOrder';
import SQLBrowser from './components/SQLBrowser';

// Data & Utils
import { SAMPLE_PRODUCTS, getFullDataset, getDataStats, CATEGORY_LIST } from './data/dakaProducts';
import { exportToExcel } from './utils/excelExport';

function App() {
  // State
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTransaction, setCurrentTransaction] = useState('/nMM03');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [modalMode, setModalMode] = useState(null); // 'view', 'edit', 'create', 'sales', 'sql'
  const [activeFilter, setActiveFilter] = useState('all');

  const { status, showSuccess, showError, showWarning, showInfo } = useStatusMessage();

  // Load initial data
  useEffect(() => {
    setLoading(true);
    // Simulate SAP data loading
    setTimeout(() => {
      setProducts(SAMPLE_PRODUCTS);
      setFilteredProducts(SAMPLE_PRODUCTS);
      setLoading(false);
      showInfo(`${SAMPLE_PRODUCTS.length.toLocaleString()} materiales cargados desde SAP`);
    }, 800);
  }, []);

  // Load full dataset
  const loadFullDataset = useCallback(() => {
    setLoading(true);
    showInfo('Cargando dataset completo (36,000 registros)...');

    setTimeout(() => {
      const fullData = getFullDataset();
      setProducts(fullData);
      setFilteredProducts(fullData);
      setLoading(false);
      showSuccess(`${fullData.length.toLocaleString()} materiales cargados exitosamente`);
    }, 1500);
  }, []);

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
    setCurrentTransaction(code);

    switch (code) {
      case '/nMM01':
        // Create new material
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
        // Open SQL Browser
        setModalMode('sql');
        showInfo('Transacción SE16 - Data Browser');
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

  // Handle save material
  const handleSaveMaterial = (material) => {
    if (modalMode === 'create') {
      // Generate new ID
      const newId = `DF-${String(products.length + 1).padStart(6, '0')}`;
      const newMaterial = { ...material, id: newId, fechaCreacion: new Date().toISOString().split('T')[0] };
      setProducts([newMaterial, ...products]);
      setFilteredProducts([newMaterial, ...filteredProducts]);
      showSuccess(`Material ${newId} creado exitosamente`);
    } else {
      // Update existing
      const updated = products.map(p => p.id === material.id ? material : p);
      setProducts(updated);
      setFilteredProducts(updated.filter(p =>
        activeFilter === 'all' ? true :
          activeFilter === 'duplicates' ? p.status === 'duplicate' :
            activeFilter === 'lowStock' ? p.stockActual < p.puntoReorden :
              activeFilter === 'overweight' ? p.pesoNeto > 50 :
                true
      ));
      showSuccess(`Material ${material.id} actualizado`);
    }
    setModalMode(null);
    setSelectedProduct(null);
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
              <span className="text-[#0854A0] font-bold text-xs">DF</span>
            </div>
            <span>Dakafacil</span>
          </div>
          <span className="text-white/60 text-sm">|</span>
          <span className="text-white/80 text-sm">SAP S/4HANA Training Simulator</span>
        </div>

        <div className="ml-auto flex items-center gap-4 text-white/80 text-sm">
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
            onClick={loadFullDataset}
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
          onClose={closeModal}
          onStatusMessage={(msg, type) => {
            if (type === 'success') showSuccess(msg);
            else if (type === 'error') showError(msg);
            else if (type === 'warning') showWarning(msg);
            else showInfo(msg);
          }}
        />
      )}
    </div>
  );
}

export default App;
