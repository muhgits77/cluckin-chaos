import { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Receipt, CheckCircle2, Ticket, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onClearCart: () => void;
}

export default function Cart({ isOpen, onClose, cartItems, onUpdateQuantity, onClearCart }: CartProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + item.item.price * item.quantity, 0);
  const kyTax = subtotal * 0.06; // 6.0% Kentucky Sales Tax!
  const total = subtotal + kyTax;

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Simulate payment processing / ticketing
    setTimeout(() => {
      const generatedOrderNum = `CC-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderNumber(generatedOrderNum);
      setIsCheckingOut(false);
      setCheckoutComplete(true);
    }, 1500);
  };

  const handleResetCheckout = () => {
    setCheckoutComplete(false);
    onClearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Sliding Panel Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-slate-950 text-white shadow-2xl flex flex-col h-full border-l border-slate-900"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-red p-1.5 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-brand-yellow" />
                  </div>
                  <h3 className="font-display font-extrabold text-xl uppercase tracking-tight">
                    Your Chaos Order
                  </h3>
                </div>
                <button
                  id="close-cart-panel"
                  onClick={onClose}
                  className="text-slate-400 hover:text-brand-yellow p-1 transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar">
                {checkoutComplete ? (
                  /* ORDER SUCCESS RECEIPT TICKET */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6 py-4"
                  >
                    <div className="text-center space-y-2">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto animate-bounce" />
                      <h4 className="font-display font-extrabold text-xl text-white uppercase tracking-tight">
                        Order Transmitted!
                      </h4>
                      <p className="text-xs text-slate-400">
                        Show this ticket to pay and claim your chicken mayhem at the truck!
                      </p>
                    </div>

                    {/* Styled Receipt Ticket */}
                    <div className="bg-white text-brand-dark p-6 rounded-2xl relative shadow-2xl border-t-8 border-brand-yellow">
                      {/* Left Circular cutouts */}
                      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-slate-950 rounded-full -translate-y-1/2"></div>
                      {/* Right Circular cutouts */}
                      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-slate-950 rounded-full -translate-y-1/2"></div>

                      {/* Receipt Content */}
                      <div className="space-y-4 text-center border-b border-dashed border-gray-300 pb-4">
                        <div className="space-y-1">
                          <p className="font-display font-extrabold text-lg uppercase tracking-tight text-brand-red leading-none">
                            CLUCKIN' CHAOS
                          </p>
                          <p className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                            Kentucky Fried Mayhem Rig
                          </p>
                          <p className="text-[9px] text-gray-400 font-mono">
                            Lake Cumberland State Resort Park, Jamestown, KY
                          </p>
                        </div>

                        <div className="bg-slate-100 py-2.5 rounded-xl border border-slate-250 inline-block px-6">
                          <p className="text-[9px] font-mono text-gray-500 uppercase leading-none">ORDER NUMBER</p>
                          <p className="font-mono text-2xl font-black text-brand-dark tracking-wider mt-1">{orderNumber}</p>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="py-4 border-b border-dashed border-gray-300 space-y-2 text-xs">
                        {cartItems.map((cartItem) => (
                          <div key={cartItem.item.id} className="flex justify-between font-mono">
                            <span className="text-gray-700">
                              {cartItem.quantity}x {cartItem.item.name}
                            </span>
                            <span className="font-bold text-brand-dark">
                              ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="py-4 space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between text-gray-500">
                          <span>SUBTOTAL</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>KY SALES TAX (6.0%)</span>
                          <span>${kyTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-brand-dark pt-1 border-t border-gray-100">
                          <span>TOTAL VALUE</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Barcode / QR Code Placeholder */}
                      <div className="pt-2 flex flex-col items-center justify-center space-y-2">
                        <QrCode className="w-14 h-14 text-brand-dark shrink-0" />
                        <p className="text-[8px] font-mono text-gray-400 tracking-widest uppercase">
                          SCAN AT PICKUP WINDOW
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleResetCheckout}
                      className="w-full bg-brand-yellow hover:bg-brand-amber text-brand-dark py-3.5 rounded-xl font-display font-black uppercase text-sm tracking-widest shadow-lg transition-colors cursor-pointer"
                    >
                      Awesome, Clear Receipt & Exit
                    </button>
                  </motion.div>
                ) : cartItems.length === 0 ? (
                  /* EMPTY STATE */
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-brand-yellow">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-display font-bold text-lg uppercase">Your cart is empty</h4>
                      <p className="text-xs text-slate-400 max-w-xs">
                        You haven't added any chicken mayhem yet. Explore the menu and fire up your appetite!
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-xs bg-brand-red hover:bg-brand-red-hover text-white py-2 px-5 rounded-lg uppercase font-black font-display tracking-widest cursor-pointer"
                    >
                      Sling Some Chicken
                    </button>
                  </div>
                ) : (
                  /* CART ITEMS LIST */
                  <div className="space-y-4">
                    <p className="text-[10px] font-mono text-brand-yellow uppercase tracking-widest font-black mb-2">
                      Reviewing Your Selections
                    </p>
                    <div className="space-y-3">
                      {cartItems.map(({ item, quantity }) => (
                        <div
                          key={item.id}
                          className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex gap-3 items-center"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded-lg border border-slate-800 shrink-0"
                          />
                          <div className="flex-grow min-w-0">
                            <h4 className="font-display font-bold text-xs text-white uppercase truncate">
                              {item.name}
                            </h4>
                            <p className="text-brand-yellow font-mono text-xs font-semibold mt-0.5">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center bg-slate-950 border border-slate-850 rounded-lg p-1 shrink-0">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="text-slate-400 hover:text-brand-red p-1 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center font-mono text-xs font-black text-white">
                              {quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="text-slate-400 hover:text-brand-yellow p-1 transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Totals & Action Checkout Panel */}
              {!checkoutComplete && cartItems.length > 0 && (
                <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4 shrink-0">
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>KY State Tax (6.0%):</span>
                      <span>${kyTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-yellow font-bold text-sm pt-2 border-t border-slate-950">
                      <span>Total Chaos:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="checkout-order-button"
                      disabled={isCheckingOut}
                      onClick={handleCheckout}
                      className="w-full bg-brand-red hover:bg-brand-red-hover disabled:bg-brand-red/50 text-white py-4 rounded-xl font-display font-black uppercase text-sm tracking-widest shadow-xl flex items-center justify-center gap-2 transition-colors border border-slate-800 cursor-pointer"
                    >
                      {isCheckingOut ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Transmitting Order...
                        </>
                      ) : (
                        <>
                          <Ticket className="w-4.5 h-4.5" />
                          Place Order (Pay at Window)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
