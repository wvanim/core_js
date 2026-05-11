// tispiGroup.js

// ═════════════════════════════════════════════════════════════
//  GROUP
// ═════════════════════════════════════════════════════════════
class TsiGroup extends TsiFace{
  constructor(parentDiv) {
    super(parentDiv);
  }
  messagePlate(onEnterPiece, onExitPiece, onEnterFace, onExitFace, params) {
    
    const status = (onEnterFace)? onEnterFace(this, params):"continue";
    if (status === 'break') return 'break';
    if (status === 'error') return 'error';
    
    for (const childDiv of this.div.children) {
      if (childDiv._tsiPiece === undefined) continue;
      
      let result = null;

      result = childDiv._tsiPiece.messageTree(onEnterPiece, onExitPiece, onEnterFace, onExitFace, params);

      
      if (result === 'break') return 'break';
      if (result === 'error') return 'error';
    }
  
    return (onExitFace)? onExitFace(this, params):"continue";
  }
}
