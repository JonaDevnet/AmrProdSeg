// Íconos portados verbatim de disenioAMR/amr_icons.jsx (stroke 1.6, currentColor)
import type { CSSProperties, ReactNode } from "react";

type IconProps = { d?: ReactNode; size?: number; sw?: number; fill?: string; style?: CSSProperties };

export const Icon = ({ d, size = 18, sw = 1.6, fill = "none", style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

type P = { size?: number; sw?: number; style?: CSSProperties };

export const IconSearch = (p: P) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />;
export const IconPlus = (p: P) => <Icon {...p} d="M12 5v14M5 12h14" />;
export const IconChevD = (p: P) => <Icon {...p} d="m6 9 6 6 6-6" />;
export const IconChevR = (p: P) => <Icon {...p} d="m9 6 6 6-6 6" />;
export const IconChevL = (p: P) => <Icon {...p} d="m15 6-6 6 6 6" />;
export const IconBell = (p: P) => <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>} />;
export const IconUser = (p: P) => <Icon {...p} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />;
export const IconLock = (p: P) => <Icon {...p} d={<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>} />;
export const IconMail = (p: P) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>} />;
export const IconEye = (p: P) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>} />;
export const IconFilter = (p: P) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4Z" />;
export const IconDots = (p: P) => <Icon {...p} sw={2.2} d={<><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></>} />;
export const IconArrowR = (p: P) => <Icon {...p} d="M5 12h14m-5-5 5 5-5 5" />;
export const IconCheck = (p: P) => <Icon {...p} sw={2} d="M5 12.5 10 17 19 7" />;
export const IconClose = (p: P) => <Icon {...p} d="M6 6l12 12M18 6 6 18" />;
export const IconCal = (p: P) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>} />;
export const IconCar = (p: P) => <Icon {...p} d={<><path d="M4 13h16l-1.6-5.2A2 2 0 0 0 16.5 6.4h-9A2 2 0 0 0 5.6 7.8L4 13Z" /><path d="M4 13v4h2v-2h12v2h2v-4" /><circle cx="7.5" cy="15.5" r="1.2" /><circle cx="16.5" cy="15.5" r="1.2" /></>} />;
export const IconShield = (p: P) => <Icon {...p} d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />;
export const IconDown = (p: P) => <Icon {...p} d="M12 5v14m-5-5 5 5 5-5" />;
