var knuth = require('./knuth'),
    Future = require('./future');

var text = [
  {
    text: 'This is a paragraph. Fe fi fo fum. \
In olden times when wishing still helped one, there lived a \
king whose daughters were all beautiful; and the youngest was \
so beautiful that the sun itself, which has seen so much, was \
astonished whenever it shone in her face. Close by the king\'s \
castle lay a great dark forest, and under an old lime-tree in the \
forest was a well, and when the day was very warm, the king\'s \
child went out into the forest and sat down by the side of the \
cool fountain: and when she was bored she took a golden ball, \
and threw it up on high and caught it; and this ball was her \
favorite plaything.',
    style: {
      'font-size': '16px',
      'font-weight': 'normal',
      'color': '#333',
      //'font-family': 'museo-sans'
    }
  }
];

var paragraph = [
  { box: true,
    w: 10,
    text: 'I'
  },
  { box: true,
    w: 10,
    text: 'n'
  },
  {
    glue: true,
    w: 6,
    y: 3,
    z: 2
  },
  { box: true,
    w: 10,
    text: 'o'
  },
  { box: true,
    w: 10,
    text: 'l'
  },
  { box: true,
    w: 10,
    text: 'd'
  },
  { box: true,
    w: 10,
    text: 'e'
  },
  { box: true,
    w: 10,
    text: 'n'
  },
  { glue: true,
    w: 6,
    y: 3,
    z: 2
  },
  { box: true,
    w: 10,
    text: 't'
  },
  { box: true,
    w: 10,
    text: 'i'
  },
  { box: true,
    w: 10,
    text: 'm'
  },
  { box: true,
    w: 10,
    text: 'e'
  },
  { box: true,
    w: 10,
    text: 's'
  },
  { glue: true,
    w : 0,
    y: 100000,
    z: 0
  },
  { penalty: true,
    score: -100000,
    flag: 1
  }
];

window.addEventListener('DOMContentLoaded', function() {
  textToParagraph(text, 1/3, 3/4).ready(function(paragraph) {
    var lines = [];
    for(var i = 0; i < 100; i++)
      lines[i] = 500 + Math.sin(i/2.5)*20;
    var active = knuth(paragraph, lines, 1);
    //if(!last) last = knuth(paragraph, lines, 10);

    var breakpoints = [];
    for(var node = active, next = null; node; next = node, node = node.previous) {
      breakpoints.unshift(node);
      node.next = next;
    }

    console.log(breakpoints);

    function getBreakpoint(k) {
      for(var i = 0; i < breakpoints.length; i++ ) {
	if(breakpoints[i].position == k) return breakpoints[i];
      }

      return false;
    }

    var out = '';
    var page = document.getElementById('page');
    var line;
    var W = 0;
    var max = 0;
    var last;
    var left;
    var first;
    paragraph.forEach(function(unit, i) {
      var breakpoint = getBreakpoint(i);

      if (breakpoint) {
	last = breakpoint;
	out += '/';
	first = i;

	max = 0;
	W = 0;
	if(i < paragraph.length-1) {
	  line = document.createElement('div');
	  line.style.position = 'relative';
	  page.appendChild(line);
	}
      }

      if(breakpoint && unit.glue) {
	left = {
	  w: unit.w,
	  y: unit.y,
	  z: unit.z
	};
      }
      
      if(!breakpoint && unit.glue) { //don't render glue if at the beginning of a line
	var span = document.createElement('span');
	for(var prop in unit.style)
	  span.style[prop] = unit.style[prop];
	span.innerHTML = '&nbsp;';
	span.style.display = 'inline-block';
	line.appendChild(span);

	if(last.next) {
	  console.log(last.totalwidth);
	  if(!last.previous)
	    var w = last.next.totalwidth - last.totalwidth - 3;
	  else
	    w = last.next.totalwidth - last.totalwidth - (left ? left.w : 0);
	  var y = last.next.totalstretch - last.totalstretch - (left ? left.y : 0);
	  var z = last.next.totalshrink - last.totalshrink - (left ? left.z : 0);

	  if(w < lines[last.line]) {
	    var tw = lines[last.line] - w;
	    span.style.width = unit.w + tw*unit.y/y + 'px';
	  } else if(w > lines[last.line]) {
	    var tw = w - lines[last.line];
	    span.style.width = unit.w - tw*unit.z/z + 'px';
	  } else {
	    span.style.width = unit.w + 'px';
	  }
 	} else {
	  span.style.width = unit.w + 'px';
	}
	out += ' ';
      } else if (unit.box) {
	var span = document.createElement('span');
	span.style.display = 'inline-block';
	span.style.width = unit.w + 'px';
	for(var prop in unit.style)
	  span.style[prop] = unit.style[prop];
	span.textContent = unit.text;
	//span.style.position = 'absolute';
	//span.style.left = W + 'px';
	line.appendChild(span);
	if(unit.h > max)
	  max = unit.h;
	out += unit.text;
      }
    });
    
    console.log(out);
  });
});

function textToParagraph(text, z, y) {
  var tmp = document.createElement('div');
  document.body.appendChild(tmp);

  var paragraph = [];
  /*paragraph.push({
    box: true,
    w: 18,
    text: ''
   });*/
  text.forEach(function(word) { //note: probably not actually a word
    for(var i = 0; i < word.text.length; i++) {
      var c = word.text[i];

      var span = document.createElement('span');
      for(var prop in word.style)
	span.style[prop] = word.style[prop];
      tmp.appendChild(span);

      if(c == ' ') {
	span.innerHTML = '&nbsp;';
	paragraph.push({
	  glue: true,
	  style: word.style,
	  span: span
	});
      } else {
	span.textContent = c;
	paragraph.push({
	  box: true,
	  text: c,
	  style: word.style,
	  span: span
	});

	if(c === '-') {
	  paragraph.push({
	    penalty: true,
	    score: 10
	  });
	}
      }
    }
  });

  //Finishing glue
  paragraph.push({
    glue: true,
    w: 0,
    y: 100000,
    z: 0
  });

  paragraph.push({
    penalty: true,
    score: -100000,
    flag: 1
  });

  //Figure out the normal width of a space according to the font
  setTimeout(function() {
    paragraph.forEach(function(unit) {
      if(unit.box && unit.span) {
	unit.w = unit.span.offsetWidth;
	unit.h = unit.span.offsetHeight;
	
	delete unit.span;
      } else if (unit.glue && unit.span) {
	var w = unit.span.offsetWidth;
	unit.w = w;
	unit.z = w * z;
	unit.y = w * y;

	delete unit.span;
      }
    });

    document.body.removeChild(tmp);
    future.complete(paragraph);
  });

  var future = new Future();
  return future;
}
