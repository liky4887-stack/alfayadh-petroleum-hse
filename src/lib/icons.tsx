import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export type IconProps = {
  size?: number;
  color?: string;
  style?: any;
  strokeWidth?: number;
  fill?: string;
};

const I = (name: string) => (props: IconProps) => (
  <Ionicons
    name={name as any}
    size={props.size ?? 24}
    color={props.color ?? '#000'}
    style={props.style}
  />
);

const M = (name: string) => (props: IconProps) => (
  <MaterialCommunityIcons
    name={name as any}
    size={props.size ?? 24}
    color={props.color ?? '#000'}
    style={props.style}
  />
);

// Navigation & chrome
export const ArrowLeft = I('arrow-back');
export const ChevronLeft = I('chevron-back');
export const ChevronRight = I('chevron-forward');
export const ChevronDown = I('chevron-down');
export const X = I('close');
export const Menu = I('menu');
export const Plus = I('add');
export const Check = I('checkmark');
export const CheckCircle2 = I('checkmark-circle');
export const XCircle = I('close-circle');
export const MoreHorizontal = I('ellipsis-horizontal');

// Media & inputs
export const Camera = I('camera-outline');
export const MapPin = I('location-outline');
export const Bell = I('notifications-outline');
export const Search = I('search-outline');
export const Filter = I('filter-outline');
export const User = I('person-outline');
export const UserRound = I('person-circle-outline');
export const Home = I('home-outline');
export const Eye = I('eye-outline');
export const Play = I('play-circle-outline');
export const Send = I('send-outline');
export const Trash2 = I('trash-outline');
export const Pencil = I('pencil-outline');
export const Image = I('image-outline');
export const FileText = I('document-text-outline');

// Status & alerts
export const AlertTriangle = I('warning-outline');
export const AlertOctagon = I('alert-circle-outline');
export const ShieldCheck = I('shield-checkmark-outline');
export const Shield = I('shield-outline');
export const Info = I('information-circle-outline');
export const Bug = I('bug-outline');

// Data & charts
export const BarChart3 = I('stats-chart-outline');
export const TrendingUp = I('trending-up-outline');
export const Activity = I('pulse-outline');

// Training & work
export const GraduationCap = I('school-outline');
export const ClipboardCheck = I('clipboard-outline');
export const ClipboardList = I('clipboard-outline');
export const Tag = I('pricetag-outline');
export const BookOpen = I('book-outline');
export const Link2 = I('link-outline');
export const Users = I('people-outline');
export const UserGroup = I('people-circle-outline');

// Departments
export const Globe = I('globe-outline');
export const Truck = M('truck-outline');
export const Wrench = M('wrench-outline');

// Contact
export const Mail = I('mail-outline');
export const Phone = I('call-outline');

// Settings
export const Settings = I('settings-outline');
export const HelpCircle = I('help-circle-outline');
export const LogOut = I('log-out-outline');
export const Calendar = I('calendar-outline');
export const Clock = I('time-outline');
export const Download = I('download-outline');
export const Share2 = I('share-outline');

// Misc
export const Circle = I('ellipse-outline');
export const CircleCheck = I('checkmark-circle-outline');

// LucideIcon is used as a type in AppNavigation.tsx
export type LucideIcon = React.ComponentType<IconProps>;

// Alias used by some screens as: import { Image as ImageIcon }
export const ImageIcon = I('image-outline');
