export type BadgeType = 'limited' | 'clearance' | 'last';

export interface ClearanceItem {
  id: string;
  name: string;
  material: string;
  img: string;
  badge: BadgeType;
}

export const BADGE_LABELS: Record<BadgeType, string> = {
  limited: 'Limited Stock',
  clearance: 'Clearance',
  last: 'Last Pieces',
};

export const CLEARANCE_ITEMS: ClearanceItem[] = [
  {
    id: 'clr-calacatta-oro',
    name: 'Calacatta Oro Marble',
    material: 'Marble',
    img: '/photos/bianco-carrara.jpg',
    badge: 'limited',
  },
  {
    id: 'clr-black-granite',
    name: 'Black Granite Slab',
    material: 'Granite',
    img: '/photos/nero-marquina.jpg',
    badge: 'clearance',
  },
  {
    id: 'clr-ivory-travertine',
    name: 'Ivory Travertine',
    material: 'Travertine',
    img: '/photos/silver-travertine.jpg',
    badge: 'last',
  },
  {
    id: 'clr-silver-slate',
    name: 'Silver Grey Slate',
    material: 'Slate',
    img: '/photos/blankimg.jpg',
    badge: 'clearance',
  },
  {
    id: 'clr-emperador-dark',
    name: 'Emperador Dark Marble',
    material: 'Marble',
    img: '/photos/dark-emperador.jpg',
    badge: 'limited',
  },
  {
    id: 'clr-botticino',
    name: 'Botticino Classico',
    material: 'Marble',
    img: '/photos/blankimg.jpg',
    badge: 'last',
  },
];
