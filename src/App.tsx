import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Search } from 'lucide-react';
import { Product, User } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModals';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('home'); // 'home' | 'wishlist' | 'admin'
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<string[]>(['For Him', 'For Her', 'Unisex', 'Couples']);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authFormType, setAuthFormType] = useState<'login' | 'signup' | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user session on page load
  useEffect(() => {
    const savedUser = sessionStorage.getItem('dialldue_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch {
        // ignore
      }
    }
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Keep collection category filter in sync if current selected category gets deleted
  useEffect(() => {
    if (categoryFilter !== 'All' && !categories.includes(categoryFilter)) {
      setCategoryFilter('All');
    }
  }, [categories, categoryFilter]);

  // Fetch wishlist when user logs in or out
  useEffect(() => {
    if (currentUser) {
      fetchWishlist(currentUser.email);
    } else {
      setWishlist([]);
    }
  }, [currentUser]);

  const showToast = (message: string) => {
    setToastMessage(message);
    const element = document.getElementById('globalToastNotification');
    if (element) {
      element.style.opacity = '1';
      element.style.transform = 'translate3d(-50%, 0, 0)';
    }
    setTimeout(() => {
      if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translate3d(-50%, 15px, 0)';
      }
      setTimeout(() => {
        setToastMessage('');
      }, 400);
    }, 2500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      showToast('Error syncing catalog database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async (email: string) => {
    try {
      const res = await fetch(`/api/wishlist/${email}`);
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleLike = async (productId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!currentUser) {
      setAuthFormType('login');
      showToast('Please sign in to save your wishlist.');
      return;
    }

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, productId })
      });

      if (!res.ok) throw new Error('Failed to toggle wishlist');
      const data = await res.json();

      if (data.isAdded) {
        setWishlist(prev => [...prev, productId]);
        showToast('Timepiece added to wishlist.');
      } else {
        setWishlist(prev => prev.filter(id => id !== productId));
        showToast('Timepiece removed from wishlist.');
      }
    } catch (err) {
      showToast('Error updating wishlist database.');
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('dialldue_user', JSON.stringify(user));
    showToast(`Welcome, ${user.name}`);
    if (user.isAdmin) {
      setCurrentView('admin');
    } else {
      setCurrentView('home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('dialldue_user');
    showToast('Session logged out successfully.');
    setCurrentView('home');
    setSelectedProduct(null);
  };

  // Admin CRUD ops mapping to relational routes
  const handleAddProduct = async (payload: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Add failed');
      
      const newProd = await res.json();
      setProducts(prev => [newProd, ...prev]);
      showToast('New timepiece successfully cataloged.');
      return true;
    } catch {
      showToast('Error creating new product in database.');
      return false;
    }
  };

  const handleUpdateProduct = async (id: number, payload: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed');

      setProducts(prev => prev.map(p => p.id === id ? { ...payload, id } : p));
      
      // Update selected product view as well if currently opened
      if (selectedProduct?.id === id) {
        setSelectedProduct({ ...payload, id });
      }

      showToast('Catalog item updated successfully.');
      return true;
    } catch {
      showToast('Error editing database catalog item.');
      return false;
    }
  };

  const handleDeleteProduct = (id: number) => {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    setProductToDelete(p);
  };

  const executeDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');

      setProducts(prev => prev.filter(prod => prod.id !== id));
      setWishlist(prev => prev.filter(likedId => likedId !== id));

      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
      showToast('Catalog item deleted from database.');
    } catch {
      showToast('Error deleting catalog item from database.');
    }
  };

  const handleSubmittedReview = (productId: number, review: { user: string; rating: number; text: string; date: string }) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const prevReviewsList = p.reviewsList || [];
        const updatedList = [review, ...prevReviewsList];
        const oldRating = p.rating || 0;
        const oldReviews = p.reviews || 0;
        const newRating = parseFloat((((oldRating * oldReviews) + review.rating) / (oldReviews + 1)).toFixed(1));
        const newReviews = oldReviews + 1;
        
        const updatedProduct = {
          ...p,
          rating: newRating,
          reviews: newReviews,
          reviewsList: updatedList
        };

        if (selectedProduct?.id === productId) {
          setSelectedProduct(updatedProduct);
        }
        return updatedProduct;
      }
      return p;
    }));
    showToast('Your testimonial has been recorded.');
  };

  const handleDeleteReview = async (productId: number, reviewId: number) => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('API delete failed');
      }

      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          const prevReviewsList = p.reviewsList || [];
          const updatedList = prevReviewsList.filter((rev: any) => Number(rev.id) !== Number(reviewId));
          const newReviews = updatedList.length;
          let newRating = 5.0;
          if (newReviews > 0) {
            const sumRating = updatedList.reduce((sum, rev) => sum + Number(rev.rating || 0), 0);
            newRating = parseFloat((sumRating / newReviews).toFixed(1));
          }

          const updatedProduct = {
            ...p,
            rating: newRating,
            reviews: newReviews,
            reviewsList: updatedList
          };

          if (selectedProduct?.id === productId) {
            setSelectedProduct(updatedProduct);
          }
          return updatedProduct;
        }
        return p;
      }));
      showToast('Client review has been deleted.');
    } catch (err: any) {
      console.error('Err deleting review:', err);
      showToast('Failed to delete review.');
    }
  };

  // Filtering catalog search
  const filteredProducts = products.filter(p => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans select-none antialiased">
      
      {/* Structural Headers and Sidebar Drawer panels */}
      <Header 
        onToggleSidebar={() => setSidebarOpen(true)}
        onNavigate={(view) => {
          setSelectedProduct(null);
          setCurrentView(view);
        }}
        wishlistCount={wishlist.length}
      />

      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        onNavigate={(view) => {
          setSelectedProduct(null);
          setCurrentView(view);
        }}
        onLogout={handleLogout}
        currentView={currentView}
        onShowAuth={(type) => setAuthFormType(type)}
      />

      {/* Main Container Flow */}
      <main className="flex-1 pt-16 flex flex-col">
        {selectedProduct ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
            <ProductDetail 
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
              isLiked={wishlist.includes(selectedProduct.id)}
              onToggleLike={() => handleToggleLike(selectedProduct.id)}
              currentUser={currentUser}
              onSubmittedReview={handleSubmittedReview}
              onDeleteReview={handleDeleteReview}
              onShowAuth={() => setAuthFormType('login')}
            />
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <div className="flex-1 flex flex-col">
                {/* Visual Premium Header Hero section */}
                <section className="bg-neutral-50 border-b border-zinc-200 py-16 px-4 text-center">
                  <div className="max-w-4xl mx-auto">
                    <span className="inline-block border border-neutral-900 text-neutral-900 text-[10px] font-sans font-bold py-1.5 px-4 tracking-[0.25em] uppercase mb-5 leading-none">
                      DIALL.DUE ATELIER
                    </span>
                    <h1 className="text-3xl sm:text-[45px] font-serif font-bold text-neutral-900 uppercase tracking-wide mb-4 leading-tight">
                      Timeless Mastery & Elegance
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto italic font-medium leading-relaxed mb-10">
                      Curating highly precise horological milestones.
                    </p>

                    {/* Search Panel */}
                    <div id="searchSuiteContainer" className="relative max-w-md mx-auto w-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search model features or curatorial brands..."
                        className="w-full border border-zinc-250 bg-white py-3.5 pl-12 pr-5 font-sans text-sm focus:outline-none focus:border-black transition-all"
                      />
                      <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>
                </section>

                {/* Our Collections Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 flex flex-col">
                  {/* Visual Title Header */}
                  <div className="text-center mb-10">
                    <span className="text-[10px] text-neutral-400 font-sans tracking-[4px] uppercase font-bold">
                      Explore Horological Categories
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 uppercase tracking-widest mt-2">
                      Our Collections
                    </h2>
                    <div className="w-12 h-[2px] bg-neutral-900 mx-auto mt-4"></div>
                  </div>

                  {/* Horizontal Collections Menu Options */}
                  <div className="flex gap-2.5 overflow-x-auto pb-6 scrollbar-none justify-start md:justify-center border-b border-zinc-150 mb-10 select-none">
                    {['All', ...categories].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`py-2.5 px-6 shrink-0 text-xs font-semibold tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                          categoryFilter === cat 
                            ? 'bg-neutral-900 text-white' 
                            : 'border border-zinc-200 text-neutral-500 hover:border-neutral-950 hover:text-neutral-950'
                        }`}
                      >
                        {cat === 'All' ? 'All Collections' : cat}
                      </button>
                    ))}
                  </div>

                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 text-neutral-450 italic text-xs font-sans">
                      Unlocking horological database connections...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-24 text-center border border-zinc-150 bg-neutral-50">
                      <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-neutral-900 mb-2">
                        No Timepieces Discovered
                      </h3>
                      <p className="text-zinc-500 text-xs italic">
                        Adjust search filters or search queries to begin discovery.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 pb-16">
                      {filteredProducts.map((p) => (
                        <ProductCard 
                          key={p.id}
                          product={p}
                          isLiked={wishlist.includes(p.id)}
                          onToggleLike={(e) => handleToggleLike(p.id, e)}
                          onViewDetails={() => setSelectedProduct(p)}
                          isAdmin={Boolean(currentUser?.isAdmin)}
                          onEditProduct={(e) => {
                            e.stopPropagation();
                            setEditingProduct(p);
                            setCurrentView('admin');
                          }}
                          onDeleteProduct={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p.id);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'wishlist' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col">
                <button
                  onClick={() => setCurrentView('home')}
                  className="self-start text-[10px] font-sans font-bold text-neutral-500 hover:text-neutral-900 mb-8 uppercase tracking-widest cursor-pointer"
                >
                  ← Continue Discovery
                </button>
                <h2 className="font-serif text-2xl uppercase tracking-wider text-neutral-900 mb-8 pb-4 border-b border-zinc-100">
                  Your Registry Wishlist
                </h2>

                {wishlistProducts.length === 0 ? (
                  <div className="py-20 text-center border border-zinc-150 bg-neutral-50">
                    <h3 className="font-serif text-[15px] font-bold uppercase text-neutral-900 mb-2">
                      Your wishlist registry is vacant
                    </h3>
                    <p className="text-neutral-400 text-xs italic mb-6">
                      Explore our active boutiques to catalog historic choices.
                    </p>
                    <button
                      onClick={() => setCurrentView('home')}
                      className="inline-flex py-3 px-8 bg-neutral-900 text-white font-bold text-xs tracking-wider uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Boutique Entrance
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 pb-16">
                    {wishlistProducts.map((p) => (
                      <ProductCard 
                        key={p.id}
                        product={p}
                        isLiked={true}
                        onToggleLike={(e) => handleToggleLike(p.id, e)}
                        onViewDetails={() => setSelectedProduct(p)}
                        isAdmin={Boolean(currentUser?.isAdmin)}
                        onEditProduct={(e) => {
                          e.stopPropagation();
                          setEditingProduct(p);
                          setCurrentView('admin');
                        }}
                        onDeleteProduct={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(p.id);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentView === 'admin' && currentUser?.isAdmin && (
              <AdminPanel 
                products={products}
                categories={categories}
                onRefreshCategories={async () => {
                  await fetchCategories();
                  await fetchProducts();
                }}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onEditClick={(p) => setEditingProduct(p)}
                activeEditingProduct={editingProduct}
                onCancelEdit={() => setEditingProduct(null)}
              />
            )}
          </>
        )}
      </main>

      {/* Global Bottom Footer */}
      <footer id="mainFooter" className="bg-neutral-50 border-t border-zinc-200 py-16 px-4 text-center mt-auto">
        <div className="max-w-4xl mx-auto">
          <p className="font-serif text-xl sm:text-2xl font-bold tracking-[6px] uppercase text-neutral-900">
            DIALL.DUE
          </p>
          <p className="text-[10px] text-neutral-400 font-sans tracking-[3px] uppercase mt-2 font-bold mb-6">
            Where Every Second Counts
          </p>
          <p className="text-xs sm:text-sm text-neutral-600 font-sans">
            Have questions? Engage our specialists via WhatsApp:{' '}
            <a 
              href="https://wa.me/918590370130" 
              className="text-neutral-900 font-sans font-bold underline transition-opacity hover:opacity-60"
              target="_blank" 
              rel="noopener noreferrer"
            >
              +91 8590370130
            </a>
          </p>
          <p className="text-[11px] text-neutral-400 mt-10 font-sans tracking-wide">
            © 2026 Diall.Due Group. All Rights Reserved. Robust SQL Interface.
          </p>
        </div>
      </footer>

      {/* Auth Forms Modals portals */}
      {authFormType && (
        <AuthModal 
          initialMode={authFormType}
          onClose={() => setAuthFormType(null)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Product Deletion Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-900 max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <h4 className="font-serif text-lg font-bold uppercase tracking-wider text-neutral-900 mb-2">
              Confirm Deletion
            </h4>
            <p className="text-zinc-550 text-xs mb-6 leading-relaxed">
              Are you sure you want to remove the <strong className="text-neutral-900 font-semibold">"{productToDelete.name}"</strong> timepiece? This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={async () => {
                  const id = productToDelete.id;
                  setProductToDelete(null);
                  await executeDeleteProduct(id);
                }}
                className="bg-red-600 text-white font-serif font-bold text-[10px] tracking-widest uppercase py-3 px-6 hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Sku
              </button>
              <button
                onClick={() => setProductToDelete(null)}
                className="border border-zinc-200 text-neutral-750 font-serif font-bold text-[10px] tracking-widest uppercase py-3 px-6 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Alerts */}
      <div 
        id="globalToastNotification" 
        style={{ transform: 'translate3d(-50%, 15px, 0)' }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-800 text-white font-serif text-[11px] font-bold tracking-widest text-center uppercase py-3.5 px-8 shadow-[0_22px_44px_rgba(0,0,0,0.18)] z-50 transition-all duration-350 opacity-0 pointer-events-none"
      >
        {toastMessage}
      </div>
    </div>
  );
}
