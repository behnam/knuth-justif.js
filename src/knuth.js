const INFINITY = 100000;
const alpha = 1; // ???
const sigma = 1; // ???

function findBreakpoints(paragraph, lines, p) {
  if(p == undefined)
    p = 20;
  
  //Create an active node representing the beginning of the paragraph
  var A = { position: 0,
	    line: 0,
	    fitness: 1,
	    totalwidth: 0,
	    totalstretch: 0,
	    totalshrink: 0,
	    totaldemerits: 0,
	    previous: null,
	    link: null },
      P = null,
      EW = 0,
      EY = 0,
      EZ = 0;

  for(var b = 0; b < paragraph.length; b++) {
    if(paragraph[b].box) {
      EW = EW + paragraph[b].w;
    } else if(paragraph[b].glue) {
      if(paragraph[b-1].box) mainLoop();
      EW = EW + paragraph[b].w;
      EY = EY + paragraph[b].y;
      EZ = EZ + paragraph[b].z;
    } else if (paragraph[b].penalty && paragraph[b].score != INFINITY) {
      mainLoop();
    }
  }

  for(var a = A, b = A, d = a.totaldemerits; a;) {
    a = a.link;
    if(!a) break;
    if(a.totaldemerits < d) {
      d = a.totaldemerits;
      b = a;
    }
  }

  return b;
  
  function mainLoop() {
    var An = [null, null, null, null],
	a = A,
	preva = null;
    for(;;) {
      var Dn = [INFINITY, INFINITY, INFINITY, INFINITY],
	  D  = INFINITY;

      for(;;) {
	var nexta = a.link;
	var r = computeRatio(a);
	if(r < -1 || paragraph[b].score == -INFINITY)
	  deactivateNode();
	else
	  preva = a;

	if(r >= -1 && r <= p) {
	  var res = computeDemerits(a, r);
	  var d = res.d,
	      c = res.c;
	  
	  if(d < Dn[c]) {
	    Dn[c] = d;
	    An[c] = a;
	    if(d < D)
	      D = d;
	  }
	}
	a = nexta;
	if(!a) break;

	var j0 = 10;
	var j = a.line + 1;
	if (a.line >= j && j < j0) break;
      }
      
      if (D < INFINITY) {
	insertNewNodes();
      }

      if(!a) break;
    }

    if (A == null) {
      console.log('ut oh');
    }

    function insertNewNodes() {
      var t = computeTx();
      
      for(var c = 0; c < 3; c++) {
	if(Dn[c] <= D + sigma) {
	  var s = {
	    position: b,
	    line: An[c].line + 1,
	    fitness: c,
	    totalwidth: t.w,
	    totalstretch: t.y,
	    totalshrink: t.z,
	    totaldemerits: Dn[c],
	    previous: An[c],
	    link: a
	  };

	  if(!preva) A = s;
	  else preva.link = s;
	  preva = s;
	}
      }
    }
    
    function deactivateNode() {
      if(!preva) A = nexta;
      else preva.link = nexta;

      if(!A /* && secondpass */ && D == INFINITY && r < -1)
	r = -1;
    }
  }

  function computeTx() {
    var tw = EW,
	ty = EY,
	tz = EZ;
    for(var i = b; i < paragraph.length; i++) {
      if(paragraph[i].box) break;
      if(paragraph[i].glue) {
	tw += paragraph[i].w;
	ty += paragraph[i].y;
	tz += paragraph[i].z;
      } else if (paragraph[i].score == -INFINITY && i > b) {
	break;
      }
    }

    return { w: tw, y: ty, z: tz };
  }

  function computeDemerits(a, r) {
    var d = 0;
    var score = paragraph[b].penalty ? paragraph[b].score : 0;
    if(score >= 0)
      d = Math.pow(1 + 100*Math.abs(r*r*r) + score, 2);
    else if(score != -INFINITY)
      d = Math.pow(1 + 100*Math.abs(r*r*r), 2) - score*score;
    else
      d = Math.pow(1 + 100*Math.abs(r*r*r), 2);

    var flaga = paragraph[a.position].penalty ? paragraph[a.position].flag : 0;
    var flagb = paragraph[b].penalty ? paragraph[b].flag : 0;
    d = d + alpha*flagb*flaga;

    var c;
    if(r < -0.5) c = 0;
    else if (r <= 0.5) c = 1;
    else if (r <= 1) c = 2;
    else c = 3;

    if(Math.abs(c - a.fitness) > 1) d = d + sigma;
    d = d + a.totaldemerits;
    
    return {d: d, c: c};
  }
  

  function computeRatio(a) {
    var L = EW - a.totalwidth;
    if(paragraph[b].penalty)
      L = L + paragraph[b].w;
    var j = a.line;
    var l = lines[j];
    var r = 0;
    if (L < l) {
      var Y = EY - a.totalstretch;
      if (Y > 0)
	r = (l - L)/Y;
      else
	r = INFINITY;
    } else if (L > l) {
      var Z = EZ - a.totalshrink;
      if (Z > 0)
	r = (l - L)/Z;
      else
	r = INFINITY;
    }
    
    return r;
  }
}

module.exports = findBreakpoints;
