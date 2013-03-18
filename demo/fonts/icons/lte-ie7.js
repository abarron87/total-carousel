/* Use this script if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icons\'">' + entity + '</span>' + html;
	}
	var icons = {
			'icon-arrow-right' : '&#x72;',
			'icon-arrow-left' : '&#x6c;',
			'icon-expand' : '&#x65;',
			'icon-contract' : '&#x63;',
			'icon-arrow-left-2' : '&#x62;',
			'icon-arrow-right-2' : '&#x66;',
			'icon-play' : '&#x70;',
			'icon-pause' : '&#x68;',
			'icon-stop' : '&#x73;',
			'icon-forward' : '&#x71;',
			'icon-backward' : '&#x7a;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; i < els.length; i += 1) {
		el = els[i];
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};