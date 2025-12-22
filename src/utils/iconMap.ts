/**
 * Optimized icon map for budget categories
 * This file imports only the icons that are actually used in the application
 * to enable proper tree-shaking and reduce bundle size.
 */
import {
  // 웨딩
  Heart,
  Gem,
  Crown,
  Sparkles,
  Star,
  Flower2,
  Gift,
  PartyPopper,
  // 장소/여행
  Building,
  Building2,
  Home,
  Hotel,
  Plane,
  Car,
  MapPin,
  Palmtree,
  // 의상/뷰티
  Shirt,
  Scissors,
  Palette,
  Brush,
  Sparkle,
  Glasses,
  Watch,
  Footprints,
  // 음식/파티
  Utensils,
  UtensilsCrossed,
  Wine,
  Cake,
  Coffee,
  IceCream,
  Pizza,
  ChefHat,
  // 사진/영상
  Camera,
  Video,
  Image,
  Film,
  Aperture,
  Focus,
  SunMedium,
  Clapperboard,
  // 음악/엔터
  Music,
  Music2,
  Mic,
  Mic2,
  Radio,
  Headphones,
  Speaker,
  Guitar,
  // 가구/가전
  Sofa,
  Lamp,
  Tv,
  Refrigerator,
  WashingMachine,
  AirVent,
  Bed,
  Bath,
  // 쇼핑/기타
  ShoppingBag,
  ShoppingCart,
  Package,
  Wallet,
  CreditCard,
  Receipt,
  Truck,
  Box,
  // 기본 아이콘
  Circle,
  type LucideIcon,
} from 'lucide-react';

// Icon map for dynamic icon rendering
export const iconMap: Record<string, LucideIcon> = {
  // 웨딩
  Heart,
  Gem,
  Crown,
  Sparkles,
  Star,
  Flower2,
  Gift,
  PartyPopper,
  // 장소/여행
  Building,
  Building2,
  Home,
  Hotel,
  Plane,
  Car,
  MapPin,
  Palmtree,
  // 의상/뷰티
  Shirt,
  Scissors,
  Palette,
  Brush,
  Sparkle,
  Glasses,
  Watch,
  Footprints,
  // 음식/파티
  Utensils,
  UtensilsCrossed,
  Wine,
  Cake,
  Coffee,
  IceCream,
  Pizza,
  ChefHat,
  // 사진/영상
  Camera,
  Video,
  Image,
  Film,
  Aperture,
  Focus,
  SunMedium,
  Clapperboard,
  // 음악/엔터
  Music,
  Music2,
  Mic,
  Mic2,
  Radio,
  Headphones,
  Speaker,
  Guitar,
  // 가구/가전
  Sofa,
  Lamp,
  Tv,
  Refrigerator,
  WashingMachine,
  AirVent,
  Bed,
  Bath,
  // 쇼핑/기타
  ShoppingBag,
  ShoppingCart,
  Package,
  Wallet,
  CreditCard,
  Receipt,
  Truck,
  Box,
  // 기본 아이콘
  Circle,
};

// Helper function to get icon component by name
export const getIconByName = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

// Icon categories for the category modal
export const ICON_CATEGORIES = [
  {
    name: '웨딩',
    icons: ['Heart', 'Gem', 'Crown', 'Sparkles', 'Star', 'Flower2', 'Gift', 'PartyPopper'],
  },
  {
    name: '장소/여행',
    icons: ['Building', 'Building2', 'Home', 'Hotel', 'Plane', 'Car', 'MapPin', 'Palmtree'],
  },
  {
    name: '의상/뷰티',
    icons: ['Shirt', 'Scissors', 'Palette', 'Brush', 'Sparkle', 'Glasses', 'Watch', 'Footprints'],
  },
  {
    name: '음식/파티',
    icons: ['Utensils', 'UtensilsCrossed', 'Wine', 'Cake', 'Coffee', 'IceCream', 'Pizza', 'ChefHat'],
  },
  {
    name: '사진/영상',
    icons: ['Camera', 'Video', 'Image', 'Film', 'Aperture', 'Focus', 'SunMedium', 'Clapperboard'],
  },
  {
    name: '음악/엔터',
    icons: ['Music', 'Music2', 'Mic', 'Mic2', 'Radio', 'Headphones', 'Speaker', 'Guitar'],
  },
  {
    name: '가구/가전',
    icons: ['Sofa', 'Lamp', 'Tv', 'Refrigerator', 'WashingMachine', 'AirVent', 'Bed', 'Bath'],
  },
  {
    name: '쇼핑/기타',
    icons: ['ShoppingBag', 'ShoppingCart', 'Package', 'Wallet', 'CreditCard', 'Receipt', 'Truck', 'Box'],
  },
];
