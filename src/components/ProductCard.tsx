import React from 'react';
import { Heart, Edit, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isLiked: boolean;
  onToggleLike: (e: React.MouseEvent) => void;
  onViewDetails: () => void;
  isAdmin: boolean;
  onEditProduct: (e: React.MouseEvent) => void;
  onDeleteProduct: (e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isLiked,
  onToggleLike,
  onViewDetails,
  isAdmin,
  onEditProduct,
  onDeleteProduct,
}) => {
  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
    
  return (
    <article className="group relative bg-white border border-zinc-200 overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-neutral-900 hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] select-none">
      
      {/* Discount Badge */}
      {hasDiscount && (
        <span className="absolute top-4 left-4 bg-neutral-900 text-white text-[9px] font-bold py-1 px-2.5 tracking-wider z-10 uppercase scale-100 group-hover:scale-105 transition-transform duration-300">
          Save {discountPercent}%
        </span>
      )}

      {/* Heart Wishlist Trigger */}
      <button
        onClick={onToggleLike}
        className={`absolute top-4 right-4 z-10 bg-white/85 backdrop-blur-[5px] border border-neutral-100 w-9 h-9 flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-neutral-900 hover:text-white ${
          isLiked ? 'bg-neutral-900 text-red-500 hover:text-red-400' : 'text-neutral-900'
        }`}
        title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-[17px] h-[17px] ${isLiked ? 'fill-current text-white' : 'stroke-[2.2]'}`} />
      </button>

      {/* Admin Action Overlays */}
      {isAdmin && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            onClick={onEditProduct}
            className="w-8 h-8 rounded-full border border-zinc-200 bg-white/90 backdrop-blur-[4px] hover:bg-neutral-900 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm text-neutral-800"
            title="Edit Product"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDeleteProduct}
            className="w-8 h-8 rounded-full border border-zinc-200 bg-white/90 backdrop-blur-[4px] hover:bg-red-655 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer text-red-600 hover:bg-red-600"
            title="Delete Product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Product Image & Video Media Space */}
      <div
        onClick={onViewDetails}
        className="relative bg-zinc-50 aspect-[4/5] cursor-pointer overflow-hidden flex items-center justify-center"
      >
        {product.media && product.media.length > 1 && (
          <div className="absolute top-4 left-4 z-10 bg-neutral-900/40 backdrop-blur-[4px] py-1 px-1.5 rounded text-[8px] font-sans font-bold text-white tracking-widest scale-100 group-hover:scale-105 transition-transform">
            COLLECTION: {product.media.length}
          </div>
        )}
        
        {/* Render elegant image */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600";
          }}
        />
      </div>

      {/* Info Space */}
      <div
        onClick={onViewDetails}
        className="p-5 flex-1 flex flex-col cursor-pointer bg-white"
      >
        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-1 block">
          {product.brand}
        </span>
        
        <h3 className="font-semibold text-sm sm:text-[15px] font-sans text-neutral-900 leading-snug group-hover:text-black mb-3.5 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Pricing Rows */}
        <div className="flex items-baseline gap-2 mt-auto mb-3">
          <span className="font-sans font-bold text-base text-neutral-950">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="line-through font-medium text-xs text-neutral-400">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Stock & Rating Footprint */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1 text-[10.5px]">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              product.stock > 0 ? 'bg-emerald-600' : 'bg-neutral-300'
            }`} />
            <span className={`font-semibold tracking-[0.5px] uppercase ${
              product.stock > 0 ? 'text-emerald-700' : 'text-neutral-400'
            }`}>
              {product.stock > 0 ? `${product.stock} Units` : 'Out Of Stock'}
            </span>
          </div>

          <div className="flex items-center gap-1 font-sans">
            <span className="text-neutral-900 font-bold">★ {product.rating}</span>
            <span className="text-neutral-400">({product.reviews})</span>
          </div>
        </div>
      </div>
    </article>
  );
};
