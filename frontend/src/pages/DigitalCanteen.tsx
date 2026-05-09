import React, { useState, useEffect } from 'react';
import { ChevronLeft, Coffee, ShoppingBag, Plus, Minus, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MENU_ITEMS = [
  { id: '1', name: 'Cold Coffee', price: 45, type: 'beverage', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80' },
  { id: '2', name: 'Veg Sandwich', price: 60, type: 'food', image: 'https://images.unsplash.com/photo-1550508139-83a903337197?w=500&q=80' },
  { id: '3', name: 'Masala Dosa', price: 50, type: 'food', image: 'https://images.unsplash.com/photo-1630383249896-424e482d0a2b?w=500&q=80' },
  { id: '4', name: 'Fresh Juice', price: 40, type: 'beverage', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80' },
];

const DigitalCanteen = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [view, setView] = useState<'menu' | 'cart' | 'status'>('menu');
  const [orderState, setOrderState] = useState<'payment' | 'preparing' | 'ready'>('payment');
  const [queueId, setQueueId] = useState<string | null>(null);

  const updateCart = (id: string, delta: number) => {
    setCart(prev => {
      const newCount = (prev[id] || 0) + delta;
      if (newCount <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newCount };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = MENU_ITEMS.find(i => i.id === id);
    return total + (item?.price || 0) * qty;
  }, 0);

  const handlePayment = () => {
    setOrderState('payment');
    setView('status');
    // Simulate payment processing
    setTimeout(() => {
      const qid = `Q-${Math.floor(Math.random() * 900) + 100}`;
      setQueueId(qid);
      setOrderState('preparing');
      
      // Simulate admin marking as ready after 5 seconds
      setTimeout(() => {
        setOrderState('ready');
      }, 5000);
    }, 1500);
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      
      {/* Header */}
      <div className="bg-orange-500 p-6 pt-12 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/campus')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Digital Canteen</h1>
              <p className="text-xs text-orange-100">Main Cafeteria</p>
            </div>
          </div>
          {view === 'menu' && (
            <button onClick={() => setView('cart')} className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-orange-600 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Menu View */}
        {view === 'menu' && (
          <div className="p-4 grid grid-cols-2 gap-4">
            {MENU_ITEMS.map(item => (
              <div key={item.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm flex flex-col">
                <img src={item.image} alt={item.name} className="w-full h-28 object-cover" />
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                    <p className="text-xs font-bold text-orange-600">₹{item.price}</p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    {cart[item.id] ? (
                      <div className="flex items-center gap-3 bg-orange-50 rounded-xl px-2 py-1 w-full justify-between">
                        <button onClick={() => updateCart(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg text-orange-600 shadow-sm"><Minus className="w-4 h-4" /></button>
                        <span className="text-sm font-bold text-slate-800">{cart[item.id]}</span>
                        <button onClick={() => updateCart(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-orange-500 rounded-lg text-white shadow-sm"><Plus className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => updateCart(item.id, 1)} className="w-full bg-slate-100 text-slate-700 font-bold text-xs py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-colors">
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart View */}
        {view === 'cart' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Your Order</h2>
            {totalItems === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">Cart is empty</p>
                <button onClick={() => setView('menu')} className="mt-4 text-orange-600 font-bold text-sm">Browse Menu</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {Object.entries(cart).map(([id, qty]) => {
                    const item = MENU_ITEMS.find(i => i.id === id)!;
                    return (
                      <div key={id} className="bg-white p-3 rounded-2xl flex items-center gap-4 shadow-sm">
                        <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                          <p className="text-xs font-bold text-orange-600">₹{item.price * qty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateCart(id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600"><Minus className="w-4 h-4" /></button>
                          <span className="text-sm font-bold w-4 text-center">{qty}</span>
                          <button onClick={() => updateCart(id, 1)} className="w-8 h-8 flex items-center justify-center bg-orange-500 rounded-xl text-white"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                    <span>Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                    <span>Tax (5%)</span>
                    <span>₹{(totalPrice * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <div className="flex justify-between text-lg font-black text-slate-800">
                    <span>Total</span>
                    <span>₹{(totalPrice * 1.05).toFixed(2)}</span>
                  </div>
                </div>

                <button onClick={handlePayment} className="mt-6 w-full bg-slate-900 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
                  <CreditCard className="w-5 h-5" /> Pay ₹{(totalPrice * 1.05).toFixed(2)}
                </button>
              </>
            )}
          </div>
        )}

        {/* Status View */}
        {view === 'status' && (
          <div className="p-6 h-full flex flex-col items-center justify-center">
            {orderState === 'payment' && (
              <div className="text-center animate-pulse">
                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Processing Payment...</h2>
              </div>
            )}
            
            {orderState === 'preparing' && (
              <div className="text-center animate-fade-in">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping"></div>
                  <div className="relative w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Coffee className="w-10 h-10 text-white animate-bounce" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Preparing Order</h2>
                <p className="text-slate-500 text-sm font-medium mb-6">Your queue number is</p>
                <div className="bg-white border-2 border-dashed border-orange-300 rounded-2xl py-3 px-8 text-3xl font-black text-orange-600 mb-8 inline-block shadow-sm">
                  {queueId}
                </div>
                <p className="text-xs text-slate-400 bg-slate-100 py-2 px-4 rounded-full">You'll be notified when it's ready.</p>
              </div>
            )}

            {orderState === 'ready' && (
              <div className="text-center animate-fade-in">
                <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Order Ready!</h2>
                <p className="text-slate-500 text-sm font-medium mb-6">Collect your order from the counter.</p>
                <div className="bg-white border-2 border-emerald-500 rounded-2xl py-3 px-8 text-3xl font-black text-emerald-600 mb-8 inline-block shadow-md">
                  {queueId}
                </div>
                <button onClick={() => { setView('menu'); setCart({}); setOrderState('payment'); }} className="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-xl active:scale-95 transition-transform">
                  Order Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DigitalCanteen;
