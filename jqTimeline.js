/*
* jqTimeline: JQuery plugin for Event Timeline
*
* Copyright (c) 2012 Jose Paul (jose.k.paul@gmail.com)
* Dual licensed under the MIT (MIT-LICENSE.txt)
* and GPL (GPL-LICENSE.txt) licenses.
*
* $Date: 2012-01-14 $
*/

(function($) {

	var jqtlMethods = {
		init : function(options) {
			var daysOfWeek = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];
			var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
					"Aug", "Sep", "Oct", "Nov", "Dec" ];
			var getFormattedDay = function(d, w) {
				if (w > 30)
					return setMarginAndWeight(daysOfWeek[d.getDay()], 2)
							+ "<br/>" + setMarginAndWeight(d.getDate(), 2);
				else if (w > 20)
					return setMarginAndWeight(daysOfWeek[d.getDay()].substr(0,
							2), 2)
							+ "<br/>" + setMarginAndWeight(d.getDate(), 2);
				else
					return '';
			};
			var setMarginAndWeight = function(str, m, b) {
				return "<span style='margin:" + m
						+ (b ? "px;font-weight:bold'>" : "px'>") + str
						+ "</span>";
			}

			var getFormattedMonth = function(d, o) {
				if (o.startDate.getTime() == d.getTime()
						|| (d.getDate() == 1 && d.getMonth() == 0))
					return setMarginAndWeight(months[d.getMonth()] + "&nbsp;"
							+ d.getFullYear(), 2, true);
				if (d.getDate() == 1)
					return setMarginAndWeight(months[d.getMonth()], 2, true);
				else
					return '';
			};
			var intersects = function(r1s, r1e, r2s, r2e) {
				var s1 = r1s.getTime();
				var e1 = r1e.getTime();
				var s2 = r2s.getTime();
				var e2 = r2e.getTime();
				return (s1 == s2) || (s1 > s2 ? s1 <= e2 : s2 <= e1);
			}
			return this
					.each(function() {
						var root = $(this);
						if (!root.data('jqtlOptions'))
							root.data('jqtlOptions', $.extend(
									$.fn.jqTimeline.defaults, options));
						else
							$.extend(root.data('jqtlOptions'), options);
						var o = root.data('jqtlOptions');
						var legendDiv = $('<div/>').addClass('jqtlLegendDiv')
								.width(o.width);
						var tlDiv = $('<div/>').addClass('jqtlTlDiv').width(
								o.width).height(o.height);
						root.empty().addClass('jqtlContainer').width(o.width)
								.append(legendDiv).append(tlDiv);
						var currD = new Date();
						currD.setTime(o.startDate.getTime());
						var dayTicks = 1000 * 60 * 60 * 24;
						var dayWidth = Math
								.floor((root.width() - 25)
										/ ((o.endDate.getTime()
												- o.startDate.getTime() + dayTicks) / dayTicks));
						var dateIdx = 0;
						var l, d, m;
						while (currD <= o.endDate) {
							m = $('<div/>').addClass("jqtlLegendMonth").width(
									dayWidth).html(getFormattedMonth(currD, o));

							l = $('<div/>').addClass("jqtlLegendDay").width(
									dayWidth).html(
									getFormattedDay(currD, dayWidth));

							legendDiv.append($('<div/>').css({
								'float' : 'left',
								'width' : dayWidth
							}).append(m).append(l));

							d = $('<div/>').css({
								'float' : 'left',
								'width' : dayWidth,
								height : '100%'
							});
							;
							tlDiv.append(d);
							d.addClass("jqtlDay").width(dayWidth).height(
									tlDiv.height());
							if (currD.getDay() > 5 || currD.getDay() < 1)
								d.addClass("jqtlWeekend");
							d.hover(function() {
								$(this).addClass('jqtlDayHover');
							}, function() {
								$(this).removeClass('jqtlDayHover');
							});

							currD.setDate(currD.getDate() + 1);
							dateIdx++;
						}
						var j = 0;
						for ( var i = 0; i < o.jqtlEvents.length; i++) {
							var evt = o.jqtlEvents[i];
							if (intersects(evt.start, evt.end, o.startDate,
									o.endDate)) {
								var w = Math.floor(dayWidth
										* (evt.end.getTime() - evt.start
												.getTime()) / dayTicks);
								var ed = $('<div/>').html(
										setMarginAndWeight(evt.title.replace(
												/\s/g, '&nbsp;'), 3)).addClass(
										'jqtlEvent');
								tlDiv.append(ed);
								var lft = 0;
								if (o.startDate > evt.start) {
									ed.css({
										'border-top-left-radius' : '0px 0px',
										'border-bottom-left-radius' : '0px 0px'
									});
									w = Math.floor(dayWidth
											* (evt.end.getTime() - o.startDate
													.getTime()) / dayTicks);
								} else {
									lft = dayWidth
											* (evt.start.getTime() - o.startDate
													.getTime()) / dayTicks;
								}
								var tp = 16 + j * (o.evtHeight + 16);
								ed.css({
									left : lft,
									top : tp
								}).width(w).height(o.evtHeight);
								if (o.endDate.getTime() + dayTicks < evt.end
										.getTime()) {
									var e = o.endDate;
									var s = (o.startDate > evt.start) ? o.startDate : evt.start;
									ed
											.width(
													dayWidth
															* (e.getTime()
																	- s
																			.getTime() + dayTicks)
															/ dayTicks)
											.css(
													{
														'border-top-right-radius' : '0px 0px',
														'border-bottom-right-radius' : '0px 0px'
													});
								}
								ed.data('jqtlEvent', evt);
								ed.click(function() {
									root.trigger('eventClick', $(this).data(
											'jqtlEvent'));
								});
								j++;
							}
						}
						var ht = j * (o.evtHeight + 16) + 16;
						if (ht > tlDiv.height()) {
							tlDiv.children('.jqtlDay').css('height', ht);
						}
						var mouseX = 0;
						var bPressed = false;
						tlDiv.mousedown(function(e){
							mouseX = e.pageX;
							bPressed = true;
						}).mouseup(function(e){
							if (bPressed && (Math.abs(mouseX - e.pageX) > dayWidth)){
								var diff = Math.floor((e.pageX - mouseX)/dayWidth) * dayTicks;
								o.startDate.setTime(o.startDate.getTime() - diff);
								o.endDate.setTime(o.endDate.getTime() - diff);
								root.trigger('timelineChangeRequest', o);
							}
							bPressed = false;
						}).bind('mousewheel',
							function(e, d){
								var diff = d * dayTicks;
								var w = tlDiv.width();
								var st = e.pageX - tlDiv.position().left;
								var en = w - st;
								o.startDate.setTime(o.startDate.getTime() + Math.floor(diff*st/w));
								o.endDate.setTime(o.endDate.getTime() - Math.floor(diff*en/w));
								root.trigger('timelineChangeRequest', o);
						});
					});

		},
		
		addJqtlEvents : function(events) {
			this.each(function() {
				if ($(this).data('jqtlOptions')) {
					for ( var i = 0; i < events.length; i++) {
						$(this).data('jqtlOptions').jqtlEvents.push(events[i]);
					}
				}
			});
			this.jqTimeline();
			return this;

		}
	};

	$.fn.jqTimeline = function(method) {
		if (jqtlMethods[method]) {
			return jqtlMethods[method].apply(this, Array.prototype.slice.call(
					arguments, 1));
		} else if (typeof method == 'object' || !method) {
			return jqtlMethods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist in jqTimeline');
		}
	};

	$.fn.jqTimeline.defaults = {
		startDate : new Date("12/12/2011"),
		endDate : new Date("12/28/2011"),
		height : 500,
		width : 1500,
		evtHeight : 30,
		jqtlEvents : [ {
			id : 101,
			title : "jqTimeline's first default event",
			start : new Date("12/16/2011 03:04 PM"),
			end : new Date("12/23/2011 12:00 PM"),
			description : "take me out: I am a default event"
		}, {
			id : 102,
			title : "jqTimeline's second default event",
			start : new Date("12/18/2011 12:00 PM"),
			end : new Date("12/26/2011 12:00 PM"),
			description : "change me: I am a default event too"
		} ]
	};

})(jQuery);
