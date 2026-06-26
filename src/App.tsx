import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Menu from './components/Menu';
import Cart from './components/Cart';
import About from './components/About';
import Gallery from './components/Gallery';
import Testimonials from './components/Testimonials';
import FindUs from './components/FindUs';
import Footer from './components/Footer';
import { CartItem, MenuItem } from './types';

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('menu');

  // Track scroll position to update active navigation item
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero-section', 'menu', 'about', 'gallery', 'testimonials', 'find-us'];
      const scrollPosition = window.scrollY + 180; // offset for sticky header

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            // map section id to nav href
            const mappedId = sectionId === 'hero-section' ? '' : sectionId;
            setActiveSection(mappedId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.item.id === item.id);
      if (existing) {
        return prevItems.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prevItems) => {
      return prevItems
        .map((i) => {
          if (i.item.id === itemId) {
            const newQty = i.quantity + delta;
            return { ...i, quantity: newQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream text-brand-dark selection:bg-brand-yellow selection:text-brand-dark">
      {/* Dynamic Header & Alert banner */}
      <Navbar
        cartCount={totalCartCount}
        onCartToggle={() => setIsCartOpen(true)}
        activeSection={activeSection}
      />

      <main className="flex-grow">
        {/* Hero Banner Section */}
        <Hero />

        {/* Menu Grid section */}
        <Menu onAddToCart={handleAddToCart} />

        {/* Narrative story section */}
        <About />

        {/* Image Grid Gallery with Lightbox slider */}
        <Gallery />

        {/* Customer Reviews/Feedback section */}
        <Testimonials />

        {/* Find the truck, Route schedule, Coordinates registration cards */}
        <FindUs />
      </main>

      {/* Slide-out Checkout / Cart Panel Drawer */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
      />

      {/* Bluegrass Forge Footer */}
      <Footer />
    </div>
  );
}
