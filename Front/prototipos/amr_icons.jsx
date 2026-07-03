// Simple inline SVG icons — stroke 1.5, currentColor

const Icon = ({ d, size = 18, sw = 1.6, fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const IconSearch = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />;
const IconPlus   = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const IconChevD  = (p) => <Icon {...p} d="m6 9 6 6 6-6" />;
const IconChevR  = (p) => <Icon {...p} d="m9 6 6 6-6 6" />;
const IconChevL  = (p) => <Icon {...p} d="m15 6-6 6 6 6" />;
const IconBell   = (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></>} />;
const IconUser   = (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>} />;
const IconLock   = (p) => <Icon {...p} d={<><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>} />;
const IconMail   = (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>} />;
const IconEye    = (p) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>} />;
const IconFilter = (p) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4Z" />;
const IconDots   = (p) => <Icon {...p} d={<><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></>} sw={2.2} />;
const IconArrowR = (p) => <Icon {...p} d="M5 12h14m-5-5 5 5-5 5" />;
const IconCheck  = (p) => <Icon {...p} d="M5 12.5 10 17 19 7" sw={2} />;
const IconClose  = (p) => <Icon {...p} d="M6 6l12 12M18 6 6 18" />;
const IconCal    = (p) => <Icon {...p} d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>} />;
const IconCar    = (p) => <Icon {...p} d={<><path d="M4 13h16l-1.6-5.2A2 2 0 0 0 16.5 6.4h-9A2 2 0 0 0 5.6 7.8L4 13Z"/><path d="M4 13v4h2v-2h12v2h2v-4"/><circle cx="7.5" cy="15.5" r="1.2"/><circle cx="16.5" cy="15.5" r="1.2"/></>} />;
const IconShield = (p) => <Icon {...p} d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />;
const IconDown   = (p) => <Icon {...p} d="M12 5v14m-5-5 5 5 5-5" />;

Object.assign(window, {
  Icon, IconSearch, IconPlus, IconChevD, IconChevR, IconChevL, IconBell, IconUser,
  IconLock, IconMail, IconEye, IconFilter, IconDots, IconArrowR, IconCheck, IconClose,
  IconCal, IconCar, IconShield, IconDown,
});
