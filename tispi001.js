// tispi002.js

/**
 */

// ═════════════════════════════════════════════════════════════
//  KEYS
// ═════════════════════════════════════════════════════════════
class TsiKey{
  constructor(numFrame) {
      this.numFrame = numFrame;
  }  
  nextKeySync(track, keyIndex){
    //______________________________________
    // Vérifie si la key est la dernière de la piste
    const nextKey = track.getKeyNext(keyIndex, this.numFrame);
    if(nextKey==null) return [-1, -1];
    
    const nominalDuration = (nextKey.numFrame - this.numFrame) * o_.FRAME_MS;
    if(!track.clock) return [nominalDuration, nextKey]; 

    const horlogeFrame = (Date.now() - track.clock.dateStart) / o_.FRAME_MS;
    const drift        = horlogeFrame - this.numFrame;
    
    const duration = Math.max(0, nominalDuration - (drift * o_.FRAME_MS));
    return [duration, nextKey];
  }      
}
class TsiKeyFace extends TsiKey{

  constructor(numFrame, faceId) {
    super(numFrame);
    this.faceId   = faceId;
  }

  exec(track, keyIndex) {
    track.keyIndex = keyIndex;
    const piece = track.piece;
    
    //______________________________________
    // Echange les faces si nécessaire
    const facePrevious = piece.faceCurr;
    const faceNew = piece.div.children[this.faceId];
    if(faceNew != facePrevious){
        piece.faceCurr = faceNew;
        piece.isVisible = (faceNew!=null);
        if (facePrevious) { facePrevious.style.display = 'none';}
        if (faceNew) { faceNew.style.display = 'block';}
    }

    //______________________________________
    // Calcule la durée
    const [duration, nextKey] = this.nextKeySync(track, keyIndex);
    // ???
    if( duration>=0) track.playLastKey(() => { nextKey.exec( track, keyIndex + 1 ); }, duration);
  }
}
class TsiKeySpatial extends TsiKey {

  constructor(numFrame, value, prop) {
    super(numFrame);
    this.value = value;
    this.prop  = prop;
  }

  exec(track, keyIndex) {
    track.keyIndex = keyIndex;
    
    //______________________________________
    // Calcule la durée
    const [duration, nextKey] = this.nextKeySync(track, keyIndex);
    if(duration<0) return;
    
    //______________________________________
    // Place la transition - slide 
    const pieceDiv = track.piece.div;
    const toCss = o_.css[this.prop]; 
    toCss.transit(pieceDiv,  duration);
    toCss.set(pieceDiv,  nextKey.value);
    track.playLastKey(() => {nextKey.exec( track, keyIndex + 1 );}, duration);
  }
}

class TsiKeyPos extends TsiKeySpatial{ constructor(numFrame, value) { super( numFrame, value, "pos"); }}

class TsiKeyCss extends TsiKey {

  constructor(numFrame, value, prop) {
    super(numFrame);
    this.prop = prop;
    this.value    = value;
  }

  exec(track, keyIndex) {
    track.keyIndex = keyIndex;
    const faceDiv = track.piece.faceCurr;
    if (!faceDiv) return;

    //______________________________________
    // Calcule la durée si il y a un key suivante
    const [duration, nextKey] = this.nextKeySync(track, keyIndex);
    if(duration<0) return;

    o_.css[this.prop].set(faceDiv, this.value);
    track.playLastKey(() => {nextKey.exec( track, keyIndex + 1, );}, duration);
  }
}

class TsiKeyBgColor extends TsiKeyCss {
  constructor(numFrame, value) {super(numFrame, value, "bgColor");}
}
// TODO
class TsiKeyClock extends TsiKey{
  constructor(numFrame, value, params) {
    super(numframe);
  }
  exec(track, keyIndex) {
      // TODO
  }
}
// ═════════════════════════════════════════════════════════════
//  TRACKS
// ═════════════════════════════════════════════════════════════
class TsiTrack{
  constructor(keys, piece, prop) {
    this.prop       =prop;
    this.keys       = keys;
    this.keyIndex   = 0;
    this.piece      = piece;
    this.clock      = null;
  }
  activeKeyAt0() {
    throw new Error(`${this.constructor.name} doit implémenter activeKeyAt0()`);
  }
  /**
   * joue l'intervale après la dernière key.
   */
  playLastKey(callback, duration) {
    clearTimeout(this._currentTimeout);
    this._timeoutStart    = Date.now();
    this._timeoutDuration = duration;
    this._timeoutCallback = callback;
    this._currentTimeout  = setTimeout(callback, duration);
  }
  getKeyNext(keyIndex, numFrame){
    return (keyIndex<this.keys.length-1)
        ? this.keys[keyIndex + 1]
        : null;
  }
  /**
    Synchronisation répétée en 3 et 5 secondes
                1 - vérification de la synchro d'une piste avec l'horloge
                2 - calculer le le numéro de frame courant de la piste
                                                                                        |<- frame_courante_horloge                   | durée_de_l_animation_du_groupe
                    Horloge ------------------------------------------------------------.............................................
                                                          |<- début_intervalle        |<-  frame_courante_piste            | fin_intervalle
                    Piste   ..............................~~~~~~~~~~~~~~~~~~~~~~~~~~~~??+++++++++++++++++++++++++++++++++++..........
                3 - frame_courantehorloge / ---- / = (Date.now() - clock.dateStart) / o_.FRAME_MS     
                4 - frame_courante_piste /.... PLUS ~~~~/ = (<temps_courant_du_setTimeout_de_la_piste>*o_.FRAME_MS - debut_intervalle ) / o_.FRAME_MS 
                5 - ecart /??/ =  <frame_courante_horloge> - frame_courante_piste 
                6 - si écart < 2 => on boucle sur la vérification suivante => quitter
                7 - relancer le setTimeout pour la portion restante /?? et +++/ 
                8 - Donc => en ajoutant l'écract /??/
                9 - => on boucle sur la vérification suivante => quitter
  
   */
  startSyncWatcher() {
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
  
      // 1 - vérification de la synchro d'une piste avec l'horloge
      const keyCurr = this.keys[this.keyIndex];
      if (!this.clock || keyCurr == null) return;
  
      // 2 - calculer le numéro de frame courant de la piste
      const frameDebutIntervalle = keyCurr.numFrame;
      const frameFinIntervalle   = this.keys[this.keyIndex + 1]?.numFrame 
                                   ?? this.piece.getAnimDuration();
  
      // 3 - frame_courante_horloge /----/
      const frame_courante_horloge = (Date.now() - this.clock.dateStart) / o_.FRAME_MS;
  
      // 4 - frame_courante_piste /.... PLUS ~~~~/
      const elapsed_piste          = Date.now() - this._timeoutStart;
      const frame_courante_piste   = frameDebutIntervalle 
                                   + (elapsed_piste / o_.FRAME_MS);
  
      // 5 - ecart /??/
      const ecart = frame_courante_horloge - frame_courante_piste;
  
      // 6 - si écart < 2 => on boucle sur la vérification suivante
      if (Math.abs(ecart) <= 2) {
        this.startSyncWatcher();
        return;
      }
  
      // 7 - relancer le setTimeout pour la portion restante /?? et +++/
      // 8 - en ajoutant l'écart /??/
      const elapsed   = Date.now() - this._timeoutStart;
      const remaining = this._timeoutDuration - elapsed - (ecart * o_.FRAME_MS);
  
      this.playLastKey(
        this._timeoutCallback,
        Math.max(0, remaining)
      );
  
      // 9 - on boucle sur la vérification suivante
      this.startSyncWatcher();
  
    }, delay);
  }  
}
class TsiTrackFace extends TsiTrack{

  constructor(keys, piece) {
    super(keys, piece, "face");
  }
  /**
   * Sélectionne la Face sur la frame 0
   */
  activeKeyAt0(){
    const key0   = this.keys[0];
    const divNewId = (key0.numFrame === 0) ? key0.faceId : null;
    const divNew = (divNewId!==null)? this.piece.div.children[divNewId] : null;
    
    const divOld = this.piece.faceCurr;
    this.piece.faceCurr = divNew;

    let faceChanged = false;
    if (divNew !== null && (divOld===null || divNewId !== divOld.id)) {
      // La 1ère face est différente de la face en-cours
      divNew.style.display = 'block';
      faceChanged = true;
    }
    // Cache la face précédente si nécessaire
    if (divOld !== null && (divNewId === null || faceChanged)) {
      divOld.style.display = 'none';
    }
    //___________________________________________
    // Double raffraichissement nécessaire pour prendre en comptee ce qui précède
    // Note : transitionEnd à été écarté car ne fonctionne pas avec un delay de 0
    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      this.keys[0].exec( this, 0 );
    });
    });
  }
}

class TsiTrackSpatial  extends TsiTrack{    
    constructor(keys, piece, prop) {
      super(keys, piece, prop);
    }

    activeKeyAt0()
    {
        if(!this.keys || this.keys.length==0) return;
        
        const pieceDiv = this.piece.div;
        const toCss = o_.css[this.prop];
        const key0 = this.keys[0];

        //______________________________________
        // désactiver transition
        toCss.transit(pieceDiv, 0);
        
        //______________________________________
        // état initial
        const value = (key0.numFrame === 0)? key0.value: toCss.defaultValue;
        toCss.set(pieceDiv, value);

        //______________________________________
        // forcer refresh CSS

        requestAnimationFrame(() =>{
        requestAnimationFrame(() => 
            {key0.exec(this, 0 );
        });
        });
    }
}
class TsiTrackPos extends TsiTrackSpatial { 
  constructor(keys, piece) { super(keys, piece, "pos"); } 
}

class TsiTrackCss  extends TsiTrack{
  constructor(keys, piece, prop) {
    super(keys, piece, prop);
  }

  activeKeyAt0(){
    const keys = this.keys;
    const faceDiv = this.piece.faceCurr;
    const key0 = keys[0];
    // place la propriété CSS
    if(faceDiv){
      const toCss = o_.css[this.prop];
      const frameOfkey0 = key0.numFrame;
      const value = (frameOfkey0===0)? key0.value: toCss.defaultValue; 
      toCss.set(faceDiv, value);
    }
    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
       key0.exec( this, 0);
    });
    });
  }
}
class TsiTrackBgColor extends TsiTrackCss { constructor(keys, piece) { super(keys, piece, "bgColor"); } }

// ═════════════════════════════════════════════════════════════
//  TRACKS CLOCK
// ═════════════════════════════════════════════════════════════
/**
 * pilote le temps et synchronise les Pieces
 */
class TsiTrackClock extends TsiTrack {
  constructor(keys, piece, prop) {
    super(keys, piece, prop);
    this.dateStart = null;
    this.started   = false;
    piece.div.parentNode._tsi.ptClock = this;
  }
  activeKeyAt0() {
    // La Clock n'a pas de keys — ne fait rien
  }
  /**
   * L'horloge déclenche le bouclage de l''animation
   */
  onLoopRestart() {
    this.started   = false;
  
    for (const childDiv of this.piece.div.parentNode.children) {
      if (!childDiv._tsiPiece) continue;
      const piece = childDiv._tsiPiece;
      for (const track of piece.timeline.tracks) {
        if (track instanceof TsiTrackClock) continue;
        track.activeKeyAt0();
      }
    }
  
    // Relance le setTimeout pour le prochain bouclage
    
    this.started   = true;
    this.dateStart = Date.now();
    setTimeout(() => { this.onLoopRestart(); }, 
      this.piece.getAnimDuration() * o_.FRAME_MS);
  }
  
  /**
   * Balayage à start
   */
  static onEnterPiece(piece, params) {
    piece.animDuration = piece.div.parentNode._tsi.animDuration;
    const clock = piece.div.parentNode._tsi.ptClock;
    if (!clock) return 'break';
    for (const track of piece.timeline.tracks) {
      if (track instanceof TsiTrackClock) continue;
      track.clock = clock;
      // Synchro 1 — bouclage : via getKeyNext() → clock.onLoopRestart()
      // Synchro 2 — aux keys : via syncDuration() dans chaque exec()
      track.activeKeyAt0();
      
      // Synchro 3 — intervalle régulier
      track.startSyncWatcher();
    }
    return 'continue';
  }

  static onExitPiece(piece, params) {
    const clock = piece.div.parentNode._tsi.ptClock;
    if (!clock || clock.started) return 'continue';
    clock.started   = true;
    clock.dateStart = Date.now();
    setTimeout(() => clock.onLoopRestart(), piece.getAnimDuration() * o_.FRAME_MS);
    return 'continue';
  }
  static start() {
    const params = { depth: 0, component: null };
    for (const childDiv of document.body.children) {
      if (!childDiv._tsiPiece) continue;
      childDiv._tsiPiece.messageTree(
        TsiTrackClock.onEnterPiece,
        TsiTrackClock.onExitPiece,
        null, null,
        params
      );
    }
  }
}
// ═════════════════════════════════════════════════════════════
//  TIMELINE
// ═════════════════════════════════════════════════════════════
class TsiTimeline {
  constructor(trackArrays, piece) {
    this.piece = piece;
    this.tracks = [];

    for (const arr of trackArrays) {
      this.tracks.push(this.buildTrack(arr));

      /*for (const item of arr) {
        if (Number.isFinite(item)) {
          this.length = Math.max(this.length, item);
        }
      }*/
    }
  }

  buildTrack(arr) {
      const trackClass = arr[0];
      let params = arr[1];
      let startPair = 2;
  
      if (Number.isFinite(params)) {
        params = undefined;
        startPair = 1;
      }
  
      const keys = [];
  
      const len = arr.length;    
      for (let i = startPair; i < len-1; i += 2) {
          if(o_.css[trackClass]==null){
              alert(trackClass+"inconnu dans o_.css{}");
          }
        keys.push( new (o_.css[trackClass].key)(arr[i], arr[i + 1], params) );
      }
      
      const trackLen = arr[ len-((((len-startPair) %2) === 1)?1:2)];
      const animDuration = this.piece.div.parentNode._tsi.animDuration;
      if(animDuration<trackLen){
          this.piece.div.parentNode._tsi.animDuration = trackLen;
      }          
      return new (o_.css[trackClass].track)(keys, this.piece, params);
    }
  }

// ═════════════════════════════════════════════════════════════
//  PIECE
// ═════════════════════════════════════════════════════════════
class TsiNode{
  constructor(parentDiv) {
    this.div = parentDiv;
    this.isVisible = false;
  }
  messageTree(onEnterPiece, onExitPiece, onEnterFace, onExitFace, params) {
    if (params.depth===undefined) params.depth=0;
    params.depth++;
    const divMemo = params.component;
  
    const flagNext =this.messagePlate(onEnterPiece, onExitPiece, onEnterFace, onExitFace, params);
  
    params.component = divMemo;
    params.depth--;
    
    return flagNext;
  }
}
class TsiPiece  extends TsiNode{
  constructor(parentDiv, pairs) {
    super(parentDiv);
    parentDiv._tsiPiece = this;
    this.animDuration = 0;
    this.faceCurr = null;

    this.div.style.position = 'absolute';
    
    if (!parentDiv.parentNode._tsi) parentDiv.parentNode._tsi = {ptClock:null, animDuration:0}
    this.timeline = new TsiTimeline(pairs, this);
  }
  getAnimDuration(){return this.animDuration;}
  messagePlate(onEnterPiece, onExitPiece, onEnterFace, onExitFace, params) {
    
    const status = (onEnterPiece)? onEnterPiece(this, params):"continue";
    if (status === 'break') return 'break';
    if (status === 'error') return 'error';
  
    
    for (const childDiv of this.div.children) {
      if (childDiv._tsiFace === undefined) continue;
  
      let result = null;
      result = childDiv._tsiFace.messageTree(onEnterPiece, onExitPiece, onEnterFace, onExitFace, params);
      
      if (result === 'break') return 'break';
      if (result === 'error') return 'error';
    } 
    return (onExitPiece)? onExitPiece(this, params):"continue";
  }
}
// ═════════════════════════════════════════════════════════════
//  FACE
// ═════════════════════════════════════════════════════════════
class TsiFace extends TsiNode{
  constructor(parentDiv) {
    super(parentDiv);
    parentDiv._tsiFace = this;
    this.div.style.position = 'absolute';
    this.div.style.display = 'none';
  }
  messagePlate(onEnterPiece, onExitPiece, onEnterFace, onExitFace, params) {
      return "continue";
  }
}


// ═════════════════════════════════════════════════════════════
//  NAMESPACE o_
// ═════════════════════════════════════════════════════════════

const o_ = {
  css:{ 
      clock:    {set:null, transit:null,
                     track:TsiTrackClock, key: TsiKeyClock }, 
      face:     {set:null, transit:null,
                     track:TsiTrackFace, key: TsiKeyFace},
      bgColor : {set:(faceDiv,color)=> {faceDiv.style.backgroundColor=color;},
                 transit:null,
                 track:TsiTrackBgColor, key: TsiKeyBgColor,
                 defaultValue: "blue"},
                   
      pos :     {set:(pieceDiv, pos) =>{
                     pieceDiv.style.left = pos[0]+"px";
                     pieceDiv.style.top  = pos[1]+"px";}, 
                 transit:(pieceDiv, duration) =>{
                     o_.setTransition(pieceDiv, 'left', 'left', duration);
                     o_.setTransition(pieceDiv, 'top', 'top',  duration); },
                 track:TsiTrackPos, key: TsiKeyPos,
                 defaultValue: [0,0]}
  },
  FRAME_MS : 1000 / 60,
  
  // ═════════════════════════════════════════════════════════════
  //  UTIL
  // ═════════════════════════════════════════════════════════════
  div: () => document.currentScript.parentElement,

  setTransition:(div, propCss, propJs, duration) =>{
    if (!div._transitions) div._transitions = {};
    div._transitions[propJs] = `${propCss} ${duration}ms linear`;
    div.style.transition = Object.values(div._transitions).join(', ');
  },
  
  start() {
    TsiTrackClock.start();
  }
};



/*

*/