import { MenuItem, Testimonial, GalleryItem, ScheduleItem } from './types';
import tendersImg from './assets/images/chicken_tenders_crispy_1782485461920.jpg';
import bbqImg from './assets/images/bbq_chicken_sandwich_1782485475987.jpg';
import nuggetsImg from './assets/images/chicken_nuggets_fries_1782485488549.jpg';
import truckImg from './assets/images/chaos_food_truck_1782485499263.jpg';
import friesImg from './assets/images/crispy_chaos_fries_1782485776398.jpg';
import caesarImg from './assets/images/caesar_salad_1782486453544.jpg';
import ranchImg from './assets/images/bacon_ranch_salad_1782486469332.jpg';
import cobbImg from './assets/images/cobb_salad_wrap_1782486482278.jpg';
import lakeImg from './assets/images/lake_cumberland_1782486495379.jpg';
import hotHoneyImg from './assets/images/spicy_hot_honey_1782486510998.jpg';
import lemonadeImg from './assets/images/fresh_lemonade_1782487246710.jpg';
import waterImg from './assets/images/bottled_water_1782487258935.jpg';
import sodaImg from './assets/images/soda_cans_1782487271435.jpg';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'tenders',
    name: "Classic Chicken Tenders",
    price: 10.99,
    description: "5 hand-breaded, pressure-fried chicken strips. Crisp on the outside, incredibly juicy on the inside, served with 2 choices of our signature dipping sauces.",
    category: 'mains',
    image: tendersImg,
    tags: ['Crispy Golden', 'Fan Favorite'],
    chaosLevel: 1
  },
  {
    id: 'nuggets',
    name: "Chaos Nuggets",
    price: 8.49,
    description: "12 bite-sized pieces of hand-cut chicken breast, tossed in our secret seasoning blend and served with ranch, smoky BBQ, or sweet hot honey drizzle.",
    category: 'mains',
    image: nuggetsImg,
    tags: ['Snack King', 'Shareable'],
    chaosLevel: 2
  },
  {
    id: 'sandwich',
    name: "Shredded BBQ Chicken Sandwich",
    price: 11.49,
    description: "Slow-sauced hickory-smoked shredded chicken piled high on a toasted brioche bun, topped with our home-style creamy slaw and tangy Kentucky pickles.",
    category: 'mains',
    image: bbqImg,
    tags: ['Rich BBQ', 'Southern Style'],
    chaosLevel: 3
  },
  {
    id: 'dinner',
    name: "Fried Chicken Dinner Platter",
    price: 13.99,
    description: "Quarter bone-in chicken (leg & thigh) breaded in our heavy-duty Kentucky seasoning, served with golden crispy fries, creamy southern slaw, and a warm, buttery flaky biscuit.",
    category: 'mains',
    image: tendersImg,
    tags: ['Heavy Duty', 'Ultimate Comfort'],
    chaosLevel: 4
  },
  {
    id: 'salad_caesar',
    name: "Blackened Chicken Caesar Salad",
    price: 11.99,
    description: "Crispy hand-blackened chicken breast over a mountain of crisp romaine, shaved aged parmesan, and butter-toasted croutons, tossed in our garlic Caesar dressing.",
    category: 'mains',
    image: caesarImg,
    tags: ['Blackened Chicken', 'Fresh Greens', 'Wrap Option'],
    chaosLevel: 1
  },
  {
    id: 'salad_ranch',
    name: "Chicken Bacon Ranch Salad",
    price: 12.49,
    description: "Your choice of grilled or fried chicken, crispy chopped bacon, juicy cherry tomatoes, and shredded Colby Jack over fresh greens, drizzled with buttermilk ranch.",
    category: 'mains',
    image: ranchImg,
    tags: ['Ranch Drizzle', 'Crispy Bacon', 'Wrap Option'],
    chaosLevel: 2
  },
  {
    id: 'salad_cobb',
    name: "Chicken Cobb Salad",
    price: 12.99,
    description: "Row-by-row Southern spread of crispy tenders, hard-boiled farm eggs, smoked blue cheese crumbles, fresh avocado, ripe tomatoes, and honey-cured bacon on garden greens.",
    category: 'mains',
    image: cobbImg,
    tags: ['Southern Cobb', 'Tenders Loaded', 'Wrap Option'],
    chaosLevel: 2
  },
  {
    id: 'fries',
    name: "Crispy Chaos Fries",
    price: 4.99,
    description: "Golden, thin-cut fries seasoned with our house dry rub—a salty, smoky blend of paprika, garlic, onion, and a tiny kick of Kentucky bourbon sugar.",
    category: 'sides',
    image: friesImg,
    tags: ['House Seasoned', 'Always Hot'],
    chaosLevel: 1
  },
  {
    id: 'sweet_tea',
    name: "Sweet Tea",
    price: 3.49,
    description: "Ice-cold, bottomless, sweet southern black tea brewed daily. Infused with pure cane sugar and served with fresh lemon wheels.",
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    tags: ['Bottomless', 'Ice Cold', 'Southern Classic'],
    chaosLevel: 0
  },
  {
    id: 'lemonade',
    name: "Fresh Lemonade",
    price: 2.99,
    description: "Classic Southern lemonade, fresh-squeezed with real whole lemons and sweetened to ice-cold perfection. Perfectly balanced, tart, and refreshing.",
    category: 'drinks',
    image: lemonadeImg,
    tags: ['Fresh Squeezed', 'Ice Cold', 'Southern Classic'],
    chaosLevel: 0
  },
  {
    id: 'bottled_water',
    name: "Bottled Spring Water",
    price: 1.99,
    description: "Pure mountain spring water, bottled at the source and served ice-cold to wash down that heat-level chaos.",
    category: 'drinks',
    image: waterImg,
    tags: ['Pure Spring', 'Always Chilled'],
    chaosLevel: 0
  },
  {
    id: 'canned_sodas',
    name: "Chilled Canned Sodas",
    price: 1.75,
    description: "Your choice of ice-cold classic canned sodas: Coke, Pepsi, Sprite, or Dr Pepper. Crispy, sweet, and always refreshing.",
    category: 'drinks',
    image: sodaImg,
    tags: ['Ice Cold', 'Can Select', 'Classic Fizz'],
    chaosLevel: 0
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Dale S.',
    location: 'Burnside, KY',
    text: "After a 6-hour stretch pullin' bass out of Lake Cumberland, nothing hits the spot like the Fried Chicken Dinner Platter. The skin has a crunch that you can hear across the marina, and that biscuit is pure heaven.",
    rating: 5,
    avatar: '👨‍✈️'
  },
  {
    id: '2',
    name: 'Clara M.',
    location: 'Somerset, KY',
    text: "The Chaos Nuggets tossed in the Hot Honey dip are absolutely legendary. I track this truck's GPS every Friday just to get a double order for the family. Cluckin' Chaos is the pride of Somerset!",
    rating: 5,
    avatar: '👩‍🌾'
  },
  {
    id: '3',
    name: 'Brother Marcus',
    location: 'Jamestown, KY',
    text: "The Shredded BBQ Chicken Sandwich is a masterpiece. The slaw is creamy and perfectly cuts through the rich, sweet barbecue sauce. This is authentic Kentucky cookout food at its finest.",
    rating: 5,
    avatar: '👨‍🍳'
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    url: truckImg,
    title: 'The Chaos Rig',
    description: 'Our custom-painted food truck serving hot, fresh fried chicken with Southern attitude.'
  },
  {
    id: 'g2',
    url: tendersImg,
    title: 'Perfect Crispy Golden Batter',
    description: 'Double-dipped, hand-kneaded tenders fried to high-voltage crispy perfection.'
  },
  {
    id: 'g3',
    url: hotHoneyImg,
    title: 'Spicy Hot Honey Tenders',
    description: 'Double-dipped, hand-kneaded tenders fried to absolute crispy perfection and drizzled with amber hot honey.'
  },
  {
    id: 'g4',
    url: nuggetsImg,
    title: 'Comfort Food Spread',
    description: 'Sides, tenders, and cool Sweet Tea ready for the ultimate Bluegrass picnic.'
  },
  {
    id: 'g5',
    url: lakeImg,
    title: 'Lake Cumberland Sunset',
    description: 'Where we spend our weekends—bringing warm, crispy fried chicken straight to the freshwater lake shores.'
  },
  {
    id: 'g6',
    url: tendersImg,
    title: 'Tender Perfection',
    description: 'Steaming hot chicken dripping in house hot honey.'
  }
];

export const SCHEDULE: ScheduleItem[] = [
  {
    day: 'Wednesday',
    location: 'Downtown Somerset (Fountain Square)',
    hours: '11:00 AM - 2:00 PM',
    status: 'scheduled',
    coordinates: 'Somerset, KY'
  },
  {
    day: 'Thursday',
    location: 'Jamestown Marina Park',
    hours: '11:30 AM - 6:00 PM',
    status: 'scheduled',
    coordinates: 'Jamestown, KY'
  },
  {
    day: 'Friday',
    location: 'Lake Cumberland State Resort Park',
    hours: '11:00 AM - 8:00 PM',
    status: 'active',
    coordinates: 'Jamestown, KY'
  },
  {
    day: 'Saturday',
    location: 'Burnside Marina Boat Ramp',
    hours: '11:00 AM - 9:00 PM',
    status: 'scheduled',
    coordinates: 'Burnside, KY'
  },
  {
    day: 'Sunday',
    location: 'Somerset River Center',
    hours: '12:00 PM - 5:00 PM',
    status: 'scheduled',
    coordinates: 'Somerset, KY'
  }
];
