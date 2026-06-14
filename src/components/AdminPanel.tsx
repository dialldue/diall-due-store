import React, { useState, useEffect } from 'react';
import { Shield, Plus, Upload, Trash2, Edit, Check } from 'lucide-react';
import { Product } from '../types';

interface AdminPanelProps {
  products: Product[];
  categories?: string[];
  onRefreshCategories?: () => Promise<void>;
  onAddProduct: (prod: any) => Promise<boolean>;
  onUpdateProduct: (id: number, prod: any) => Promise<boolean>;
  onDeleteProduct: (id: number) => void;
  onEditClick: (product: Product) => void;
  activeEditingProduct: Product | null;
  onCancelEdit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  categories = ['For Him', 'For Her', 'Unisex', 'Couples'],
  onRefreshCategories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onEditClick,
  activeEditingProduct,
  onCancelEdit,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [category, setCategory] = useState(categories[0] || 'For Him');
  const [stock, setStock] = useState('10');
  const [rating, setRating] = useState('4.7');
  const [reviewsCount, setReviewsCount] = useState('65');
  const [description, setDescription] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  
  // Media holds [{ type: 'image' | 'video', data: string }] where data is URL or base64
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ type: 'image' | 'video'; data: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill when activeEditingProduct updates
  useEffect(() => {
    if (activeEditingProduct) {
      setName(activeEditingProduct.name);
      setBrand(activeEditingProduct.brand);
      if (activeEditingProduct.originalPrice && activeEditingProduct.originalPrice > activeEditingProduct.price) {
        setOriginalPrice(activeEditingProduct.originalPrice.toString());
        setOfferPrice(activeEditingProduct.price.toString());
      } else {
        setOriginalPrice(activeEditingProduct.price.toString());
        setOfferPrice('');
      }
      setCategory(activeEditingProduct.category);
      setStock(activeEditingProduct.stock.toString());
      setRating(activeEditingProduct.rating.toString());
      setReviewsCount(activeEditingProduct.reviews.toString());
      setDescription(activeEditingProduct.description);
      setFeaturesInput(activeEditingProduct.features ? activeEditingProduct.features.join(', ') : '');
      setUploadedMedia(activeEditingProduct.media || [{ type: 'image', data: activeEditingProduct.image }]);
      setShowAddForm(true);
    } else {
      clearForm();
    }
  }, [activeEditingProduct]);

  const clearForm = () => {
    setName('');
    setBrand('');
    setOriginalPrice('');
    setOfferPrice('');
    setCategory(categories[0] || 'For Him');
    setStock('10');
    setRating('4.5');
    setReviewsCount('50');
    setDescription('');
    setFeaturesInput('');
    setUploadedMedia([]);
    setErrorMsg('');
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((item) => {
      const file = item as File;
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg(`File ${file.name} is too large. Maximum supported size is 15MB.`);
        return;
      }
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedMedia((prev) => [
            ...prev,
            { type: isVideo ? 'video' : 'image', data: event.target!.result as string }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeMediaItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !brand || !originalPrice || !description || !featuresInput) {
      setErrorMsg('Please complete all required fields (Name, Brand, Original Price, Description, Highlights).');
      return;
    }

    if (uploadedMedia.length === 0) {
      setErrorMsg('Please upload at least one image or product video.');
      return;
    }

    setIsSubmitting(true);

    const origPriceNum = parseFloat(originalPrice);
    const offerPriceNum = offerPrice ? parseFloat(offerPrice) : NaN;
    
    // offer price is used if set, otherwise original price is also the selling price
    const finalPrice = (!isNaN(offerPriceNum) && offerPriceNum > 0) ? offerPriceNum : origPriceNum;
    const finalOriginalPrice = origPriceNum;

    const productPayload = {
      name,
      brand,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      stock: parseInt(stock) || 0,
      category,
      rating: activeEditingProduct ? activeEditingProduct.rating : 5.0,
      reviews: activeEditingProduct ? activeEditingProduct.reviews : 0,
      description,
      features: featuresInput.split(',').map((f) => f.trim()).filter(Boolean),
      image: uploadedMedia[0].data,
      media: uploadedMedia
    };

    let success = false;
    if (activeEditingProduct) {
      success = await onUpdateProduct(activeEditingProduct.id, productPayload);
    } else {
      success = await onAddProduct(productPayload);
    }

    setIsSubmitting(false);

    if (success) {
      clearForm();
      setShowAddForm(false);
      if (activeEditingProduct) onCancelEdit();
    } else {
      setErrorMsg('Operation failed. Please try again.');
    }
  };

  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const avgPrice = products.length 
    ? Math.round(products.reduce((acc, p) => acc + p.price, 0) / products.length)
    : 0;

  return (
    <div id="adminPanelSection" className="p-0 select-none max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-fade-in">
      
      {/* Admin Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-serif font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-6 h-6 stroke-[1.5]" />
            Boutique Logistics Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-sans italic">
            Analyze stock, evaluate price, and curate product catalogs in real-time
          </p>
        </div>

        <button
          onClick={() => {
            if (showAddForm) {
              clearForm();
              if (activeEditingProduct) onCancelEdit();
            }
            setShowAddForm(!showAddForm);
          }}
          className="bg-neutral-900 text-white font-bold text-xs tracking-wider uppercase py-3.5 px-6 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Close Product Portal' : 'Introduce New Piece'}
        </button>
      </div>

      {/* Metrics Dashboard Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-zinc-200 p-6 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-sans tracking-[2px] font-bold uppercase mb-2">
            Inventory Catalog
          </span>
          <span className="text-3xl font-sans font-bold text-neutral-900 leading-none">
            {products.length} <span className="text-sm font-medium text-neutral-400 uppercase font-sans tracking-wide">Skus</span>
          </span>
        </div>

        <div className="bg-white border border-zinc-200 p-6 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-sans tracking-[2px] font-bold uppercase mb-2">
            Total Stock Volume
          </span>
          <span className="text-3xl font-sans font-bold text-neutral-900 leading-none">
            {totalStock} <span className="text-sm font-medium text-neutral-400 uppercase font-sans tracking-wide">Units</span>
          </span>
        </div>

        <div className="bg-white border border-zinc-200 p-6 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-sans tracking-[2px] font-bold uppercase mb-2">
            Average Sku Value
          </span>
          <span className="text-3xl font-sans font-bold text-neutral-900 leading-none">
            ₹{avgPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-zinc-200 p-6 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 font-sans tracking-[2px] font-bold uppercase mb-2">
            Depleted Inventory
          </span>
          <span className={`text-3xl font-sans font-bold leading-none ${outOfStockCount > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
            {outOfStockCount} <span className="text-sm font-medium text-neutral-450 uppercase font-sans tracking-wide">Depleted</span>
          </span>
        </div>
      </section>

      {/* Categories & Collections Management Portal */}
      <div className="bg-white border border-neutral-900 p-6 sm:p-8 mb-10">
        <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-neutral-900 mb-4 pb-2.5 border-b border-zinc-150 flex justify-between items-center flex-wrap gap-2">
          <span>Manage Collections & Categories</span>
          <span className="text-[10px] text-neutral-400 font-sans tracking-[1.5px] uppercase font-bold">Dynamic Navigation Builder</span>
        </h3>

        {/* Input box to propose a new luxury category */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            id="newBoutiqueCategoryInput"
            placeholder="e.g. Couples, Limited Edition, Vintage"
            className="flex-1 border border-zinc-250 bg-zinc-50 p-3 text-xs focus:bg-white focus:outline-none focus:border-black transition-all"
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const btn = document.getElementById('addBoutiqueCategoryBtn');
                btn?.click();
              }
            }}
          />
          <button
            type="button"
            id="addBoutiqueCategoryBtn"
            onClick={async () => {
              const input = document.getElementById('newBoutiqueCategoryInput') as HTMLInputElement;
              const val = input?.value?.trim();
              if (!val) return;
              try {
                const res = await fetch('/api/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: val })
                });
                if (res.ok) {
                  input.value = '';
                  if (onRefreshCategories) {
                    await onRefreshCategories();
                  }
                } else {
                  const errObj = await res.json();
                  alert(errObj.error || 'Failed to add custom category');
                }
              } catch (e) {
                console.error('Error adding category:', e);
              }
            }}
            className="bg-neutral-900 text-white font-serif font-bold text-[10px] tracking-widest uppercase py-3.5 px-6 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Add Category
          </button>
        </div>

        {/* Categories checklist containing delete capabilities */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center gap-2.5 bg-neutral-50 px-3.5 py-2 border border-zinc-200 text-xs font-semibold uppercase tracking-wider text-neutral-700"
            >
              {deletingCategory === cat ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-650 font-bold text-[9px] lowercase tracking-normal">delete collection & its watches?</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/categories/${encodeURIComponent(cat)}`, {
                          method: 'DELETE'
                        });
                        if (res.ok) {
                          if (onRefreshCategories) {
                            await onRefreshCategories();
                          }
                        } else {
                          const errObj = await res.json();
                          setErrorMsg(errObj.error || 'Failed to delete category');
                        }
                      } catch (e) {
                        console.error('Error deleting category:', e);
                      } finally {
                        setDeletingCategory(null);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] px-1.5 py-0.5 cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(null)}
                    className="text-neutral-500 hover:text-neutral-800 font-bold text-[9px] px-1 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(cat)}
                    className="text-red-500 hover:text-red-700 transition-colors p-0.5 cursor-pointer ml-1.5 focus:outline-none"
                    title={`Delete "${cat}" collection`}
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product Adding Form Container */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-900 p-6 sm:p-10 mb-12">
          <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-neutral-900 mb-8 border-b border-zinc-100 pb-3">
            {activeEditingProduct ? 'Modify Catalog Sku' : 'Introduce New Watch Sku'}
          </h3>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-750 p-4 mb-6 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="e.g. Phantom Chrono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Brand Curator *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="e.g. Diall Elite"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Original Price (₹) *
              </label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="e.g. 32999"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Offer Price (₹) [Optional]
              </label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="e.g. 29999 (leave empty if no offer)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Boutique Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3.5 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Stock Count Units *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="e.g. 15"
                min="0"
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Product Media Swatches (Images & Videos - Max 15MB each) *
              </label>
              
              <div 
                onClick={() => document.getElementById('dragMediaUpload')?.click()}
                className="w-full border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center cursor-pointer transition-colors hover:border-black"
              >
                <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">
                  Click to select images/videos from storage
                </p>
              </div>
              <input
                type="file"
                id="dragMediaUpload"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleMediaUpload}
              />

              {uploadedMedia.length > 0 && (
                <div className="flex gap-3 flex-wrap mt-4 p-4 border border-zinc-100 bg-zinc-50">
                  {uploadedMedia.map((m, idx) => (
                    <div key={idx} className="relative w-20 h-20 border border-zinc-200 overflow-hidden bg-black flex items-center justify-center">
                      {m.type === 'video' ? (
                        <video src={m.data} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={m.data} className="w-full h-full object-cover" alt="Uploaded media preview" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => removeMediaItem(e, idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-650 hover:bg-red-700 text-white flex items-center justify-center text-xs font-bold shadow cursor-pointer text-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Product Description Portfolio *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                rows={3}
                placeholder="Narrate the craftsmanship, design intent and beauty of this milestone watch..."
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-sans font-bold tracking-[1.5px] uppercase text-neutral-700 block">
                Technical Highlights (comma separated) *
              </label>
              <input
                type="text"
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                className="w-full border border-zinc-250 bg-zinc-50 p-3 text-sm focus:bg-white focus:outline-none focus:border-black transition-all"
                placeholder="e.g. Tourbillon Escapement, Sapphire Glass Core, 20atm Seal, Ceramic Bezel"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs tracking-wider uppercase transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving to Database...' : activeEditingProduct ? 'Update Piece' : 'Commit New Piece'}
            </button>
            <button
              type="button"
              onClick={() => {
                clearForm();
                setShowAddForm(false);
                if (activeEditingProduct) onCancelEdit();
              }}
              className="px-8 py-4 border border-zinc-300 text-neutral-700 font-semibold text-xs tracking-wider uppercase hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Catalog Table List */}
      <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-neutral-900 mb-6 block">
        Active Luxury Catalog List
      </h3>

      <div className="bg-white border border-zinc-200 overflow-x-auto">
        {products.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-405 font-sans italic">
            No watches currently cataloged in the database.
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-zinc-200">
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
                  Timepiece
                </th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
                  Curator Brand
                </th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
                  Valuation (₹)
                </th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
                  Stock Units
                </th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
                  Assigned Category
                </th>
                <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-neutral-600 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 object-cover border border-zinc-200 bg-neutral-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100";
                        }}
                      />
                      <span className="font-semibold text-neutral-900 text-sm">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4.5 px-6 text-xs text-neutral-500 font-sans">
                    {p.brand}
                  </td>
                  <td className="py-4.5 px-6 font-bold text-neutral-900 text-sm font-sans">
                    ₹{p.price.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4.5 px-6">
                    <span className={`inline-block py-1 px-2.5 text-[9.5px] font-bold uppercase tracking-wider rounded ${
                      p.stock > 0 
                        ? 'bg-emerald-50 text-emerald-850 border border-emerald-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {p.stock > 0 ? `${p.stock} units` : 'depleted'}
                    </span>
                  </td>
                  <td className="py-4.5 px-6">
                    <span className="inline-block py-1 px-2.5 bg-neutral-100 text-neutral-800 border border-zinc-250 text-[9.5px] font-bold uppercase tracking-wider rounded">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-4.5 px-6 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => onEditClick(p)}
                        className="p-2 border border-zinc-250 text-neutral-800 hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                        title="Edit Sku Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {deletingProductId === p.id ? (
                        <div className="flex items-center gap-1 border border-red-200 bg-red-50 p-1.5 rounded animate-in fade-in duration-200">
                          <span className="text-red-700 font-bold text-[9px] uppercase tracking-wider px-1">Sure?</span>
                          <button
                            onClick={() => {
                              onDeleteProduct(p.id);
                              setDeletingProductId(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-[9.5px] font-bold uppercase px-2 py-0.5 cursor-pointer"
                          >
                            Del
                          </button>
                          <button
                            onClick={() => setDeletingProductId(null)}
                            className="text-neutral-500 hover:text-neutral-800 text-[10px] font-bold uppercase px-1.5 cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingProductId(p.id)}
                          className="p-2 border border-zinc-250 text-red-600 hover:bg-red-650 hover:text-white transition-colors cursor-pointer"
                          title="Delete Sku"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
