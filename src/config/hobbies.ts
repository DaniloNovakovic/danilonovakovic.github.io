import DrawingCanvas from '../components/DrawingCanvas';
import GuitarStrings from '../components/GuitarStrings';
import GamesMini from '../components/GamesMini';
import MuayThaiMini from '../components/MuayThaiMini';
import DancingMini from '../components/DancingMini';
import CodingMini from '../components/CodingMini';

export interface Hobby {
  id: string;
  name: string;
  x: number;
  description: string;
  Component: React.ComponentType;
}

export const HOBBIES: Hobby[] = [
  {
    id: 'drawing',
    name: 'Drawing',
    x: 400,
    description: 'Drawing is one of my core passions. It allows me to express creativity visually. I am currently learning design and bridging the gap between my code and artistic expression.',
    Component: DrawingCanvas
  },
  {
    id: 'guitar',
    name: 'Guitar',
    x: 850,
    description: 'When I step away from the keyboard, I love to play the guitar. It\'s a great way to disconnect and recharge.',
    Component: GuitarStrings
  },
  {
    id: 'games',
    name: 'Games',
    x: 1300,
    description: 'I\'m a huge fan of video games! Playing them, making them, and analyzing their mechanics.',
    Component: GamesMini
  },
  {
    id: 'muay thai',
    name: 'Muay Thai',
    x: 1750,
    description: 'Muay Thai keeps me disciplined and physically sharp. It\'s the ultimate test of endurance and focus.',
    Component: MuayThaiMini
  },
  {
    id: 'dancing',
    name: 'Dancing',
    x: 2200,
    description: 'Dancing is pure joy and rhythm. It\'s a fun way to stay active and express myself physically.',
    Component: DancingMini
  },
  {
    id: 'coding',
    name: 'Coding',
    x: 2650,
    description: 'I\'ve been coding since 2016. With deep experience in both Backend and Frontend, I\'m now combining engineering with design to build complete, beautiful products.',
    Component: CodingMini
  }
];
