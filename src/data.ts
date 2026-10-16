/* El Banquillo · data.js — Datos fijos del mundo: nombres, países, formaciones, posiciones, tácticas, rasgos. */
// @ts-nocheck — código heredado de la versión de scripts globales; se irá tipando por partes.
import {pick} from './core';
import {save} from './persist';
export const NAMES={
 es:[['Álvaro','Diego','Javier','Pablo','Sergio','Iker','Hugo','Mateo','Lucas','Dani','Raúl','Marcos','Adrián','Óscar','Rubén','Unai','Gonzalo','Nico','Santi','Bruno','Joel','Aitor','Iván','Mario','Borja','Jon','Ander','Martín','Ángel','Rafa','Víctor','Cristian','Andrés','Juanma','Pedro','Alejandro','Carlos','Manu','Jorge','Héctor','Luis','Miguel','Salva','Edu','Julen','Asier','Jaime','Nacho','Toni','Facundo','Emiliano','Lautaro','Matías','Franco','Thiago'],
  ['García','Martínez','López','Sánchez','Pérez','Gómez','Fernández','Ruiz','Díaz','Moreno','Muñoz','Álvarez','Romero','Navarro','Torres','Domínguez','Vázquez','Ramos','Gil','Serrano','Molina','Ortega','Delgado','Castro','Ortiz','Rubio','Marín','Sanz','Iglesias','Medina','Garrido','Cortés','Castillo','Santos','Lozano','Guerrero','Cano','Prieto','Méndez','Cruz','Calvo','Vidal','León','Herrera','Peña','Flores','Cabrera','Campos','Vega','Fuentes','Carrasco','Reyes','Nieto','Aguirre','Etxeberria','Benítez','Quintero','Valverde','Mendoza','Paredes','Salinas','Acosta','Villalba','Pastor','Soler','Bravo','Hidalgo','Ibáñez']],
 en:[['Jack','Harry','Oliver','George','Charlie','James','Tom','Callum','Ryan','Luke','Josh','Ben','Kieran','Jordan','Liam','Mason','Reece','Danny','Sam','Connor','Jamie','Lewis','Aaron','Declan','Owen','Joe'],
  ['Smith','Jones','Taylor','Brown','Walker','Wright','Hughes','Green','Hall','Wood','Clarke','Turner','Hill','Ward','Cooper','King','Baker','Harris','Morgan','Price','Bennett','Shaw','Fletcher','Holmes','Barnes','Lowe','Davies','Pearce']],
 it:[['Luca','Marco','Alessandro','Matteo','Lorenzo','Andrea','Federico','Davide','Simone','Giorgio','Riccardo','Gianluca','Nicolò','Stefano','Paolo','Filippo','Tommaso','Daniele','Emanuele','Antonio'],
  ['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca','Mancini','Costa','Giordano','Rizzo','Lombardi','Moretti','Barbieri','Fontana','Caruso','Santoro']],
 de:[['Lukas','Jonas','Leon','Felix','Maximilian','Paul','Niklas','Tim','Jan','Florian','Tobias','Moritz','Kai','Sebastian','Julian','Fabian','Dominik','Philipp','Lennart','Malte'],
  ['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann','Koch','Richter','Klein','Wolf','Neumann','Schwarz','Krüger','Hartmann','Werner','Lange','Brandt','Vogel','Kraus','Seidel']],
 fr:[['Lucas','Hugo','Théo','Antoine','Maxime','Julien','Kylian','Mathis','Romain','Nicolas','Bastien','Yanis','Clément','Adrien','Moussa','Karim','Mehdi','Florian','Enzo','Axel'],
  ['Martin','Bernard','Dubois','Thomas','Robert','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Garnier','Fournier','Girard','Bonnet','Mercier','Diallo','Traoré','Camara','Rousseau','Blanc','Faure']],
 pt:[['João','Pedro','Tiago','Rafael','Gonçalo','Diogo','Rodrigo','Bruno','Gabriel','Lucas','Matheus','Felipe','Vinícius','Thiago','Caio','André','Rui','Nuno','Igor','Renan','Wesley','Danilo'],
  ['Silva','Santos','Oliveira','Souza','Pereira','Costa','Ferreira','Rodrigues','Almeida','Carvalho','Lima','Gomes','Ribeiro','Martins','Araújo','Barbosa','Moreira','Teixeira','Fonseca','Cardoso','Nascimento','Rocha','Mendes','Pinto']],
 nl:[['Daan','Sem','Lars','Bram','Jesse','Thijs','Ruben','Stijn','Joost','Niels','Teun','Wout','Jasper','Koen','Milan','Luuk','Sven','Tijn'],
  ['de Jong','Jansen','de Vries','van Dijk','Bakker','Visser','Smit','Meijer','de Boer','Mulder','de Groot','Bos','Vos','Peters','Hendriks','van Leeuwen','Dekker','Brouwer','Kuiper','Willems']],
 tr:[['Emre','Burak','Mert','Arda','Kerem','Can','Ozan','Yusuf','Hakan','Serkan','Oğuz','Cengiz','Barış','Efe','Kaan','Umut','Tolga','Selim'],
  ['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Aydın','Öztürk','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özdemir','Polat','Erdem','Aksoy']],
 ja:[['Haruto','Sota','Yuto','Riku','Kaito','Ren','Daiki','Takumi','Kenta','Shota','Yuki','Hiroki','Kazuki','Ryo','Taiga','Sho','Kaoru','Makoto'],
  ['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato','Yoshida','Yamada','Sasaki','Inoue','Kimura','Hayashi','Shimizu','Mori','Endo','Ikeda']],
};
export const PT_A=['Vila','São','Porto','Monte','Torre','Vale','Ponte','Santa','Castelo','Rio','Serra','Campo'],PT_B=['Verde','Nova','Alta','do Mar','do Sol','Real','Branca','Longa','Clara','Formosa','Velha','Grande','Bonita','Serena'];
export const TOWNS={
 ES:{A:['Villa','Puerto','Torre','Valle','Monte','Fuente','Castro','Peña','Vega','Campo','Mira','Sierra','Alba','Navas','Olmeda','Cerro','Llano','Robla','Arroyo','Molina'],B:['verde','nueva','alta','mar','sol','dorada','llana','franca','hermosa','clara','blanca','seca','rubia','fría','honda','larga'],J:'',P:['CD {t}','UD {t}','SD {t}','CF {t}','Real {t}','Atlético {t}','Racing de {t}','Deportivo {t}','Sporting de {t}','Unión {t}','Club {t}','CP {t}']},
 EN:{A:['Ash','Brook','Kings','North','West','East','Stan','Wood','Hart','Black','Red','Mill','Market','Elm','Thorn','Brad','Wey','Ox','Fern','Hollin','Castle','Whit'],B:['ford','bury','ton','field','ham','wick','ley','mouth','bridge','gate','worth','stone','port','dale','minster','combe'],J:'',P:['{t} United','{t} Town','{t} City','{t} Rovers','{t} Athletic','{t} Wanderers','AFC {t}','{t} Albion','{t} County','{t} FC']},
 IT:{A:['Monte','Castel','Borgo','Villa','Porto','Torre','Valle','Poggio','Rocca','Ponte','Lago','Colle','Fonte','Prato'],B:['verde','fiore','nuovo','alto','mare','bianco','rosso','lungo','franco','chiaro','sereno','vecchio','santo'],J:'',P:['US {t}','AC {t}','{t} Calcio','SS {t}','FC {t}','Atletico {t}','AS {t}','Virtus {t}','Sporting {t}']},
 DE:{A:['Wald','Berg','Hohen','Neu','Alt','Ober','Nieder','Stein','Rosen','Linden','Eichen','Sonnen','Bach','Kirch','Fels','Hagen'],B:['dorf','heim','burg','feld','hausen','bach','stadt','au','tal','berg','hofen','brück'],J:'',P:['FC {t}','SV {t}','VfB {t}','TSV {t}','SC {t}','1. FC {t}','Borussia {t}','Eintracht {t}','VfL {t}','SpVgg {t}','Fortuna {t}']},
 FR:{A:['Saint-','Mont','Ville','Beau','Clair','Belle','Roche','Val','Fontaine','Château','Pont','Bois','Grand'],B:['fort','mont','ville','champ','lieu','mar','font','val','roc','vert','pré','mare'],J:'',P:['FC {t}','AS {t}','Olympique {t}','Stade {t}','US {t}','Racing {t}','SC {t}','En Avant {t}','AC {t}']},
 PT:{A:PT_A,B:PT_B,J:' ',P:['SC {t}','CD {t}','FC {t}','Académico {t}','Desportivo {t}','União {t}','GD {t}','Atlético {t}']},
 BR:{A:PT_A,B:PT_B,J:' ',P:['{t} EC','{t} FC','EC {t}','Atlético {t}','SE {t}','América {t}','Grêmio {t}','Esporte Clube {t}','Ferroviário {t}']},
 AR:{A:['Villa','San','Puerto','Santa','Valle','Monte','General','Río','Paso','Cañada','Colonia','Isla'],B:['Esperanza','del Sur','Alegre','Grande','Hermosa','Victoria','Unión','Rosales','del Monte','Vieja','Nueva','Clara'],J:' ',P:['Club Atlético {t}','{t} Juniors','Deportivo {t}','Sportivo {t}','Unión de {t}','Atlético {t}','Defensores de {t}','Estudiantes de {t}','Ferro de {t}']},
 NL:{A:['Groen','Hoog','Noord','Zuid','Oost','West','Berg','Vliet','Water','Linde','Brug','Dijk','Ven'],B:['dam','dijk','veen','hoven','wijk','berg','meer','zand','burg','hout','horst','loo'],J:'',P:['FC {t}','SC {t}','VV {t}','{t} United','SV {t}','Go Ahead {t}','{t} Boys','RKC {t}']},
 BE:{A:['Sint-','Oost','West','Lier','Zele','Wavre','Heren','Mol','Genk','Roe','Meche','Brug'],B:['kerke','gem','laar','hout','beek','dorp','veld','rode','hove','zele'],J:'',P:['KV {t}','KAA {t}','Sporting {t}','RSC {t}','Royal {t}','KSV {t}','Cercle {t}','Union {t}']},
 TR:{A:['Kara','Ak','Yeni','Eski','Gök','Kızıl','Bey','Sarı','Demir','Taş','Deniz','Yeşil'],B:['köy','dere','tepe','pınar','kale','ova','yurt','han','kent','bağ','ören'],J:'',P:['{t}spor','{t} Belediyespor','{t} FK','{t} Gençlik','{t} İdmanyurdu','{t} Gücü']},
 SC:{A:['Glen','Kil','Dun','Inver','Strath','Bal','Aber','Kirk','Loch','Craig','Fal','Ard'],B:['more','burn','ton','field','ness','mouth','side','haven','brae','muir'],J:'',P:['{t} FC','{t} Athletic','{t} Thistle','{t} United','Queen of {t}','{t} Rovers','{t} Albion']},
 US:{A:['Spring','Lake','River','Oak','Cedar','Pine','Red','Silver','Clear','Rock','Fair','Green'],B:['field','ville','wood','port','dale','ridge','view','haven','town','creek'],J:'',P:['{t} FC','{t} United','Real {t}','{t} SC','{t} Rangers','{t} Galaxy','{t} Union','{t} City']},
 JP:{A:['Kita','Minami','Higashi','Nishi','Shin','Taka','Naka','Kawa','Yama','Matsu','Haru','Aki'],B:['saki','hama','yama','gawa','shima','zawa','oka','mura','hara','numa'],J:'',P:['{t} FC','FC {t}','{t} United','Vortis {t}','{t} Reds','{t} Antlers','{t} Frontale']},
 CO:{A:['San','Santa','Villa','Puerto','Valle','Monte','Río','Nueva','Ciudad','Alto'],B:['Bolívar','del Cauca','Verde','Hermosa','Dorada','Blanca','del Sol','Grande','Real','Linda'],J:' ',P:['Deportivo {t}','Atlético {t}','Independiente {t}','Once {t}','Real {t}','Cortuluá {t}','Patriotas de {t}']},
 MX:{A:['San','Santa','Puerto','Villa','Valle','Real del','Ciudad','Nuevo','Tierra'],B:['Morelos','Alegre','Grande','Hermosa','Victoria','del Mar','Dorada','Blanca','Verde','Bonita','Vieja'],J:' ',P:['Club {t}','Deportivo {t}','Atlético {t}','{t} FC','Halcones de {t}','Leones de {t}','Toros de {t}','Venados de {t}','Tiburones de {t}']},
};
export const COUNTRIES=[
 {n:'España',code:'ESP',lang:'es',tw:'ES',lv:5,top:74.5},{n:'Inglaterra',code:'ING',lang:'en',tw:'EN',lv:5,top:76},{n:'Italia',code:'ITA',lang:'it',tw:'IT',lv:5,top:73},
 {n:'Alemania',code:'ALE',lang:'de',tw:'DE',lv:5,top:73},{n:'Francia',code:'FRA',lang:'fr',tw:'FR',lv:5,top:71.5},
 {n:'Portugal',code:'PRT',lang:'pt',tw:'PT',lv:4,top:68},{n:'Brasil',code:'BRA',lang:'pt',tw:'BR',lv:4,top:69},{n:'Argentina',code:'ARG',lang:'es',tw:'AR',lv:4,top:67},
 {n:'Países Bajos',code:'NED',lang:'nl',tw:'NL',lv:3,top:67.5},{n:'México',code:'MEX',lang:'es',tw:'MX',lv:3,top:64},
 {n:'Bélgica',code:'BEL',lang:'nl',tw:'BE',lv:2,top:67},{n:'Turquía',code:'TUR',lang:'tr',tw:'TR',lv:2,top:67},{n:'Escocia',code:'SCO',lang:'en',tw:'SC',lv:2,top:63.5},
 {n:'Estados Unidos',code:'USA',lang:'en',tw:'US',lv:2,top:65},{n:'Japón',code:'JPN',lang:'ja',tw:'JP',lv:2,top:64},{n:'Colombia',code:'COL',lang:'es',tw:'CO',lv:2,top:64},
];
/** Selecciones sin liga en el juego: juegan Mundial, Eurocopa y Copa América con su propio nivel (no tienen jugadores en el mundo). conf: eu, sa, na, af, as. */
export const NATIONS=[
 {n:'Croacia',code:'CRO',lang:'de',conf:'eu',top:70},{n:'Uruguay',code:'URU',lang:'es',conf:'sa',top:69},{n:'Marruecos',code:'MAR',lang:'fr',conf:'af',top:69},{n:'Dinamarca',code:'DEN',lang:'de',conf:'eu',top:68},
 {n:'Suiza',code:'SUI',lang:'de',conf:'eu',top:68},{n:'Senegal',code:'SEN',lang:'fr',conf:'af',top:67},{n:'Suecia',code:'SWE',lang:'de',conf:'eu',top:66},{n:'Noruega',code:'NOR',lang:'de',conf:'eu',top:66},
 {n:'Austria',code:'AUT',lang:'de',conf:'eu',top:66},{n:'Nigeria',code:'NGA',lang:'en',conf:'af',top:66},{n:'Polonia',code:'POL',lang:'de',conf:'eu',top:65},{n:'Serbia',code:'SRB',lang:'de',conf:'eu',top:65},
 {n:'Ucrania',code:'UKR',lang:'de',conf:'eu',top:65},{n:'Ecuador',code:'ECU',lang:'es',conf:'sa',top:65},{n:'Corea del Sur',code:'KOR',lang:'ja',conf:'as',top:65},{n:'Costa de Marfil',code:'CIV',lang:'fr',conf:'af',top:65},
 {n:'Canadá',code:'CAN',lang:'en',conf:'na',top:64},{n:'Egipto',code:'EGY',lang:'en',conf:'af',top:64},{n:'Irán',code:'IRN',lang:'en',conf:'as',top:64},{n:'Chequia',code:'CZE',lang:'de',conf:'eu',top:64},
 {n:'Perú',code:'PER',lang:'es',conf:'sa',top:63},{n:'Chile',code:'CHI',lang:'es',conf:'sa',top:63},{n:'Paraguay',code:'PAR',lang:'es',conf:'sa',top:63},{n:'Gales',code:'GAL',lang:'en',conf:'eu',top:63},
 {n:'Hungría',code:'HUN',lang:'de',conf:'eu',top:63},{n:'Camerún',code:'CMR',lang:'fr',conf:'af',top:63},{n:'Argelia',code:'ALG',lang:'fr',conf:'af',top:63},{n:'Ghana',code:'GHA',lang:'en',conf:'af',top:63},
 {n:'Australia',code:'AUS',lang:'en',conf:'as',top:63},{n:'Irlanda',code:'IRL',lang:'en',conf:'eu',top:62},{n:'Grecia',code:'GRE',lang:'de',conf:'eu',top:62},{n:'Rumanía',code:'ROU',lang:'it',conf:'eu',top:62},
 {n:'Túnez',code:'TUN',lang:'fr',conf:'af',top:62},{n:'Eslovaquia',code:'SVK',lang:'de',conf:'eu',top:61},{n:'Eslovenia',code:'SVN',lang:'de',conf:'eu',top:61},{n:'Venezuela',code:'VEN',lang:'es',conf:'sa',top:61},
 {n:'Costa Rica',code:'CRC',lang:'es',conf:'na',top:61},{n:'Mali',code:'MLI',lang:'fr',conf:'af',top:61},{n:'Arabia Saudí',code:'KSA',lang:'en',conf:'as',top:61},{n:'Georgia',code:'GEO',lang:'de',conf:'eu',top:60},
 {n:'Islandia',code:'ISL',lang:'de',conf:'eu',top:60},{n:'Panamá',code:'PAN',lang:'es',conf:'na',top:60},{n:'Sudáfrica',code:'RSA',lang:'en',conf:'af',top:60},{n:'Catar',code:'QAT',lang:'en',conf:'as',top:60},
 {n:'Uzbekistán',code:'UZB',lang:'en',conf:'as',top:60},{n:'Albania',code:'ALB',lang:'it',conf:'eu',top:59},{n:'Finlandia',code:'FIN',lang:'de',conf:'eu',top:59},{n:'Irak',code:'IRQ',lang:'en',conf:'as',top:59},
 {n:'Bolivia',code:'BOL',lang:'es',conf:'sa',top:58},{n:'Jamaica',code:'JAM',lang:'en',conf:'na',top:58},{n:'Honduras',code:'HON',lang:'es',conf:'na',top:58},{n:'Nueva Zelanda',code:'NZL',lang:'en',conf:'as',top:57},{n:'China',code:'CHN',lang:'en',conf:'as',top:57}];
/** Resto de países del mundo (solo para elegir la nacionalidad del entrenador). */
export const OTHER_NAT=['Afganistán','Andorra','Angola','Armenia','Azerbaiyán','Bahréin','Bangladés','Bielorrusia','Bosnia y Herzegovina','Bulgaria','Burkina Faso','Cabo Verde','Chipre','Congo','Cuba','Curazao','El Salvador','Emiratos Árabes Unidos','Estonia','Etiopía','Filipinas','Gabón','Guatemala','Guinea','Guinea Ecuatorial','Haití','India','Indonesia','Israel','Jordania','Kazajistán','Kenia','Kosovo','Kuwait','Letonia','Líbano','Libia','Liechtenstein','Lituania','Luxemburgo','Macedonia del Norte','Madagascar','Malasia','Malta','Moldavia','Mónaco','Montenegro','Mozambique','Nicaragua','Omán','Palestina','Puerto Rico','República Dominicana','RD Congo','San Marino','Siria','Sudán','Tailandia','Tanzania','Trinidad y Tobago','Uganda','Vietnam','Zambia','Zimbabue'].map(n=>({n,code:'---',lang:'en'}));
/** Todas las nacionalidades: primero los países con liga (mismos índices que COUNTRIES), luego las selecciones y el resto. */
export const ALLN=[...COUNTRIES,...NATIONS,...OTHER_NAT];
export const LV_NAMES=['Primera División','Segunda División','Tercera División','Cuarta División','Quinta División'];
export const LV_SH=['1ª','2ª','3ª','4ª','5ª'];
export const LV_STEP=8.5;
export const KITS=[['#1d3f8f','#f2f2f2'],['#c8202f','#ffffff'],['#0f7d8c','#ffffff'],['#14213d','#fca311'],['#e0b100','#1a1a1a'],['#1f6b35','#ffffff'],['#e05a1b','#ffffff'],['#5f646b','#e8463a'],['#5b2a86','#ffffff'],['#86c440','#14301a'],['#0b5394','#ffd966'],['#a61c1c','#f4e3c1'],['#274e13','#ffffff'],['#3d85c6','#ffffff'],['#ffffff','#0b3c7a'],['#38761d','#ffe599'],['#e69138','#3b2a14'],['#1a1a1a','#e2b13c'],['#134f5c','#f2f2f2'],['#6fa8dc','#0b2a4a'],['#990000','#ffffff'],['#8e7cc3','#ffffff'],['#5b3a1e','#e9d3a7'],['#f1c232','#2b5c12'],['#cc4125','#f3f3f3'],['#45818e','#ffffff'],['#20124d','#e06666'],['#6aa84f','#ffffff'],['#7f6000','#d9ead3'],['#3c78d8','#fce5cd'],['#ffffff','#c8202f'],['#111111','#ffffff']];
export const FORMS={
 '4-4-2':[[['LI','DFC','DFC','LD'],70],[['MI','MC','MC','MD'],46],[['DC','DC'],19]],
 '4-3-3':[[['LI','DFC','DFC','LD'],70],[['MC','MCD','MC'],48],[['EI','DC','ED'],20]],
 '4-2-3-1':[[['LI','DFC','DFC','LD'],72],[['MCD','MCD'],56],[['EI','MCO','ED'],36],[['DC'],15]],
 '4-1-4-1':[[['LI','DFC','DFC','LD'],72],[['MCD'],59],[['MI','MC','MC','MD'],40],[['DC'],16]],
 '4-3-1-2':[[['LI','DFC','DFC','LD'],72],[['MC','MCD','MC'],54],[['MCO'],36],[['DC','DC'],17]],
 '4-5-1':[[['LI','DFC','DFC','LD'],70],[['MI','MC','MCD','MC','MD'],45],[['DC'],17]],
 '3-5-2':[[['DFC','DFC','DFC'],71],[['MI','MC','MCD','MC','MD'],46],[['DC','DC'],19]],
 '3-4-3':[[['DFC','DFC','DFC'],71],[['MI','MC','MC','MD'],46],[['EI','DC','ED'],20]],
 '5-3-2':[[['LI','DFC','DFC','DFC','LD'],70],[['MC','MCD','MC'],46],[['DC','DC'],19]],
 '5-4-1':[[['LI','DFC','DFC','DFC','LD'],70],[['MI','MC','MC','MD'],45],[['DC'],17]],
};
export const SPN={POR:'Portero',DFC:'Defensa central',LD:'Lateral derecho',LI:'Lateral izquierdo',MCD:'Mediocentro defensivo',MC:'Mediocentro',MCO:'Mediapunta',MD:'Interior derecho',MI:'Interior izquierdo',ED:'Extremo derecho',EI:'Extremo izquierdo',DC:'Delantero centro'};
export const GRP={POR:'POR',DFC:'DEF',LD:'DEF',LI:'DEF',MCD:'MED',MC:'MED',MCO:'MED',MD:'MED',MI:'MED',ED:'DEL',EI:'DEL',DC:'DEL'};
export const SPXY={POR:[50,90],DFC:[50,74],LI:[14,68],LD:[86,68],MCD:[50,60],MC:[50,47],MI:[16,44],MD:[84,44],MCO:[50,33],EI:[18,20],ED:[82,20],DC:[50,12]};
export const SP_ALT={POR:[],DFC:['MCD','LD','LI'],LD:['LI','MD','DFC'],LI:['LD','MI','DFC'],MCD:['MC','DFC'],MC:['MCD','MCO','MD','MI'],MCO:['MC','DC','ED','EI'],MD:['ED','MI','LD','MC'],MI:['EI','MD','LI','MC'],ED:['EI','MD','DC'],EI:['ED','MI','DC'],DC:['MCO','ED','EI']};
export const SP_SEQ={POR:['POR','POR'],DEF:['DFC','DFC','LD','LI','DFC','LD','LI'],MED:['MC','MC','MCD','MCO','MD','MI','MC'],DEL:['DC','DC','ED','EI','DC']};
export const WIDE=['LD','LI','MD','MI','ED','EI'];
export const spRandom=g=>pick({POR:['POR'],DEF:['DFC','DFC','LD','LI'],MED:['MC','MC','MCD','MCO','MD','MI'],DEL:['DC','DC','DC','ED','EI']}[g]);
export const FOOT={D:'Diestro',I:'Zurdo',A:'Ambidiestro'};
export const PERS={nor:{n:'Equilibrado',d:'Sin rasgos de carácter destacados.'},pro:{n:'Profesional',d:'Entrena con disciplina: mejora más rápido.'},lid:{n:'Líder',d:'Cuando es titular, sube la química del equipo.'},tem:{n:'Temperamental',d:'Ve más tarjetas.'},amb:{n:'Ambicioso',d:'Quiere jugar en clubes grandes; se frustra en categorías bajas.'},lea:{n:'Leal',d:'Su felicidad cae más despacio.'},tra:{n:'Incansable',d:'Se cansa menos durante los partidos.'}};
export const PERS_W={nor:40,pro:12,lid:8,tem:10,amb:12,lea:10,tra:8};
export const TRAITS={gol:'Instinto goleador',lej:'Dispara de lejos',cab:'Cabeceador',reg:'Regateador',pas:'Pase al hueco',bal:'Especialista a balón parado',mur:'Muro defensivo',vel:'Velocista',par:'Paradas imposibles'};
export const ROLES={cl:{n:'Jugador clave',min:.8,l:4},ti:{n:'Titular',min:.6,l:3},ro:{n:'Rotación',min:.35,l:2},jo:{n:'Joven promesa',min:.2,l:1},su:{n:'Suplente',min:.12,l:1}};
/** Estadísticas de temporada. xg se guarda en centésimas; kp pases clave, tk entradas, dr regates, du duelos ganados. */
export const ST_K=['pj','mi','g','a','rs','mv','yc','rc','cs','xg','kp','tk','dr','du'];
export const newSt=()=>({pj:0,mi:0,g:0,a:0,rs:0,mv:0,yc:0,rc:0,cs:0,xg:0,kp:0,tk:0,dr:0,du:0});
export const TACS={pre:{n:'Presión',o:{baj:'Baja',med:'Media',alt:'Alta'},d:'Alta: robas más arriba y el rival crea menos, pero tus jugadores se cansan más y sufres ante el contragolpe.'},
 lin:{n:'Línea defensiva',o:{baj:'Baja',med:'Media',alt:'Alta'},d:'Alta: ayuda a atacar pero deja espacio a la espalda. Baja: sólida atrás, pero creas menos.'},
 rit:{n:'Ritmo',o:{len:'Lento',nor:'Normal',rap:'Rápido'},d:'Rápido: más ocasiones para los dos y más cansancio. Lento: partido controlado y cerrado.'},
 anc:{n:'Anchura',o:{est:'Estrecho',nor:'Normal',anc:'Ancho'},d:'Ancho: aprovecha laterales y extremos buenos. Estrecho: juega por dentro si tus medios son mejores.'},
 per:{n:'Al perder el balón',o:{nor:'Normal',cpr:'Contrapresión',rep:'Replegar'},d:'Contrapresión: a por el balón en cuanto se pierde (robas arriba, cansa y te expone a la contra). Replegar: todos atrás a defender (sólido, pero atacas menos).'},
 rec:{n:'Al recuperar el balón',o:{nor:'Normal',cont:'Contraataque',pau:'Pausar'},d:'Contraataque: rápido a la espalda del rival (mortal si tiene la línea alta o está volcado; mejor con delanteros rápidos). Pausar: guardar el balón y ordenarse.'},
 ent:{n:'Entradas',o:{pru:'Prudentes',nor:'Normales',dur:'Duras'},d:'Duras: robas más balones y el rival crea menos, pero ves más tarjetas. Prudentes: casi sin tarjetas, aunque el rival progresa con más facilidad.'},
 off:{n:'Trampa del fuera de juego',o:{no:'No',si:'Sí'},d:'Con defensas bien colocados y la línea alta deja al rival en fuera de juego; con defensas lentos o mal colocados es un riesgo.'},
 tie:{n:'Perder tiempo',o:{no:'No',si:'Sí'},d:'Sólo cuando vas ganando: el partido se enfría y el rival crea menos, aunque tú también atacas menos. El árbitro puede amonestar.'},
 est:{n:'Estilo',o:{equ:'Equilibrado',pos:'Posesión',dir:'Directo',con:'Contragolpe'},d:'Posesión: castiga la presión baja. Directo: bueno con delanteros fuertes. Contragolpe: mortal contra líneas altas y rivales ofensivos.'}};
export const TAC0={pre:'med',lin:'med',rit:'nor',anc:'nor',est:'equ',per:'nor',rec:'nor',ent:'nor',off:'no',tie:'no'};
export const ORDERS={'':'Sin orden',sube:'Sube al ataque',libre:'Libertad creativa',marca:'Marcar a su estrella',fija:'Quédate atrás'};
/** Instrucciones al rival (se aplican a todo su equipo). */
export const OIS={ban:{n:'Cerrar las bandas',d:'Frena a los rivales que atacan por fuera, a cambio de un poco menos de ataque propio.'},
 sal:{n:'Presionar su salida',d:'Les quita el balón y les hace fallar si sus defensas no saben sacarlo jugado. Tus jugadores se cansan más.'},
 dur:{n:'Entradas duras',d:'Les cuesta más crear, pero verás más faltas y tarjetas.'}};
export const MENT={def:{own:.78,opp:.84,label:'Defensiva'},bal:{own:1,opp:1,label:'Equilibrada'},att:{own:1.22,opp:1.15,label:'Ofensiva'}};
export const POS_ORD={POR:0,DEF:1,MED:2,DEL:3};
export const POS_NAME={POR:'Portero',DEF:'Defensa',MED:'Centrocampista',DEL:'Delantero'};
export const posChip=p=>`<span class="pos ${GRP[p.sp]||p.pos}" title="${SPN[p.sp]||''}">${p.sp||p.pos}</span>`;
/*
 * Atributos del 1 al 10. Los seis primeros son los de siempre (el orden importa: así se guardan las partidas).
 * Liderazgo, Regularidad y Partidos grandes no cuentan para la media, pero sí en el partido y el vestuario.
 */
export const ATTRS=['tir','pas','reg','def','fis','por','cab','vis','col','dec','vel','res','lid','con','gra'];
export const ATTRS_OLD=['tir','pas','reg','def','fis','por'];
export const AT_NAME={tir:'Remate',pas:'Pase',reg:'Regate',def:'Entradas',fis:'Fuerza',por:'Portería',cab:'Cabezazo',vis:'Visión',col:'Colocación',dec:'Decisiones',vel:'Velocidad',res:'Resistencia',lid:'Liderazgo',con:'Regularidad',gra:'Partidos grandes'};
export const AT_SH={tir:'REM',pas:'PAS',reg:'REG',def:'ENT',fis:'FUE',por:'POR',cab:'CAB',vis:'VIS',col:'COL',dec:'DEC',vel:'VEL',res:'RES',lid:'LID',con:'REGU',gra:'GRA'};
export const AT_GROUPS=[['Técnica',['tir','pas','reg','cab','def']],['Mental',['vis','col','dec','lid','con','gra']],['Física',['vel','res','fis']],['Portero',['por']]];
/** Columnas que se ven en las tablas (la ficha enseña todos). */
export const AT_COLS=['tir','pas','reg','def','vel','fis','por'];
/** Atributos que cambian con la edad como los físicos (pierden antes) o los mentales (mejoran hasta tarde). */
export const AT_PHYS=['vel','res','fis'],AT_MENT=['vis','col','dec','lid','con','gra'];
/** Peso de cada atributo en la media según la línea (suman 1). */
export const W={POR:{por:.62,col:.12,dec:.1,pas:.08,fis:.04,vel:.04},
 DEF:{def:.3,col:.18,cab:.12,fis:.1,vel:.1,dec:.08,pas:.08,res:.04},
 MED:{pas:.26,vis:.16,dec:.12,reg:.1,res:.1,def:.08,col:.06,tir:.06,fis:.06},
 DEL:{tir:.3,reg:.14,col:.12,vel:.12,cab:.1,dec:.08,fis:.08,vis:.06}};
/** Pesos antiguos (6 atributos), para convertir partidas sin cambiar la media de nadie. */
export const W_OLD={POR:{por:.75,fis:.15,pas:.1},DEF:{def:.55,fis:.25,pas:.15,reg:.05},MED:{pas:.4,reg:.2,def:.15,tir:.1,fis:.15},DEL:{tir:.5,reg:.25,fis:.15,pas:.1}};
export const SPEEDS={1:650,2:300,4:110,9:1600}; // 9 = solo jugadas clave
export const TX={
 goal:['¡GOOOL de {p}! Remate cruzado, imposible para el portero.','¡Gol! {p} la empuja a la red tras un centro desde la banda.','¡Golazo de {p} desde fuera del área, a la escuadra!','¡{p} no perdona en el mano a mano!','¡Gol de cabeza de {p} a la salida de un córner!','¡Gol! {p} aprovecha un rechace dentro del área.','¡{p} define con clase por encima del portero!'],
 miss:['{p} dispara alto desde la frontal.','Ocasión clara para {p}, pero el balón se marcha rozando el palo.','{p} prueba desde lejos. Fuera.','Cabezazo de {p} que se va desviado.','{p} se queda solo y la manda a la grada.'],
 post:['¡Al palo! {p} estuvo a centímetros del gol.','¡Larguero! El disparo de {p} hace temblar la portería.'],
 save:['Paradón de {g} a disparo de {p}.','{g} atrapa sin problemas el tiro de {p}.','{g} despeja a córner un remate de {p}.','Mano salvadora de {g} ante {p}.'],
 yellow:['Amarilla para {p} por una entrada a destiempo.','{p} ve la amarilla por protestar.','Tarjeta amarilla a {p} por cortar un contragolpe.'],
};
