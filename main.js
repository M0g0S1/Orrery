const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d', { alpha: false });

// Overlay canvas for tribes, borders, labels
const overlayCanvas = document.createElement('canvas');
const overlayCtx = overlayCanvas.getContext('2d', { alpha: true });

const MAP_WIDTH = 2048;
const MAP_HEIGHT = 1024;

const camera = {
  x: 0,
  y: 0,
  zoom: 1.0,
  targetZoom: 1.0,
  minZoom: 0.5,
  maxZoom: 4.0,
  moveSpeed: 20 // pixels per frame
};

// Keyboard state
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
  ArrowRight: false
};

let planetData = null;
let basePlanetTexture = null;
let worldRng = null;
let worldNoise = null;

// ============================================
// NAME GENERATION (VASTLY EXPANDED)
// ============================================
const nameData = {
  // Tribe name prefixes (expanded from ~10 to 100+)
  tribePrefixes: [
    'Red', 'Blue', 'Green', 'White', 'Black', 'Grey', 'Golden', 'Silver', 'Bronze',
    'Iron', 'Stone', 'Wind', 'River', 'Mountain', 'Forest', 'Desert', 'Snow', 'Fire',
    'Water', 'Thunder', 'Storm', 'Cloud', 'Sun', 'Moon', 'Star', 'Sky', 'Ocean',
    'Sea', 'Lake', 'Valley', 'Hill', 'Peak', 'Cliff', 'Canyon', 'Marsh', 'Swamp',
    'Grass', 'Sand', 'Dust', 'Ash', 'Frost', 'Ice', 'Flame', 'Ember', 'Spark',
    'Dawn', 'Dusk', 'Shadow', 'Light', 'Dark', 'Bright', 'Pale', 'Deep', 'High',
    'Low', 'Far', 'Near', 'Ancient', 'Old', 'Young', 'New', 'First', 'Last',
    'Wild', 'Free', 'Proud', 'Strong', 'Swift', 'Wise', 'Brave', 'Bold', 'Fierce',
    'Silent', 'Loud', 'Hidden', 'Open', 'Sacred', 'Holy', 'Blessed', 'Cursed',
    'Eagle', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Raven', 'Crow', 'Owl', 'Tiger',
    'Lion', 'Panther', 'Deer', 'Elk', 'Bison', 'Buffalo', 'Mammoth', 'Serpent',
    'Dragon', 'Phoenix', 'Turtle', 'Salmon', 'Whale', 'Shark', 'Dolphin', 'Otter',
    'Beaver', 'Badger', 'Raccoon', 'Lynx', 'Coyote', 'Jaguar', 'Leopard', 'Cheetah',
    'Rhino', 'Elephant', 'Horse', 'Caribou', 'Moose', 'Antelope', 'Gazelle'
  ],

  tribeSuffixes: [
    'Walkers', 'Runners', 'Hunters', 'Gatherers', 'Warriors', 'Riders', 'Wanderers',
    'Nomads', 'Dwellers', 'People', 'Clan', 'Tribe', 'Band', 'Group', 'Folk',
    'Kin', 'Children', 'Sons', 'Daughters', 'Born', 'Bound', 'Keepers', 'Watchers',
    'Seekers', 'Finders', 'Makers', 'Builders', 'Crafters', 'Shapers', 'Weavers',
    'Singers', 'Dancers', 'Dreamers', 'Seers', 'Speakers', 'Tellers', 'Listeners',
    'Trackers', 'Scouts', 'Guards', 'Defenders', 'Protectors', 'Raiders', 'Rovers',
    'Striders', 'Stalkers', 'Prowlers', 'Climbers', 'Jumpers', 'Swimmers', 'Divers',
    'Fishers', 'Planters', 'Herders', 'Shepherds', 'Tamers', 'Breeders', 'Carvers',
    'Painters', 'Potters', 'Smiths', 'Forgers', 'Miners', 'Diggers', 'Cutters'
  ],

  // City/Civilization name components (expanded from ~20 to 150+)
  cityPrefixes: [
    'Ak', 'Al', 'An', 'Ar', 'As', 'Ba', 'Be', 'Bra', 'Ca', 'Ce', 'Cha', 'Da', 'De',
    'Dra', 'El', 'En', 'Er', 'Es', 'Fa', 'Fe', 'Ga', 'Ge', 'Gra', 'Ha', 'He', 'Il',
    'In', 'Ir', 'Ka', 'Ke', 'Kha', 'Ki', 'Ko', 'Kra', 'La', 'Le', 'Li', 'Lo', 'Lu',
    'Ma', 'Me', 'Mi', 'Mo', 'Mu', 'Na', 'Ne', 'Ni', 'No', 'Nu', 'Nya', 'O', 'Pa',
    'Pe', 'Phi', 'Pra', 'Qa', 'Qi', 'Ra', 'Re', 'Rha', 'Ri', 'Ro', 'Sa', 'Se', 'Sha',
    'Si', 'So', 'Sta', 'Ta', 'Te', 'Tha', 'Ti', 'To', 'Tra', 'Tsa', 'Ua', 'Ul', 'Um',
    'Un', 'Ur', 'Us', 'Va', 'Ve', 'Vi', 'Vo', 'Vra', 'Wa', 'We', 'Wi', 'Xa', 'Xe',
    'Ya', 'Ye', 'Yi', 'Za', 'Ze', 'Zha', 'Zi', 'Zo', 'Zu',
    // Additional exotic combinations
    'Aer', 'Aes', 'Aur', 'Bel', 'Bor', 'Cor', 'Cyr', 'Dal', 'Dor', 'Dul', 'Eir',
    'Eor', 'Far', 'Fel', 'Fir', 'Gar', 'Gil', 'Gol', 'Hal', 'Har', 'Hel', 'Hor',
    'Ial', 'Ior', 'Jal', 'Jor', 'Kal', 'Kar', 'Kel', 'Ker', 'Kir', 'Kor', 'Kul',
    'Kur', 'Lal', 'Lar', 'Lir', 'Lor', 'Lur', 'Mal', 'Mar', 'Mel', 'Mer', 'Mir',
    'Mor', 'Mul', 'Mur', 'Nal', 'Nar', 'Nel', 'Ner', 'Nil', 'Nor', 'Nul', 'Nur'
  ],

  citySuffixes: [
    'ad', 'ak', 'al', 'an', 'ar', 'as', 'at', 'ax', 'ath', 'ba', 'bek', 'ben', 'ber',
    'beth', 'bor', 'ca', 'cath', 'chan', 'che', 'chi', 'cor', 'da', 'dan', 'dar', 'dek',
    'del', 'den', 'dor', 'dus', 'ea', 'ech', 'ed', 'ek', 'el', 'em', 'en', 'er', 'es',
    'eth', 'fa', 'fal', 'fan', 'fer', 'fin', 'fir', 'for', 'ga', 'gan', 'gar', 'gen',
    'ger', 'gis', 'gol', 'gon', 'gor', 'grad', 'grim', 'ha', 'had', 'ham', 'han', 'har',
    'has', 'haven', 'helm', 'hold', 'ia', 'ian', 'iar', 'ias', 'ica', 'ich', 'ida',
    'idon', 'il', 'ila', 'im', 'in', 'ion', 'ir', 'is', 'ith', 'ka', 'kan', 'kar',
    'kas', 'kath', 'ken', 'kor', 'la', 'lan', 'lar', 'las', 'lath', 'len', 'lin', 'lis',
    'lon', 'lor', 'los', 'lum', 'lun', 'lus', 'ma', 'mal', 'man', 'mar', 'mas', 'mel',
    'mer', 'mes', 'meth', 'mir', 'mis', 'mon', 'mor', 'mos', 'mul', 'mun', 'mus', 'na',
    'nad', 'nal', 'nam', 'nan', 'nar', 'nas', 'nath', 'nel', 'nia', 'nis', 'nok', 'nor',
    'nos', 'num', 'nus', 'nya', 'oa', 'onas', 'on', 'or', 'os', 'oth', 'pa', 'pan',
    'par', 'pel', 'pen', 'per', 'pha', 'phen', 'pol', 'por', 'qa', 'qar', 'qin', 'ra',
    'rad', 'ral', 'ran', 'ras', 'rath', 'rel', 'ren', 'res', 'reth', 'ria', 'rin', 'ris',
    'ron', 'ros', 'rum', 'rus', 'ryn'
  ],

  // Civilization name components (NEW - doesn't use "Civilization" suffix)
  civPrefixes: [
    'Aeg', 'Aer', 'Aet', 'Alb', 'Ald', 'Ale', 'Alt', 'Amb', 'Ang', 'Ant', 'Aqu',
    'Arc', 'Ard', 'Arg', 'Arm', 'Asc', 'Ast', 'Ath', 'Atl', 'Aur', 'Aus', 'Ava',
    'Axi', 'Azo', 'Bal', 'Bar', 'Bat', 'Bel', 'Ben', 'Ber', 'Bor', 'Bra', 'Bri',
    'Bru', 'Bul', 'Bur', 'Byz', 'Cal', 'Cam', 'Can', 'Cap', 'Car', 'Cas', 'Cat',
    'Cel', 'Cer', 'Cha', 'Che', 'Chi', 'Cim', 'Cla', 'Col', 'Con', 'Cor', 'Cre',
    'Cro', 'Cyr', 'Dac', 'Dal', 'Dam', 'Dan', 'Dar', 'Del', 'Den', 'Dor', 'Dra',
    'Dur', 'Ebe', 'Ech', 'Egy', 'Ela', 'Elb', 'Elv', 'Epi', 'Ere', 'Eri', 'Eth',
    'Etr', 'Fal', 'Far', 'Fen', 'Fer', 'Fla', 'For', 'Fra', 'Fri', 'Gal', 'Gar',
    'Gau', 'Gel', 'Ger', 'Gil', 'Gol', 'Got', 'Gra', 'Gre', 'Gue', 'Had', 'Haf',
    'Hal', 'Han', 'Har', 'Has', 'Hel', 'Her', 'Het', 'Hib', 'Hip', 'Hit', 'Hol',
    'Hum', 'Hun', 'Hur', 'Hyb', 'Hyk', 'Hyr', 'Ibe', 'Ice', 'Idy', 'Ila', 'Ily',
    'Ind', 'Ion', 'Ira', 'Isa', 'Isl', 'Isr', 'Ist', 'Ita', 'Jav', 'Jer', 'Jud',
    'Jul', 'Jut', 'Kab', 'Kad', 'Kal', 'Kam', 'Kar', 'Kas', 'Kel', 'Kha', 'Khi',
    'Kho', 'Khy', 'Kin', 'Kol', 'Kor', 'Kur', 'Kus', 'Lab', 'Lac', 'Lam', 'Lan',
    'Lar', 'Lat', 'Lau', 'Lec', 'Led', 'Lem', 'Leo', 'Les', 'Let', 'Lev', 'Lib',
    'Lic', 'Lig', 'Lin', 'Lit', 'Liv', 'Lom', 'Lon', 'Lor', 'Lot', 'Luc', 'Lug',
    'Lus', 'Lut', 'Lyc', 'Lyd', 'Mac', 'Mad', 'Mag', 'Mal', 'Man', 'Mar', 'Mas',
    'Mau', 'Max', 'Med', 'Meg', 'Mel', 'Mem', 'Men', 'Mer', 'Mes', 'Met', 'Mid',
    'Mil', 'Min', 'Mit', 'Moe', 'Mol', 'Mon', 'Mor', 'Mos', 'Mug', 'Mur', 'Myc',
    'Myr', 'Nab', 'Nap', 'Nar', 'Nas', 'Nav', 'Nax', 'Nea', 'Neb', 'Nem', 'Neo',
    'Ner', 'Nes', 'Nev', 'Nic', 'Nil', 'Nin', 'Nip', 'Nor', 'Nov', 'Nub', 'Num',
    'Nym', 'Oce', 'Odo', 'Oen', 'Oly', 'Oph', 'Ora', 'Orc', 'Ore', 'Ori', 'Oro',
    'Ors', 'Ost', 'Ott', 'Pac', 'Pal', 'Pan', 'Pap', 'Par', 'Pat', 'Pau', 'Pax',
    'Pel', 'Per', 'Pet', 'Pha', 'Phe', 'Phi', 'Pho', 'Phr', 'Pic', 'Pis', 'Pit',
    'Pla', 'Ple', 'Pol', 'Pom', 'Pon', 'Por', 'Pos', 'Pot', 'Pra', 'Pri', 'Pro',
    'Pru', 'Pto', 'Pun', 'Pyr', 'Qad', 'Qar', 'Qat', 'Que', 'Qui', 'Quo', 'Rab',
    'Rae', 'Rag', 'Ram', 'Rav', 'Rax', 'Rea', 'Red', 'Reg', 'Rha', 'Rhe', 'Rho',
    'Ric', 'Rif', 'Rig', 'Rim', 'Rin', 'Riv', 'Roa', 'Rod', 'Rom', 'Ros', 'Rot',
    'Rub', 'Rud', 'Rus', 'Rut', 'Sab', 'Sac', 'Sad', 'Sag', 'Sah', 'Sal', 'Sam',
    'San', 'Sar', 'Sat', 'Sau', 'Sav', 'Sax', 'Sca', 'Sce', 'Sci', 'Sco', 'Scy',
    'Seb', 'Sed', 'Seg', 'Sel', 'Sem', 'Sen', 'Sep', 'Ser', 'Set', 'Sev', 'Sib',
    'Sic', 'Sid', 'Sie', 'Sig', 'Sil', 'Sin', 'Sir', 'Sis', 'Sit', 'Ska', 'Sla',
    'Slo', 'Smy', 'Sob', 'Soc', 'Sog', 'Sol', 'Som', 'Sor', 'Spa', 'Spe', 'Sph',
    'Spo', 'Sta', 'Ste', 'Sto', 'Str', 'Stu', 'Sty', 'Sub', 'Sud', 'Sue', 'Sug',
    'Sul', 'Sum', 'Sun', 'Sur', 'Sus', 'Swa', 'Swe', 'Swi', 'Syb', 'Syd', 'Syl',
    'Sym', 'Syn', 'Syr', 'Tab', 'Tac', 'Tad', 'Tae', 'Taj', 'Tal', 'Tam', 'Tan',
    'Tap', 'Tar', 'Tas', 'Tat', 'Tau', 'Tax', 'Teb', 'Tec', 'Teg', 'Tel', 'Tem',
    'Ten', 'Ter', 'Tet', 'Teu', 'Tex', 'Tha', 'The', 'Thi', 'Tho', 'Thr', 'Thu',
    'Thy', 'Tib', 'Tic', 'Tid', 'Til', 'Tim', 'Tin', 'Tir', 'Tit', 'Tiv', 'Tob',
    'Toc', 'Tog', 'Tol', 'Tom', 'Ton', 'Top', 'Tor', 'Tot', 'Tou', 'Tow', 'Tra',
    'Tre', 'Tri', 'Tro', 'Tru', 'Tsa', 'Tse', 'Tsi', 'Tso', 'Tsu', 'Tua', 'Tub',
    'Tuc', 'Tud', 'Tug', 'Tul', 'Tum', 'Tun', 'Tur', 'Tus', 'Tut', 'Tyl', 'Tyn',
    'Tyr', 'Ubi', 'Udo', 'Ufa', 'Uga', 'Uju', 'Ula', 'Ule', 'Uli', 'Ulo', 'Ulu',
    'Uma', 'Umb', 'Ume', 'Umi', 'Umu', 'Una', 'Und', 'Une', 'Ung', 'Uni', 'Uno',
    'Upa', 'Upe', 'Uph', 'Upo', 'Ura', 'Urb', 'Urc', 'Urd', 'Ure', 'Urg', 'Uri',
    'Urn', 'Uro', 'Urr', 'Urs', 'Uru', 'Usa', 'Use', 'Ush', 'Usk', 'Uso', 'Ust',
    'Uta', 'Ute', 'Uth', 'Uto', 'Utr', 'Uts', 'Utu', 'Uva', 'Uve', 'Uvi', 'Uvo',
    'Uvu', 'Uza', 'Uze', 'Uzi', 'Uzo', 'Uzu'
  ],

  civSuffixes: [
    'ia', 'nia', 'aria', 'eria', 'uria', 'oria', 'yria', 'sia', 'tia', 'lia', 'ria',
    'an', 'ian', 'ean', 'yan', 'lan', 'ran', 'stan', 'tan', 'van', 'wan',
    'and', 'land', 'eland', 'oland', 'uland', 'yland',
    'ia', 'ica', 'ina', 'isa', 'ita', 'iva', 'iza',
    'os', 'ios', 'aos', 'eos', 'uos', 'yos',
    'um', 'ium', 'eum', 'uum', 'yum',
    'is', 'is', 'ais', 'eis', 'ois', 'uis',
    'es', 'ies', 'aes', 'ees', 'oes', 'ues',
    'on', 'ion', 'aon', 'eon', 'yon',
    'ar', 'iar', 'ear', 'uar', 'yar',
    'or', 'ior', 'eor', 'uor', 'yor',
    'us', 'ius', 'eus', 'uus', 'yus',
    'en', 'ien', 'aen', 'een', 'uen',
    'el', 'iel', 'ael', 'eel', 'uel',
    'al', 'ial', 'eal', 'ual', 'yal',
    'ond', 'iond', 'eond', 'uond', 'yond',
    'arn', 'iarn', 'earn', 'uarn', 'yarn',
    'ern', 'iern', 'aern', 'uern', 'yern',
    'orn', 'iorn', 'aorn', 'eorn', 'uorn',
    'ax', 'iax', 'eax', 'uax', 'yax',
    'ex', 'iex', 'aex', 'uex', 'yex',
    'ix', 'aix', 'eix', 'uix', 'yix',
    'ox', 'iox', 'aox', 'eox', 'uox',
    'ux', 'iux', 'aux', 'eux', 'yux',
    'esh', 'iesh', 'aesh', 'eesh', 'uesh',
    'ash', 'iash', 'eash', 'uash', 'yash',
    'osh', 'iosh', 'aosh', 'eosh', 'uosh',
    'ush', 'iush', 'aush', 'eush', 'yush',
    'eth', 'ieth', 'aeth', 'eeth', 'ueth',
    'ath', 'iath', 'eath', 'uath', 'yath',
    'oth', 'ioth', 'aoth', 'eoth', 'uoth'
  ],

  // Leader name components (expanded)
  leaderFirstNames: [
    'Alaric', 'Baldwin', 'Cedric', 'Darius', 'Edmund', 'Felix', 'Gareth', 'Harald',
    'Ivan', 'Julius', 'Konrad', 'Leopold', 'Magnus', 'Nero', 'Otto', 'Perseus',
    'Quintus', 'Ragnar', 'Sigurd', 'Titus', 'Ulric', 'Victor', 'Werner', 'Xavier',
    'Yuri', 'Zeno', 'Adrian', 'Brutus', 'Cassius', 'Draco', 'Erik', 'Friedrich',
    'Gustav', 'Henrik', 'Igor', 'Johan', 'Karl', 'Ludwig', 'Mikhail', 'Nikolas',
    'Odin', 'Pavel', 'Quintilian', 'Rudolf', 'Stefan', 'Theodor', 'Ulysses', 'Valerius',
    'Wilhelm', 'Xerxes', 'Yaroslav', 'Zacharias', 'Aetius', 'Boris', 'Constantine',
    'Dimitri', 'Erasmus', 'Flavius', 'Gregorius', 'Hector', 'Ignatius', 'Justinian',
    'Konstantin', 'Leonidas', 'Maximus', 'Nero', 'Octavius', 'Pontius', 'Quintus',
    'Romulus', 'Severus', 'Tiberius', 'Urbanus', 'Valentinian', 'Wulfric', 'Xander',
    // Female names
    'Aelia', 'Beatrix', 'Claudia', 'Diana', 'Eleanor', 'Freya', 'Guinevere', 'Helena',
    'Irene', 'Julia', 'Katarina', 'Livia', 'Morgana', 'Natalia', 'Octavia', 'Priscilla',
    'Quintessa', 'Regina', 'Sabina', 'Tatiana', 'Ursula', 'Valentina', 'Wilhelmina',
    'Xenia', 'Yvonne', 'Zenobia', 'Anastasia', 'Brigitte', 'Cassandra', 'Drusilla',
    'Elara', 'Felicia', 'Giselle', 'Hypatia', 'Isolde', 'Josephine', 'Kassandra',
    'Lucretia', 'Marcella', 'Nora', 'Ophelia', 'Perpetua', 'Quintina', 'Rowena',
    'Seraphina', 'Theodora', 'Ulrika', 'Victoria', 'Winifred', 'Xiomara', 'Yasmin', 'Zara'
  ],

  leaderTitles: [
    'the Great', 'the Wise', 'the Bold', 'the Brave', 'the Just', 'the Terrible',
    'the Conqueror', 'the Builder', 'the Diplomat', 'the Defender', 'the Unifier',
    'the Merciful', 'the Cruel', 'the Pious', 'the Scholar', 'the Warrior',
    'the Reformer', 'the Lawgiver', 'the Navigator', 'the Explorer', 'the Liberator',
    'the Iron', 'the Golden', 'the Silver', 'the Bronze', 'the Strong', 'the Swift',
    'the Silent', 'the Eloquent', 'the Patient', 'the Restless', 'the Ambitious',
    'the Cautious', 'the Fearless', 'the Noble', 'the Common', 'the Young',
    'the Old', 'the First', 'the Last', 'the Elder', 'the Younger', 'the Fair',
    'the Dark', 'the Red', 'the White', 'the Black', 'the Blessed', 'the Cursed',
    'the Holy', 'the Unholy', 'the Righteous', 'the Wicked', 'the Mad', 'the Sane'
  ],

  // City name components (more variety)
  cityMiddles: [
    '', '', '', '', 'a', 'e', 'i', 'o', 'u', 'ar', 'er', 'or', 'an', 'en', 'on',
    'al', 'el', 'il', 'ol', 'ul', 'am', 'em', 'im', 'om', 'um', 'at', 'et', 'it', 'ot', 'ut'
  ]
};

function pickRandom(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

function generateTribeName(rng = Math.random) {
  const prefix = pickRandom(nameData.tribePrefixes, rng);
  const suffix = pickRandom(nameData.tribeSuffixes, rng);
  return `${prefix} ${suffix}`;
}

function generateCityName(rng = Math.random) {
  const prefix = pickRandom(nameData.cityPrefixes, rng);
  const middle = pickRandom(nameData.cityMiddles, rng);
  const suffix = pickRandom(nameData.citySuffixes, rng);
  return prefix + middle + suffix;
}

// NEW: Generate civilization names WITHOUT "Civilization" suffix
function generateCivilizationName(rng = Math.random) {
  const prefix = pickRandom(nameData.civPrefixes, rng);
  const suffix = pickRandom(nameData.civSuffixes, rng);
  return prefix + suffix;
}

function generateLeaderName(rng = Math.random) {
  const first = pickRandom(nameData.leaderFirstNames, rng);
  const useTitle = rng() > 0.4;
  if (useTitle) {
    const title = pickRandom(nameData.leaderTitles, rng);
    return `${first} ${title}`;
  }
  return first;
}

// ============================================
// SEEDED RNG
// ============================================
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ============================================
// SIMPLEX NOISE
// ============================================
class SimplexNoise {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this.p = [];
    const seedRng = mulberry32(seed);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seedRng() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    this.p = this.p.concat(this.p);
  }

  dot2(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  noise2D(x, y) {
    const grad3 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    let n0, n1, n2;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.p[ii + this.p[jj]] % 8;
    const gi1 = this.p[ii + i1 + this.p[jj + j1]] % 8;
    const gi2 = this.p[ii + 1 + this.p[jj + 1]] % 8;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot2(grad3[gi0], x0, y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot2(grad3[gi1], x1, y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot2(grad3[gi2], x2, y2);
    }
    return 70.0 * (n0 + n1 + n2);
  }
}

// ============================================
// PLANET GENERATION
// ============================================
function generatePlanetData(seed, progressCallback) {
  const rng = mulberry32(seed);
  const noise = new SimplexNoise(seed);

  const width = MAP_WIDTH;
  const height = MAP_HEIGHT;

  const data = {
    width,
    height,
    elevation: new Float32Array(width * height),
    moisture: new Float32Array(width * height),
    temperature: new Float32Array(width * height),
    biome: new Uint8Array(width * height),
    river: new Uint8Array(width * height),
    seed
  };

  const scale = 0.003;
  const octaves = 6;
  const persistence = 0.5;
  const lacunarity = 2.0;

  // Elevation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let amplitude = 1.0;
      let frequency = 1.0;
      let value = 0;
      for (let o = 0; o < octaves; o++) {
        const sampleX = x * scale * frequency;
        const sampleY = y * scale * frequency;
        const n = noise.noise2D(sampleX, sampleY);
        value += n * amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }
      const latFactor = Math.abs((y / height) - 0.5) * 2;
      const polarPenalty = Math.pow(latFactor, 1.5) * 0.3;
      value -= polarPenalty;
      data.elevation[y * width + x] = value;
    }
    if (y % 50 === 0) {
      const pct = (y / height) * 33;
      progressCallback(pct, 'Generating elevation...');
    }
  }

  // Moisture
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let amplitude = 1.0;
      let frequency = 1.0;
      let value = 0;
      for (let o = 0; o < 4; o++) {
        const sampleX = (x + 1000) * scale * frequency;
        const sampleY = (y + 1000) * scale * frequency;
        const n = noise.noise2D(sampleX, sampleY);
        value += n * amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }
      data.moisture[y * width + x] = value;
    }
    if (y % 50 === 0) {
      const pct = 33 + (y / height) * 33;
      progressCallback(pct, 'Generating moisture...');
    }
  }

  // Temperature
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const latFactor = Math.abs((y / height) - 0.5) * 2;
      const baseTemp = 1.0 - latFactor;
      const elev = data.elevation[y * width + x];
      const elevPenalty = Math.max(0, elev - 0.1) * 0.5;
      let temp = baseTemp - elevPenalty;
      const n = noise.noise2D(x * 0.01, y * 0.01) * 0.1;
      temp += n;
      data.temperature[y * width + x] = temp;
    }
    if (y % 50 === 0) {
      const pct = 66 + (y / height) * 33;
      progressCallback(pct, 'Generating temperature...');
    }
  }

  // Biomes
  const BIOME_OCEAN = 0;
  const BIOME_COAST = 1;
  const BIOME_DESERT = 2;
  const BIOME_GRASSLAND = 3;
  const BIOME_FOREST = 4;
  const BIOME_TUNDRA = 5;
  const BIOME_SNOW = 6;
  const BIOME_MOUNTAIN = 7;

  for (let i = 0; i < width * height; i++) {
    const e = data.elevation[i];
    const m = data.moisture[i];
    const t = data.temperature[i];

    if (e < -0.05) {
      data.biome[i] = BIOME_OCEAN;
    } else if (e < 0.0) {
      data.biome[i] = BIOME_COAST;
    } else if (e > 0.6) {
      data.biome[i] = BIOME_MOUNTAIN;
    } else if (t < 0.2) {
      data.biome[i] = BIOME_SNOW;
    } else if (t < 0.4) {
      data.biome[i] = BIOME_TUNDRA;
    } else if (m < -0.2) {
      data.biome[i] = BIOME_DESERT;
    } else if (m < 0.1) {
      data.biome[i] = BIOME_GRASSLAND;
    } else {
      data.biome[i] = BIOME_FOREST;
    }
  }

  progressCallback(100, 'World generated!');
  return data;
}

function renderPlanetTexture(data) {
  const canvas = document.createElement('canvas');
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext('2d', { alpha: false });
  const imgData = ctx.createImageData(data.width, data.height);

  const colors = {
    0: [20, 40, 80],    // ocean
    1: [70, 90, 110],   // coast
    2: [210, 180, 100], // desert
    3: [100, 140, 80],  // grassland
    4: [40, 80, 40],    // forest
    5: [120, 120, 100], // tundra
    6: [240, 240, 250], // snow
    7: [100, 100, 100]  // mountain
  };

  for (let i = 0; i < data.biome.length; i++) {
    const b = data.biome[i];
    const c = colors[b];
    const offset = i * 4;
    imgData.data[offset] = c[0];
    imgData.data[offset + 1] = c[1];
    imgData.data[offset + 2] = c[2];
    imgData.data[offset + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// ============================================
// GAME STATE
// ============================================
let year = 0;
let tribes = [];
let countries = [];
let events = [];
let gameSpeed = 2;
const speedMultipliers = [0, 1, 5, 20, 100];

// EXPANSION LIMITS
const TRIBE_MAX_TERRITORY = 25;  // Tribes can't expand beyond this many tiles
const CIVILIZATION_TERRITORY_THRESHOLD = 50; // When a tribe becomes a civilization

class Tribe {
  constructor(x, y, id) {
    this.id = id;
    this.name = generateTribeName(worldRng);
    this.x = x;
    this.y = y;
    this.population = 50 + Math.floor(worldRng() * 150);
    this.territory = [{ x, y }];
    this.color = `hsl(${Math.floor(worldRng() * 360)}, 70%, 60%)`;
    this.growthRate = 0.02 + worldRng() * 0.03;
  }

  // FIX 4: Tribes can't expand too far
  canExpand() {
    return this.territory.length < TRIBE_MAX_TERRITORY;
  }

  expand() {
    if (!this.canExpand()) return;
    
    const candidates = [];
    for (const tile of this.territory) {
      const neighbors = [
        { x: tile.x - 1, y: tile.y },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x, y: tile.y + 1 }
      ];
      for (const n of neighbors) {
        if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) continue;
        const idx = n.y * MAP_WIDTH + n.x;
        const biome = planetData.biome[idx];
        if (biome === 0) continue; // Skip ocean

        // FIX 3: Check if territory is already claimed
        const isOccupied = this.territory.some(t => t.x === n.x && t.y === n.y) ||
                          tribes.some(tribe => tribe !== this && tribe.territory.some(t => t.x === n.x && t.y === n.y)) ||
                          countries.some(country => country.territory.some(t => t.x === n.x && t.y === n.y));
        
        if (!isOccupied) {
          candidates.push(n);
        }
      }
    }

    if (candidates.length > 0) {
      const chosen = pickRandom(candidates, worldRng);
      this.territory.push(chosen);
    }
  }

  update() {
    this.population *= (1 + this.growthRate);
    if (worldRng() < 0.02 && this.canExpand()) {
      this.expand();
    }

    // Convert to civilization if territory is large enough
    if (this.territory.length >= CIVILIZATION_TERRITORY_THRESHOLD) {
      this.becomeCivilization();
    }
  }

  becomeCivilization() {
    const civ = new Country(this.x, this.y, countries.length, this);
    countries.push(civ);
    addEvent(`${this.name} has formed ${civ.name}!`);
    const idx = tribes.indexOf(this);
    if (idx !== -1) tribes.splice(idx, 1);
  }
}

class Country {
  constructor(x, y, id, fromTribe = null) {
    this.id = id;
    if (fromTribe) {
      // FIX 1: Use new civilization name generator instead of adding "Civilization"
      this.name = generateCivilizationName(worldRng);
      this.territory = [...fromTribe.territory];
      this.population = fromTribe.population;
      this.color = fromTribe.color;
    } else {
      this.name = generateCivilizationName(worldRng);
      this.territory = [{ x, y }];
      this.population = 500 + Math.floor(worldRng() * 1000);
      this.color = `hsl(${Math.floor(worldRng() * 360)}, 70%, 50%)`;
    }
    this.capital = { x, y, name: generateCityName(worldRng) };
    this.cities = [this.capital];
    this.government = 'Tribal Council';
    this.leader = {
      name: generateLeaderName(worldRng),
      aggression: worldRng(),
      caution: worldRng(),
      diplomacy: worldRng(),
      ambition: worldRng()
    };
    this.growthRate = 0.03 + worldRng() * 0.04;
  }

  expand() {
    const candidates = [];
    for (const tile of this.territory) {
      const neighbors = [
        { x: tile.x - 1, y: tile.y },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x, y: tile.y + 1 }
      ];
      for (const n of neighbors) {
        if (n.x < 0 || n.x >= MAP_WIDTH || n.y < 0 || n.y >= MAP_HEIGHT) continue;
        const idx = n.y * MAP_WIDTH + n.x;
        const biome = planetData.biome[idx];
        if (biome === 0) continue;

        // FIX 3: Check if territory is already claimed
        const isOccupied = this.territory.some(t => t.x === n.x && t.y === n.y) ||
                          countries.some(country => country !== this && country.territory.some(t => t.x === n.x && t.y === n.y)) ||
                          tribes.some(tribe => tribe.territory.some(t => t.x === n.x && t.y === n.y));
        
        if (!isOccupied) {
          candidates.push(n);
        }
      }
    }

    if (candidates.length > 0) {
      const chosen = pickRandom(candidates, worldRng);
      this.territory.push(chosen);

      // Maybe found a new city
      if (worldRng() < 0.01 && this.cities.length < 10) {
        const cityName = generateCityName(worldRng);
        this.cities.push({ x: chosen.x, y: chosen.y, name: cityName });
        addEvent(`${this.name} founded the city of ${cityName}.`);
      }
    }
  }

  update() {
    this.population *= (1 + this.growthRate);
    if (worldRng() < 0.05) {
      this.expand();
    }
  }
}

function spawnInitialTribes(count) {
  for (let i = 0; i < count; i++) {
    let x, y, biome;
    let attempts = 0;
    do {
      x = Math.floor(worldRng() * MAP_WIDTH);
      y = Math.floor(worldRng() * MAP_HEIGHT);
      biome = planetData.biome[y * MAP_WIDTH + x];
      attempts++;
    } while ((biome === 0 || biome === 7) && attempts < 100);

    if (biome !== 0 && biome !== 7) {
      const tribe = new Tribe(x, y, tribes.length);
      tribes.push(tribe);
    }
  }
  addEvent(`${tribes.length} tribes have emerged across the world.`);
}

// ============================================
// EVENTS
// ============================================
function addEvent(message) {
  events.push({ year, message });
  if (events.length > 100) events.shift();
  updateEventLog();
}

function updateEventLog() {
  const logEl = document.getElementById('eventLog');
  logEl.innerHTML = '';
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `
      <span class="event-year">Year ${e.year}</span>
      <span class="event-message">${e.message}</span>
    `;
    logEl.appendChild(item);
  }
}

// ============================================
// RENDER
// ============================================
function drawMap() {
  if (!basePlanetTexture) return;

  const cw = mapCanvas.width;
  const ch = mapCanvas.height;

  mapCtx.save();
  mapCtx.setTransform(1, 0, 0, 1, 0, 0);
  mapCtx.clearRect(0, 0, cw, ch);
  mapCtx.restore();

  mapCtx.save();
  mapCtx.translate(-camera.x, -camera.y);
  mapCtx.scale(camera.zoom, camera.zoom);
  mapCtx.drawImage(basePlanetTexture, 0, 0, MAP_WIDTH, MAP_HEIGHT);
  mapCtx.restore();

  overlayCtx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // Draw tribe territories
  for (const tribe of tribes) {
    overlayCtx.fillStyle = tribe.color + '80';
    for (const tile of tribe.territory) {
      overlayCtx.fillRect(tile.x, tile.y, 1, 1);
    }
  }

  // Draw country territories
  for (const country of countries) {
    overlayCtx.fillStyle = country.color + '80';
    for (const tile of country.territory) {
      overlayCtx.fillRect(tile.x, tile.y, 1, 1);
    }
  }

  // Draw cities
  overlayCtx.fillStyle = '#ffffff';
  for (const country of countries) {
    for (const city of country.cities) {
      overlayCtx.fillRect(city.x - 1, city.y - 1, 3, 3);
    }
  }

  mapCtx.save();
  mapCtx.translate(-camera.x, -camera.y);
  mapCtx.scale(camera.zoom, camera.zoom);
  mapCtx.drawImage(overlayCanvas, 0, 0);
  mapCtx.restore();
}

function updateCamera() {
  const speed = camera.moveSpeed / camera.zoom;
  if (keys.w || keys.ArrowUp) camera.y -= speed;
  if (keys.s || keys.ArrowDown) camera.y += speed;
  if (keys.a || keys.ArrowLeft) camera.x -= speed;
  if (keys.d || keys.ArrowRight) camera.x += speed;

  const zoomSpeed = 0.05;
  if (camera.zoom !== camera.targetZoom) {
    const diff = camera.targetZoom - camera.zoom;
    camera.zoom += diff * zoomSpeed;
    if (Math.abs(diff) < 0.001) camera.zoom = camera.targetZoom;
  }

  const maxX = MAP_WIDTH * camera.zoom - mapCanvas.width;
  const maxY = MAP_HEIGHT * camera.zoom - mapCanvas.height;
  camera.x = Math.max(0, Math.min(camera.x, maxX));
  camera.y = Math.max(0, Math.min(camera.y, maxY));
}

// ============================================
// UPDATE LOOP
// ============================================
let lastUpdate = Date.now();
const updateInterval = 100;

function gameLoop() {
  const now = Date.now();
  const delta = now - lastUpdate;

  if (delta >= updateInterval) {
    lastUpdate = now;
    const ticks = speedMultipliers[gameSpeed];
    for (let i = 0; i < ticks; i++) {
      year++;
      for (const tribe of tribes) tribe.update();
      for (const country of countries) country.update();
    }
    updateUI();
  }

  updateCamera();
  drawMap();
  requestAnimationFrame(gameLoop);
}

function updateUI() {
  document.getElementById('worldStats').textContent =
    `Year ${year} | Tribes: ${tribes.length} | Countries: ${countries.length}`;
}

// ============================================
// INPUT
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key in keys) {
    keys[e.key] = true;
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key in keys) {
    keys[e.key] = false;
    e.preventDefault();
  }
});

mapCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  camera.targetZoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.targetZoom * zoomFactor));
});

mapCanvas.addEventListener('click', (e) => {
  const rect = mapCanvas.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;
  const worldX = Math.floor((canvasX + camera.x) / camera.zoom);
  const worldY = Math.floor((canvasY + camera.y) / camera.zoom);

  let foundTribe = null;
  for (const tribe of tribes) {
    if (tribe.territory.some(t => t.x === worldX && t.y === worldY)) {
      foundTribe = tribe;
      break;
    }
  }

  let foundCountry = null;
  for (const country of countries) {
    if (country.territory.some(t => t.x === worldX && t.y === worldY)) {
      foundCountry = country;
      break;
    }
  }

  const infoPanel = document.getElementById('infoPanel');
  const infoPanelTitle = document.getElementById('infoPanelTitle');
  const infoPanelContent = document.getElementById('infoPanelContent');

  if (foundCountry) {
    infoPanelTitle.textContent = foundCountry.name;
    infoPanelContent.innerHTML = `
      <div class="info-row"><span class="info-label">Leader:</span><span class="info-value">${foundCountry.leader.name}</span></div>
      <div class="info-row"><span class="info-label">Government:</span><span class="info-value">${foundCountry.government}</span></div>
      <div class="info-row"><span class="info-label">Population:</span><span class="info-value">${Math.floor(foundCountry.population).toLocaleString()}</span></div>
      <div class="info-row"><span class="info-label">Territory:</span><span class="info-value">${foundCountry.territory.length} tiles</span></div>
      <div class="info-row"><span class="info-label">Cities:</span><span class="info-value">${foundCountry.cities.length}</span></div>
      <div class="info-row"><span class="info-label">Capital:</span><span class="info-value">${foundCountry.capital.name}</span></div>
    `;
    infoPanel.style.display = 'block';
  } else if (foundTribe) {
    infoPanelTitle.textContent = foundTribe.name;
    infoPanelContent.innerHTML = `
      <div class="info-row"><span class="info-label">Type:</span><span class="info-value">Tribe</span></div>
      <div class="info-row"><span class="info-label">Population:</span><span class="info-value">${Math.floor(foundTribe.population).toLocaleString()}</span></div>
      <div class="info-row"><span class="info-label">Territory:</span><span class="info-value">${foundTribe.territory.length} tiles</span></div>
      <div class="info-row"><span class="info-label">Max Territory:</span><span class="info-value">${TRIBE_MAX_TERRITORY} tiles</span></div>
    `;
    infoPanel.style.display = 'block';
  } else {
    infoPanel.style.display = 'none';
  }
});

document.getElementById('closeInfoPanel').addEventListener('click', () => {
  document.getElementById('infoPanel').style.display = 'none';
});

// ============================================
// TIME CONTROLS
// ============================================
document.querySelectorAll('.time-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    gameSpeed = parseInt(btn.dataset.speed);
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ============================================
// SETTINGS
// ============================================
document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsPanel').style.display = 'flex';
});

document.getElementById('closeSettings').addEventListener('click', () => {
  document.getElementById('settingsPanel').style.display = 'none';
});

// ============================================
// INITIALIZATION
// ============================================
document.getElementById('playBtn').addEventListener('click', async () => {
  document.getElementById('mainMenu').style.display = 'none';
  document.getElementById('gameView').style.display = 'block';

  const seed = Date.now();
  worldRng = mulberry32(seed);
  worldNoise = new SimplexNoise(seed);

  planetData = await new Promise((resolve) => {
    setTimeout(() => {
      const data = generatePlanetData(seed, (pct, msg) => {
        document.getElementById('progressBar').style.width = pct + '%';
        document.getElementById('progressText').textContent = msg;
      });
      resolve(data);
    }, 100);
  });

  basePlanetTexture = renderPlanetTexture(planetData);

  mapCanvas.width = window.innerWidth;
  mapCanvas.height = window.innerHeight;
  overlayCanvas.width = MAP_WIDTH;
  overlayCanvas.height = MAP_HEIGHT;

  camera.x = 0;
  camera.y = 0;
  camera.zoom = Math.min(window.innerWidth / MAP_WIDTH, window.innerHeight / MAP_HEIGHT);
  camera.targetZoom = camera.zoom;

  spawnInitialTribes(20);

  document.getElementById('progressUI').classList.add('hidden');
  document.getElementById('gameUI').style.display = 'block';

  gameLoop();
});

window.addEventListener('resize', () => {
  mapCanvas.width = window.innerWidth;
  mapCanvas.height = window.innerHeight;
});
