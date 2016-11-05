var activeGraph = null;
Ext.onReady(function() {
	Ext.MessageBox.buttonText.yes = '确定';
	Ext.MessageBox.buttonText.ok = '是';
	Ext.MessageBox.buttonText.no = '否';
	Ext.MessageBox.buttonText.cancel = '取消';
	
	var tabPanel = new Ext.TabPanel({
		id: 'TabPanel',
		region: 'center',
		margins: '5 5 5 0',
		plain: true
	});
	
	var guidePanel = new GuidePanel({
		id: 'GuidePanel',
		split: true,
		region: 'west',
		width: 300,
		margins: '5 0 5 5'
	});
	
	tabPanel.on('tabchange', function(me, item) {
		if(item) {
			activeGraph = item;
			guidePanel.activeCom(item);
		} else {
			activeGraph = null;
			guidePanel.activeCom(null);
		}
	});
	

    new Ext.Viewport({
		layout: 'border',
		items: [guidePanel, tabPanel]
	});
    
    setTimeout(function(){
    	Ext.get('loading').hide();
        Ext.get('loading-mask').fadeOut();
    }, 250);
    
});

function syncCall(cfg) {
	var conn = null;
	try {
		conn = new XMLHttpRequest();
    } catch(e) {
        for (var i = Ext.isIE6 ? 1 : 0; i < activeX.length; ++i) {
            try {
            	conn = new ActiveXObject(activeX[i]);
                break;
            } catch(e) {
            	
            }
        }
    }
    var jsonData = cfg.params || {};
    var p = Ext.isObject(jsonData) ? Ext.urlEncode(jsonData) : jsonData;
    
    var url = cfg.url;
    url = Ext.urlAppend(url, p);
    
    conn.open(cfg.method || 'POST', url, false);
    conn.send(null);
    if (conn.status == "200") {  
    	return conn.responseText;  
    }  
    return null;
}

var loadCache = new Ext.util.MixedCollection();
function loadPluginScript(pluginId) {
	if(!pluginId) return;
	
	if(!loadCache.containsKey(pluginId)) {
		var oHead = document.getElementsByTagName('HEAD').item(0);
	    var oScript= document.createElement("script");
	    oScript.type = "text/javascript";
	    oScript.src = GetUrl('ui/stepjs/' + pluginId + '.js2');
	    oHead.appendChild( oScript ); 
		
		loadCache.add(pluginId, 1);
	}
}

function findItems(c, name, v) {
	var arrays = [];
	if(c.items) {
		c.items.each(function(t) {
			if(t[name] == v)
				arrays.push(t);
			Ext.each(findItems(t, name, v), function(e) {
				arrays.push(e);
			});
		});
	}
	return arrays;
}

function getActiveGraph() {
	return activeGraph;
}

function decodeResponse(response, cb, opts) {
	try {
		var resinfo = Ext.decode(response.responseText);
		if(resinfo.success) {
			cb(resinfo);
		} else {
			Ext.Msg.show({
			   title: resinfo.title,
			   msg: resinfo.message,
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.ERROR
			});
		}
		Ext.getBody().unmask();
	} catch(e) {
		Ext.getBody().unmask();
		alert('处理响应信息发生异常！');
	}
}

function failureResponse(response) {
	Ext.getBody().unmask();
	if(response.status == 0 && !response.responseText) {
		Ext.Msg.show({
		   title: '系统提示',
		   msg: '服务器繁忙或宕机，请确认服务器状态！',
		   buttons: Ext.Msg.OK,
		   icon: Ext.MessageBox.WARNING
		});
	} else if(response.status == 500) {
		var noText = Ext.MessageBox.buttonText.no;
		Ext.MessageBox.buttonText.no = '查看详细';
		Ext.Msg.show({
		   title: '系统提示',
		   msg: '系统发生错误！错误信息：' + response.statusText,
		   buttons: Ext.Msg.YESNOCANCEL,
		   fn: function(bId) {
			   Ext.MessageBox.buttonText.no = noText;
			   if(bId == 'no') {
				   var win = new Ext.Window({
					   width: 1000,
					   height: 600,
					   title: '详细错误',
					   modal: true,
					   layout: 'fit',
					   items: new Ext.form.TextArea({
						   	value: decodeURIComponent(response.responseText),
							readOnly : true
					   }),
					   bbar: ['->', {
						   text: '确定', handler: function() {win.close();}
					   }]
				   });
				   win.show();
			   }
		   },
		   icon: Ext.MessageBox.ERROR
		});
	}
}

var cellLabelChanged = mxGraph.prototype.cellLabelChanged;
mxGraph.prototype.cellLabelChanged = function(cell, value, autoSize)
{
	var tmp = cell.value.cloneNode(true);
	tmp.setAttribute('label', value);
	value = tmp;
	
	cellLabelChanged.apply(this, arguments);
};
var convertValueToString = mxGraph.prototype.convertValueToString;
mxGraph.prototype.convertValueToString = function(cell)
{
	var label = cell.getAttribute('label');
	if(label)
		return decodeURIComponent(label);
	return label;
};
mxPopupMenu.prototype.zIndex = 100000;

mxGraph.prototype.isHtmlLabel = function(	cell	) {
	return true;
}

function NoteShape()
{
	mxCylinder.call(this);
};
mxUtils.extend(NoteShape, mxCylinder);
NoteShape.prototype.size = 10;
NoteShape.prototype.redrawPath = function(path, x, y, w, h, isForeground)
{
	var s = Math.min(w, Math.min(h, mxUtils.getValue(this.style, 'size', this.size)));

	if (isForeground)
	{
		path.moveTo(w - s, 0);
		path.lineTo(w - s, s);
		path.lineTo(w, s);
		path.end();
	}
	else
	{
		path.moveTo(0, 0);
		path.lineTo(w - s, 0);
		path.lineTo(w, s);
		path.lineTo(w, h);
		path.lineTo(0, h);
		path.lineTo(0, 0);
		path.close();
		path.end();
	}
};

mxCellRenderer.prototype.defaultShapes['note'] = NoteShape;

NoteShape.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0.25, 0), true),
                                   new mxConnectionConstraint(new mxPoint(0.5, 0), true),
                                   new mxConnectionConstraint(new mxPoint(0.75, 0), true),
 	              		 new mxConnectionConstraint(new mxPoint(0, 0.25), true),
 	              		 new mxConnectionConstraint(new mxPoint(0, 0.5), true),
 	              		 new mxConnectionConstraint(new mxPoint(0, 0.75), true),
 	            		 new mxConnectionConstraint(new mxPoint(1, 0.25), true),
 	            		 new mxConnectionConstraint(new mxPoint(1, 0.5), true),
 	            		 new mxConnectionConstraint(new mxPoint(1, 0.75), true),
 	            		 new mxConnectionConstraint(new mxPoint(0.25, 1), true),
 	            		 new mxConnectionConstraint(new mxPoint(0.5, 1), true),
 	            		 new mxConnectionConstraint(new mxPoint(0.75, 1), true)];

Ext.override(Ext.data.Store, {
	toArray: function(fields) {
		var data = [];
		this.each(function(rec) {
			var obj = new Object();
			Ext.each(fields, function(field) {
				if(Ext.isString(field))
					obj[field] = rec.get(field);
				else if(Ext.isObject(field)) {
					if(field.value)
						obj[field.name] = field.value;
					else
						obj[field.name] = rec.get(field.field);
				}
			});
			data.push(obj);
		});
		return data;
	},
	toJson: function() {
		var data = [];
		this.each(function(rec) {
			var obj = new Object();
			rec.fields.each(function(field) {
				obj[field.name] = rec.get(field.name);
			});
			data.push(obj);
		});
		return data;
	},
	merge: function(store, fields) {
		var me = this;
		if(store.getCount() <= 0) return;
		var data = store.toArray(fields);
		
		if(this.getCount() > 0) {
			var answerDialog = new AnswerDialog({has: me.getCount(), found: data.length});
			answerDialog.on('addNew', function() {
				me.loadData(data, true);
			});
			answerDialog.on('addAll', function() {
				Ext.each(data, function(d) {
	                var record = new store.recordType(d);
	                me.insert(0, record);
				});
			});
			answerDialog.on('clearAddAll', function() {
				me.removeAll();
				me.loadData(data);
			});
			answerDialog.show();
		} else {
			me.loadData(data);
		}
	}
});