/**
 * Composants d'illustrations d'onboarding
 * SVG intégrés directement pour éviter les problèmes de chargement
 */

import React from 'react';
import { SvgXml } from 'react-native-svg';

// Illustration 1 : Infirmière + Dossier patient
export const Onboarding1Svg = ({ width = 300, height = 300 }: { width?: number; height?: number }) => {
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E6F4FE;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F0F9FF;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="nurseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0051D5;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGrad1)"/>
  <circle cx="150" cy="150" r="80" fill="#007AFF" fill-opacity="0.1"/>
  <circle cx="874" cy="874" r="100" fill="#34C759" fill-opacity="0.1"/>
  <g transform="translate(200, 200)">
    <circle cx="312" cy="180" r="80" fill="#FFDBAC"/>
    <path d="M232 180 Q232 120 280 100 Q328 100 344 120 Q360 100 408 100 Q456 120 456 180" fill="#3A3A3C" fill-opacity="0.8"/>
    <rect x="252" y="260" width="120" height="200" rx="20" fill="url(#nurseGrad)"/>
    <rect x="200" y="280" width="40" height="140" rx="20" fill="url(#nurseGrad)"/>
    <rect x="384" y="280" width="40" height="140" rx="20" fill="url(#nurseGrad)"/>
    <circle cx="312" cy="320" r="25" fill="#FFFFFF"/>
    <path d="M312 305 L312 335 M297 320 L327 320" stroke="#007AFF" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g transform="translate(500, 300)">
    <rect x="0" y="0" width="300" height="400" rx="24" fill="#FFFFFF" stroke="#E5E5EA" stroke-width="3"/>
    <rect x="20" y="-20" width="80" height="40" rx="8" fill="#007AFF"/>
    <rect x="40" y="60" width="220" height="16" rx="8" fill="#E5E5EA"/>
    <rect x="40" y="100" width="180" height="16" rx="8" fill="#E5E5EA"/>
    <rect x="40" y="140" width="200" height="16" rx="8" fill="#E5E5EA"/>
    <rect x="40" y="180" width="160" height="16" rx="8" fill="#E5E5EA"/>
    <circle cx="150" cy="260" r="50" fill="#34C759" fill-opacity="0.1"/>
    <path d="M150 230 L150 290 M120 260 L180 260" stroke="#34C759" stroke-width="8" stroke-linecap="round"/>
    <rect x="40" y="340" width="220" height="40" rx="12" fill="#FF9500" fill-opacity="0.1"/>
    <text x="150" y="365" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#FF9500" text-anchor="middle">-50% temps</text>
  </g>
  <circle cx="800" cy="200" r="40" fill="#007AFF" fill-opacity="0.2"/>
  <circle cx="150" cy="800" r="50" fill="#34C759" fill-opacity="0.15"/>
</svg>`;
  return <SvgXml xml={svg} width={width} height={height} />;
};

// Illustration 2 : Microphone + Ondes + SOAPIE
export const Onboarding2Svg = ({ width = 300, height = 300 }: { width?: number; height?: number }) => {
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F0F9FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E6F4FE;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGrad2)"/>
  <g transform="translate(512, 400)">
    <path d="M-200 0 Q-150 -80 -100 0 T0 0" stroke="#007AFF" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.4"/>
    <path d="M-200 0 Q-150 80 -100 0 T0 0" stroke="#007AFF" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.4"/>
    <path d="M-300 0 Q-200 -120 -100 0 T100 0" stroke="#007AFF" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="M-300 0 Q-200 120 -100 0 T100 0" stroke="#007AFF" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="M-400 0 Q-250 -160 -100 0 T200 0" stroke="#007AFF" stroke-width="20" fill="none" stroke-linecap="round" opacity="0.8"/>
    <path d="M-400 0 Q-250 160 -100 0 T200 0" stroke="#007AFF" stroke-width="20" fill="none" stroke-linecap="round" opacity="0.8"/>
  </g>
  <g transform="translate(412, 500)">
    <rect x="0" y="0" width="200" height="280" rx="100" fill="#3A3A3C"/>
    <circle cx="100" cy="80" r="50" fill="#1C1C1E" fill-opacity="0.6"/>
    <circle cx="100" cy="80" r="35" fill="#3A3A3C"/>
    <rect x="90" y="280" width="20" height="80" fill="#8E8E93"/>
    <rect x="70" y="360" width="60" height="20" rx="10" fill="#8E8E93"/>
    <circle cx="100" cy="80" r="25" fill="#FF3B30" opacity="0.8"/>
  </g>
  <g>
    <g transform="translate(150, 150)">
      <circle cx="0" cy="0" r="60" fill="#007AFF" fill-opacity="0.15"/>
      <circle cx="0" cy="0" r="50" fill="#007AFF"/>
      <text x="0" y="8" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle">S</text>
    </g>
    <g transform="translate(874, 150)">
      <circle cx="0" cy="0" r="60" fill="#34C759" fill-opacity="0.15"/>
      <circle cx="0" cy="0" r="50" fill="#34C759"/>
      <text x="0" y="8" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle">O</text>
    </g>
    <g transform="translate(150, 874)">
      <circle cx="0" cy="0" r="60" fill="#FF9500" fill-opacity="0.15"/>
      <circle cx="0" cy="0" r="50" fill="#FF9500"/>
      <text x="0" y="8" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle">A</text>
    </g>
    <g transform="translate(874, 874)">
      <circle cx="0" cy="0" r="60" fill="#FF3B30" fill-opacity="0.15"/>
      <circle cx="0" cy="0" r="50" fill="#FF3B30"/>
      <text x="0" y="8" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle">P</text>
    </g>
    <g transform="translate(512, 150)">
      <circle cx="0" cy="0" r="60" fill="#AF52DE" fill-opacity="0.15"/>
      <circle cx="0" cy="0" r="50" fill="#AF52DE"/>
      <text x="0" y="8" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle">I</text>
    </g>
    <g transform="translate(512, 874)">
      <circle cx="0" cy="0" r="60" fill="#5AC8FA" fill-opacity="0.15"/>
      <circle cx="0" cy="0" r="50" fill="#5AC8FA"/>
      <text x="0" y="8" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle">E</text>
    </g>
  </g>
  <path d="M150 150 Q512 300 874 150" stroke="#E5E5EA" stroke-width="2" fill="none" opacity="0.5"/>
  <path d="M150 874 Q512 724 874 874" stroke="#E5E5EA" stroke-width="2" fill="none" opacity="0.5"/>
</svg>`;
  return <SvgXml xml={svg} width={width} height={height} />;
};

// Illustration 3 : PDF + Stéthoscope + Checkmark
export const Onboarding3Svg = ({ width = 300, height = 300 }: { width?: number; height?: number }) => {
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E6F4FE;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F0F9FF;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F8F9FA;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGrad3)"/>
  <circle cx="200" cy="200" r="100" fill="#34C759" fill-opacity="0.08"/>
  <circle cx="824" cy="824" r="120" fill="#007AFF" fill-opacity="0.08"/>
  <g transform="translate(262, 162)">
    <rect x="4" y="4" width="500" height="700" rx="32" fill="#E5E5EA" fill-opacity="0.3"/>
    <rect x="0" y="0" width="500" height="700" rx="32" fill="url(#docGrad)" stroke="#E5E5EA" stroke-width="4"/>
    <rect x="0" y="0" width="500" height="120" rx="32" fill="#007AFF"/>
    <rect x="40" y="40" width="120" height="40" rx="8" fill="#FFFFFF" fill-opacity="0.3"/>
    <rect x="180" y="50" width="200" height="20" rx="4" fill="#FFFFFF" fill-opacity="0.8"/>
    <rect x="40" y="160" width="420" height="24" rx="6" fill="#E5E5EA"/>
    <rect x="40" y="220" width="380" height="20" rx="4" fill="#F2F2F7"/>
    <rect x="40" y="260" width="400" height="20" rx="4" fill="#F2F2F7"/>
    <rect x="40" y="300" width="360" height="20" rx="4" fill="#F2F2F7"/>
    <rect x="40" y="360" width="420" height="120" rx="12" fill="#E6F4FE"/>
    <rect x="60" y="380" width="80" height="16" rx="4" fill="#007AFF" fill-opacity="0.3"/>
    <rect x="60" y="420" width="100" height="16" rx="4" fill="#007AFF" fill-opacity="0.2"/>
    <rect x="60" y="450" width="90" height="16" rx="4" fill="#007AFF" fill-opacity="0.2"/>
    <circle cx="450" cy="80" r="30" fill="#FF3B30"/>
    <text x="450" y="92" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" text-anchor="middle">PDF</text>
  </g>
  <g transform="translate(200, 700)">
    <circle cx="0" cy="0" r="50" fill="#3A3A3C"/>
    <circle cx="0" cy="0" r="35" fill="#1C1C1E"/>
    <path d="M0 50 Q100 150 200 200 Q300 250 400 300 Q500 350 600 400" stroke="#8E8E93" stroke-width="20" fill="none" stroke-linecap="round"/>
    <circle cx="600" cy="400" r="25" fill="#3A3A3C"/>
    <circle cx="650" cy="420" r="25" fill="#3A3A3C"/>
  </g>
  <g transform="translate(700, 200)">
    <circle cx="0" cy="0" r="100" fill="#34C759" fill-opacity="0.15"/>
    <circle cx="0" cy="0" r="80" fill="#34C759"/>
    <path d="M-30 -10 L-5 20 L30 -20" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <g>
    <g transform="translate(150, 500)">
      <path d="M0 0 L40 -30 L80 0 L80 40 L40 80 L0 40 Z" fill="#007AFF" fill-opacity="0.2"/>
      <path d="M0 0 L40 -30 L80 0 L80 40 L40 80 L0 40 Z" stroke="#007AFF" stroke-width="3" fill="none"/>
      <circle cx="40" cy="30" r="15" fill="#007AFF"/>
    </g>
    <g transform="translate(874, 500)">
      <path d="M40 0 L48 28 L76 28 L52 44 L60 72 L40 56 L20 72 L28 44 L4 28 L32 28 Z" fill="#FF9500" fill-opacity="0.2"/>
      <path d="M40 0 L48 28 L76 28 L52 44 L60 72 L40 56 L20 72 L28 44 L4 28 L32 28 Z" stroke="#FF9500" stroke-width="3" fill="none"/>
    </g>
  </g>
</svg>`;
  return <SvgXml xml={svg} width={width} height={height} />;
};

