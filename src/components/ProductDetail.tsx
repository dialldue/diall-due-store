import React, { useState } from 'react';
import { ArrowLeft, Heart, Check, MessageSquare, Star, ArrowRight, ArrowLeft as ArrowLeftIcon, Trash2 } from 'lucide-react';
import { Product, User } from '../types';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  currentUser: User | null;
  onSubmittedReview: (productId: number, review: { user: string; rating: number; text: string; date: string }) => void;
  onDeleteReview?: (productId: number, reviewId: number) => void;
  onShowAuth: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onBack,
  isLiked,
  onToggleLike,
  currentUser,
  onSubmittedReview,
  onDeleteReview,
  onShowAuth,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  const mediaList = product.media && product.media.length > 0 
    ? product.media 
    : [{ type: 'image', data: product.image }];

  const WHATSAPP_NUMBER = "918590370130";

  const handleBuyWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi Diall.Due. I am interested in buying: ${product.name} (${product.brand}) priced at ₹${product.price.toLocaleString('en-IN')}. Please check availability.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handlePrevMedia = () => {
    setActiveMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setActiveMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');

    if (!currentUser) {
      onShowAuth();
      return;
    }

    if (reviewRating === 0) {
      setReviewError('Please select a star rating rating.');
      return;
    }

    if (!reviewText.trim()) {
      setReviewError('Please write your review thoughts.');
      return;
    }

    setSubmittingReview(true);

    try {
      const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      const body = {
        user: currentUser.name,
        rating: reviewRating,
        text: reviewText,
        date: dateStr
      };

      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error('Could not record review.');
      }

      onSubmittedReview(product.id, body);
      setReviewText('');
      setReviewRating(0);
    } catch (err: any) {
      setReviewError(err.message || 'Connecting server failed.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div id="productDetailSection" className="pb-24 animate-fade-in select-none">
      
      {/* Return Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-900 mb-8 border-b border-neutral-900 pb-1 uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to archive
      </button>

      {/* Primary Detail Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 bg-white border border-zinc-200 p-6 sm:p-10 lg:p-14 mb-16">
        
        {/* Media Block (Image and Video Swiper) */}
        <div className="flex flex-col items-center justify-start gap-4">
          <div className="relative w-full aspect-[4/5] bg-zinc-50 border border-zinc-200 overflow-hidden group">
            
            {/* Sliding Swiper */}
            <div className="w-full h-full flex items-center justify-center">
              {mediaList[activeMediaIndex].type === 'video' ? (
                <video
                  src={mediaList[activeMediaIndex].data}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={mediaList[activeMediaIndex].data}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600";
                  }}
                />
              )}
            </div>

            {/* Slider triggers */}
            {mediaList.length > 1 && (
              <>
                <button
                  onClick={handlePrevMedia}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-[4px] border border-zinc-250 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-all cursor-pointer shadow-sm text-neutral-850"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-[4px] border border-zinc-250 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-all cursor-pointer shadow-sm text-neutral-850"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Media Thumbnails Swatch */}
          {mediaList.length > 1 && (
            <div className="flex gap-2 w-full overflow-x-auto py-1 scrollbar-none justify-start">
              {mediaList.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMediaIndex(i)}
                  className={`w-16 h-16 border flex-shrink-0 transition-opacity bg-neutral-50 overflow-hidden cursor-pointer ${
                    activeMediaIndex === i 
                      ? 'border-neutral-900 opacity-100' 
                      : 'border-zinc-200 opacity-40 hover:opacity-80'
                  }`}
                >
                  {m.type === 'video' ? (
                    <div className="w-full h-full bg-neutral-900 relative flex items-center justify-center text-[9px] font-sans font-bold text-white">
                      VIDEO
                    </div>
                  ) : (
                    <img
                      src={m.data}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Block */}
        <div className="flex flex-col justify-start">
          <span className="text-neutral-400 text-[10px] font-bold tracking-[3px] uppercase block mb-1">
            {product.brand}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 uppercase tracking-tight mb-4">
            {product.name}
          </h2>

          {/* Core rating summary line */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex text-neutral-900">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-sm">
                  {i < Math.floor(product.rating) ? '★' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-xs text-neutral-500 font-sans font-medium">
              {product.rating} Rating ({product.reviews} Registered Reviews)
            </span>
          </div>

          {/* Elegant Display Price Tag */}
          <div className="mb-6 flex items-baseline gap-4 border-y border-zinc-100 py-4.5">
            <span className="text-3xl font-sans font-bold text-neutral-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <span className="line-through text-neutral-400 font-medium text-base">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Inventory Badge */}
          <div className="mb-8 block">
            <span className={`inline-flex items-center gap-2 py-1.5 px-3.5 text-xs font-semibold uppercase tracking-widest ${
              product.stock > 0 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                : 'bg-zinc-50 text-neutral-400 border border-zinc-150'
            }`}>
              <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-600' : 'bg-neutral-350'}`} />
              {product.stock > 0 ? `In Stock: ${product.stock} Units` : 'Acquisition Window Closed'}
            </span>
          </div>

          {/* Description */}
          <p className="text-neutral-600 text-sm leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Specifications Checklist */}
          {product.features && product.features.length > 0 && (
            <div className="border-t border-zinc-100 pt-6 mb-8">
              <h3 className="text-neutral-900 font-sans font-bold text-[11px] uppercase tracking-widest mb-4">
                Technical Specifications
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-zinc-650 text-xs">
                    <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dynamic Core Actions Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-100">
            <button
              onClick={onToggleLike}
              className={`flex-1 py-4 text-xs font-semibold tracking-wider uppercase border cursor-pointer transition-all ${
                isLiked 
                  ? 'bg-neutral-50 border-neutral-900 text-neutral-900' 
                  : 'bg-white border-neutral-900 text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {isLiked ? '♥ Linked inside Wishlist' : '♡ Add to Wishlist'}
            </button>
            <button
              onClick={handleBuyWhatsApp}
              className="flex-1 py-4 bg-neutral-900 text-white font-bold text-xs tracking-wider uppercase hover:bg-neutral-800 transition-colors cursor-pointer text-center flex items-center justify-center"
            >
              Acquire via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Customer Review Section */}
      <div className="max-w-3xl mx-auto">
        <h3 className="font-serif text-xl font-bold text-center uppercase tracking-wider text-neutral-900 mb-8 border-b border-zinc-100 pb-4">
          Client Reviews & Testimonials
        </h3>

        {/* Entry box for review */}
        {currentUser ? (
          <form onSubmit={handleSubmitReview} className="bg-neutral-50 border border-zinc-200 p-6 sm:p-8 mb-10">
            <h4 className="font-semibold text-xs text-neutral-900 tracking-wider uppercase mb-4 text-center">
              Record Your Testimonial
            </h4>

            {reviewError && (
              <div className="bg-red-50 border border-red-100 p-3 text-red-750 text-xs text-center mb-4">
                {reviewError}
              </div>
            )}

            {/* Star inputs */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setReviewRating(i + 1)}
                  className={`text-2xl cursor-pointer transition-colors ${
                    i < reviewRating ? 'text-neutral-950' : 'text-zinc-250 hover:text-neutral-500'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full border border-zinc-250 bg-white p-4 text-sm font-sans placeholder-zinc-350 focus:outline-none focus:border-black transition-all mb-4"
              rows={4}
              placeholder="Tell us what you admire about this milestone piece..."
              required
            />

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs tracking-wider uppercase py-3.5 transition-all cursor-pointer"
            >
              {submittingReview ? 'Recording Testimonial...' : 'Submit Testimonial'}
            </button>
          </form>
        ) : (
          <div className="bg-neutral-50 border border-zinc-150 p-6 sm:p-10 text-center mb-10">
            <p className="text-zinc-500 text-xs italic mb-4">
              Please connect your registered account profile to leave a testimonial.
            </p>
            <button
              onClick={onShowAuth}
              className="inline-flex py-2 px-6 border border-neutral-900 text-neutral-900 font-semibold text-xs tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-all cursor-pointer"
            >
              Connect Session
            </button>
          </div>
        )}

        {/* Testimonials List */}
        <div className="space-y-4">
          {product.reviewsList && product.reviewsList.length > 0 ? (
            product.reviewsList.map((rev, idx) => (
              <div key={idx} className="bg-white border border-zinc-200 p-6 transition-all duration-300 hover:border-neutral-900">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                    {rev.user}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400">
                      {rev.date}
                    </span>
                    {currentUser?.isAdmin && (
                      <div className="flex items-center ml-2 border-l border-zinc-200 pl-2">
                        {deletingReviewId === rev.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-1 py-0.5 text-[9px] uppercase tracking-wider animate-in fade-in duration-150">
                            <span className="text-red-700 font-bold px-0.5">Sure?</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onDeleteReview && rev.id !== undefined) {
                                  onDeleteReview(product.id, rev.id);
                                }
                                setDeletingReviewId(null);
                              }}
                              className="bg-red-650 hover:bg-red-700 text-white font-serif font-bold text-[8px] px-1.5 py-0.5 cursor-pointer uppercase tracking-widest"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingReviewId(null)}
                              className="text-neutral-500 hover:text-neutral-800 font-serif font-bold text-[8px] px-1 cursor-pointer uppercase tracking-widest"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingReviewId(rev.id !== undefined ? rev.id : null)}
                            className="text-red-650 hover:text-red-800 p-0.5 cursor-pointer flex items-center justify-center transition-colors"
                            title="Delete this review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-neutral-900 text-xs tracking-widest mb-3">
                  {'★'.repeat(Math.min(5, Math.max(0, Math.round(Number(rev.rating || 5)))))}{'☆'.repeat(Math.min(5, Math.max(0, 5 - Math.round(Number(rev.rating || 5)))))}
                </div>
                <p className="text-neutral-600 text-[13.5px] leading-relaxed">
                  {rev.text}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center italic text-neutral-400 text-xs py-8">
              No registered testimonials yet. Be the first to catalog your purchase.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
