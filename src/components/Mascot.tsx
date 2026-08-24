// Dva maskoti, kteří se navzájem přetahují.
//
// THE CLOSER — nagelované vlasy, dobré sako, povolená kravata, sluneční brýle
// vyhrnuté do čela, věčný úsměv, velká gesta. Každou rundu považuje za pozici,
// kterou zaujal. Nesnáší vyrovnanou skupinu.
//
// THE ANALYST — rozčepýřené vlasy, vytahané tričko, sluchátka na krku, kruhy
// pod očima, v ruce výpis se stoupající červenou křivkou. Suchý, klidný,
// vždycky má pravdu a nikdo ho neposlouchá.
//
// ⚠️ TOHLE JE PLACEHOLDER. Handoff je explicitní: silueta, barvy a charakter
// jsou zadání, ne hotová ilustrace. Před vydáním nech nakreslit skutečnou
// grafiku a nahraď jen vnitřek téhle komponenty — rozhraní (`who`, `size`,
// `variant`) zůstává.
//
// Obličeje jsou záměrně KOSTĚNÉ, ne v odstínu pleti: postavy jedou do všech
// trhů a plakátové podání se tomu vyhne beze zbytku. Zároveň to sedí k tisku
// a k nulovým poloměrům zbytku appky.
//
// PRÁVNÍ: obecné archetypy. Žádná podoba s konkrétním člověkem, hercem ani
// filmovou postavou. Žádná politika, žádné národnostní ani náboženské motivy.

import React from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Path, Rect, Line, Polygon } from 'react-native-svg';
import { useUi } from './ui';
import type { MascotName } from '../types';
import { useApp } from '../store';
import { mascotVisible } from '../quips';

interface MascotProps {
  who: MascotName;
  size?: number;
  variant?: 'bust' | 'full';
}

export default function Mascot({ who, size = 34, variant = 'bust' }: MascotProps) {
  const { c, rtl } = useUi();
  const ink = c.border;          // v tmavém režimu kostěná — obrys se překlopí s appkou
  const paper = c.isDark ? '#1C1C1C' : '#FAF7F0';
  const full = variant === 'full';
  const w = full ? size : size;
  const h = full ? size * 1.6 : size;
  const vb = full ? '0 0 100 160' : '0 0 100 100';
  const sw = full ? 4 : 5;       // tah roste s měřítkem, ať drží plakátový dojem

  return (
    // V RTL se maskot zrcadlí spolu se zbytkem layoutu, jinak by ukazoval mimo
    <View style={{ width: w, height: h, transform: [{ scaleX: rtl ? -1 : 1 }] }}>
      <Svg width={w} height={h} viewBox={vb}>
        {who === 'closer'
          ? <Closer ink={ink} paper={paper} sw={sw} full={full} primary={c.primary} accent={c.accent} negative={c.negative} />
          : <Analyst ink={ink} paper={paper} sw={sw} full={full} negative={c.negative} muted={c.isDark ? '#3A3A3A' : '#C9C4B6'} />}
      </Svg>
    </View>
  );
}

interface PartProps {
  ink: string; paper: string; sw: number; full: boolean;
  primary?: string; accent?: string; negative?: string; muted?: string;
}

function Closer({ ink, paper, sw, full, primary, negative }: PartProps) {
  return (
    <G stroke={ink} strokeWidth={sw} strokeLinejoin="miter" strokeLinecap="butt" fill="none">
      {/* sako — široká ramena, otevřené klopy */}
      <Polygon points="14,96 24,60 76,60 86,96" fill={primary} />
      {full && <Polygon points="14,96 86,96 82,156 18,156" fill={primary} />}
      {/* košile */}
      <Polygon points="40,60 50,78 60,60" fill={paper} />
      {/* povolená kravata — uzel je posunutý, ne uprostřed */}
      <Polygon points="46,64 56,64 54,72 48,72" fill={negative} />
      <Polygon points="48,72 54,72 56,92 50,98 44,92" fill={negative} />
      {/* krk */}
      <Rect x="42" y="48" width="16" height="14" fill={paper} />
      {/* hlava */}
      <Rect x="30" y="14" width="40" height="38" fill={paper} />
      {/* nagelované vlasy — jeden ostrý sešikmený blok, žádné kudrny */}
      <Polygon points="28,16 72,16 72,8 46,4 28,10" fill={ink} />
      {/* sluneční brýle vyhrnuté do čela */}
      <Rect x="30" y="17" width="40" height="7" fill={ink} />
      {/* oči */}
      <Rect x="38" y="30" width="6" height="4" fill={ink} stroke="none" />
      <Rect x="56" y="30" width="6" height="4" fill={ink} stroke="none" />
      {/* věčný úsměv */}
      <Path d="M38 42 L50 47 L62 42" />
      {full && (
        <>
          {/* velké gesto — jedna paže nahoře, druhá otevřená do strany */}
          <Path d="M86 70 L98 44" strokeWidth={sw + 2} />
          <Rect x="92" y="34" width="12" height="12" fill={paper} />
          <Path d="M14 70 L2 88" strokeWidth={sw + 2} />
          <Rect x="-2" y="88" width="12" height="12" fill={paper} />
        </>
      )}
    </G>
  );
}

function Analyst({ ink, paper, sw, full, negative, muted }: PartProps) {
  return (
    <G stroke={ink} strokeWidth={sw} strokeLinejoin="miter" strokeLinecap="butt" fill="none">
      {/* vytahané tričko — spadlá ramena, žádná linie */}
      <Polygon points="18,96 22,62 78,62 82,96" fill={muted} />
      {full && <Polygon points="18,96 82,96 80,156 20,156" fill={muted} />}
      {/* krk */}
      <Rect x="42" y="48" width="16" height="14" fill={paper} />
      {/* sluchátka na krku */}
      <Path d="M32 60 Q50 46 68 60" />
      <Rect x="26" y="58" width="10" height="12" fill={ink} stroke="none" />
      <Rect x="64" y="58" width="10" height="12" fill={ink} stroke="none" />
      {/* hlava */}
      <Rect x="30" y="14" width="40" height="38" fill={paper} />
      {/* rozčepýřené vlasy — zubatý blok, nic učesaného */}
      <Polygon points="28,16 34,4 40,14 46,2 52,14 58,5 64,14 72,8 72,16" fill={ink} />
      {/* oči + kruhy pod nimi */}
      <Rect x="38" y="29" width="6" height="4" fill={ink} stroke="none" />
      <Rect x="56" y="29" width="6" height="4" fill={ink} stroke="none" />
      <Line x1="37" y1="37" x2="45" y2="37" strokeWidth={sw - 1} />
      <Line x1="55" y1="37" x2="63" y2="37" strokeWidth={sw - 1} />
      {/* rovná ústa — bez emoce */}
      <Line x1="42" y1="45" x2="58" y2="45" />
      {full && (
        <>
          {/* výpis se stoupající červenou křivkou */}
          <Path d="M82 76 L96 92" strokeWidth={sw + 2} />
          <Rect x="72" y="92" width="30" height="38" fill={paper} />
          <Path d="M76 122 L84 112 L90 116 L98 98" stroke={negative} strokeWidth={sw} />
          {/* druhá ruka v kapse — ramenní linie končí, paže ne */}
          <Path d="M18 76 L10 96" strokeWidth={sw + 2} />
        </>
      )}
    </G>
  );
}

/** Malý pruh s hláškou. Používá se všude, kde maskot jen prohodí větu. */
/**
 * Jeden pruh. Sám se schová, když je jeho postava vypnutá — díky tomu
 * nemusí každá obrazovka tu podmínku opisovat a nemůže se stát, že se
 * na jedné zapomene.
 */
export function MascotStrip({ who, text, fill }: { who: MascotName; text: string; fill?: string }) {
  const { c, ty } = useUi();
  const { state } = useApp();
  const bg = fill || (who === 'closer' ? c.accent : c.surface);
  const fg = bg === c.accent ? c.onAccent : c.text;
  if (!mascotVisible(state.notif, who)) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: bg,
        borderWidth: 3,
        borderColor: c.border,
        padding: 9,
      }}
    >
      <Mascot who={who} size={32} />
      <View style={{ flex: 1 }}>
        {/* flex:1 + žádné numberOfLines → dlouhý překlad zvedne pruh, neuřízne text */}
        <Text style={[ty('caption'), { color: fg }]}>{text}</Text>
      </View>
    </View>
  );
}

/**
 * Dvojice pruhů vedle sebe — TADY se jejich komentáře potkávají.
 * Objevuje se jen na pěti obrazovkách (viz quips.ts), jinak by z toho byl gag.
 *
 * Když je jedna z postav v Notifikacích vypnutá, zbylá zabere celou šířku
 * sama — půlka pruhu s prázdným místem vedle by vypadala jako chyba
 * vykreslení, ne jako nastavení, které si člověk vybral.
 */
export function DualMascotStrip({ closer, analyst }: { closer: string; analyst: string }) {
  const { c, ty } = useUi();
  const { state } = useApp();
  const showCloser = mascotVisible(state.notif, 'closer');
  const showAnalyst = mascotVisible(state.notif, 'analyst');
  if (!showCloser && !showAnalyst) return null;
  if (!showAnalyst) return <MascotStrip who="closer" text={closer} />;
  if (!showCloser) return <MascotStrip who="analyst" text={analyst} />;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1, backgroundColor: c.accent, borderWidth: 3, borderColor: c.border, padding: 9, gap: 6 }}>
        <Mascot who="closer" size={30} />
        <Text style={[ty('caption'), { color: c.onAccent }]}>{closer}</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 3, borderColor: c.border, padding: 9, gap: 6 }}>
        <Mascot who="analyst" size={30} />
        <Text style={[ty('caption'), { color: c.text }]}>{analyst}</Text>
      </View>
    </View>
  );
}
