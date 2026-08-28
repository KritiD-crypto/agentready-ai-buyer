import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Product, ProductSpec, ProductVariant } from '../../types/index';
import { api } from '../../lib/api';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  Code2,
  DollarSign,
  ArrowUpDown,
  Tag,
  Check,
  AlertCircle,
  X,
  RefreshCw,
  Box,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';

export function ProductManager() {
  const { merchant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Selected product for inspection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all'); // all, in_stock, low_stock, out_of_stock
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('all'); // all, agent_yes, agent_no
  const [selectedSchemaFilter, setSelectedSchemaFilter] = useState('all'); // all, schema_yes, schema_no

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Stock Adjustment state
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);

  // Form State (shared for Add and Edit)
  const [formId, setFormId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Footwear');
  const [formPrice, setFormPrice] = useState<number>(2999);
  const [formCurrency, setFormCurrency] = useState('INR');
  const [formSku, setFormSku] = useState('');
  const [formStock, setFormStock] = useState<number>(50);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formHasSchema, setFormHasSchema] = useState(true);
  const [formAgentPurchasable, setFormAgentPurchasable] = useState(true);
  const [formTags, setFormTags] = useState<string>('running, performance, marathon');
  const [formSpecs, setFormSpecs] = useState<ProductSpec[]>([
    { key: 'Weight', value: '240g', category: 'Physical' },
    { key: 'Material', value: 'Engineered Mesh', category: 'Material' },
  ]);
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getProducts({
        merchantId: merchant?.id,
      });
      setProducts(data);
      if (data.length > 0) {
        if (!selectedProduct || !data.find((p) => p.id === selectedProduct.id)) {
          setSelectedProduct(data[0]);
        } else {
          setSelectedProduct(data.find((p) => p.id === selectedProduct.id) || data[0]);
        }
      } else {
        setSelectedProduct(null);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setErrorMessage(err?.message || 'Failed to load product catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [merchant]);

  // Dynamic category options from products
  const categoryOptions = useMemo(() => {
    const defaultCategories = ['Footwear', 'Wearables', 'Audio & Electronics', 'Apparel', 'Accessories', 'General'];
    const catalogCategories = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...defaultCategories, ...catalogCategories]));
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchCategory = p.category?.toLowerCase().includes(q);
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchSku = p.variants?.some((v) => v.sku.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCategory && !matchTags && !matchSku) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Stock status
      if (selectedStockFilter === 'in_stock' && p.stockQuantity <= 10) return false;
      if (selectedStockFilter === 'low_stock' && (p.stockQuantity === 0 || p.stockQuantity > 10)) return false;
      if (selectedStockFilter === 'out_of_stock' && p.stockQuantity > 0) return false;

      // Agent purchasable
      if (selectedAgentFilter === 'agent_yes' && !p.isAgentPurchasable) return false;
      if (selectedAgentFilter === 'agent_no' && p.isAgentPurchasable) return false;

      // Schema.org
      if (selectedSchemaFilter === 'schema_yes' && !p.hasStructuredData) return false;
      if (selectedSchemaFilter === 'schema_no' && p.hasStructuredData) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStockFilter, selectedAgentFilter, selectedSchemaFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.stockQuantity > 10).length;
    const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length;
    const schemaReady = products.filter((p) => p.hasStructuredData).length;
    const agentReady = products.filter((p) => p.isAgentPurchasable).length;

    const schemaPercent = total > 0 ? Math.round((schemaReady / total) * 100) : 100;
    const agentPercent = total > 0 ? Math.round((agentReady / total) * 100) : 100;

    return { total, inStock, lowStock, outOfStock, schemaPercent, agentPercent };
  }, [products]);

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFormId('');
    setFormTitle('');
    setFormCategory('Footwear');
    setFormPrice(2499);
    setFormCurrency('INR');
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormStock(50);
    setFormDescription('');
    setFormImageUrl('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80');
    setFormHasSchema(true);
    setFormAgentPurchasable(true);
    setFormTags('running, performance, marathon');
    setFormSpecs([
      { key: 'Weight', value: '240g', category: 'Physical' },
      { key: 'Material', value: 'Engineered Mesh', category: 'Material' },
      { key: 'Drop', value: '8mm', category: 'Geometry' },
    ]);
    setFormVariants([]);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: Product) => {
    setFormId(p.id);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormPrice(p.basePrice);
    setFormCurrency(p.currency || 'INR');
    setFormSku(p.variants?.[0]?.sku || `SKU-${p.id.slice(-4).toUpperCase()}`);
    setFormStock(p.stockQuantity);
    setFormDescription(p.description || '');
    setFormImageUrl(p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
    setFormHasSchema(p.hasStructuredData);
    setFormAgentPurchasable(p.isAgentPurchasable);
    setFormTags(p.tags?.join(', ') || '');
    setFormSpecs(p.specs && p.specs.length > 0 ? [...p.specs] : [{ key: 'Weight', value: '250g', category: 'General' }]);
    setFormVariants(p.variants ? [...p.variants] : []);
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formTitle.trim()) {
      errors.title = 'Product title is required.';
    }
    if (isNaN(formPrice) || formPrice < 0) {
      errors.price = 'Base price must be a non-negative number.';
    }
    if (isNaN(formStock) || formStock < 0) {
      errors.stock = 'Stock quantity must be a non-negative number.';
    }
    if (!formSku.trim()) {
      errors.sku = 'Primary SKU is required for agent inventory tracking.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Add
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const newProd = await api.createProduct({
        title: formTitle.trim(),
        category: formCategory.trim(),
        basePrice: Number(formPrice),
        currency: formCurrency,
        sku: formSku.trim().toUpperCase(),
        stockQuantity: Number(formStock),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        hasStructuredData: formHasSchema,
        isAgentPurchasable: formAgentPurchasable,
        tags: parsedTags,
        specs: formSpecs.filter((s) => s.key.trim() && s.value.trim()),
      });

      setIsAddModalOpen(false);
      await fetchProducts();
      setSelectedProduct(newProd);
      showToast(`Created product "${newProd.title}" successfully!`);
    } catch (err: any) {
      console.error('Error creating product:', err);
      setFormErrors({ submit: err?.message || 'Failed to create product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !formId) return;

    setIsSubmitting(true);
    try {
      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updated = await api.updateProduct(formId, {
        title: formTitle.trim(),
        category: formCategory.trim(),
        basePrice: Number(formPrice),
        currency: formCurrency,
        sku: formSku.trim().toUpperCase(),
        stockQuantity: Number(formStock),
        description: formDescription.trim(),
        imageUrl: formImageUrl.trim(),
        hasStructuredData: formHasSchema,
        isAgentPurchasable: formAgentPurchasable,
        tags: parsedTags,
        specs: formSpecs.filter((s) => s.key.trim() && s.value.trim()),
      });

      setIsEditModalOpen(false);
      await fetchProducts();
      setSelectedProduct(updated);
      showToast(`Updated "${updated.title}" successfully!`);
    } catch (err: any) {
      console.error('Error updating product:', err);
      setFormErrors({ submit: err?.message || 'Failed to update product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Modal
  const handleOpenDelete = (p: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProductToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await api.deleteProduct(productToDelete.id);
      setIsDeleteModalOpen(false);
      showToast(`Deleted "${productToDelete.title}" from catalog.`);
      setProductToDelete(null);
      await fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast(err?.message || 'Failed to delete product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Stock Adjustment (+1, -1, +10, -10)
  const handleQuickStock = async (p: Product, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStockUpdatingId(p.id);
    try {
      const newStock = Math.max(0, p.stockQuantity + delta);
      const updated = await api.updateProductStock(p.id, newStock);
      setProducts((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
      if (selectedProduct?.id === p.id) {
        setSelectedProduct(updated);
      }
    } catch (err: any) {
      console.error('Failed to update stock:', err);
    } finally {
      setStockUpdatingId(null);
    }
  };

  // Helper to add/remove spec rows
  const handleAddSpecRow = () => {
    setFormSpecs([...formSpecs, { key: '', value: '', category: 'General' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setFormSpecs(formSpecs.filter((_, idx) => idx !== index));
  };

  const handleSpecChange = (index: number, field: keyof ProductSpec, val: string) => {
    const updated = [...formSpecs];
    updated[index] = { ...updated[index], [field]: val };
    setFormSpecs(updated);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Product Catalog & Micro-Attributes
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage products, SKU matrix inventory, machine-verifiable specifications, and autonomous agent permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-refresh-products"
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-2.5 bg-[#0D0D0E] hover:bg-slate-800 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-add-product-open"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Products</span>
          <p className="text-lg font-bold text-white font-mono">{stats.total}</p>
        </div>

        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">In Stock (&gt;10)</span>
          <p className="text-lg font-bold text-emerald-400 font-mono">{stats.inStock}</p>
        </div>

        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Low Stock (1-10)</span>
          <p className="text-lg font-bold text-amber-400 font-mono">{stats.lowStock}</p>
        </div>

        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Out of Stock</span>
          <p className="text-lg font-bold text-rose-400 font-mono">{stats.outOfStock}</p>
        </div>

        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Schema.org Ready</span>
          <p className="text-lg font-bold text-violet-300 font-mono">{stats.schemaPercent}%</p>
        </div>

        <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Agent Purchasable</span>
          <p className="text-lg font-bold text-indigo-300 font-mono">{stats.agentPercent}%</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-product-search"
              type="text"
              placeholder="Search by title, SKU, category, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080809] border border-slate-800/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="select-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              id="select-filter-stock"
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt;10)</option>
              <option value="low_stock">Low Stock (1-10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Agent Permission Filter */}
          <div>
            <select
              id="select-filter-agent"
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="w-full bg-[#080809] border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Agent Permissions</option>
              <option value="agent_yes">Agent Purchasable: Yes</option>
              <option value="agent_no">Agent Purchasable: No</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        {(searchQuery || selectedCategory !== 'all' || selectedStockFilter !== 'all' || selectedAgentFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
            <span className="text-slate-400">
              Showing {filteredProducts.length} of {products.length} products
            </span>
            <button
              id="btn-clear-product-filters"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStockFilter('all');
                setSelectedAgentFilter('all');
              }}
              className="text-violet-400 hover:text-violet-300 font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Split View: Product List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-28 bg-[#0D0D0E] border border-slate-800/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-8 text-center space-y-3">
              <Box className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">No Products Found</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {products.length === 0
                    ? 'Your catalog is empty. Add your first machine-readable product to get started.'
                    : 'No products matched your search or active filter combination.'}
                </p>
              </div>
              {products.length === 0 ? (
                <button
                  id="btn-add-first-product"
                  onClick={handleOpenAddModal}
                  className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Product</span>
                </button>
              ) : (
                <button
                  id="btn-reset-filters-empty"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedStockFilter('all');
                    setSelectedAgentFilter('all');
                  }}
                  className="mt-2 text-xs text-violet-400 hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              const primarySku = product.variants?.[0]?.sku || 'SKU-NONE';
              const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 10;
              const isOutOfStock = product.stockQuantity === 0;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => setSelectedProduct(product)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-violet-950/20 border-violet-500/60 shadow-lg shadow-violet-950/20'
                      : 'bg-[#0D0D0E] border-slate-800/60 hover:bg-[#121214] hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 truncate">
                          {product.category}
                        </span>
                        <span className="text-xs font-bold text-white font-mono shrink-0">
                          ₹{product.basePrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <h3 className="text-xs font-semibold text-slate-100 truncate">{product.title}</h3>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>{primarySku}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            isOutOfStock
                              ? 'text-rose-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {product.stockQuantity} in stock
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Quick Action Footer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {product.hasStructuredData ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                          Schema.org
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
                          No Schema
                        </span>
                      )}

                      {product.isAgentPurchasable && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-medium">
                          Agent Ready
                        </span>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Stock Adjuster */}
                      <button
                        id={`btn-stock-minus-${product.id}`}
                        onClick={(e) => handleQuickStock(product, -1, e)}
                        disabled={product.stockQuantity === 0 || stockUpdatingId === product.id}
                        className="w-6 h-6 rounded-lg bg-[#080809] border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30"
                        title="Decrease stock by 1"
                      >
                        -
                      </button>

                      <button
                        id={`btn-stock-plus-${product.id}`}
                        onClick={(e) => handleQuickStock(product, 1, e)}
                        disabled={stockUpdatingId === product.id}
                        className="w-6 h-6 rounded-lg bg-[#080809] border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center disabled:opacity-30"
                        title="Increase stock by 1"
                      >
                        +
                      </button>

                      <button
                        id={`btn-edit-prod-card-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(product);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60 ml-1"
                        title="Edit product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-delete-prod-card-${product.id}`}
                        onClick={(e) => handleOpenDelete(product, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Product Inspector & Micro-Attribute Explorer */}
        <div className="lg:col-span-7">
          {selectedProduct ? (
            <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-5 md:p-6 space-y-6 sticky top-4">
              {/* Product Header in Inspector */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800/60">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                      {selectedProduct.category}
                    </span>
                    <h2 className="text-base font-bold text-white tracking-tight">{selectedProduct.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{selectedProduct.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  <button
                    id="btn-inspector-edit"
                    onClick={() => handleOpenEditModal(selectedProduct)}
                    className="px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Specs</span>
                  </button>

                  <button
                    id="btn-inspector-delete"
                    onClick={() => handleOpenDelete(selectedProduct)}
                    className="px-3 py-1.5 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Core Commercial Signals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#080809] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-medium">Base Price</span>
                  <p className="text-sm font-bold text-emerald-400 font-mono">
                    ₹{selectedProduct.basePrice.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="p-3 bg-[#080809] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-medium">Stock Inventory</span>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-white font-mono">{selectedProduct.stockQuantity}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickStock(selectedProduct, -5)}
                        className="px-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Reduce 5"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleQuickStock(selectedProduct, 5)}
                        className="px-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Add 5"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#080809] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-medium">JSON-LD Markup</span>
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedProduct.hasStructuredData ? 'Active' : 'Disabled'}</span>
                  </p>
                </div>

                <div className="p-3 bg-[#080809] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-medium">Agent Settlement</span>
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{selectedProduct.isAgentPurchasable ? 'Allowed' : 'Blocked'}</span>
                  </p>
                </div>
              </div>

              {/* Machine-Verifiable Micro-Attributes (Specs) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
                    <span>Machine-Verifiable Micro-Attributes (JSON-LD Specs)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedProduct.specs?.length || 0} Specs defined
                  </span>
                </div>

                {selectedProduct.specs && selectedProduct.specs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedProduct.specs.map((spec, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#080809] border border-slate-800/80 rounded-xl space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-mono font-medium">
                            {spec.key}
                          </span>
                          {spec.category && (
                            <span className="text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                              {spec.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-200">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#080809] border border-slate-800/80 rounded-xl text-center text-xs text-slate-500">
                    No technical specifications configured. AI agents with strict constraints may penalize this product.
                  </div>
                )}
              </div>

              {/* SKU & Matrix Variants */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      <span>SKU Matrix Variants & Inventory Levels</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {selectedProduct.variants.length} Variants
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedProduct.variants.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 bg-[#080809] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-200 font-semibold">{v.sku}</span>
                          <p className="text-[11px] text-slate-400">{v.title}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`font-mono text-[11px] ${
                              v.inventoryCount > 0 ? 'text-slate-300' : 'text-rose-400 font-semibold'
                            }`}
                          >
                            Stock: {v.inventoryCount}
                          </span>
                          <span className="font-bold text-emerald-400 font-mono">
                            ₹{v.price.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live JSON-LD Schema Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Schema.org JSON-LD Output (Generated Live)</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">200 OK Schema Valid</span>
                </div>
                <pre className="p-3.5 bg-[#050506] border border-slate-900 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(
                    {
                      '@context': 'https://schema.org/',
                      '@type': 'Product',
                      name: selectedProduct.title,
                      image: selectedProduct.imageUrl,
                      description: selectedProduct.description,
                      sku: selectedProduct.variants?.[0]?.sku || 'SKU-001',
                      offers: {
                        '@type': 'Offer',
                        priceCurrency: selectedProduct.currency || 'INR',
                        price: selectedProduct.basePrice,
                        availability:
                          selectedProduct.stockQuantity > 0
                            ? 'https://schema.org/InStock'
                            : 'https://schema.org/OutOfStock',
                        itemCondition: 'https://schema.org/NewCondition',
                      },
                      additionalProperty: selectedProduct.specs?.map((s) => ({
                        '@type': 'PropertyValue',
                        name: s.key,
                        value: s.value,
                      })),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-[#0D0D0E] border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500 text-xs">
              Select a product from the list to inspect specifications, stock levels, and Schema.org markup.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D0D0E] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Add Product to Catalog</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Product Title *</label>
                  <input
                    id="input-add-title"
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. UltraGlide Carbon-Plate Running Shoe"
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                  />
                  {formErrors.title && <p className="text-[11px] text-rose-400 mt-1">{formErrors.title}</p>}
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Category</label>
                  <input
                    id="input-add-category"
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Footwear"
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Primary SKU *</label>
                  <input
                    id="input-add-sku"
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. NG-SHOE-01"
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-violet-500"
                  />
                  {formErrors.sku && <p className="text-[11px] text-rose-400 mt-1">{formErrors.sku}</p>}
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Base Price (₹) *</label>
                  <input
                    id="input-add-price"
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Initial Stock Quantity *</label>
                  <input
                    id="input-add-stock"
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Image URL</label>
                  <input
                    id="input-add-image"
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Description</label>
                  <textarea
                    id="input-add-desc"
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detailed specifications, materials, and fit advice..."
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Search & Discovery Tags (Comma-separated)</label>
                  <input
                    id="input-add-tags"
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="marathon, road, carbon-plate"
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Dynamic Technical Specs Adder */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Technical Micro-Attributes (Specs)</label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formSpecs.map((spec, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Key (e.g. Weight)"
                          value={spec.key}
                          onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                          className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Value (e.g. 240g)"
                          value={spec.value}
                          onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                          className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Category"
                          value={spec.category || ''}
                          onChange={(e) => handleSpecChange(index, 'category', e.target.value)}
                          className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(index)}
                          className="p-1.5 text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#080809] border border-slate-800 cursor-pointer">
                  <span className="text-xs text-slate-300 font-medium">Publish JSON-LD Schema.org</span>
                  <input
                    id="toggle-add-schema"
                    type="checkbox"
                    checked={formHasSchema}
                    onChange={(e) => setFormHasSchema(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#080809] border border-slate-800 cursor-pointer">
                  <span className="text-xs text-slate-300 font-medium">Allow AI Agent Direct Checkout</span>
                  <input
                    id="toggle-add-agent"
                    type="checkbox"
                    checked={formAgentPurchasable}
                    onChange={(e) => setFormAgentPurchasable(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                  />
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-add-product"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Product...' : 'Create & Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0D0D0E] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Edit Product & Specifications</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formErrors.submit && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {formErrors.submit}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Product Title *</label>
                  <input
                    id="input-edit-title"
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                  />
                  {formErrors.title && <p className="text-[11px] text-rose-400 mt-1">{formErrors.title}</p>}
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Category</label>
                  <input
                    id="input-edit-category"
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Primary SKU</label>
                  <input
                    id="input-edit-sku"
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Base Price (₹) *</label>
                  <input
                    id="input-edit-price"
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Stock Quantity *</label>
                  <input
                    id="input-edit-stock"
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Image URL</label>
                  <input
                    id="input-edit-image"
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Description</label>
                  <textarea
                    id="input-edit-desc"
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Search & Discovery Tags (Comma-separated)</label>
                  <input
                    id="input-edit-tags"
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Dynamic Technical Specs Editor */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Technical Micro-Attributes (Specs)</label>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec Row</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formSpecs.map((spec, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Key"
                          value={spec.key}
                          onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                          className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Value"
                          value={spec.value}
                          onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                          className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Category"
                          value={spec.category || ''}
                          onChange={(e) => handleSpecChange(index, 'category', e.target.value)}
                          className="w-full bg-[#080809] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecRow(index)}
                          className="p-1.5 text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#080809] border border-slate-800 cursor-pointer">
                  <span className="text-xs text-slate-300 font-medium">Publish JSON-LD Schema.org</span>
                  <input
                    id="toggle-edit-schema"
                    type="checkbox"
                    checked={formHasSchema}
                    onChange={(e) => setFormHasSchema(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-[#080809] border border-slate-800 cursor-pointer">
                  <span className="text-xs text-slate-300 font-medium">Allow AI Agent Direct Checkout</span>
                  <input
                    id="toggle-edit-agent"
                    type="checkbox"
                    checked={formAgentPurchasable}
                    onChange={(e) => setFormAgentPurchasable(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0"
                  />
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-edit-product"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0E] border border-rose-500/30 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Product from Catalog?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#080809] border border-slate-800 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-white">{productToDelete.title}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                SKU: {productToDelete.variants?.[0]?.sku || 'N/A'} • ₹{productToDelete.basePrice.toLocaleString('en-IN')}
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Removing this product will prevent simulated and real AI agents from discovering or purchasing it.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-product"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
