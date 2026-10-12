/* El Banquillo · flags.ts — Banderas de los países en SVG (se ven igual en cualquier móvil, sin depender de emojis). */
const H=(...c:string[])=>c.map((x,i)=>`<rect y="${i*20/c.length}" width="30" height="${20/c.length+.05}" fill="${x}"/>`).join('');
const V=(...c:string[])=>c.map((x,i)=>`<rect x="${i*30/c.length}" width="${30/c.length+.05}" height="20" fill="${x}"/>`).join('');
const F:Record<string,string>={
 ESP:`<rect width="30" height="20" fill="#c60b1e"/><rect y="5" width="30" height="10" fill="#ffc400"/>`,
 ING:`<rect width="30" height="20" fill="#fff"/><rect x="13" width="4" height="20" fill="#ce1124"/><rect y="8" width="30" height="4" fill="#ce1124"/>`,
 ITA:V('#009246','#fff','#ce2b37'),
 ALE:H('#000','#dd0000','#ffce00'),
 FRA:V('#0055a4','#fff','#ef4135'),
 PRT:`<rect width="30" height="20" fill="#da291c"/><rect width="12" height="20" fill="#046a38"/><circle cx="12" cy="10" r="3.6" fill="#ffe900"/><circle cx="12" cy="10" r="2.2" fill="#da291c"/>`,
 BRA:`<rect width="30" height="20" fill="#009c3b"/><path d="M15 2.5 27 10 15 17.5 3 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.2" fill="#002776"/>`,
 ARG:H('#74acdf','#fff','#74acdf')+`<circle cx="15" cy="10" r="2" fill="#f6b40e"/>`,
 NED:H('#ae1c28','#fff','#21468b'),
 MEX:V('#006847','#fff','#ce1126')+`<circle cx="15" cy="10" r="2.4" fill="#8c5a2b"/>`,
};
/** Bandera del país por su código (ESP, ING…). */
export const flag=(code:string,cls='')=>`<svg class="flag ${cls}" viewBox="0 0 30 20" aria-hidden="true">${F[code]||H('#999')}</svg>`;
