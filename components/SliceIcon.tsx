/**
 * One glyph per way of slicing the shelf: an industry, a stage, who leads,
 * a check size. Asset classes keep their own tinted glyph
 * (components/AssetClassIcon). Shared by Explore and the preferences form
 * so a member sees the same picture for the same idea everywhere.
 */
import {
  Boxes,
  Building2,
  Coins,
  Cpu,
  CreditCard,
  Database,
  Factory,
  Handshake,
  HeartPulse,
  Landmark,
  Mountain,
  Plane,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  TrendingUp,
  Truck,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const SLICE_GLYPH: Record<string, LucideIcon> = {
  altspot: ShieldCheck,
  partner: Handshake,
  seed: Sprout,
  early: TrendingUp,
  growth: Mountain,
  late: Landmark,
  'artificial-intelligence': Cpu,
  'enterprise-software': Boxes,
  'data-infrastructure': Database,
  cybersecurity: Shield,
  fintech: CreditCard,
  healthcare: HeartPulse,
  'aerospace-defense': Plane,
  'energy-climate': Zap,
  industrials: Factory,
  'consumer-marketplaces': ShoppingBag,
  'logistics-supply-chain': Truck,
  'real-estate': Building2,
  '10-25': Coins,
  '25-50': Coins,
  '50-100': Wallet,
  '100+': Wallet,
};

export default function SliceIcon({
  slice,
  size = 15,
  className,
}: {
  slice: string;
  size?: number;
  className?: string;
}) {
  const Icon = SLICE_GLYPH[slice] ?? Boxes;
  return <Icon className={className} size={size} strokeWidth={1.6} aria-hidden="true" />;
}
